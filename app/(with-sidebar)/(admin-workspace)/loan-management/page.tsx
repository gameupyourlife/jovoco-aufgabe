import { CircleAlert, History, PackageCheck, RotateCcw } from "lucide-react";

import { InventoryWorkspace } from "@/components/inventory-workspace";
import { MetricCard } from "@/components/metric-card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { hasPermission, isAuthenticated } from "@/lib/auth/guard";
import { getInventoryData } from "@/lib/data/inventory";
import { getManagedUsers } from "@/lib/data/users";

export const dynamic = "force-dynamic";

export default async function LoanManagementPage() {
  const session = await isAuthenticated({ behavior: "forbidden", permissions: { loan: ["read_all"] } });
  try {
    const [inventory, canCreateForOthers, canReturnAll, users] = await Promise.all([
      getInventoryData(),
      hasPermission({ loan: ["create_for_others"] }),
      hasPermission({ loan: ["return_all"] }),
      getManagedUsers(),
    ]);
    const openLoans = inventory.devices.reduce((total, device) => total + device.loans.filter((loan) => !loan.returnedAt).length, 0);
    const overdueLoans = inventory.devices.reduce((total, device) => total + device.loans.filter((loan) => !loan.returnedAt && loan.dueAt && loan.dueAt < new Date().toISOString().slice(0, 10)).length, 0);

    return <main className="min-h-svh bg-muted/30 px-4 py-8 sm:px-6">
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        <header className="flex flex-col gap-3"><Badge variant="outline" className="w-fit">Administration</Badge><h1 className="font-heading text-4xl font-semibold tracking-tight">Ausleihverwaltung</h1><p className="max-w-2xl text-muted-foreground">Geräte ausgeben, offene Ausleihen verfolgen und Rückgaben für alle Benutzer erfassen.</p></header>
        <section className="grid gap-4 sm:grid-cols-3"><MetricCard label="Offene Ausleihen" value={openLoans} detail="Geräte aktuell unterwegs" icon={<PackageCheck />} /><MetricCard label="Überfällig" value={overdueLoans} detail="Rückgabe erforderlich" icon={<RotateCcw />} warning={overdueLoans > 0} /><MetricCard label="Geräte" value={inventory.devices.length} detail="Im Ausleihbestand" icon={<History />} /></section>
        <InventoryWorkspace devices={inventory.devices} categories={inventory.categories} currentUserId={session.user.id} currentUserName={session.user.name} users={users} canCreateForOthers={canCreateForOthers} canReturnAll={canReturnAll} enableReservations={false} adminMode />
      </div>
    </main>;
  } catch {
    return <main className="flex min-h-svh items-center justify-center bg-muted/30 px-6 py-10"><Alert variant="destructive" className="max-w-xl"><CircleAlert /><AlertTitle>Datenbank nicht erreichbar</AlertTitle><AlertDescription>Setze DATABASE_URL und führe die Datenbanksynchronisierung aus.</AlertDescription></Alert></main>;
  }
}

