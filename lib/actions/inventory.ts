"use server";

import { revalidatePath } from "next/cache";
import { and, eq, isNull, sql } from "drizzle-orm";

import { isAuthenticated } from "@/lib/auth/guard";
import { db } from "@/lib/db";
import { devices, loans } from "@/lib/db/schema";
import type { Device } from "@/lib/data/inventory";

export type LoanActionResult =
  | { success: true }
  | { success: false; error: string };

type DeviceAvailability = Pick<Device, "id" | "quantity">;

export async function checkoutLoan(deviceId: number, borrower: string): Promise<LoanActionResult> {
  try {
    await isAuthenticated({ behavior: "error" });
    const trimmedBorrower = borrower.trim();
    if (!Number.isInteger(deviceId) || !trimmedBorrower) {
      return { success: false, error: "Gerät und ausleihende Person sind erforderlich." };
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
        borrower: trimmedBorrower,
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
    await isAuthenticated({ behavior: "error" });
    if (!Number.isInteger(loanId)) {
      return { success: false, error: "Eine gültige Ausleihe ist erforderlich." };
    }

    const [updatedLoan] = await db.update(loans)
      .set({ returnedAt: new Date().toISOString().slice(0, 10) })
      .where(and(eq(loans.id, loanId), isNull(loans.returnedAt)))
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