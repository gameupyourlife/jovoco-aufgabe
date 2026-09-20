import { asc, desc } from "drizzle-orm";

import { db } from "@/lib/db";
import { devices, loans } from "@/lib/db/schema";

export type Device = typeof devices.$inferSelect;
export type Loan = typeof loans.$inferSelect;

export type InventoryDevice = Device & {
  available: number;
  loans: Loan[];
};

export type InventoryData = {
  devices: InventoryDevice[];
  categories: string[];
  loanCount: number;
  availableCount: number;
};

export async function getInventoryData(): Promise<InventoryData> {
  const [deviceRows, loanRows] = await Promise.all([
    db.select().from(devices).orderBy(asc(devices.name)),
    db.select().from(loans).orderBy(desc(loans.borrowedAt)),
  ]);

  const loansByDevice = new Map<number, Loan[]>();
  for (const loan of loanRows) {
    const deviceLoans = loansByDevice.get(loan.deviceId) ?? [];
    deviceLoans.push(loan);
    loansByDevice.set(loan.deviceId, deviceLoans);
  }

  const inventoryDevices = deviceRows.map((device) => {
    const deviceLoans = loansByDevice.get(device.id) ?? [];
    const openLoanCount = deviceLoans.filter((loan) => !loan.returnedAt).length;
    return { ...device, available: Math.max(device.quantity - openLoanCount, 0), loans: deviceLoans };
  });

  return {
    devices: inventoryDevices,
    categories: [...new Set(deviceRows.map((device) => device.category))].sort(),
    loanCount: loanRows.filter((loan) => !loan.returnedAt).length,
    availableCount: inventoryDevices.reduce((total, device) => total + device.available, 0),
  };
}