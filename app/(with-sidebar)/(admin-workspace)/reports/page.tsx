import { BarChart3, CircleAlert } from "lucide-react";

import { ReportsWorkspace } from "@/components/reports-workspace";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { isAuthenticated } from "@/lib/auth/guard";
import { getReportData } from "@/lib/data/reports";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  await isAuthenticated({ behavior: "forbidden", permissions: { report: ["read"] } });
  try {
    const data = await getReportData();
    return <main className="min-h-svh bg-muted/30 px-4 py-8 sm:px-6">
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        <header className="flex flex-col gap-3"><p className="text-sm font-medium uppercase tracking-[0.2em] text-primary">Verwaltung</p><div className="flex items-end justify-between gap-4"><div><h1 className="font-heading text-4xl font-semibold tracking-tight">Auswertungen</h1><p className="mt-2 max-w-2xl text-muted-foreground">Ein kompakter Blick auf aktuelle Ausleihen, Nutzungshäufigkeit und Kapazitätsauslastung.</p></div><BarChart3 className="hidden size-10 text-primary sm:block" /></div></header>
        <ReportsWorkspace data={data} />
      </div>
    </main>;
  } catch {
    return <main className="flex min-h-svh items-center justify-center bg-muted/30 px-6 py-10"><Alert variant="destructive" className="max-w-xl"><CircleAlert /><AlertTitle>Datenbank nicht erreichbar</AlertTitle><AlertDescription>Setze DATABASE_URL und führe die Datenbanksynchronisierung aus.</AlertDescription></Alert></main>;
  }
}
