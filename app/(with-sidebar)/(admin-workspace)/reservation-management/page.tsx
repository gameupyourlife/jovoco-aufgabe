import { CalendarRange, CircleAlert, History, Users } from "lucide-react";

import { ReservationWorkspace } from "@/components/reservation-workspace";
import { MetricCard } from "@/components/metric-card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { hasPermission, isAuthenticated } from "@/lib/auth/guard";
import { getInventoryData } from "@/lib/data/inventory";
import { getReservableDevices, getReservations } from "@/lib/data/reservations";
import { getManagedUsers } from "@/lib/data/users";

export const dynamic = "force-dynamic";

export default async function ReservationManagementPage() {
  const session = await isAuthenticated({ behavior: "forbidden", permissions: { reservation: ["read_all"] } });
  try {
    const [devices, reservations, inventory, users, canCreateForOthers, canCancelAll, canPickupAll] = await Promise.all([
      getReservableDevices(),
      getReservations(),
      getInventoryData(),
      getManagedUsers(),
      hasPermission({ reservation: ["create_for_others"] }),
      hasPermission({ reservation: ["cancel_all"] }),
      hasPermission({ reservation: ["pickup_all"] }),
    ]);
    const activeReservations = reservations.filter((reservation) => reservation.status === "active").length;
    const peopleWithReservations = new Set(reservations.filter((reservation) => reservation.status === "active").map((reservation) => reservation.reserverUserId)).size;

    return <main className="min-h-svh bg-muted/30 px-4 py-8 sm:px-6">
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        <header className="flex flex-col gap-3"><Badge variant="outline" className="w-fit">Administration</Badge><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><h1 className="font-heading text-4xl font-semibold tracking-tight">Reservierungsverwaltung</h1><p className="mt-2 max-w-2xl text-muted-foreground">Alle Gerätevormerkungen prüfen, für Benutzer anlegen und innerhalb des Reservierungszeitraums abholen.</p></div><Badge variant="outline"><CalendarRange data-icon="inline-start" />{activeReservations} aktiv</Badge></div></header>
        <section className="grid gap-4 sm:grid-cols-3"><MetricCard label="Aktive Reservierungen" value={activeReservations} detail="Noch nicht abgeholt" icon={<CalendarRange />} /><MetricCard label="Betroffene Benutzer" value={peopleWithReservations} detail="Mit aktiver Vormerkung" icon={<Users />} /><MetricCard label="Geräte im Verlauf" value={inventory.devices.length} detail="Mit Bestandsdaten" icon={<History />} /></section>
        <ReservationWorkspace devices={devices} reservations={reservations} inventoryDevices={inventory.devices} users={users} currentUserId={session.user.id} canCreateForOthers={canCreateForOthers} canCancelAll={canCancelAll} canPickupAll={canPickupAll} canReturnAll={false} canViewAll allowLoanReturns={false} />
      </div>
    </main>;
  } catch {
    return <main className="flex min-h-svh items-center justify-center bg-muted/30 px-6 py-10"><Alert variant="destructive" className="max-w-xl"><CircleAlert /><AlertTitle>Datenbank nicht erreichbar</AlertTitle><AlertDescription>Setze DATABASE_URL und führe die Datenbanksynchronisierung aus.</AlertDescription></Alert></main>;
  }
}

