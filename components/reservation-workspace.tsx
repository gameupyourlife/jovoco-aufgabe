"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarCheck, CircleAlert, Clock3, History, OctagonX, PackageCheck, RotateCcw, Search, UserRound } from "lucide-react";

import {
    cancelReservation,
    createReservation,
    pickupReservation,
} from "@/lib/actions/reservations";
import { returnLoan } from "@/lib/actions/inventory";
import type { InventoryDevice } from "@/lib/data/inventory";
import type { ReservationWithDevice } from "@/lib/data/reservations";
import type { ManagedUser } from "@/lib/data/users";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Empty,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import {
    Combobox,
    ComboboxContent,
    ComboboxEmpty,
    ComboboxInput,
    ComboboxItem,
    ComboboxList,
} from "@/components/ui/combobox";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

type Device = {
    id: number
    name: string
    inventoryNumber: string
    category: string
}
type Message = { type: "success" | "error"; text: string }

function getReservationStatusLabel(status: string) {
    return (
        (
            {
                active: "Aktiv",
                cancelled: "Storniert",
                fulfilled: "Abgeholt",
            } as Record<string, string>
        )[status] ?? status
    )
}

function getLoanStatus(loan: InventoryDevice["loans"][number]) {
    if (loan.returnedAt) return { label: "Zurückgegeben", variant: "outline" as const };
    if (loan.dueAt && loan.dueAt < new Date().toISOString().slice(0, 10)) return { label: "Überfällig", variant: "destructive" as const };
    return { label: "Offen", variant: "secondary" as const };
}

