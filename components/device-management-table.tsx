import { Archive, Pencil, Search } from "lucide-react"

import type { Device } from "@/lib/data/inventory"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export function DeviceManagementTable({
    devices,
    search,
    pending,
    onSearchChange,
    onEdit,
    onRetire,
}: {
    devices: Device[]
    search: string
    pending: boolean
    onSearchChange: (value: string) => void
    onEdit: (device: Device) => void
    onRetire: (deviceId: number) => void
}) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Bestand verwalten</CardTitle>
                <CardDescription>{devices.length} Geräte im Datenmodell, einschließlich ausgemusterter Geräte.</CardDescription>
                <div className="relative mt-3 max-w-md"><Search className="absolute top-2.5 left-2.5 text-muted-foreground" /><Input className="pl-8" placeholder="Gerät, Nummer oder Kategorie suchen" value={search} onChange={(event) => onSearchChange(event.target.value)} /></div>
            </CardHeader>
            <CardContent className="p-0">
                <Table>
                    <TableHeader><TableRow><TableHead>Gerät</TableHead><TableHead>Kategorie</TableHead><TableHead>Menge</TableHead><TableHead>Anschaffung</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Aktionen</TableHead></TableRow></TableHeader>
                    <TableBody>{devices.map((device) => <TableRow key={device.id}>
                        <TableCell><div className="flex flex-col"><span className="font-medium">{device.name}</span><span className="font-mono text-xs text-muted-foreground">{device.inventoryNumber}</span></div></TableCell>
                        <TableCell>{device.category}</TableCell><TableCell>{device.quantity}</TableCell><TableCell>{device.acquiredAt}</TableCell>
                        <TableCell>{device.retiredAt ? <Badge variant="outline"><Archive data-icon="inline-start" />Ausgemustert</Badge> : <Badge variant="secondary">Aktiv</Badge>}</TableCell>
                        <TableCell><div className="flex flex-wrap justify-end gap-2"><Button size="sm" variant="outline" onClick={() => onEdit(device)} disabled={pending}><Pencil data-icon="inline-start" />Bearbeiten</Button>{!device.retiredAt && <Button size="sm" variant="destructive" onClick={() => onRetire(device.id)} disabled={pending}><Archive data-icon="inline-start" />Ausmustern</Button>}</div></TableCell>
                    </TableRow>)}</TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}