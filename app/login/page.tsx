"use client";

import { FormEvent, useState } from "react";
import { LogIn } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth/auth-client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [register, setRegister] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const result = register
      ? await authClient.signUp.email({ email, password, name })
      : await authClient.signIn.email({ email, password });
    setPending(false);
    if (result.error) {
      setError(result.error.message ?? "Anmeldung fehlgeschlagen.");
      return;
    }
    window.location.href = "/inventory";
  }

  return <main className="flex min-h-svh items-center justify-center bg-muted/30 px-4 py-8"><Card className="w-full max-w-md"><CardHeader><p className="text-sm font-medium uppercase tracking-[0.2em] text-primary">Geräteverleih</p><CardTitle>{register ? "Konto anlegen" : "Anmelden"}</CardTitle><CardDescription>{register ? "Lege ein Konto für die Geräteverwaltung an." : "Melde dich an, um das Inventar zu öffnen."}</CardDescription></CardHeader><CardContent><form className="flex flex-col gap-4" onSubmit={submit}>{register && <Input aria-label="Name" autoComplete="name" placeholder="Name" value={name} onChange={(event) => setName(event.target.value)} required />}<Input aria-label="E-Mail" autoComplete="email" type="email" placeholder="E-Mail" value={email} onChange={(event) => setEmail(event.target.value)} required /><Input aria-label="Passwort" autoComplete={register ? "new-password" : "current-password"} type="password" placeholder="Passwort" value={password} onChange={(event) => setPassword(event.target.value)} minLength={8} required />{error && <Alert variant="destructive"><AlertTitle>Anmeldung fehlgeschlagen</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}<Button type="submit" disabled={pending}>{pending ? "Bitte warten ..." : <><LogIn data-icon="inline-start" />{register ? "Konto anlegen" : "Anmelden"}</>}</Button><Button type="button" variant="link" onClick={() => setRegister((value) => !value)}>{register ? "Bereits registriert? Anmelden" : "Noch kein Konto? Registrieren"}</Button></form></CardContent></Card></main>;
}