"use client";

import { useState } from "react";
import { CheckCircle2, Save } from "lucide-react";

import { updateLoanDurationRule } from "@/lib/actions/loan-duration";
import type { LoanDurationRule } from "@/lib/data/loan-duration";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function LoanDurationManagement({ rules }: { rules: LoanDurationRule[] }) {
  const [values, setValues] = useState(() => Object.fromEntries(rules.map((rule) => [rule.category, String(rule.durationDays)])));
  const [pending, setPending] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function save(category: string) {
    setPending(category);
    setMessage(null);
    const result = await updateLoanDurationRule(category, Number(values[category]));
    setPending(null);
    setMessage({ type: result.success ? "success" : "error", text: result.success ? `Leihfrist für ${category} gespeichert.` : result.error });
  }

  return <div className="flex flex-col gap-4">
    {message && <Alert variant={message.type === "error" ? "destructive" : "default"}><CheckCircle2 /><AlertTitle>{message.type === "error" ? "Speichern nicht möglich" : "Änderung gespeichert"}</AlertTitle><AlertDescription>{message.text}</AlertDescription></Alert>}
    <Table><TableHeader><TableRow><TableHead>Kategorie</TableHead><TableHead>Leihfrist in Tagen</TableHead><TableHead className="text-right">Aktion</TableHead></TableRow></TableHeader><TableBody>{rules.map((rule) => <TableRow key={rule.id}><TableCell className="font-medium">{rule.category}</TableCell><TableCell><Input className="w-28" type="number" min={1} max={365} value={values[rule.category] ?? ""} onChange={(event) => setValues((current) => ({ ...current, [rule.category]: event.target.value }))} /></TableCell><TableCell className="text-right"><Button size="sm" disabled={pending === rule.category} onClick={() => save(rule.category)}><Save data-icon="inline-start" />Speichern</Button></TableCell></TableRow>)}</TableBody></Table>
    <p className="text-sm text-muted-foreground">Die passende Kategorie wird beim Anlegen einer Ausleihe verwendet. Fehlt eine Kategorie, gilt die Regel „Standard“.</p>
  </div>;
}