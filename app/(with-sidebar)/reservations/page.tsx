import { CalendarRange } from "lucide-react";

import { ReservationWorkspace } from "@/components/reservation-workspace";
import { Badge } from "@/components/ui/badge";
import { hasPermission, isAuthenticated } from "@/lib/auth/guard";
import { getReservableDevices, getReservations } from "@/lib/data/reservations";
import { getManagedUsers } from "@/lib/data/users";

export const dynamic = "force-dynamic";

export default async function ReservationsPage() {
  const session = await isAuthenticated({ behavior: "redirect" });
  const [canCreateForOthers, canCancelAll, canPickupAll] = await Promise.all([
    hasPermission({ reservation: ["create_for_others"] }),
    hasPermission({ reservation: ["cancel_all"] }),
    hasPermission({ reservation: ["pickup_all"] }),
  ]);
  const [devices, allReservations, users] = await Promise.all([
    getReservableDevices(),
    getReservations(),
    canCreateForOthers ? getManagedUsers() : Promise.resolve([]),
  ]);
  const reservations = allReservations.filter((reservation) => reservation.reserverUserId === session.user.id);

  return <main className="min-h-svh bg-muted/30 px-4 py-8 sm:px-6">
    <div className="mx-auto flex max-w-7xl flex-col gap-8">
      <header className="flex flex-col gap-3">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary">Geräteverleih</p>
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div className="flex flex-col gap-2"><h1 className="font-heading text-4xl font-semibold tracking-tight">Reservierungen</h1><p className="max-w-2xl text-muted-foreground">Sichere dir ein Gerät für einen zukünftigen Zeitraum und hole es anschließend als normale Ausleihe ab.</p></div>
          <Badge variant="outline"><CalendarRange data-icon="inline-start" />{reservations.filter((reservation) => reservation.status === "active").length} aktiv</Badge>
        </div>
      </header>
      <ReservationWorkspace devices={devices} reservations={reservations} users={users} currentUserId={session.user.id} canCreateForOthers={canCreateForOthers} canCancelAll={canCancelAll} canPickupAll={canPickupAll} />
    </div>
  </main>;
}
