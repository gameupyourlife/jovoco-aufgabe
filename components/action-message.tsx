import type { ReactNode } from "react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export type ActionMessageState = {
    type: "success" | "error"
    text: string
}

export function ActionMessage({
    message,
    icon,
}: {
    message: ActionMessageState
    icon: ReactNode
}) {
    return (
        <Alert variant={message.type === "error" ? "destructive" : "default"}>
            {icon}
            <AlertTitle>
                {message.type === "error" ? "Aktion nicht möglich" : "Gespeichert"}
            </AlertTitle>
            <AlertDescription>{message.text}</AlertDescription>
        </Alert>
    )
}