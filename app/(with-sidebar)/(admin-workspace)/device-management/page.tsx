import { CircleAlert } from "lucide-react";

import { DeviceManagement } from "@/components/device-management";
import { MetricCard } from "@/components/metric-card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { isAuthenticated } from "@/lib/auth/guard";
import { getManagedDevices } from "@/lib/data/device-management";

export const dynamic = "force-dynamic";

export default async function DeviceManagementPage() {
  await isAuthenticated({ behavior: "forbidden", permissions: { inventory: ["update"] } });
  try {
    const devices = await getManagedDevices();
    const activeDevices = devices.filter((device) => !device.retiredAt);
    const retiredDevices = devices.length - activeDevices.length;
    const totalUnits = activeDevices.reduce((total, device) => total + device.quantity, 0);
    return <main className="min-h-svh bg-muted/30 px-4 py-8 sm:px-6">
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        <header className="flex flex-col gap-3"><Badge variant="outline" className="w-fit">Administration</Badge><h1 className="font-heading text-4xl font-semibold tracking-tight">Geräteverwaltung</h1><p className="max-w-2xl text-muted-foreground">Stammdaten, Bestand und Ausmusterungen zentral verwalten. Änderungen wirken direkt im öffentlichen Inventar.</p></header>
        <section className="grid gap-4 sm:grid-cols-3">
          <MetricCard label="Geräte" value={activeDevices.length} detail="Aktive Datensätze" />
          <MetricCard label="Einheiten" value={totalUnits} detail="Gesamter aktiver Bestand" />
          <MetricCard label="Ausgemustert" value={retiredDevices} detail="Für Historie archiviert" />
        </section>
        <DeviceManagement devices={devices} />
      </div>
    </main>;
  } catch {
    return <main className="flex min-h-svh items-center justify-center bg-muted/30 px-6 py-10"><Alert variant="destructive" className="max-w-xl"><CircleAlert /><AlertTitle>Datenbank nicht erreichbar</AlertTitle><AlertDescription>Setze DATABASE_URL und führe die Datenbanksynchronisierung aus.</AlertDescription></Alert></main>;
  }
}

