"use server";

import { revalidatePath } from "next/cache";
import { and, eq, isNull, sql } from "drizzle-orm";

import { hasPermission, isAuthenticated } from "@/lib/auth/guard";
import { db } from "@/lib/db";
import { devices, loanDurationRules, loans, reservations, user } from "@/lib/db/schema";
import { calculateDueDate, getDurationDays } from "@/lib/data/loan-duration";
import { canCheckoutLoan } from "@/lib/domain/reservations";
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

      const durationRules = await transaction.select({ category: loanDurationRules.category, durationDays: loanDurationRules.durationDays })
        .from(loanDurationRules);
      const [deviceDetails] = await transaction.select({ category: devices.category }).from(devices).where(eq(devices.id, deviceId));
      if (!deviceDetails) throw new Error("Gerät wurde nicht gefunden.");
      const borrowedAt = new Date().toISOString().slice(0, 10);

      const openLoans = await transaction.select({ count: sql<number>`count(*)` })
        .from(loans)
        .where(and(eq(loans.deviceId, deviceId), isNull(loans.returnedAt)));
      const openLoanCount = Number(openLoans[0]?.count ?? 0);
      if (!canCheckoutLoan(device.quantity, openLoanCount, 0)) {
        throw new Error("Keine Einheit verfügbar. Bitte zuerst eine Rückgabe erfassen.");
      }

      const dueAt = calculateDueDate(borrowedAt, getDurationDays(durationRules, deviceDetails.category));
      const [blockingReservations] = await transaction.select({ count: sql<number>`count(*)` })
        .from(reservations)
        .where(and(
          eq(reservations.deviceId, deviceId),
          eq(reservations.status, "active"),
        ));
      if (!canCheckoutLoan(device.quantity, openLoanCount, Number(blockingReservations?.count ?? 0))) {
        throw new Error("Keine Einheit verfügbar. Für dieses Gerät besteht bereits eine aktive Reservierung.");
      }

      await transaction.insert(loans).values({
        sourceKey: `checkout-${crypto.randomUUID()}`,
        deviceId,
        borrowerUserId: canCreateForOthers && borrowerUserId ? borrowerUserId : session.user.id,
        borrower: borrower.trim(),
        borrowedAt,
        dueAt,
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