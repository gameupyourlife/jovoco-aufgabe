import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function Page() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-between p-24">
            <h1 className="text-4xl font-bold">Jovoco Import</h1>
            <p className="text-lg text-muted-foreground">
                Importiere Daten aus einer CSV-Datei in die Datenbank.
            </p>
            <div className="flex flex-col items-center gap-4">
                <Button render={<Link href="/imports" />}>
                    Imports ansehen
                </Button>
            </div>
        </div>          
    )
}