"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CheckCircle2, RotateCcw } from "lucide-react";

import { returnLoan } from "@/lib/actions/inventory";
import type { InventoryDevice } from "@/lib/data/inventory";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type MyLoan = InventoryDevice["loans"][number] & Pick<InventoryDevice, "name" | "inventoryNumber" | "category">;

export function MyLoans({ loans }: { loans: MyLoan[] }) {
  const router = useRouter();
  const [pendingLoanId, setPendingLoanId] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function handleReturn(loanId: number) {
    setPendingLoanId(loanId);
    setMessage(null);
    const result = await returnLoan(loanId);
    setPendingLoanId(null);
    if (!result.success) {
      setMessage(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Meine Ausleihen</CardTitle>
        <CardDescription>Hier siehst du deine offenen Geräte und kannst sie zurückgeben.</CardDescription>
      </CardHeader>
      <CardContent>
        {message ? <Alert variant="destructive" className="mb-4"><AlertTitle>Rückgabe nicht möglich</AlertTitle><AlertDescription>{message}</AlertDescription></Alert> : null}
        {loans.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon"><CheckCircle2 /></EmptyMedia>
              <EmptyTitle>Keine offenen Ausleihen</EmptyTitle>
              <EmptyDescription>Ausgeliehene Geräte erscheinen hier automatisch.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <Table>
            <TableHeader><TableRow><TableHead>Gerät</TableHead><TableHead>Kategorie</TableHead><TableHead>Ausgeliehen am</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Aktion</TableHead></TableRow></TableHeader>
            <TableBody>{loans.map((loan) => <TableRow key={loan.id}>
              <TableCell><div className="flex flex-col"><span className="font-medium">{loan.name}</span><span className="font-mono text-xs text-muted-foreground">{loan.inventoryNumber}</span></div></TableCell>
              <TableCell>{loan.category}</TableCell>
              <TableCell>{loan.borrowedAt}</TableCell>
              <TableCell><Badge variant="secondary">Offen</Badge></TableCell>
              <TableCell className="text-right"><Button variant="outline" size="sm" disabled={pendingLoanId === loan.id} onClick={() => handleReturn(loan.id)}><RotateCcw data-icon="inline-start" />Zurückgeben</Button></TableCell>
            </TableRow>)}</TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}