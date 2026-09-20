"use server";

import { revalidatePath } from "next/cache";

import { hasPermission, isAuthenticated } from "@/lib/auth/guard";
import { db } from "@/lib/db";
import { loanDurationRules } from "@/lib/db/schema";

export type LoanDurationActionResult = { success: true } | { success: false; error: string };

export async function updateLoanDurationRule(category: string, durationDays: number): Promise<LoanDurationActionResult> {
  try {
    await isAuthenticated({ behavior: "error" });
    if (!(await hasPermission({ loan_settings: ["manage"] }))) {
      return { success: false, error: "Du hast keine Berechtigung, Leihfristen zu verwalten." };
    }

    const normalizedCategory = category.trim();
    if (!normalizedCategory || normalizedCategory.length > 80) {
      return { success: false, error: "Bitte eine gültige Kategorie angeben." };
    }
    if (!Number.isInteger(durationDays) || durationDays < 1 || durationDays > 365) {
      return { success: false, error: "Die Leihfrist muss zwischen 1 und 365 Tagen liegen." };
    }

    await db.insert(loanDurationRules)
      .values({ category: normalizedCategory, durationDays })
      .onConflictDoUpdate({ target: loanDurationRules.category, set: { durationDays, updatedAt: new Date() } });

    revalidatePath("/loan-settings");
    revalidatePath("/inventory");
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Leihfrist konnte nicht gespeichert werden." };
  }
}