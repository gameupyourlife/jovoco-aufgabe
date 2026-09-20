import { asc } from "drizzle-orm";

import { isAuthenticated } from "@/lib/auth/guard";
import { db } from "@/lib/db";
import { devices, loans } from "@/lib/db/schema";

export type ReportData = {
  currentBorrowers: { borrower: string; count: number }[];
  popularDevices: { name: string; inventoryNumber: string; count: number }[];
  categoryUtilization: { category: string; capacity: number; openLoans: number; utilization: number }[];
};

export async function getReportData(): Promise<ReportData> {
  await isAuthenticated({ behavior: "error", permissions: { report: ["read"] } });
  const [deviceRows, loanRows] = await Promise.all([
    db.select({ id: devices.id, name: devices.name, inventoryNumber: devices.inventoryNumber, category: devices.category, quantity: devices.quantity, retiredAt: devices.retiredAt }).from(devices).orderBy(asc(devices.name)),
    db.select({ deviceId: loans.deviceId, borrower: loans.borrower, returnedAt: loans.returnedAt }).from(loans),
  ]);

  const borrowerCounts = new Map<string, number>();
  const deviceCounts = new Map<number, number>();
  const categoryStats = new Map<string, { capacity: number; openLoans: number }>();
  for (const loan of loanRows) {
    if (!loan.returnedAt) borrowerCounts.set(loan.borrower, (borrowerCounts.get(loan.borrower) ?? 0) + 1);
    deviceCounts.set(loan.deviceId, (deviceCounts.get(loan.deviceId) ?? 0) + 1);
  }
  for (const device of deviceRows) {
    const current = categoryStats.get(device.category) ?? { capacity: 0, openLoans: 0 };
    if (!device.retiredAt) {
      current.capacity += device.quantity;
      current.openLoans += loanRows.filter((loan) => loan.deviceId === device.id && !loan.returnedAt).length;
    }
    categoryStats.set(device.category, current);
  }

  return {
    currentBorrowers: [...borrowerCounts.entries()].map(([borrower, count]) => ({ borrower, count })).sort((a, b) => b.count - a.count || a.borrower.localeCompare(b.borrower, "de")),
    popularDevices: deviceRows.map((device) => ({ name: device.name, inventoryNumber: device.inventoryNumber, count: deviceCounts.get(device.id) ?? 0 })).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "de")).slice(0, 10),
    categoryUtilization: [...categoryStats.entries()].map(([category, stats]) => ({ category, ...stats, utilization: stats.capacity ? Math.round((stats.openLoans / stats.capacity) * 100) : 0 })).sort((a, b) => b.utilization - a.utilization || a.category.localeCompare(b.category, "de")),
  };
}
