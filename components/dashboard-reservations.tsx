"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CalendarCheck, CircleX } from "lucide-react";

import { cancelReservation } from "@/lib/actions/reservations";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";

type DashboardReservation = {
  id: number;
  deviceName: string;
  inventoryNumber: string;
  startsAt: string;
  endsAt: string;
  status: string;
};

export function DashboardReservations({ reservations }: { reservations: DashboardReservation[] }) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function cancel(id: number) {
    setPendingId(id);
    setError(null);
    const result = await cancelReservation(id);
    setPendingId(null);
    if (!result.success) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  const activeReservations = reservations.filter((reservation) => reservation.status === "active");

  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b bg-card/70">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <CardTitle>Meine Reservierungen</CardTitle>
            <CardDescription>Deine nächsten Geräte sind hier auf einen Blick.</CardDescription>
          </div>
          <CalendarCheck className="text-primary" />
        </div>
      </CardHeader>
      <CardContent className="pt-5">
        {error && <Alert variant="destructive" className="mb-4"><CircleX /><AlertTitle>Aktion nicht möglich</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
        {activeReservations.length === 0 ? (
          <Empty className="border-0 p-4">
            <EmptyHeader>
              <EmptyMedia variant="icon"><CalendarCheck /></EmptyMedia>
              <EmptyTitle>Keine aktiven Reservierungen</EmptyTitle>
              <EmptyDescription>Reservierungen für dich werden hier angezeigt.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="flex flex-col gap-3">
            {activeReservations.map((reservation) => (
              <div key={reservation.id} className="flex flex-col gap-3 rounded-xl border bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{reservation.deviceName}</span>
                    <Badge variant="secondary">Aktiv</Badge>
                  </div>
                  <span className="font-mono text-xs text-muted-foreground">{reservation.inventoryNumber}</span>
                  <span className="text-sm text-muted-foreground">{reservation.startsAt} bis {reservation.endsAt}</span>
                </div>
                <Button variant="outline" size="sm" disabled={pendingId === reservation.id} onClick={() => cancel(reservation.id)}>
                  <CircleX data-icon="inline-start" />Stornieren
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
