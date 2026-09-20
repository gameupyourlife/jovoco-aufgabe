import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { importRows, importRuns } from "@/lib/db/schema";
import { isAuthenticated } from "@/lib/auth/guard";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await isAuthenticated();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const requestedRunId = Number(new URL(request.url).searchParams.get("run"));
  const runs = await db.select().from(importRuns).orderBy(desc(importRuns.startedAt));
  const run = runs.find((candidate) => candidate.id === requestedRunId) ?? runs[0];
  if (!run) return NextResponse.json({ run: null, rows: [] });
  const rows = await db.select().from(importRows).where(eq(importRows.runId, run.id)).orderBy(importRows.sourceTable, importRows.sourceRow);
  return NextResponse.json({ run, rows });
}