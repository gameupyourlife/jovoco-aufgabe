"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";

import { setManagedUserRole } from "@/lib/actions/users";
import type { ManagedUser } from "@/lib/data/users";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function UserManagement({ users }: { users: ManagedUser[] }) {
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState<string | null>(null);

  async function updateRole(userId: string, role: "user" | "admin") {
    setPending(userId);
    setMessage(null);
    const result = await setManagedUserRole(userId, role);
    setPending(null);
    setMessage(result.success ? "Rolle aktualisiert." : result.error);
  }

  return <div className="flex flex-col gap-4">{message && <Alert><CheckCircle2 /><AlertTitle>Änderung gespeichert</AlertTitle><AlertDescription>{message}</AlertDescription></Alert>}<Table><TableHeader><TableRow><TableHead>Benutzer</TableHead><TableHead>Status</TableHead><TableHead>Rolle</TableHead><TableHead className="text-right">Ändern</TableHead></TableRow></TableHeader><TableBody>{users.map((user) => <TableRow key={user.id}><TableCell><div className="flex flex-col"><span className="font-medium">{user.name}</span><span className="text-xs text-muted-foreground">{user.email}</span></div></TableCell><TableCell><Badge variant={user.banned ? "destructive" : "secondary"}>{user.banned ? "Gesperrt" : "Aktiv"}</Badge></TableCell><TableCell><Badge variant="outline">{user.role === "admin" ? "Administrator" : "Benutzer"}</Badge></TableCell><TableCell><Select value={user.role === "admin" ? "admin" : "user"} onValueChange={(value) => { if (value === "admin" || value === "user") updateRole(user.id, value); }} disabled={pending === user.id}><SelectTrigger className="ml-auto w-36"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="user">Benutzer</SelectItem><SelectItem value="admin">Administrator</SelectItem></SelectContent></Select></TableCell></TableRow>)}</TableBody></Table></div>;
}