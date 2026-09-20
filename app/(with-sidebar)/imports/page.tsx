import { desc, eq } from "drizzle-orm";
import { CircleAlert, Database, FileJson, Rows3 } from "lucide-react";

import { ImportSelector } from "@/components/import-selector";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { db } from "@/lib/db";
import { importRows, importRuns } from "@/lib/db/schema";
import { isAuthenticated } from "@/lib/auth/guard";

export const dynamic = "force-dynamic";

const statusLabels = {
  accepted: { label: "Übernommen", variant: "secondary" as const },
  warning: { label: "Mit Vorbehalt", variant: "outline" as const },
  rejected: { label: "Abgelehnt", variant: "destructive" as const },
  skipped: { label: "Bereits vorhanden", variant: "ghost" as const },
};

type PageProps = {
  searchParams: Promise<{ run?: string }>;
};

export default async function Page({ searchParams }: PageProps) {
  await isAuthenticated({ behavior: "redirect" });
  try {
    const params = await searchParams;
    const runs = await db.select().from(importRuns).orderBy(desc(importRuns.startedAt));
    const requestedRunId = Number(params.run);
    const run = runs.find((candidate) => candidate.id === requestedRunId) ?? runs[0];
    const rows = run
      ? await db.select().from(importRows).where(eq(importRows.runId, run.id)).orderBy(importRows.sourceTable, importRows.sourceRow)
      : [];

    return (
      <main className="min-h-svh bg-muted/30 px-6 py-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-8">
          <header className="flex flex-col gap-3">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary">Geräteverleih</p>
            <h1 className="font-heading text-4xl font-semibold tracking-tight">Datenimport</h1>
            <p className="max-w-2xl text-muted-foreground">Jede Rohdatenzeile erhält eine nachvollziehbare Entscheidung. Der letzte Importbericht bleibt in PostgreSQL gespeichert.</p>
          </header>

          {runs.length > 0 && run ? (
            <Card size="sm">
              <CardHeader>
                <CardTitle>Import auswählen</CardTitle>
                <CardDescription>Wähle einen gespeicherten Importbericht zur Prüfung aus.</CardDescription>
              </CardHeader>
              <CardContent>
                <ImportSelector
                  selectedRunId={run.id}
                  runs={runs.map((candidate) => ({
                    id: candidate.id,
                    label: `${candidate.sourceFile} · ${candidate.startedAt.toLocaleString("de-DE")}`,
                  }))}
                />
              </CardContent>
            </Card>
          ) : null}

          {!run ? (
            <Card>
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon"><Rows3 /></EmptyMedia>
                  <EmptyTitle>Noch kein Importbericht</EmptyTitle>
                  <EmptyDescription>Starte den Import, damit die geprüften Rohdaten hier erscheinen.</EmptyDescription>
                </EmptyHeader>
                <EmptyContent><code className="rounded-md bg-muted px-3 py-2 text-sm">npm run db:import</code></EmptyContent>
              </Empty>
            </Card>
          ) : (
            <>
              <section className="grid gap-4 sm:grid-cols-3">
                <Metric label="Übernommen" value={run.importedCount} description="Gültige Rohdaten" icon={<Database />} />
                <Metric label="Warnungen" value={run.warningCount} description="Übernommen mit Vorbehalt" icon={<CircleAlert />} />
                <Metric label="Abgelehnt" value={run.rejectedCount} description="Nicht in das Modell übernommen" icon={<Rows3 />} />
              </section>
              <Card>
                <CardHeader className="border-b">
                  <CardTitle>Zeilenprotokoll</CardTitle>
                  <CardDescription>Quelle: {run.sourceFile}</CardDescription>
                  <CardAction>
                  <Button variant="link" nativeButton={false} render={<a href={`/api/import-report?run=${run.id}`} />}>
                    <FileJson data-icon="inline-start" />
                    Als JSON öffnen
                  </Button>
                  </CardAction>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Quelle</TableHead>
                        <TableHead>Schlüssel</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Begründung</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rows.map((row) => {
                        const status = statusLabels[row.status as keyof typeof statusLabels];
                        return (
                          <TableRow key={row.id}>
                            <TableCell className="text-muted-foreground">{row.sourceTable} · {row.sourceRow}</TableCell>
                            <TableCell className="font-mono text-xs text-primary">{row.sourceKey}</TableCell>
                            <TableCell><Badge variant={status?.variant ?? "outline"}>{status?.label ?? row.status}</Badge></TableCell>
                            <TableCell className="whitespace-normal text-muted-foreground">{row.message}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </main>
    );
  } catch {
    return (
      <main className="flex min-h-svh items-center justify-center bg-muted/30 px-6 py-10">
        <Alert variant="destructive" className="max-w-xl">
          <CircleAlert />
          <AlertTitle>Datenbank nicht erreichbar</AlertTitle>
          <AlertDescription>Setze DATABASE_URL, führe `npm run db:push` aus und starte danach den Import.</AlertDescription>
        </Alert>
      </main>
    );
  }
}

function Metric({ label, value, description, icon }: { label: string; value: number; description: string; icon: React.ReactNode }) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-3xl">{value}</CardTitle>
        <CardAction className="text-muted-foreground">{icon}</CardAction>
      </CardHeader>
      <CardContent className="text-xs text-muted-foreground">{description}</CardContent>
    </Card>
  );
}
