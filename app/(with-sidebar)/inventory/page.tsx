import { Archive, Boxes, CircleAlert, History, PackageCheck } from "lucide-react";

import { InventoryWorkspace } from "@/components/inventory-workspace";
import { MyLoans } from "@/components/my-loans";
import { OverdueLoans } from "@/components/overdue-loans";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { hasPermission, isAuthenticated } from "@/lib/auth/guard";
import { getInventoryData } from "@/lib/data/inventory";
import { getManagedUsers } from "@/lib/data/users";

export const dynamic = "force-dynamic";

export default async function InventoryPage() {
  const session = await isAuthenticated({ behavior: "redirect" });

  try {
    const [canViewAllInventory, canViewAllLoans, canCreateForOthers, canReturnAll] = await Promise.all([
      hasPermission({ inventory: ["read_all"] }),
      hasPermission({ loan: ["read_all"] }),
      hasPermission({ loan: ["create_for_others"] }),
      hasPermission({ loan: ["return_all"] }),
    ]);
    const inventory = await getInventoryData(session.user, canViewAllInventory, canViewAllLoans);
    const managedUsers = canCreateForOthers ? await getManagedUsers() : [];
    const myLoans = inventory.devices.flatMap((device) => device.loans
      .filter((loan) => loan.borrowerUserId === session.user.id && !loan.returnedAt)
      .map((loan) => ({ ...loan, name: device.name, inventoryNumber: device.inventoryNumber, category: device.category })));
    const today = new Date().toISOString().slice(0, 10);
    const overdueLoans = inventory.devices.flatMap((device) => device.loans
      .filter((loan) => !loan.returnedAt && loan.dueAt && loan.dueAt < today)
      .map((loan) => ({ id: loan.id, borrower: loan.borrower, name: device.name, inventoryNumber: device.inventoryNumber, dueAt: loan.dueAt! })));

    return (
      <main className="min-h-svh bg-muted/30 px-4 py-8 sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-col gap-8">
          <header className="flex flex-col gap-3">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary">Geräteverleih</p>
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div className="flex flex-col gap-2">
                <h1 className="font-heading text-4xl font-semibold tracking-tight">Inventar</h1>
                <p className="max-w-2xl text-muted-foreground">Verfügbarkeit prüfen, Ausleihen erfassen und Rückgaben nachvollziehbar dokumentieren.</p>
              </div>
              <Badge variant="outline"><PackageCheck data-icon="inline-start" />{inventory.devices.length} Geräte</Badge>
            </div>
          </header>

          <section className="grid gap-4 sm:grid-cols-3">
            <Metric label="Geräte" value={inventory.devices.length} description="Im Inventar" icon={<Boxes />} />
            <Metric label="Verfügbar" value={inventory.availableCount} description="Einheiten sofort ausleihbar" icon={<PackageCheck />} />
            <Metric label="Offene Ausleihen" value={inventory.loanCount} description="Noch nicht zurückgegeben" icon={<History />} />
          </section>

          <MyLoans loans={myLoans} />
          <OverdueLoans loans={overdueLoans} />

          {inventory.devices.length === 0 ? (
            <Card><Empty><EmptyHeader><EmptyMedia variant="icon"><Archive /></EmptyMedia><EmptyTitle>Noch keine Geräte</EmptyTitle><EmptyDescription>Importiere zunächst den Gerätebestand.</EmptyDescription></EmptyHeader></Empty></Card>
          ) : <InventoryWorkspace devices={inventory.devices} categories={inventory.categories} currentUserName={session.user.name} users={managedUsers} canCreateForOthers={canCreateForOthers} canReturnAll={canReturnAll} />}
        </div>
      </main>
    );
  } catch {
    return <main className="flex min-h-svh items-center justify-center bg-muted/30 px-6 py-10"><Alert variant="destructive" className="max-w-xl"><CircleAlert /><AlertTitle>Datenbank nicht erreichbar</AlertTitle><AlertDescription>Setze DATABASE_URL, führe `npm run db:push` aus und starte danach den Import.</AlertDescription></Alert></main>;
  }
}

function Metric({ label, value, description, icon }: { label: string; value: number; description: string; icon: React.ReactNode }) {
  return <Card size="sm"><CardHeader><CardDescription>{label}</CardDescription><CardTitle className="text-3xl">{value}</CardTitle><CardAction className="text-muted-foreground">{icon}</CardAction></CardHeader><CardContent className="text-xs text-muted-foreground">{description}</CardContent></Card>;
}