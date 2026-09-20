"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Archive, CheckCircle2, Pencil, Plus, RotateCcw } from "lucide-react";

import { createDevice, retireDevice, updateDevice, type DeviceInput } from "@/lib/actions/devices";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Device } from "@/lib/data/inventory";

const emptyForm: DeviceInput = { name: "", inventoryNumber: "", category: "", quantity: 1, acquiredAt: new Date().toISOString().slice(0, 10) };

type Props = { devices: Device[] };

export function DeviceManagement({ devices }: Props) {
  const router = useRouter();
  const [form, setForm] = useState<DeviceInput>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  function editDevice(device: Device) {
    setEditingId(device.id);
    setForm({ name: device.name, inventoryNumber: device.inventoryNumber, category: device.category, quantity: device.quantity, acquiredAt: device.acquiredAt });
    setMessage(null);
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage(null);
    const result = editingId === null ? await createDevice(form) : await updateDevice(editingId, form);
    setPending(false);
    if (!result.success) {
      setMessage({ type: "error", text: result.error });
      return;
    }
    setMessage({ type: "success", text: editingId === null ? "Gerät angelegt." : "Gerät gespeichert." });
    resetForm();
    router.refresh();
  }

  async function retire(deviceId: number) {
    setPending(true);
    setMessage(null);
    const result = await retireDevice(deviceId);
    setPending(false);
    setMessage({ type: result.success ? "success" : "error", text: result.success ? "Gerät ausgemustert." : result.error });
    if (result.success) router.refresh();
  }

  return <div className="flex flex-col gap-6">
    {message && <Alert variant={message.type === "error" ? "destructive" : "default"}><CheckCircle2 /><AlertTitle>{message.type === "error" ? "Aktion nicht möglich" : "Gespeichert"}</AlertTitle><AlertDescription>{message.text}</AlertDescription></Alert>}
    <Card>
      <CardHeader>
        <CardTitle>{editingId === null ? "Gerät anlegen" : "Gerät bearbeiten"}</CardTitle>
        <CardDescription>Ausgemusterte Geräte bleiben für die Historie erhalten, können aber nicht mehr ausgeliehen werden.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5" onSubmit={submit}>
          <label className="flex flex-col gap-1.5 text-sm"><span>Bezeichnung</span><Input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label>
          <label className="flex flex-col gap-1.5 text-sm"><span>Inventarnummer</span><Input required value={form.inventoryNumber} onChange={(event) => setForm({ ...form, inventoryNumber: event.target.value })} /></label>
          <label className="flex flex-col gap-1.5 text-sm"><span>Kategorie</span><Input required value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} /></label>
          <label className="flex flex-col gap-1.5 text-sm"><span>Menge</span><Input required min={1} max={10000} type="number" value={form.quantity} onChange={(event) => setForm({ ...form, quantity: Number(event.target.value) })} /></label>
          <label className="flex flex-col gap-1.5 text-sm"><span>Anschaffung</span><Input required type="date" value={form.acquiredAt} onChange={(event) => setForm({ ...form, acquiredAt: event.target.value })} /></label>
          <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-5">
            <Button type="submit" disabled={pending}><Plus data-icon="inline-start" />{editingId === null ? "Anlegen" : "Speichern"}</Button>
            {editingId !== null && <Button type="button" variant="outline" onClick={resetForm} disabled={pending}><RotateCcw data-icon="inline-start" />Abbrechen</Button>}
          </div>
        </form>
      </CardContent>
    </Card>

    <Card>
      <CardHeader><CardTitle>Bestand verwalten</CardTitle><CardDescription>{devices.length} Geräte im Datenmodell, einschließlich ausgemusterter Geräte.</CardDescription></CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader><TableRow><TableHead>Gerät</TableHead><TableHead>Kategorie</TableHead><TableHead>Menge</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Aktionen</TableHead></TableRow></TableHeader>
          <TableBody>{devices.map((device) => <TableRow key={device.id}>
            <TableCell><div className="flex flex-col"><span className="font-medium">{device.name}</span><span className="font-mono text-xs text-muted-foreground">{device.inventoryNumber}</span></div></TableCell>
            <TableCell>{device.category}</TableCell><TableCell>{device.quantity}</TableCell>
            <TableCell>{device.retiredAt ? <Badge variant="outline"><Archive data-icon="inline-start" />Ausgemustert</Badge> : <Badge variant="secondary">Aktiv</Badge>}</TableCell>
            <TableCell><div className="flex justify-end gap-2"><Button size="sm" variant="outline" onClick={() => editDevice(device)} disabled={pending}><Pencil data-icon="inline-start" />Bearbeiten</Button>{!device.retiredAt && <Button size="sm" variant="destructive" onClick={() => retire(device.id)} disabled={pending}><Archive data-icon="inline-start" />Ausmustern</Button>}</div></TableCell>
          </TableRow>)}</TableBody>
        </Table>
      </CardContent>
    </Card>
  </div>;
}
