import assert from "node:assert/strict";
import test from "node:test";

import { canCheckoutLoan, canCreateReservation, canPickupReservation, intervalsOverlap, transitionReservationStatus } from "../lib/domain/reservations";

test("reservation intervals overlap when their boundary dates touch", () => {
  assert.equal(intervalsOverlap("2026-10-10", "2026-10-12", "2026-10-12", "2026-10-14"), true);
});

test("reservation intervals do not overlap when separated by a day", () => {
  assert.equal(intervalsOverlap("2026-10-10", "2026-10-12", "2026-10-13", "2026-10-14"), false);
});

test("an interval inside another interval overlaps", () => {
  assert.equal(intervalsOverlap("2026-10-10", "2026-10-20", "2026-10-12", "2026-10-14"), true);
});

test("a loan interval conflicts with an active reservation", () => {
  assert.equal(intervalsOverlap("2026-09-20", "2026-10-04", "2026-10-01", "2026-10-03"), true);
});

test("a loan ending before a future reservation does not conflict", () => {
  assert.equal(intervalsOverlap("2026-09-20", "2026-09-30", "2026-10-01", "2026-10-03"), false);
});

test("complete reservation flow blocks checkout, cancels, then permits checkout", () => {
  const reservation = { startsAt: "2026-10-01", endsAt: "2026-10-03" };
  let openLoans = 0;
  let activeReservations = [reservation];
  let status: "active" | "cancelled" | "fulfilled" = "active";

  assert.equal(canCreateReservation(1, openLoans, activeReservations, "2026-10-01", "2026-10-03"), false);
  assert.equal(canCheckoutLoan(1, openLoans, activeReservations.length), false);

  assert.equal(transitionReservationStatus(status, "cancelled"), true);
  status = "cancelled";
  activeReservations = [];
  assert.equal(canCheckoutLoan(1, openLoans, activeReservations.length), true);

  openLoans = 1;
  assert.equal(canPickupReservation(1, openLoans), false);
  assert.equal(transitionReservationStatus(status, "fulfilled"), false);

  openLoans = 0;
  assert.equal(canCreateReservation(1, openLoans, activeReservations, "2026-10-01", "2026-10-03"), true);
  status = "active";
  assert.equal(transitionReservationStatus(status, "fulfilled"), true);
  status = "fulfilled";
  openLoans = 1;
  assert.equal(canPickupReservation(1, openLoans), false);
  assert.equal(status, "fulfilled");
});
