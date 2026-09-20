import assert from "node:assert/strict";
import test from "node:test";

import { calculateDueDate, getDurationDays } from "../lib/data/loan-duration";
import {
  canCreateReservation,
  canPickupReservation,
  intervalsOverlap,
  transitionReservationStatus,
} from "../lib/domain/reservations";

const durationRules = [
  { category: "Standard", durationDays: 14 },
  { category: "Kamera", durationDays: 7 },
  { category: "Mobilgerät", durationDays: 30 },
];

test("reservation end date uses the configured duration for the device category", () => {
  const durationDays = getDurationDays(durationRules, "Kamera");

  assert.equal(durationDays, 7);
  assert.equal(calculateDueDate("2026-10-01", durationDays), "2026-10-08");
});

test("duration lookup normalizes category names and falls back to Standard", () => {
  assert.equal(getDurationDays(durationRules, "  kamera "), 7);
  assert.equal(getDurationDays(durationRules, "Unbekannt"), 14);
});

test("reservation intervals overlap when their boundary dates touch", () => {
  assert.equal(intervalsOverlap("2026-10-10", "2026-10-12", "2026-10-12", "2026-10-14"), true);
});

test("reservation intervals do not overlap when separated by a day", () => {
  assert.equal(intervalsOverlap("2026-10-10", "2026-10-12", "2026-10-13", "2026-10-14"), false);
});

test("an interval inside another interval overlaps", () => {
  assert.equal(intervalsOverlap("2026-10-10", "2026-10-20", "2026-10-12", "2026-10-14"), true);
});

test("canCreateReservation rejects a reservation when open loans use all units", () => {
  assert.equal(canCreateReservation(1, 1, [], "2026-10-01", "2026-10-03"), false);
  assert.equal(canCreateReservation(2, 1, [], "2026-10-01", "2026-10-03"), true);
});

test("canCreateReservation counts only overlapping active reservations", () => {
  const activeReservations = [
    { startsAt: "2026-10-01", endsAt: "2026-10-03" },
    { startsAt: "2026-10-10", endsAt: "2026-10-12" },
  ];

  assert.equal(canCreateReservation(1, 0, activeReservations, "2026-10-01", "2026-10-03"), false);
  assert.equal(canCreateReservation(1, 0, activeReservations, "2026-10-03", "2026-10-05"), false);
  assert.equal(canCreateReservation(1, 0, activeReservations, "2026-10-04", "2026-10-09"), true);
  assert.equal(canCreateReservation(1, 0, activeReservations, "2026-10-12", "2026-10-14"), false);
});

test("canCreateReservation allows another unit when one overlapping reservation exists", () => {
  const activeReservations = [{ startsAt: "2026-10-01", endsAt: "2026-10-03" }];

  assert.equal(canCreateReservation(2, 0, activeReservations, "2026-10-01", "2026-10-03"), true);
  assert.equal(canCreateReservation(2, 1, activeReservations, "2026-10-01", "2026-10-03"), false);
});

test("canCreateReservation rejects an overlapping reservation when loans and reservations fill capacity", () => {
  const activeReservations = [{ startsAt: "2026-10-01", endsAt: "2026-10-03" }];

  assert.equal(canCreateReservation(3, 1, activeReservations, "2026-10-02", "2026-10-04"), true);
  assert.equal(canCreateReservation(2, 1, activeReservations, "2026-10-02", "2026-10-04"), false);
});

test("reservation lifecycle allows cancellation or pickup only from active", () => {
  assert.equal(transitionReservationStatus("active", "cancelled"), true);
  assert.equal(transitionReservationStatus("active", "fulfilled"), true);
  assert.equal(transitionReservationStatus("cancelled", "fulfilled"), false);
  assert.equal(transitionReservationStatus("fulfilled", "cancelled"), false);
});

test("pickup is rejected when all units are still on loan", () => {
  assert.equal(canPickupReservation(1, 0), true);
  assert.equal(canPickupReservation(1, 1), false);
  assert.equal(canPickupReservation(2, 1), true);
});