export function ReservationWorkspace({
    devices,
    reservations,
    inventoryDevices,
    users,
    currentUserId,
    canCreateForOthers,
    canCancelAll,
    canPickupAll,
    canReturnAll,
    canViewAll,
    allowLoanReturns = true,
}: {
    devices: Device[]
    reservations: ReservationWithDevice[]
    inventoryDevices: InventoryDevice[]
    users: ManagedUser[]
    currentUserId: string
    canCreateForOthers: boolean
    canCancelAll: boolean
    canPickupAll: boolean
    canReturnAll: boolean
    canViewAll: boolean
    allowLoanReturns?: boolean
}) {
    const router = useRouter()
    const [deviceId, setDeviceId] = useState("")
    const [startsAt, setStartsAt] = useState("")
    const [reserverUserId, setReserverUserId] = useState(currentUserId)
    const [pending, setPending] = useState<number | "create" | null>(null)
    const [message, setMessage] = useState<Message | null>(null)
    const [search, setSearch] = useState("")
    const [statusFilter, setStatusFilter] = useState("all")
    const [expandedDevice, setExpandedDevice] = useState<number | null>(null)

    const visibleReservations = useMemo(() => reservations.filter((reservation) => {
        const query = search.toLowerCase()
        const matchesSearch = !query || `${reservation.deviceName} ${reservation.inventoryNumber} ${reservation.reserver} ${reservation.category}`.toLowerCase().includes(query)
        return matchesSearch && (statusFilter === "all" || reservation.status === statusFilter)
    }), [reservations, search, statusFilter])

    const openLoans = inventoryDevices.flatMap((device) => device.loans.filter((loan) => !loan.returnedAt))
    const activeReservations = reservations.filter((reservation) => reservation.status === "active")
    const overdueLoans = openLoans.filter((loan) => loan.dueAt && loan.dueAt < new Date().toISOString().slice(0, 10))

    async function create() {
        setPending("create")
        setMessage(null)
        const result = await createReservation(
            Number(deviceId),
            startsAt,
            canCreateForOthers ? reserverUserId : undefined
        )
        setPending(null)
        if (!result.success) {
            setMessage({ type: "error", text: result.error })
            return
        }
        setMessage({ type: "success", text: "Reservierung angelegt." })
        setDeviceId("")
        setStartsAt("")
        router.refresh()
    }

    async function runAction(action: "cancel" | "pickup", id: number) {
        setPending(id)
        setMessage(null)
        const result =
            action === "cancel"
                ? await cancelReservation(id)
                : await pickupReservation(id)
        setPending(null)
        setMessage({
            type: result.success ? "success" : "error",
            text: result.success
                ? action === "cancel"
                    ? "Reservierung storniert."
                    : "Reservierung abgeholt und als Ausleihe erfasst."
                : result.error,
        })
        if (result.success) router.refresh()
    }

    async function handleReturn(loanId: number) {
        setPending(loanId)
        setMessage(null)
        const result = await returnLoan(loanId)
        setPending(null)
        setMessage({ type: result.success ? "success" : "error", text: result.success ? "Rückgabe gespeichert." : result.error })
        if (result.success) router.refresh()
    }

    return (
        <div className="flex flex-col gap-6">
            {message && (
                <Alert variant={message.type === "error" ? "destructive" : "default"}>
                    <CalendarCheck />
                    <AlertTitle>
                        {message.type === "error" ? "Aktion nicht möglich" : "Gespeichert"}
                    </AlertTitle>
                    <AlertDescription>{message.text}</AlertDescription>
                </Alert>
            )}
            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Summary label="Aktive Reservierungen" value={activeReservations.length} detail="Noch nicht abgeholt" icon={<CalendarCheck />} />
                <Summary label="Offene Ausleihen" value={openLoans.length} detail="Geräte unterwegs" icon={<PackageCheck />} />
                <Summary label="Überfällig" value={overdueLoans.length} detail="Rückgabe erforderlich" icon={<Clock3 />} warning={overdueLoans.length > 0} />
                <Summary label="Geräte im Verlauf" value={inventoryDevices.length} detail={canViewAll ? "Gesamter Bestand" : "Deine Geräte"} icon={<History />} />
            </section>
            <Card>
                <CardHeader>
                    <CardTitle>Gerät reservieren</CardTitle>
                    <CardDescription>
                        Die Dauer wird automatisch aus der Leihdauer-Konfiguration der
                        Gerätekategorie übernommen.
                    </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Combobox
                        items={devices}
                        value={
                            devices.find((device) => device.id === Number(deviceId)) ?? null
                        }
                        onValueChange={(device) =>
                            setDeviceId(device ? String(device.id) : "")
                        }
                        itemToStringLabel={(device) => device?.name ?? ""}
                        itemToStringValue={(device) => (device ? String(device.id) : "")}
                    >
                        <ComboboxInput
                            placeholder="Gerät auswählen"
                            showClear
                            className="w-full"
                        />
                        <ComboboxContent>
                            <ComboboxList>
                                <ComboboxEmpty>Kein passendes Gerät gefunden.</ComboboxEmpty>
                                {devices.map((device) => (
                                    <ComboboxItem key={device.id} value={device}>
                                        {device.name}{" "}
                                        <span className="text-muted-foreground">
                                            · {device.inventoryNumber}
                                        </span>
                                    </ComboboxItem>
                                ))}
                            </ComboboxList>
                        </ComboboxContent>
                    </Combobox>
                    <Input
                        type="date"
                        aria-label="Beginn"
                        value={startsAt}
                        onChange={(event) => setStartsAt(event.target.value)}
                    />
                    
                        {canCreateForOthers ? (
                            <Combobox
                                items={users}
                                value={users.find((user) => user.id === reserverUserId) ?? null}
                                onValueChange={(user) => setReserverUserId(user?.id ?? currentUserId)}
                                itemToStringLabel={(user) => user?.name ?? ""}
                                itemToStringValue={(user) => user?.id ?? ""}
                            >
                                <ComboboxInput placeholder="Person auswählen" showClear className="w-full" />
                                <ComboboxContent>
                                    <ComboboxList>
                                        <ComboboxEmpty>Keine Person gefunden.</ComboboxEmpty>
                                        {users.map((user) => <ComboboxItem key={user.id} value={user}>{user.name}</ComboboxItem>)}
                                    </ComboboxList>
                                </ComboboxContent>
                            </Combobox>
                        ) : (
                            <div className="flex items-center gap-2 rounded-md border bg-muted/40 px-3 text-sm text-muted-foreground"><UserRound />Für mich</div>
                        )}
                    <Button disabled={pending === "create"} onClick={create}>
                        <CalendarCheck data-icon="inline-start" />
                        Reservieren
                    </Button>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="gap-4 border-b">
                    <div className="flex flex-col gap-1"><CardTitle>Verlauf verwalten</CardTitle><CardDescription>Reservierungen, Abholungen und Rückgaben bleiben pro Gerät nachvollziehbar.</CardDescription></div>
                    <div className="flex flex-col gap-3 sm:flex-row">
                        <div className="relative flex-1"><Search className="absolute top-2.5 left-2.5 text-muted-foreground" /><Input className="pl-8" placeholder="Gerät, Inventarnummer oder Person suchen" value={search} onChange={(event) => setSearch(event.target.value)} /></div>
                        <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value ?? "all")}>
                            <SelectTrigger className="w-full sm:w-44" aria-label="Reservierungsstatus"><SelectValue placeholder="Alle Status" /></SelectTrigger>
                            <SelectContent><SelectItem value="all">Alle Status</SelectItem><SelectItem value="active">Aktiv</SelectItem><SelectItem value="fulfilled">Abgeholt</SelectItem><SelectItem value="cancelled">Storniert</SelectItem></SelectContent>
                        </Select>
                    </div>
                </CardHeader>
                {visibleReservations.length === 0 ? (
                    <Empty>
                        <EmptyHeader>
                            <EmptyMedia variant="icon">
                                <CircleAlert />
                            </EmptyMedia>
                            <EmptyTitle>Noch keine Reservierungen</EmptyTitle>
                            <EmptyDescription>
                                Lege oben die erste Reservierung an.
                            </EmptyDescription>
                        </EmptyHeader>
                    </Empty>
                ) : (
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Gerät</TableHead>
                                    <TableHead>Zeitraum</TableHead>
                                    <TableHead>Person</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Aktion</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {visibleReservations.map((reservation) => {
                                    const expanded = expandedDevice === reservation.deviceId
                                    return <TableRow key={reservation.id} data-state={expanded ? "selected" : undefined}>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-medium">
                                                    {reservation.deviceName}
                                                </span>
                                                <span className="font-mono text-xs text-muted-foreground">
                                                    {reservation.inventoryNumber}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {reservation.startsAt} bis {reservation.endsAt}
                                        </TableCell>
                                        <TableCell>{reservation.reserver}</TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={
                                                    reservation.status === "active"
                                                        ? "secondary"
                                                        : "outline"
                                                }
                                            >
                                                {getReservationStatusLabel(reservation.status)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex justify-end gap-2">
                                                <Button variant="ghost" size="sm" onClick={() => setExpandedDevice(expanded ? null : reservation.deviceId)}><History data-icon="inline-start" />Details</Button>
                                                {reservation.status === "active" && (
                                                    <>
                                                        {(canPickupAll ||
                                                            reservation.reserverUserId === currentUserId) && (
                                                                <Button
                                                                    size="sm"
                                                                    disabled={pending === reservation.id}
                                                                    onClick={() =>
                                                                        runAction("pickup", reservation.id)
                                                                    }
                                                                >
                                                                    <CalendarCheck data-icon="inline-start" />
                                                                    Abholen
                                                                </Button>
                                                            )}
                                                        {(canCancelAll ||
                                                            reservation.reserverUserId === currentUserId) && (
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    disabled={pending === reservation.id}
                                                                    onClick={() =>
                                                                        runAction("cancel", reservation.id)
                                                                    }
                                                                >
                                                                    <OctagonX data-icon="inline-start" />
                                                                    Stornieren
                                                                </Button>
                                                            )}
                                                    </>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                })}
                            </TableBody>
                        </Table>
                        {expandedDevice !== null && <DeviceHistory device={inventoryDevices.find((device) => device.id === expandedDevice)} reservations={reservations.filter((reservation) => reservation.deviceId === expandedDevice)} pending={pending} canReturnAll={canReturnAll} currentUserId={currentUserId} onReturn={handleReturn} allowLoanReturns={allowLoanReturns} />}
                    </CardContent>
                )}
            </Card>
        </div>
    )
}

function Summary({ label, value, detail, icon, warning = false }: { label: string; value: number; detail: string; icon: React.ReactNode; warning?: boolean }) {
    return <Card className={warning ? "border-destructive/30 bg-destructive/5" : undefined}><CardHeader className="flex-row items-start justify-between gap-4 space-y-0"><div className="flex flex-col gap-1"><CardDescription>{label}</CardDescription><CardTitle className="text-3xl">{value}</CardTitle></div><span className="rounded-lg bg-muted p-2 text-primary">{icon}</span></CardHeader><CardContent className="text-xs text-muted-foreground">{detail}</CardContent></Card>
}

function DeviceHistory({ device, reservations, pending, canReturnAll, currentUserId, onReturn, allowLoanReturns }: { device?: InventoryDevice; reservations: ReservationWithDevice[]; pending: number | "create" | null; canReturnAll: boolean; currentUserId: string; onReturn: (loanId: number) => void; allowLoanReturns: boolean }) {
    if (!device) return null
    return <div className="border-t bg-muted/20 p-4"><div className="mb-3 flex items-center justify-between gap-3"><div><p className="font-medium">{device.name}</p><p className="font-mono text-xs text-muted-foreground">{device.inventoryNumber} · {device.category}</p></div><Badge variant="outline">{device.available} / {device.quantity} verfügbar</Badge></div><div className="grid gap-4 lg:grid-cols-2"><div><p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Reservierungen</p><div className="flex flex-col gap-2">{reservations.map((reservation) => <div key={reservation.id} className="flex items-center justify-between gap-3 rounded-md border bg-background p-3 text-sm"><span>{reservation.startsAt} bis {reservation.endsAt}<span className="block text-xs text-muted-foreground">{reservation.reserver}</span></span><Badge variant={reservation.status === "active" ? "secondary" : "outline"}>{getReservationStatusLabel(reservation.status)}</Badge></div>)}</div></div><div><p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Ausleihen</p><div className="flex flex-col gap-2">{device.loans.length === 0 ? <p className="text-sm text-muted-foreground">Noch keine Ausleihen erfasst.</p> : device.loans.map((loan) => { const status = getLoanStatus(loan); const canReturn = !loan.returnedAt && (canReturnAll || loan.borrowerUserId === currentUserId); return <div key={loan.id} className="flex items-center justify-between gap-3 rounded-md border bg-background p-3 text-sm"><span>{loan.borrower}<span className="block text-xs text-muted-foreground">{loan.borrowedAt} bis {loan.returnedAt ?? loan.dueAt ?? "offen"}</span></span><div className="flex items-center gap-2"><Badge variant={status.variant}>{status.label}</Badge>{allowLoanReturns && canReturn && <Button variant="outline" size="sm" disabled={pending === loan.id} onClick={() => onReturn(loan.id)}><RotateCcw data-icon="inline-start" />Rückgabe</Button>}</div></div> })}</div></div></div></div>
}
