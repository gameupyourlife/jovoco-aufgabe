import { asc, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { devices, reservations } from "@/lib/db/schema";
import { hasPermission, isAuthenticated } from "@/lib/auth/guard";
export { countOverlappingReservations, hasAvailableCapacity, intervalsOverlap } from "@/lib/domain/reservations";

export type Reservation = typeof reservations.$inferSelect;
export type ReservationWithDevice = Reservation & {
  deviceName: string;
  inventoryNumber: string;
  category: string;
};

export async function getReservableDevices() {
  await isAuthenticated({ behavior: "error", permissions: { reservation: ["read"] } });
  return db.select({ id: devices.id, name: devices.name, inventoryNumber: devices.inventoryNumber, category: devices.category })
    .from(devices).orderBy(asc(devices.name), asc(devices.inventoryNumber));
}

export async function getReservations(): Promise<ReservationWithDevice[]> {
  const session = await isAuthenticated({ behavior: "error", permissions: { reservation: ["read"] } });
  const canViewAll = await hasPermission({ reservation: ["read_all"] });
  return db.select({
    id: reservations.id,
    deviceId: reservations.deviceId,
    reserverUserId: reservations.reserverUserId,
    reserver: reservations.reserver,
    startsAt: reservations.startsAt,
    endsAt: reservations.endsAt,
    status: reservations.status,
    createdAt: reservations.createdAt,
    deviceName: devices.name,
    inventoryNumber: devices.inventoryNumber,
    category: devices.category,
  }).from(reservations).innerJoin(devices, eq(reservations.deviceId, devices.id))
    .where(canViewAll ? undefined : eq(reservations.reserverUserId, session.user.id))
    .orderBy(asc(reservations.startsAt), asc(reservations.id));
}

export function getReservationStatusLabel(status: string) {
  return ({ active: "Aktiv", cancelled: "Storniert", fulfilled: "Abgeholt" } as Record<string, string>)[status] ?? status;
}