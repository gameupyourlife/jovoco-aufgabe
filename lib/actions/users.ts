"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { hasPermission, isAuthenticated } from "@/lib/auth/guard";

export type UserActionResult =
    | { success: true }
    | { success: false; error: string };

export async function setManagedUserRole(userId: string, role: "user" | "admin"): Promise<UserActionResult> {
    try {
        const session = await isAuthenticated({ behavior: "error" });
        if (!(await hasPermission({ user: ["set-role"] }))) {
            return { success: false, error: "Du hast keine Berechtigung, Rollen zu ändern." };
        }
        if (!userId || userId === session.user.id) {
            return { success: false, error: "Die eigene Rolle kann hier nicht geändert werden." };
        }

        await auth.api.setRole({
            headers: await headers(),
            body: { userId, role },
        });
        revalidatePath("/users");
        revalidatePath("/inventory");
        return { success: true };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : "Rolle konnte nicht geändert werden." };
    }
}