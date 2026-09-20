import { CalendarClock, Settings2 } from "lucide-react";

import { LoanDurationManagement } from "@/components/loan-duration-management";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { isAuthenticated } from "@/lib/auth/guard";
import { getLoanDurationRules } from "@/lib/data/loan-duration";

export const dynamic = "force-dynamic";

export default async function LoanSettingsPage() {
  await isAuthenticated({ behavior: "forbidden", permissions: { loan_settings: ["manage"] } });
  const rules = await getLoanDurationRules();

  return <main className="min-h-svh bg-muted/30 px-4 py-8 sm:px-6"><div className="mx-auto flex max-w-6xl flex-col gap-8"><header className="flex flex-col gap-3"><p className="text-sm font-medium uppercase tracking-[0.2em] text-primary">Verwaltung</p><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><h1 className="font-heading text-4xl font-semibold tracking-tight">Leihfristen</h1><p className="mt-2 max-w-2xl text-muted-foreground">Konfiguriere, wie viele Tage eine neue Ausleihe je Kategorie dauern darf.</p></div><Badge variant="outline"><CalendarClock data-icon="inline-start" />{rules.length} Regeln</Badge></div></header><Card><CardHeader><CardTitle className="flex items-center gap-2"><Settings2 />Fristenverwaltung</CardTitle><CardDescription>Die Einstellung wird dauerhaft in der Datenbank gespeichert und bei jeder neuen Ausleihe berücksichtigt.</CardDescription></CardHeader><CardContent><LoanDurationManagement rules={rules} /></CardContent></Card></div></main>;
}