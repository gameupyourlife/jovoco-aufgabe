import { asc, desc, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { devices, loans, reservations } from "@/lib/db/schema";
import type { Session } from "@/lib/auth";
import { backfillMissingLoanDueDates } from "@/lib/data/loan-duration";

export type Device = typeof devices.$inferSelect;
export type Loan = typeof loans.$inferSelect;

export type InventoryDevice = Device & {
  available: number;
  reserved: number;
  loans: Loan[];
};

export type InventoryData = {
  devices: InventoryDevice[];
  categories: string[];
  loanCount: number;
  availableCount: number;
};

export async function getInventoryData(
  viewer: Session["user"],
  canViewAllInventory: boolean,
  canViewAllLoans: boolean,
): Promise<InventoryData> {
  await backfillMissingLoanDueDates();
  const [deviceRows, loanRows, reservationRows] = await Promise.all([
    db.select().from(devices).orderBy(asc(devices.name)),
    db.select().from(loans).orderBy(desc(loans.borrowedAt)),
    db.select({ deviceId: reservations.deviceId }).from(reservations).where(eq(reservations.status, "active")),
  ]);

  const visibleLoans = canViewAllLoans
    ? loanRows
    : loanRows.filter((loan) => loan.borrowerUserId === viewer.id);
  const allLoansByDevice = new Map<number, Loan[]>();
  const visibleLoansByDevice = new Map<number, Loan[]>();
  const reservationsByDevice = new Map<number, number>();
  for (const reservation of reservationRows) {
    reservationsByDevice.set(reservation.deviceId, (reservationsByDevice.get(reservation.deviceId) ?? 0) + 1);
  }
  for (const loan of visibleLoans) {
    const deviceLoans = visibleLoansByDevice.get(loan.deviceId) ?? [];
    deviceLoans.push(loan);
    visibleLoansByDevice.set(loan.deviceId, deviceLoans);
  }
  for (const loan of loanRows) {
    const deviceLoans = allLoansByDevice.get(loan.deviceId) ?? [];
    deviceLoans.push(loan);
    allLoansByDevice.set(loan.deviceId, deviceLoans);
  }

  const inventoryDevices = deviceRows.map((device) => {
    const deviceLoans = visibleLoansByDevice.get(device.id) ?? [];
    const openLoanCount = (allLoansByDevice.get(device.id) ?? []).filter((loan) => !loan.returnedAt).length;
    return { ...device, available: Math.max(device.quantity - openLoanCount, 0), reserved: reservationsByDevice.get(device.id) ?? 0, loans: deviceLoans };
  }).filter((device) => canViewAllInventory || device.available > 0 || device.loans.length > 0);

  return {
    devices: inventoryDevices,
    categories: [...new Set(deviceRows.map((device) => device.category))].sort(),
    loanCount: visibleLoans.filter((loan) => !loan.returnedAt).length,
    availableCount: inventoryDevices.reduce((total, device) => total + device.available, 0),
  };
}