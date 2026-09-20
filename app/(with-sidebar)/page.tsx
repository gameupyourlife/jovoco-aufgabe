import Link from "next/link";
import { ArrowRight, CalendarCheck, PackageCheck, RotateCcw, ShieldCheck } from "lucide-react";

import { DashboardReservations } from "@/components/dashboard-reservations";
import { MyLoans } from "@/components/my-loans";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { isAuthenticated } from "@/lib/auth/guard";
import { getInventoryData } from "@/lib/data/inventory";
import { getReservations } from "@/lib/data/reservations";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
    const session = await isAuthenticated({ behavior: "redirect" });
    const [inventory, reservations] = await Promise.all([
        getInventoryData(),
        getReservations(),
    ]);
    const myLoans = inventory.devices.flatMap((device) => device.loans
        .filter((loan) => loan.borrowerUserId === session.user.id && !loan.returnedAt)
        .map((loan) => ({ ...loan, name: device.name, inventoryNumber: device.inventoryNumber, category: device.category })));
    const myReservations = reservations.filter((reservation) => reservation.reserverUserId === session.user.id);
    const activeReservations = myReservations.filter((reservation) => reservation.status === "active");
    const today = new Date().toISOString().slice(0, 10);
    const overdueCount = myLoans.filter((loan) => loan.dueAt && loan.dueAt < today).length;

    return (
        <main className="min-h-svh bg-muted/30 px-4 py-8 sm:px-6 lg:py-10">
            <div className="mx-auto flex max-w-7xl flex-col gap-8">
                <header className="flex flex-col gap-5 border-b pb-8 lg:flex-row lg:items-end lg:justify-between">
                    <div className="flex flex-col gap-3">
                        <Badge variant="outline" className="w-fit">Persönlicher Bereich</Badge>
                        <div className="flex flex-col gap-2">
                            <h1 className="font-heading text-4xl font-semibold tracking-tight sm:text-5xl">Hallo, {session.user.name.split(" ")[0]}.</h1>
                            <p className="max-w-2xl text-lg text-muted-foreground">Behalte deine Geräte, Rückgaben und Reservierungen an einem Ort im Blick.</p>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button render={<Link href="/inventory" />}><PackageCheck data-icon="inline-start" />Inventar öffnen</Button>
                        <Button variant="outline" render={<Link href="/reservations" />}><CalendarCheck data-icon="inline-start" />Reservieren</Button>
                    </div>
                </header>

                <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <DashboardMetric label="Offene Ausleihen" value={myLoans.length} detail="Auf deinem Konto" icon={<PackageCheck />} />
                    <DashboardMetric label="Reservierungen" value={activeReservations.length} detail="Aktiv vorgemerkt" icon={<CalendarCheck />} />
                    <DashboardMetric label="Rückgaben" value={overdueCount} detail="Überfällig" icon={<RotateCcw />} tone={overdueCount > 0 ? "warning" : "default"} />
                    <DashboardMetric label="Verfügbar" value={inventory.availableCount} detail="Einheiten im Inventar" icon={<ShieldCheck />} />
                </section>

                <div className="grid gap-6 xl:grid-cols-[1.35fr_1fr]">
                    <MyLoans loans={myLoans} />
                    <DashboardReservations reservations={myReservations} />
                </div>

                <section className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
                    <Card className="bg-primary text-primary-foreground">
                        <CardHeader>
                            <CardTitle className="text-2xl">Brauchst du ein Gerät?</CardTitle>
                            <CardDescription className="text-primary-foreground/70">Durchsuche den aktuellen Bestand und leihe oder reserviere das passende Gerät.</CardDescription>
                        </CardHeader>
                        <CardContent><Button variant="secondary" render={<Link href="/inventory" />}>Zum Inventar <ArrowRight data-icon="inline-end" /></Button></CardContent>
                    </Card>
                </section>
            </div>
        </main>
    );
}

function DashboardMetric({ label, value, detail, icon, tone = "default" }: { label: string; value: number; detail: string; icon: React.ReactNode; tone?: "default" | "warning" }) {
    return <Card className={tone === "warning" ? "border-destructive/30 bg-destructive/5" : undefined}>
        <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
            <div className="flex flex-col gap-1"><CardDescription>{label}</CardDescription><CardTitle className="text-3xl">{value}</CardTitle></div>
            <span className="rounded-lg bg-muted p-2 text-primary">{icon}</span>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">{detail}</CardContent>
    </Card>;
}