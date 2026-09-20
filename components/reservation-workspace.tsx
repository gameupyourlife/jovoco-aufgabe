"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarCheck, CircleAlert, OctagonX } from "lucide-react";

import { cancelReservation, createReservation, pickupReservation } from "@/lib/actions/reservations";
import type { ReservationWithDevice } from "@/lib/data/reservations";
import type { ManagedUser } from "@/lib/data/users";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type Device = { id: number; name: string; inventoryNumber: string; category: string };
type Message = { type: "success" | "error"; text: string };

function getReservationStatusLabel(status: string) {
  return ({ active: "Aktiv", cancelled: "Storniert", fulfilled: "Abgeholt" } as Record<string, string>)[status] ?? status;
}

export function ReservationWorkspace({ devices, reservations, users, currentUserId, canCreateForOthers, canCancelAll, canPickupAll }: { devices: Device[]; reservations: ReservationWithDevice[]; users: ManagedUser[]; currentUserId: string; canCreateForOthers: boolean; canCancelAll: boolean; canPickupAll: boolean }) {
  const router = useRouter();
  const [deviceId, setDeviceId] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [reserverUserId, setReserverUserId] = useState(currentUserId);
  const [pending, setPending] = useState<number | "create" | null>(null);
  const [message, setMessage] = useState<Message | null>(null);

  async function create() {
    setPending("create"); setMessage(null);
    const result = await createReservation(Number(deviceId), startsAt, canCreateForOthers ? reserverUserId : undefined);
    setPending(null);
    if (!result.success) { setMessage({ type: "error", text: result.error }); return; }
    setMessage({ type: "success", text: "Reservierung angelegt." }); setDeviceId(""); setStartsAt(""); router.refresh();
  }

  async function runAction(action: "cancel" | "pickup", id: number) {
    setPending(id); setMessage(null);
    const result = action === "cancel" ? await cancelReservation(id) : await pickupReservation(id);
    setPending(null); setMessage({ type: result.success ? "success" : "error", text: result.success ? action === "cancel" ? "Reservierung storniert." : "Reservierung abgeholt und als Ausleihe erfasst." : result.error });
    if (result.success) router.refresh();
  }

  return <div className="flex flex-col gap-6">
    {message && <Alert variant={message.type === "error" ? "destructive" : "default"}><CalendarCheck /><AlertTitle>{message.type === "error" ? "Aktion nicht möglich" : "Gespeichert"}</AlertTitle><AlertDescription>{message.text}</AlertDescription></Alert>}
    <Card><CardHeader><CardTitle>Gerät reservieren</CardTitle><CardDescription>Die Dauer wird automatisch aus der Leihdauer-Konfiguration der Gerätekategorie übernommen.</CardDescription></CardHeader><CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Select value={deviceId} onValueChange={(value) => setDeviceId(value ?? "")}><SelectTrigger><SelectValue placeholder="Gerät auswählen" /></SelectTrigger><SelectContent>{devices.map((device) => <SelectItem key={device.id} value={String(device.id)}>{device.name} · {device.inventoryNumber}</SelectItem>)}</SelectContent></Select>
      <Input type="date" aria-label="Beginn" value={startsAt} onChange={(event) => setStartsAt(event.target.value)} />
      {canCreateForOthers ? <Select value={reserverUserId} onValueChange={(value) => setReserverUserId(value ?? "")}><SelectTrigger><SelectValue placeholder="Person auswählen" /></SelectTrigger><SelectContent>{users.map((user) => <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>)}</SelectContent></Select> : <div className="flex items-center rounded-md border bg-muted/40 px-3 text-sm text-muted-foreground">Für mich</div>}
      <Button disabled={pending === "create"} onClick={create}><CalendarCheck data-icon="inline-start" />Reservieren</Button>
    </CardContent></Card>
    {reservations.length === 0 ? <Card><Empty><EmptyHeader><EmptyMedia variant="icon"><CircleAlert /></EmptyMedia><EmptyTitle>Noch keine Reservierungen</EmptyTitle><EmptyDescription>Lege oben die erste Reservierung an.</EmptyDescription></EmptyHeader></Empty></Card> : <Card><CardHeader><CardTitle>Reservierungsübersicht</CardTitle><CardDescription>Stornierte und abgeholte Reservierungen bleiben als Historie erhalten.</CardDescription></CardHeader><CardContent className="p-0"><Table><TableHeader><TableRow><TableHead>Gerät</TableHead><TableHead>Zeitraum</TableHead><TableHead>Person</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Aktion</TableHead></TableRow></TableHeader><TableBody>{reservations.map((reservation) => <TableRow key={reservation.id}><TableCell><div className="flex flex-col"><span className="font-medium">{reservation.deviceName}</span><span className="font-mono text-xs text-muted-foreground">{reservation.inventoryNumber}</span></div></TableCell><TableCell>{reservation.startsAt} bis {reservation.endsAt}</TableCell><TableCell>{reservation.reserver}</TableCell><TableCell><Badge variant={reservation.status === "active" ? "secondary" : "outline"}>{getReservationStatusLabel(reservation.status)}</Badge></TableCell><TableCell><div className="flex justify-end gap-2">{reservation.status === "active" && <>{(canPickupAll || reservation.reserverUserId === currentUserId) && <Button size="sm" disabled={pending === reservation.id} onClick={() => runAction("pickup", reservation.id)}><CalendarCheck data-icon="inline-start" />Abholen</Button>}{(canCancelAll || reservation.reserverUserId === currentUserId) && <Button variant="outline" size="sm" disabled={pending === reservation.id} onClick={() => runAction("cancel", reservation.id)}><OctagonX data-icon="inline-start" />Stornieren</Button>}</>}</div></TableCell></TableRow>)}</TableBody></Table></CardContent></Card>}
  </div>;
}
