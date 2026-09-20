import { Archive, Boxes, CircleAlert, History, PackageCheck } from "lucide-react";

import { InventoryWorkspace } from "@/components/inventory-workspace";
import { MetricCard } from "@/components/metric-card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { isAuthenticated } from "@/lib/auth/guard";
import { getInventoryData } from "@/lib/data/inventory";

export const dynamic = "force-dynamic";

export default async function InventoryPage() {
  const session = await isAuthenticated({ behavior: "redirect" });

  try {
    const inventory = await getInventoryData();
    const personalLoanCount = inventory.devices.reduce((total, device) => total + device.loans.filter((loan) => loan.borrowerUserId === session.user.id && !loan.returnedAt).length, 0);

    return (
      <main className="min-h-svh bg-muted/30 px-4 py-8 sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-col gap-8">
          <header className="flex flex-col gap-3">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary">Mein Bereich</p>
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div className="flex flex-col gap-2">
                <h1 className="font-heading text-4xl font-semibold tracking-tight">Inventar & Ausleihe</h1>
                <p className="max-w-2xl text-muted-foreground">Finde ein Gerät, leihe es direkt aus oder reserviere es für einen passenden Zeitraum.</p>
              </div>
              <Badge variant="outline"><PackageCheck data-icon="inline-start" />{inventory.devices.length} Geräte</Badge>
            </div>
          </header>

          <section className="grid gap-4 sm:grid-cols-3">
            <MetricCard label="Geräte" value={inventory.devices.length} detail="Im Inventar" icon={<Boxes />} />
            <MetricCard label="Verfügbar" value={inventory.availableCount} detail="Einheiten sofort ausleihbar" icon={<PackageCheck />} />
            <MetricCard label="Offene Ausleihen" value={personalLoanCount} detail="Auf deinem Konto" icon={<History />} />
          </section>

          {inventory.devices.length === 0 ? (
            <Card><Empty><EmptyHeader><EmptyMedia variant="icon"><Archive /></EmptyMedia><EmptyTitle>Noch keine Geräte</EmptyTitle><EmptyDescription>Importiere zunächst den Gerätebestand.</EmptyDescription></EmptyHeader></Empty></Card>
          ) : <InventoryWorkspace devices={inventory.devices} categories={inventory.categories} currentUserId={session.user.id} currentUserName={session.user.name} users={[]} canCreateForOthers={false} canReturnAll={false} />}
        </div>
      </main>
    );
  } catch {
    return <main className="flex min-h-svh items-center justify-center bg-muted/30 px-6 py-10"><Alert variant="destructive" className="max-w-xl"><CircleAlert /><AlertTitle>Datenbank nicht erreichbar</AlertTitle><AlertDescription>Setze DATABASE_URL, führe `npm run db:push` aus und starte danach den Import.</AlertDescription></Alert></main>;
  }
}

