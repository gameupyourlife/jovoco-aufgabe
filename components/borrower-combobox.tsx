import type { ManagedUser } from "@/lib/data/users"
import {
    Combobox,
    ComboboxContent,
    ComboboxEmpty,
    ComboboxInput,
    ComboboxItem,
    ComboboxList,
} from "@/components/ui/combobox"

export function BorrowerCombobox({
    users,
    value,
    onChange,
}: {
    users: ManagedUser[]
    value: string
    onChange: (value: string) => void
}) {
    return (
        <Combobox
            items={users}
            value={users.find((user) => user.id === value) ?? null}
            onValueChange={(nextUser) => onChange(nextUser?.id ?? "")}
            itemToStringLabel={(user) => user?.name ?? ""}
            itemToStringValue={(user) => user?.id ?? ""}
        >
            <ComboboxInput placeholder="Person suchen ..." showClear className="w-full" />
            <ComboboxContent>
                <ComboboxList>
                    <ComboboxEmpty>Keine passende Person gefunden.</ComboboxEmpty>
                    {users.map((user) => (
                        <ComboboxItem key={user.id} value={user}>
                            {user.name} <span className="text-muted-foreground">· {user.email}</span>
                        </ComboboxItem>
                    ))}
                </ComboboxList>
            </ComboboxContent>
        </Combobox>
    )
}