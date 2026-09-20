import { AlertTriangle, CalendarClock } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export type OverdueLoan = {
  id: number;
  borrower: string;
  name: string;
  inventoryNumber: string;
  dueAt: string;
};

export function OverdueLoans({ loans }: { loans: OverdueLoan[] }) {
  return <Card><CardHeader><CardTitle className="flex items-center gap-2"><AlertTriangle className="text-destructive" />Überfällige Ausleihen</CardTitle><CardDescription>{loans.length === 0 ? "Aktuell ist keine offene Ausleihe überfällig." : "Diese offenen Ausleihen sollten zurückgegeben werden."}</CardDescription></CardHeader><CardContent>{loans.length === 0 ? <p className="text-sm text-muted-foreground">Alles im grünen Bereich.</p> : <div className="flex flex-col gap-2">{loans.map((loan) => <div key={loan.id} className="flex flex-col justify-between gap-2 rounded-lg border bg-background p-3 text-sm sm:flex-row sm:items-center"><div><p className="font-medium">{loan.name} <span className="font-mono text-xs text-muted-foreground">{loan.inventoryNumber}</span></p><p className="text-muted-foreground">{loan.borrower}</p></div><Badge variant="destructive"><CalendarClock data-icon="inline-start" />Fällig seit {loan.dueAt}</Badge></div>)}</div>}</CardContent></Card>;
}