import type { ReactNode } from "react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function MetricCard({
    label,
    value,
    detail,
    icon,
    warning = false,
}: {
    label: string
    value: number
    detail: string
    icon?: ReactNode
    warning?: boolean
}) {
    return (
        <Card className={warning ? "border-destructive/30 bg-destructive/5" : undefined}>
            <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
                <div className="flex flex-col gap-1">
                    <CardDescription>{label}</CardDescription>
                    <CardTitle className="text-3xl">{value}</CardTitle>
                </div>
                {icon && <span className="rounded-lg bg-muted p-2 text-primary">{icon}</span>}
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">{detail}</CardContent>
        </Card>
    )
}