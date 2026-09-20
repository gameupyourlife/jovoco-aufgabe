import { Plus, RotateCcw } from "lucide-react"

import type { DeviceInput } from "@/lib/actions/devices"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

export function DeviceManagementForm({
    form,
    editing,
    pending,
    onChange,
    onSubmit,
    onReset,
}: {
    form: DeviceInput
    editing: boolean
    pending: boolean
    onChange: (field: keyof DeviceInput, value: string | number) => void
    onSubmit: (event: React.FormEvent<HTMLFormElement>) => void
    onReset: () => void
}) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>{editing ? "Gerät bearbeiten" : "Gerät anlegen"}</CardTitle>
                <CardDescription>Ausgemusterte Geräte bleiben für die Historie erhalten, können aber nicht mehr ausgeliehen werden.</CardDescription>
            </CardHeader>
            <CardContent>
                <form className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5" onSubmit={onSubmit}>
                    <label className="flex flex-col gap-1.5 text-sm"><span>Bezeichnung</span><Input required value={form.name} onChange={(event) => onChange("name", event.target.value)} /></label>
                    <label className="flex flex-col gap-1.5 text-sm"><span>Inventarnummer</span><Input required value={form.inventoryNumber} onChange={(event) => onChange("inventoryNumber", event.target.value)} /></label>
                    <label className="flex flex-col gap-1.5 text-sm"><span>Kategorie</span><Input required value={form.category} onChange={(event) => onChange("category", event.target.value)} /></label>
                    <label className="flex flex-col gap-1.5 text-sm"><span>Menge</span><Input required min={1} max={10000} type="number" value={form.quantity} onChange={(event) => onChange("quantity", Number(event.target.value))} /></label>
                    <label className="flex flex-col gap-1.5 text-sm"><span>Anschaffung</span><Input required type="date" value={form.acquiredAt} onChange={(event) => onChange("acquiredAt", event.target.value)} /></label>
                    <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-5">
                        <Button type="submit" disabled={pending}><Plus data-icon="inline-start" />{editing ? "Speichern" : "Anlegen"}</Button>
                        {editing && <Button type="button" variant="outline" onClick={onReset} disabled={pending}><RotateCcw data-icon="inline-start" />Abbrechen</Button>}
                    </div>
                </form>
            </CardContent>
        </Card>
    )
}