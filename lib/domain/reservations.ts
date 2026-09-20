export type ReservationInterval = {
  startsAt: string;
  endsAt: string;
};

export type ReservationStatus = "active" | "cancelled" | "fulfilled";

export function intervalsOverlap(firstStart: string, firstEnd: string, secondStart: string, secondEnd: string) {
  return firstStart <= secondEnd && secondStart <= firstEnd;
}

export function countOverlappingReservations(reservationRows: ReservationInterval[], startsAt: string, endsAt: string) {
  return reservationRows.filter((reservation) => intervalsOverlap(reservation.startsAt, reservation.endsAt, startsAt, endsAt)).length;
}

export function hasAvailableCapacity(quantity: number, openLoanCount: number, reservationCount: number) {
  return openLoanCount + reservationCount < quantity;
}

export function canCreateReservation(
  quantity: number,
  openLoanCount: number,
  activeReservations: ReservationInterval[],
  startsAt: string,
  endsAt: string,
) {
  return hasAvailableCapacity(quantity, openLoanCount, countOverlappingReservations(activeReservations, startsAt, endsAt));
}

export function canCheckoutLoan(quantity: number, openLoanCount: number, activeReservationCount: number) {
  return hasAvailableCapacity(quantity, openLoanCount, activeReservationCount);
}

export function canPickupReservation(quantity: number, openLoanCount: number) {
  return hasAvailableCapacity(quantity, openLoanCount, 0);
}

export function transitionReservationStatus(currentStatus: ReservationStatus, nextStatus: ReservationStatus) {
  const validTransitions: Record<ReservationStatus, ReservationStatus[]> = {
    active: ["cancelled", "fulfilled"],
    cancelled: [],
    fulfilled: [],
  };
  return validTransitions[currentStatus].includes(nextStatus);
}