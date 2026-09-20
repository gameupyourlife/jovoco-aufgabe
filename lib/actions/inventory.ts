"use server";

import { revalidatePath } from "next/cache";
import { and, eq, isNull, sql } from "drizzle-orm";

import { hasPermission, isAuthenticated } from "@/lib/auth/guard";
import { db } from "@/lib/db";
import { loans, user } from "@/lib/db/schema";
import type { Device } from "@/lib/data/inventory";

export type LoanActionResult =
  | { success: true }
  | { success: false; error: string };

type DeviceAvailability = Pick<Device, "id" | "quantity">;

export async function checkoutLoan(deviceId: number, borrower: string, borrowerUserId?: string): Promise<LoanActionResult> {
  try {
    const session = await isAuthenticated({ behavior: "error" });
    const canCreateForOthers = await hasPermission({ loan: ["create_for_others"] });
    const trimmedBorrower = borrower.trim();
    if (!Number.isInteger(deviceId) || !trimmedBorrower) {
      return { success: false, error: "Gerät und ausleihende Person sind erforderlich." };
    }
    if (!canCreateForOthers && trimmedBorrower !== session.user.name) {
      return { success: false, error: "Du darfst Ausleihen nur für dich selbst anlegen." };
    }
    if (canCreateForOthers && borrowerUserId) {
      const [targetUser] = await db.select({ id: user.id, name: user.name }).from(user).where(eq(user.id, borrowerUserId));
      if (!targetUser) return { success: false, error: "Die ausgewählte Person existiert nicht." };
      borrower = targetUser.name;
    } else if (canCreateForOthers && trimmedBorrower !== session.user.name) {
      return { success: false, error: "Für eine Ausleihe an eine andere Person muss ein Benutzerkonto ausgewählt werden." };
    }
    if (!canCreateForOthers && !(await hasPermission({ loan: ["create"] }))) {
      return { success: false, error: "Du hast keine Berechtigung, Geräte auszuleihen." };
    }
    if (canCreateForOthers && !(await hasPermission({ loan: ["create_for_others"] }))) {
      return { success: false, error: "Du darfst keine Ausleihen für andere Personen anlegen." };
    }

    await db.transaction(async (transaction) => {
      const deviceResult = await transaction.execute<DeviceAvailability>(sql`
        select id, quantity
        from devices
        where id = ${deviceId}
        for update
      `);
      const device = deviceResult.rows[0];
      if (!device) throw new Error("Gerät wurde nicht gefunden.");

      const openLoans = await transaction.select({ count: sql<number>`count(*)` })
        .from(loans)
        .where(and(eq(loans.deviceId, deviceId), isNull(loans.returnedAt)));
      if (Number(openLoans[0]?.count ?? 0) >= device.quantity) {
        throw new Error("Keine Einheit verfügbar. Bitte zuerst eine Rückgabe erfassen.");
      }

      await transaction.insert(loans).values({
        sourceKey: `checkout-${crypto.randomUUID()}`,
        deviceId,
        borrowerUserId: canCreateForOthers && borrowerUserId ? borrowerUserId : session.user.id,
        borrower: borrower.trim(),
        borrowedAt: new Date().toISOString().slice(0, 10),
      });
    });

    revalidatePath("/inventory");
    return { success: true };
  } catch (error) {
    return { success: false, error: getActionError(error, "Ausleihe konnte nicht angelegt werden.") };
  }
}

export async function returnLoan(loanId: number): Promise<LoanActionResult> {
  try {
    const session = await isAuthenticated({ behavior: "error" });
    const canReturnAll = await hasPermission({ loan: ["return_all"] });
    if (!canReturnAll && !(await hasPermission({ loan: ["return"] }))) {
      return { success: false, error: "Du hast keine Berechtigung, Ausleihen zurückzugeben." };
    }
    if (!Number.isInteger(loanId)) {
      return { success: false, error: "Eine gültige Ausleihe ist erforderlich." };
    }

    const [updatedLoan] = await db.update(loans)
      .set({ returnedAt: new Date().toISOString().slice(0, 10) })
      .where(and(
        eq(loans.id, loanId),
        isNull(loans.returnedAt),
        ...(canReturnAll ? [] : [eq(loans.borrowerUserId, session.user.id)]),
      ))
      .returning({ id: loans.id });
    if (!updatedLoan) {
      return { success: false, error: "Ausleihe wurde nicht gefunden oder bereits zurückgegeben." };
    }

    revalidatePath("/inventory");
    return { success: true };
  } catch (error) {
    return { success: false, error: getActionError(error, "Rückgabe konnte nicht gespeichert werden.") };
  }
}

function getActionError(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}