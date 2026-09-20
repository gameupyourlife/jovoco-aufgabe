"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarClock, CheckCircle2, ChevronDown, CircleAlert, RotateCcw, Search } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import {
    Combobox,
    ComboboxContent,
    ComboboxEmpty,
    ComboboxInput,
    ComboboxItem,
    ComboboxList,
} from "@/components/ui/combobox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { checkoutLoan, returnLoan as returnLoanAction } from "@/lib/actions/inventory";
import type { InventoryDevice } from "@/lib/data/inventory";
import type { ManagedUser } from "@/lib/data/users";

type Loan = InventoryDevice["loans"][number];
type Device = InventoryDevice;

export function InventoryWorkspace({ devices, categories, currentUserName, users, canCreateForOthers, canReturnAll }: { devices: Device[]; categories: string[]; currentUserName: string; users: ManagedUser[]; canCreateForOthers: boolean; canReturnAll: boolean }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [availableOnly, setAvailableOnly] = useState(false);
  const [borrowerUserId, setBorrowerUserId] = useState("");
  const [expanded, setExpanded] = useState<number | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [pending, setPending] = useState<number | null>(null);

  const filteredDevices = useMemo(() => devices.filter((device) => {
    const borrowers = device.loans.map((loan) => loan.borrower).join(" ");
    const haystack = `${device.name} ${device.inventoryNumber} ${device.category} ${borrowers}`.toLowerCase();
    return haystack.includes(search.toLowerCase()) && (category === "all" || device.category === category) && (!availableOnly || device.available > 0);
  }), [availableOnly, category, devices, search]);

  async function checkout(deviceId: number) {
    const borrower = canCreateForOthers
      ? users.find((user) => user.id === borrowerUserId)?.name ?? ""
      : currentUserName;
    if (!borrower.trim()) { setMessage({ type: "error", text: "Bitte zuerst eine ausleihende Person eingeben." }); return; }
    setPending(deviceId); setMessage(null);
    const result = await checkoutLoan(deviceId, borrower, canCreateForOthers && borrowerUserId ? borrowerUserId : undefined);
    setPending(null);
    if (!result.success) { setMessage({ type: "error", text: result.error }); return; }
    setMessage({ type: "success", text: "Ausleihe angelegt." });
    setBorrowerUserId("");
    router.refresh();
  }

  async function returnLoan(loanId: number) {
    setPending(loanId); setMessage(null);
    const result = await returnLoanAction(loanId);
    setPending(null);
    setMessage({ type: result.success ? "success" : "error", text: result.success ? "Rückgabe gespeichert." : result.error });
    if (result.success) router.refresh();
  }

  return <div className="flex flex-col gap-4">
    {message && <Alert variant={message.type === "error" ? "destructive" : "default"}><CheckCircle2 /><AlertTitle>{message.type === "error" ? "Aktion nicht möglich" : "Gespeichert"}</AlertTitle><AlertDescription>{message.text}</AlertDescription></Alert>}
    <Card>
      <CardHeader><CardTitle>Geräteübersicht</CardTitle><CardDescription>Verfügbarkeit basiert auf Bestand minus offenen Ausleihen. Reservierte Einheiten können nur über die Reservierung abgeholt werden.</CardDescription></CardHeader>
      <CardContent className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1"><Search className="absolute top-2 left-2.5 text-muted-foreground" /><Input className="pl-8" placeholder="Gerät, Person, Inventarnummer oder Kategorie" value={search} onChange={(event) => setSearch(event.target.value)} /></div>
        <Select value={category} onValueChange={(value) => setCategory(value ?? "all")}><SelectTrigger className="w-full sm:w-52"><SelectValue placeholder="Kategorie" /></SelectTrigger><SelectContent><SelectItem value="all">Alle Kategorien</SelectItem>{categories.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select>
        <Button variant={availableOnly ? "secondary" : "outline"} onClick={() => setAvailableOnly((value) => !value)}><CheckCircle2 data-icon="inline-start" />Nur verfügbar</Button>
      </CardContent>
    </Card>

    <Card><CardHeader><CardTitle>Ausleihe anlegen</CardTitle><CardDescription>{canCreateForOthers ? "Wähle aus, für wen das Gerät ausgegeben wird." : "Das Gerät wird auf dein Konto ausgeliehen."}</CardDescription></CardHeader><CardContent>{canCreateForOthers ? <BorrowerCombobox users={users} value={borrowerUserId} onChange={setBorrowerUserId} /> : <Input aria-label="Ausleihende Person" value={currentUserName} disabled />}</CardContent></Card>

    {filteredDevices.length === 0 ? <Card><Empty><EmptyHeader><EmptyMedia variant="icon"><CircleAlert /></EmptyMedia><EmptyTitle>Keine passenden Geräte</EmptyTitle><EmptyDescription>Verändere Suche oder Filter.</EmptyDescription></EmptyHeader></Empty></Card> : <Card><CardContent className="p-0"><Table><TableHeader><TableRow><TableHead>Gerät</TableHead><TableHead>Kategorie</TableHead><TableHead>Bestand</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Aktion</TableHead></TableRow></TableHeader><TableBody>{filteredDevices.map((device) => <DeviceRow key={device.id} device={device} expanded={expanded === device.id} onToggle={() => setExpanded(expanded === device.id ? null : device.id)} onCheckout={() => checkout(device.id)} onReturn={returnLoan} pending={pending} canReturnAll={canReturnAll} currentUserName={currentUserName} />)}</TableBody></Table></CardContent></Card>}
  </div>;
}

function DeviceRow({ device, expanded, onToggle, onCheckout, onReturn, pending, canReturnAll, currentUserName }: { device: Device; expanded: boolean; onToggle: () => void; onCheckout: () => void; onReturn: (loanId: number) => void; pending: number | null; canReturnAll: boolean; currentUserName: string }) {
  return <>
    <TableRow><TableCell><div className="flex flex-col"><span className="font-medium">{device.name}</span><span className="font-mono text-xs text-muted-foreground">{device.inventoryNumber}</span></div></TableCell><TableCell>{device.category}</TableCell><TableCell>{device.available} / {device.quantity}</TableCell><TableCell><Badge variant={device.reserved > 0 ? "outline" : device.available > 0 ? "secondary" : "destructive"}>{device.reserved > 0 ? "Reserviert" : device.available > 0 ? "Verfügbar" : "Verliehen"}</Badge></TableCell><TableCell><div className="flex justify-end gap-2"><Button size="sm" disabled={device.available === 0 || device.reserved >= device.available || pending === device.id} onClick={onCheckout}><CheckCircle2 data-icon="inline-start" />Ausleihen</Button><Button variant="outline" size="sm" onClick={onToggle} aria-expanded={expanded}><ChevronDown data-icon="inline-start" />Historie</Button></div></TableCell></TableRow>
    {expanded && <TableRow><TableCell colSpan={5} className="bg-muted/30"><div className="flex flex-col gap-3"><p className="font-medium">Ausleihhistorie</p>{device.loans.length === 0 ? <p className="text-sm text-muted-foreground">Noch keine Ausleihen.</p> : <div className="flex flex-col gap-2">{device.loans.map((loan) => <div key={loan.id} className="flex flex-col justify-between gap-2 rounded-lg border bg-background p-3 text-sm sm:flex-row sm:items-center"><div><span className="font-medium">{loan.borrower}</span><span className="text-muted-foreground"> · ausgeliehen am {loan.borrowedAt}</span>{loan.dueAt && <span className="text-muted-foreground"> · fällig am {loan.dueAt}</span>}{loan.returnedAt && <span className="text-muted-foreground"> · zurück am {loan.returnedAt}</span>}{!loan.returnedAt && loan.dueAt && loan.dueAt < new Date().toISOString().slice(0, 10) && <Badge variant="destructive" className="ml-2"><CalendarClock data-icon="inline-start" />Überfällig</Badge>}</div>{!loan.returnedAt && (canReturnAll || loan.borrower === currentUserName) && <Button variant="outline" size="sm" disabled={pending === loan.id} onClick={() => onReturn(loan.id)}><RotateCcw data-icon="inline-start" />Rückgabe</Button>}</div>)}</div>}</div></TableCell></TableRow>}
  </>;
}

function BorrowerCombobox({ users, value, onChange }: { users: ManagedUser[]; value: string; onChange: (value: string) => void }) {
  const userIds = users.map((user) => user.id);

  return <Combobox
    items={userIds}
    value={value || null}
    onValueChange={(nextValue) => onChange(nextValue ?? "")}
    itemToStringValue={(userId) => {
      const user = users.find((candidate) => candidate.id === userId);
      return user ? `${user.name} ${user.email}` : "";
    }}
  >
    <ComboboxInput placeholder="Person suchen ..." showClear className="w-full" />
    <ComboboxContent>
      <ComboboxList>
        <ComboboxEmpty>Keine passende Person gefunden.</ComboboxEmpty>
        {users.map((user) => <ComboboxItem key={user.id} value={user.id}>{user.name} <span className="text-muted-foreground">· {user.email}</span></ComboboxItem>)}
      </ComboboxList>
    </ComboboxContent>
  </Combobox>;
}