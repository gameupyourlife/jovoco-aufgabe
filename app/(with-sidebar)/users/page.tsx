import { ShieldCheck, Users } from "lucide-react";

import { UserManagement } from "@/components/user-management";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { isAuthenticated } from "@/lib/auth/guard";
import { getManagedUsers } from "@/lib/data/users";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  await isAuthenticated({ behavior: "forbidden", permissions: { user: ["list"] } });
  const users = await getManagedUsers();

  return <main className="min-h-svh bg-muted/30 px-4 py-8 sm:px-6"><div className="mx-auto flex max-w-6xl flex-col gap-8"><header className="flex flex-col gap-3"><p className="text-sm font-medium uppercase tracking-[0.2em] text-primary">Verwaltung</p><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><h1 className="font-heading text-4xl font-semibold tracking-tight">Benutzer</h1><p className="mt-2 max-w-2xl text-muted-foreground">Rollen steuern, wer Ausleihen für andere Personen verwalten und alle Leihvorgänge sehen darf.</p></div><Badge variant="outline"><Users data-icon="inline-start" />{users.length} Konten</Badge></div></header><Card><CardHeader><CardTitle className="flex items-center gap-2"><ShieldCheck /> Rollenverwaltung</CardTitle><CardDescription>Administratoren besitzen die vollständigen Geräte- und Benutzerberechtigungen. Normale Benutzer sehen nur verfügbare Geräte und ihre eigenen Ausleihen.</CardDescription></CardHeader><CardContent><UserManagement users={users} /></CardContent></Card></div></main>;
}