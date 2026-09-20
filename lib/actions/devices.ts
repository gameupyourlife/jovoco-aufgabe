"use server"

import { revalidatePath } from "next/cache"
import { and, eq, isNull } from "drizzle-orm"

import { hasPermission, isAuthenticated } from "@/lib/auth/guard"
import { db } from "@/lib/db"
import { devices } from "@/lib/db/schema"

export type DeviceActionResult =
    { success: true } | { success: false; error: string }

export type DeviceInput = {
    name: string
    inventoryNumber: string
    category: string
    quantity: number
    acquiredAt: string
}

function validateDeviceInput(input: DeviceInput) {
    const name = input.name.trim()
    const inventoryNumber = input.inventoryNumber.trim()
    const category = input.category.trim()
    if (!name || !inventoryNumber || !category)
        return "Bezeichnung, Inventarnummer und Kategorie sind erforderlich."
    if (
        !Number.isInteger(input.quantity) ||
        input.quantity < 1 ||
        input.quantity > 10000
    )
        return "Die Menge muss zwischen 1 und 10.000 liegen."
    if (!/^\d{4}-\d{2}-\d{2}$/.test(input.acquiredAt))
        return "Bitte ein gültiges Anschaffungsdatum angeben."
    return null
}

export async function createDevice(
    input: DeviceInput
): Promise<DeviceActionResult> {
    try {
        await isAuthenticated({ behavior: "error" })
        if (!(await hasPermission({ inventory: ["create"] })))
            return {
                success: false,
                error: "Du hast keine Berechtigung, Geräte anzulegen.",
            }
        const error = validateDeviceInput(input)
        if (error) return { success: false, error }

        await db.insert(devices).values({
            sourceKey: `manual-${crypto.randomUUID()}`,
            name: input.name.trim(),
            inventoryNumber: input.inventoryNumber.trim(),
            category: input.category.trim(),
            quantity: input.quantity,
            acquiredAt: input.acquiredAt,
        })
        revalidatePath("/device-management")
        revalidatePath("/inventory")
        revalidatePath("/reports")
        return { success: true }
    } catch (error) {
        return {
            success: false,
            error:
                error instanceof Error && error.message.includes("unique")
                    ? "Die Inventarnummer ist bereits vergeben."
                    : "Gerät konnte nicht angelegt werden.",
        }
    }
}

export async function updateDevice(
    deviceId: number,
    input: DeviceInput
): Promise<DeviceActionResult> {
    try {
        await isAuthenticated({ behavior: "error" })
        if (!(await hasPermission({ inventory: ["update"] })))
            return {
                success: false,
                error: "Du hast keine Berechtigung, Geräte zu bearbeiten.",
            }
        if (!Number.isInteger(deviceId))
            return { success: false, error: "Ein gültiges Gerät ist erforderlich." }
        const error = validateDeviceInput(input)
        if (error) return { success: false, error }

        const [updated] = await db
            .update(devices)
            .set({
                name: input.name.trim(),
                inventoryNumber: input.inventoryNumber.trim(),
                category: input.category.trim(),
                quantity: input.quantity,
                acquiredAt: input.acquiredAt,
            })
            .where(eq(devices.id, deviceId))
            .returning({ id: devices.id })
        if (!updated)
            return { success: false, error: "Gerät wurde nicht gefunden." }
        revalidatePath("/device-management")
        revalidatePath("/inventory")
        revalidatePath("/reports")
        return { success: true }
    } catch (error) {
        return {
            success: false,
            error:
                error instanceof Error && error.message.includes("unique")
                    ? "Die Inventarnummer ist bereits vergeben."
                    : "Gerät konnte nicht gespeichert werden.",
        }
    }
}

export async function retireDevice(
    deviceId: number
): Promise<DeviceActionResult> {
    try {
        await isAuthenticated({ behavior: "error" })
        if (!(await hasPermission({ inventory: ["retire"] })))
            return {
                success: false,
                error: "Du hast keine Berechtigung, Geräte auszumustern.",
            }
        if (!Number.isInteger(deviceId))
            return { success: false, error: "Ein gültiges Gerät ist erforderlich." }

        const [retired] = await db
            .update(devices)
            .set({ retiredAt: new Date().toISOString().slice(0, 10) })
            .where(and(eq(devices.id, deviceId), isNull(devices.retiredAt)))
            .returning({ id: devices.id })
        if (!retired)
            return {
                success: false,
                error: "Gerät wurde nicht gefunden oder ist bereits ausgemustert.",
            }
        revalidatePath("/device-management")
        revalidatePath("/inventory")
        revalidatePath("/reports")
        return { success: true }
    } catch (error) {
        return {
            success: false,
            error:
                error instanceof Error
                    ? error.message
                    : "Gerät konnte nicht ausgemustert werden.",
        }
    }
}
