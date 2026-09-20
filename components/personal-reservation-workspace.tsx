"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarCheck, CircleAlert, OctagonX, UserRound } from "lucide-react";

import { cancelReservation, createReservation, pickupReservation } from "@/lib/actions/reservations";
import type { ReservationWithDevice } from "@/lib/data/reservations";
import type { ManagedUser } from "@/lib/data/users";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Combobox, ComboboxContent, ComboboxEmpty, ComboboxInput, ComboboxItem, ComboboxList } from "@/components/ui/combobox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type Device = { id: number; name: string; inventoryNumber: string; category: string };

export function PersonalReservationWorkspace({ devices, reservations, users, currentUserId, canCreateForOthers, canCancelAll, canPickupAll }: { devices: Device[]; reservations: ReservationWithDevice[]; users: ManagedUser[]; currentUserId: string; canCreateForOthers: boolean; canCancelAll: boolean; canPickupAll: boolean }) {
    const router = useRouter();
    const [deviceId, setDeviceId] = useState("");
    const [startsAt, setStartsAt] = useState("");
    const [reserverUserId, setReserverUserId] = useState(currentUserId);
    const [pending, setPending] = useState<number | "create" | null>(null);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    async function create() {
        setPending("create");
        setMessage(null);
        const result = await createReservation(Number(deviceId), startsAt, canCreateForOthers ? reserverUserId : undefined);
        setPending(null);
        if (!result.success) {
            setMessage({ type: "error", text: result.error });
            return;
        }
        setMessage({ type: "success", text: "Reservierung angelegt." });
        setDeviceId("");
        setStartsAt("");
        router.refresh();
    }

    async function runAction(action: "cancel" | "pickup", id: number) {
        setPending(id);
        setMessage(null);
        const result = action === "cancel" ? await cancelReservation(id) : await pickupReservation(id);
        setPending(null);
        setMessage({ type: result.success ? "success" : "error", text: result.success ? (action === "cancel" ? "Reservierung storniert." : "Reservierung abgeholt und als Ausleihe erfasst.") : result.error });
        if (result.success) router.refresh();
    }

    return <div className="flex flex-col gap-6">
        {message && <Alert variant={message.type === "error" ? "destructive" : "default"}><CalendarCheck /><AlertTitle>{message.type === "error" ? "Aktion nicht möglich" : "Gespeichert"}</AlertTitle><AlertDescription>{message.text}</AlertDescription></Alert>}
        <Card>
            <CardHeader><CardTitle>Gerät reservieren</CardTitle><CardDescription>Die Dauer wird automatisch aus der Leihdauer-Konfiguration der Gerätekategorie übernommen.</CardDescription></CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Combobox items={devices} value={devices.find((device) => device.id === Number(deviceId)) ?? null} onValueChange={(device) => setDeviceId(device ? String(device.id) : "")} itemToStringLabel={(device) => device?.name ?? ""} itemToStringValue={(device) => device ? String(device.id) : ""}>
                    <ComboboxInput placeholder="Gerät auswählen" showClear className="w-full" />
                    <ComboboxContent><ComboboxList><ComboboxEmpty>Kein passendes Gerät gefunden.</ComboboxEmpty>{devices.map((device) => <ComboboxItem key={device.id} value={device}>{device.name} <span className="text-muted-foreground">· {device.inventoryNumber}</span></ComboboxItem>)}</ComboboxList></ComboboxContent>
                </Combobox>
                <Input type="date" aria-label="Beginn" value={startsAt} onChange={(event) => setStartsAt(event.target.value)} />
                {canCreateForOthers ? <Combobox items={users} value={users.find((user) => user.id === reserverUserId) ?? null} onValueChange={(user) => setReserverUserId(user?.id ?? currentUserId)} itemToStringLabel={(user) => user?.name ?? ""} itemToStringValue={(user) => user?.id ?? ""}><ComboboxInput placeholder="Person auswählen" showClear className="w-full" /><ComboboxContent><ComboboxList><ComboboxEmpty>Keine Person gefunden.</ComboboxEmpty>{users.map((user) => <ComboboxItem key={user.id} value={user}>{user.name}</ComboboxItem>)}</ComboboxList></ComboboxContent></Combobox> : <div className="flex items-center gap-2 rounded-md border bg-muted/40 px-3 text-sm text-muted-foreground"><UserRound />Für mich</div>}
                <Button disabled={pending === "create"} onClick={create}><CalendarCheck data-icon="inline-start" />Reservieren</Button>
            </CardContent>
        </Card>
        {reservations.length === 0 ? <Card><Empty><EmptyHeader><EmptyMedia variant="icon"><CircleAlert /></EmptyMedia><EmptyTitle>Noch keine Reservierungen</EmptyTitle><EmptyDescription>Lege oben die erste Reservierung an.</EmptyDescription></EmptyHeader></Empty></Card> : <Card><CardHeader><CardTitle>Meine Reservierungen</CardTitle><CardDescription>Stornierte und abgeholte Reservierungen bleiben als persönliche Historie erhalten.</CardDescription></CardHeader><CardContent className="p-0"><Table><TableHeader><TableRow><TableHead>Gerät</TableHead><TableHead>Zeitraum</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Aktion</TableHead></TableRow></TableHeader><TableBody>{reservations.map((reservation) => <TableRow key={reservation.id}><TableCell><div className="flex flex-col"><span className="font-medium">{reservation.deviceName}</span><span className="font-mono text-xs text-muted-foreground">{reservation.inventoryNumber}</span></div></TableCell><TableCell>{reservation.startsAt} bis {reservation.endsAt}</TableCell><TableCell><Badge variant={reservation.status === "active" ? "secondary" : "outline"}>{reservation.status === "active" ? "Aktiv" : reservation.status === "fulfilled" ? "Abgeholt" : "Storniert"}</Badge></TableCell><TableCell><div className="flex justify-end gap-2">{reservation.status === "active" && <>{(canPickupAll || reservation.reserverUserId === currentUserId) && <Button size="sm" disabled={pending === reservation.id} onClick={() => runAction("pickup", reservation.id)}><CalendarCheck data-icon="inline-start" />Abholen</Button>}{(canCancelAll || reservation.reserverUserId === currentUserId) && <Button variant="outline" size="sm" disabled={pending === reservation.id} onClick={() => runAction("cancel", reservation.id)}><OctagonX data-icon="inline-start" />Stornieren</Button>}</>}</div></TableCell></TableRow>)}</TableBody></Table></CardContent></Card>}
    </div>;
}