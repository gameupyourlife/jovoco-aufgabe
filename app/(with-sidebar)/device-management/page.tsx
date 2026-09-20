import { CircleAlert } from "lucide-react";

import { DeviceManagement } from "@/components/device-management";
import { InventoryWorkspace } from "@/components/inventory-workspace";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { hasPermission, isAuthenticated } from "@/lib/auth/guard";
import { getInventoryData } from "@/lib/data/inventory";
import { getManagedDevices } from "@/lib/data/device-management";
import { getManagedUsers } from "@/lib/data/users";

export const dynamic = "force-dynamic";

export default async function DeviceManagementPage() {
  const session = await isAuthenticated({ behavior: "forbidden", permissions: { inventory: ["update"] } });
  try {
    const [devices, inventory, canCreateForOthers, canReturnAll, managedUsers] = await Promise.all([
      getManagedDevices(),
      getInventoryData(),
      hasPermission({ loan: ["create_for_others"] }),
      hasPermission({ loan: ["return_all"] }),
      getManagedUsers(),
    ]);
    const activeDevices = devices.filter((device) => !device.retiredAt);
    const retiredDevices = devices.length - activeDevices.length;
    const totalUnits = activeDevices.reduce((total, device) => total + device.quantity, 0);
    return <main className="min-h-svh bg-muted/30 px-4 py-8 sm:px-6">
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        <header className="flex flex-col gap-3"><Badge variant="outline" className="w-fit">Administration</Badge><h1 className="font-heading text-4xl font-semibold tracking-tight">Geräteverwaltung</h1><p className="max-w-2xl text-muted-foreground">Stammdaten, Bestand und Ausmusterungen zentral verwalten. Änderungen wirken direkt im öffentlichen Inventar.</p></header>
        <section className="grid gap-4 sm:grid-cols-3">
          <AdminMetric label="Geräte" value={activeDevices.length} detail="Aktive Datensätze" />
          <AdminMetric label="Einheiten" value={totalUnits} detail="Gesamter aktiver Bestand" />
          <AdminMetric label="Ausgemustert" value={retiredDevices} detail="Für Historie archiviert" />
        </section>
        <DeviceManagement devices={devices} />
        <section className="flex flex-col gap-3 border-t pt-8">
          <div className="flex flex-col gap-1"><h2 className="font-heading text-2xl font-semibold tracking-tight">Ausleihe & Reservierung</h2><p className="text-muted-foreground">Geräte für andere Benutzer ausgeben, reservieren und Rückgaben verwalten.</p></div>
          <InventoryWorkspace devices={inventory.devices} categories={inventory.categories} currentUserId={session.user.id} currentUserName={session.user.name} users={managedUsers} canCreateForOthers={canCreateForOthers} canReturnAll={canReturnAll} adminMode />
        </section>
      </div>
    </main>;
  } catch {
    return <main className="flex min-h-svh items-center justify-center bg-muted/30 px-6 py-10"><Alert variant="destructive" className="max-w-xl"><CircleAlert /><AlertTitle>Datenbank nicht erreichbar</AlertTitle><AlertDescription>Setze DATABASE_URL und führe die Datenbanksynchronisierung aus.</AlertDescription></Alert></main>;
  }
}

function AdminMetric({ label, value, detail }: { label: string; value: number; detail: string }) {
  return <Card><CardHeader><CardDescription>{label}</CardDescription><CardTitle className="text-3xl">{value}</CardTitle></CardHeader><CardContent className="text-sm text-muted-foreground">{detail}</CardContent></Card>;
}
