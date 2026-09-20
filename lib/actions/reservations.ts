"use server";

import { revalidatePath } from "next/cache";
import { and, eq, isNull, sql } from "drizzle-orm";

import { hasPermission, isAuthenticated } from "@/lib/auth/guard";
import { db } from "@/lib/db";
import { devices, loanDurationRules, loans, reservations, user } from "@/lib/db/schema";
import { calculateDueDate, getDurationDays } from "@/lib/data/loan-duration";
import { canCreateReservation, canPickupReservation, transitionReservationStatus } from "@/lib/domain/reservations";

export type ReservationActionResult = { success: true } | { success: false; error: string };

export async function createReservation(deviceId: number, startsAt: string, endsAt: string, reserverUserId?: string): Promise<ReservationActionResult> {
  try {
    const session = await isAuthenticated({ behavior: "error" });
    const canCreateForOthers = await hasPermission({ reservation: ["create_for_others"] });
    if (!(await hasPermission({ reservation: ["create"] })) && !canCreateForOthers) return { success: false, error: "Du hast keine Berechtigung, Reservierungen anzulegen." };
    if (!Number.isInteger(deviceId) || !isDate(startsAt) || !isDate(endsAt)) return { success: false, error: "Gerät und gültiger Zeitraum sind erforderlich." };
    const today = currentDate();
    if (startsAt < today || endsAt < startsAt) return { success: false, error: "Der Zeitraum muss ab heute beginnen und in sich gültig sein." };

    let reserver = session.user.name;
    let ownerId = session.user.id;
    if (reserverUserId && canCreateForOthers) {
      const [target] = await db.select({ id: user.id, name: user.name }).from(user).where(eq(user.id, reserverUserId));
      if (!target) return { success: false, error: "Die ausgewählte Person existiert nicht." };
      ownerId = target.id;
      reserver = target.name;
    } else if (reserverUserId && reserverUserId !== session.user.id) {
      return { success: false, error: "Du darfst nur für dich selbst reservieren." };
    }

    await db.transaction(async (transaction) => {
      const deviceResult = await transaction.execute<{ id: number; quantity: number }>(sql`select id, quantity from devices where id = ${deviceId} for update`);
      const device = deviceResult.rows[0];
      if (!device) throw new Error("Gerät wurde nicht gefunden.");
      const [blockingLoans] = await transaction.select({ count: sql<number>`count(*)` }).from(loans).where(and(eq(loans.deviceId, deviceId), isNull(loans.returnedAt), sql`(${loans.dueAt} is null or ${loans.dueAt} >= ${startsAt} or ${loans.dueAt} < ${currentDate()})`));
      const activeReservations = await transaction.select({ startsAt: reservations.startsAt, endsAt: reservations.endsAt }).from(reservations).where(and(eq(reservations.deviceId, deviceId), eq(reservations.status, "active")));
      if (!canCreateReservation(device.quantity, Number(blockingLoans?.count ?? 0), activeReservations, startsAt, endsAt)) throw new Error("Das Gerät ist in diesem Zeitraum voraussichtlich nicht verfügbar.");
      await transaction.insert(reservations).values({ deviceId, reserverUserId: ownerId, reserver, startsAt, endsAt });
    });
    revalidatePath("/reservations");
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Reservierung konnte nicht angelegt werden." };
  }
}

export async function cancelReservation(reservationId: number): Promise<ReservationActionResult> {
  try {
    const session = await isAuthenticated({ behavior: "error" });
    const canCancelAll = await hasPermission({ reservation: ["cancel_all"] });
    if (!canCancelAll && !(await hasPermission({ reservation: ["cancel"] }))) return { success: false, error: "Du hast keine Berechtigung, Reservierungen zu stornieren." };
    if (!transitionReservationStatus("active", "cancelled")) return { success: false, error: "Reservierung kann nicht storniert werden." };
    const [cancelled] = await db.update(reservations).set({ status: "cancelled" }).where(and(eq(reservations.id, reservationId), eq(reservations.status, "active"), ...(canCancelAll ? [] : [eq(reservations.reserverUserId, session.user.id)]))).returning({ id: reservations.id });
    if (!cancelled) return { success: false, error: "Reservierung wurde nicht gefunden oder ist nicht mehr aktiv." };
    revalidatePath("/reservations");
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Stornierung konnte nicht gespeichert werden." };
  }
}

export async function pickupReservation(reservationId: number): Promise<ReservationActionResult> {
  try {
    const session = await isAuthenticated({ behavior: "error" });
    const canPickupAll = await hasPermission({ reservation: ["pickup_all"] });
    if (!canPickupAll && !(await hasPermission({ reservation: ["pickup"] }))) return { success: false, error: "Du hast keine Berechtigung, Reservierungen abzuholen." };
    if (!transitionReservationStatus("active", "fulfilled")) return { success: false, error: "Reservierung kann nicht abgeholt werden." };
    await db.transaction(async (transaction) => {
      const [reservation] = await transaction.select().from(reservations).where(and(eq(reservations.id, reservationId), eq(reservations.status, "active"), ...(canPickupAll ? [] : [eq(reservations.reserverUserId, session.user.id)]))).for("update");
      if (!reservation) throw new Error("Reservierung wurde nicht gefunden oder ist nicht aktiv.");
      if (reservation.startsAt > currentDate() || reservation.endsAt < currentDate()) throw new Error("Die Reservierung kann nur innerhalb ihres Zeitraums abgeholt werden.");
      const [device] = await transaction.select({ id: devices.id, quantity: devices.quantity, category: devices.category }).from(devices).where(eq(devices.id, reservation.deviceId)).for("update");
      if (!device) throw new Error("Gerät wurde nicht gefunden.");
      const [openLoans] = await transaction.select({ count: sql<number>`count(*)` }).from(loans).where(and(eq(loans.deviceId, device.id), isNull(loans.returnedAt)));
      if (!canPickupReservation(device.quantity, Number(openLoans?.count ?? 0))) throw new Error("Keine Einheit verfügbar. Eine andere offene Ausleihe blockiert die Abholung.");
      const rules = await transaction.select({ category: loanDurationRules.category, durationDays: loanDurationRules.durationDays }).from(loanDurationRules);
      const borrowedAt = currentDate();
      await transaction.insert(loans).values({ sourceKey: `reservation-${reservation.id}-${crypto.randomUUID()}`, deviceId: device.id, borrowerUserId: reservation.reserverUserId, borrower: reservation.reserver, borrowedAt, dueAt: calculateDueDate(borrowedAt, getDurationDays(rules, device.category)) });
      await transaction.update(reservations).set({ status: "fulfilled" }).where(eq(reservations.id, reservation.id));
    });
    revalidatePath("/reservations");
    revalidatePath("/inventory");
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Abholung konnte nicht gespeichert werden." };
  }
}

function isDate(value: string) { return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`)); }
function currentDate() { return new Date().toISOString().slice(0, 10); }