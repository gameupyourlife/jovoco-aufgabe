import { asc, eq, isNull } from "drizzle-orm";

import { db } from "@/lib/db";
import { devices, loanDurationRules, loans } from "@/lib/db/schema";
import { isAuthenticated } from "@/lib/auth/guard";

export const DEFAULT_LOAN_DURATION_RULES = [
  { category: "Standard", durationDays: 14 },
  { category: "Kamera", durationDays: 7 },
  { category: "Präsentation", durationDays: 7 },
  { category: "Mobilgerät", durationDays: 30 },
] as const;

export type LoanDurationRule = typeof loanDurationRules.$inferSelect;

export function calculateDueDate(borrowedAt: string, durationDays: number) {
  const dueDate = new Date(`${borrowedAt}T00:00:00Z`);
  dueDate.setUTCDate(dueDate.getUTCDate() + durationDays);
  return dueDate.toISOString().slice(0, 10);
}

export function getDurationDays(rules: Pick<LoanDurationRule, "category" | "durationDays">[], category: string) {
  const normalizedCategory = category.trim().toLocaleLowerCase("de-DE");
  return rules.find((rule) => rule.category.trim().toLocaleLowerCase("de-DE") === normalizedCategory)?.durationDays
    ?? rules.find((rule) => rule.category === "Standard")?.durationDays
    ?? 14;
}

export async function getLoanDurationRules() {
  await isAuthenticated({ behavior: "error", permissions: { loan_settings: ["read"] } });
  return getLoanDurationRulesUnchecked();
}

async function getLoanDurationRulesUnchecked() {
  await db.insert(loanDurationRules)
    .values(DEFAULT_LOAN_DURATION_RULES.map((rule) => rule))
    .onConflictDoNothing({ target: loanDurationRules.category });
  return db.select().from(loanDurationRules).orderBy(asc(loanDurationRules.id));
}

export async function backfillMissingLoanDueDates() {
  await isAuthenticated({ behavior: "error", permissions: { inventory: ["read"] } });
  const rules = await getLoanDurationRulesUnchecked();
  const missingDueDates = await db.select({ loanId: loans.id, borrowedAt: loans.borrowedAt, category: devices.category })
    .from(loans)
    .innerJoin(devices, eq(loans.deviceId, devices.id))
    .where(isNull(loans.dueAt));

  for (const loan of missingDueDates) {
    await db.update(loans)
      .set({ dueAt: calculateDueDate(loan.borrowedAt, getDurationDays(rules, loan.category)) })
      .where(eq(loans.id, loan.loanId));
  }
}