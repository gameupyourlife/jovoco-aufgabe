import "dotenv/config";

import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { eq, sql } from "drizzle-orm";
import { db } from "../lib/db";
import { devices, importRows, importRuns, legacyInventory, legacyLoans, loans } from "../lib/db/schema";

type ImportStatus = "accepted" | "warning" | "rejected" | "skipped";
type RowResult = { sourceTable: string; sourceRow: number; sourceKey: string; status: ImportStatus; message: string; rawData: Record<string, string | null> };

function parseDate(value: string | null): string | null {
  const normalizedValue = value?.trim();
  if (!normalizedValue) return null;
  const isoMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(normalizedValue);
  const germanMatch = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(normalizedValue);
  const year = isoMatch?.[1] ?? germanMatch?.[3];
  const month = isoMatch?.[2] ?? germanMatch?.[2];
  const day = isoMatch?.[3] ?? germanMatch?.[1];
  if (!year || !month || !day) return null;
  const candidate = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  if (Number.isNaN(candidate.getTime()) || candidate.getUTCFullYear() !== Number(year) || candidate.getUTCMonth() !== Number(month) - 1 || candidate.getUTCDate() !== Number(day)) return null;
  return `${year}-${month}-${day}`;
}

function rowResult(sourceTable: string, sourceRow: number, sourceKey: string, status: ImportStatus, message: string, rawData: Record<string, string | null>): RowResult {
  return { sourceTable, sourceRow, sourceKey, status, message, rawData };
}

async function main() {
  const seedSql = await readFile(resolve(process.cwd(), "docs", "altdaten_seed.sql"), "utf8");

  await db.transaction(async (transaction) => {
    await transaction.execute(sql.raw(seedSql));
    const [run] = await transaction.insert(importRuns).values({ sourceFile: "docs/altdaten_seed.sql" }).returning({ id: importRuns.id });
    const results: RowResult[] = [];
    const inventoryRows = await transaction.select().from(legacyInventory);
    const loanRows = await transaction.select().from(legacyLoans);
    const seenInventoryNumbers = new Set<string>();

    for (const [index, source] of inventoryRows.entries()) {
      const inventoryNumber = source.inventoryNumber?.trim() ?? "";
      const name = source.name?.trim() ?? "";
      const category = source.category?.trim() ?? "";
      const quantity = Number(source.quantity?.trim());
      const acquiredAt = parseDate(source.acquiredAt);
      const rawData = { inventarnummer: source.inventoryNumber, bezeichnung: source.name, kategorie: source.category, menge: source.quantity, angeschafft_am: source.acquiredAt };
      if (!inventoryNumber || !name || !category || !Number.isInteger(quantity) || quantity <= 0) {
        results.push(rowResult("alt_inventar", index + 1, inventoryNumber || `row-${index + 1}`, "rejected", "Pflichtfeld fehlt oder Menge ist keine positive ganze Zahl.", rawData));
        continue;
      }
      if (!acquiredAt) {
        results.push(rowResult("alt_inventar", index + 1, inventoryNumber, "rejected", "Anschaffungsdatum hat kein unterstütztes Format.", rawData));
        continue;
      }
      if (seenInventoryNumbers.has(inventoryNumber)) {
        results.push(rowResult("alt_inventar", index + 1, inventoryNumber, "rejected", "Inventarnummer kommt mehrfach vor; die erste gültige Zeile gewinnt.", rawData));
        continue;
      }
      seenInventoryNumbers.add(inventoryNumber);
      const inserted = await transaction.insert(devices).values({ sourceKey: inventoryNumber, inventoryNumber, name, category, quantity, acquiredAt }).onConflictDoNothing({ target: devices.sourceKey }).returning({ id: devices.id });
      if (inserted.length === 0) {
        results.push(rowResult("alt_inventar", index + 1, inventoryNumber, "skipped", "Gerät ist bereits importiert.", rawData));
        continue;
      }
      const isFutureDate = acquiredAt > new Date().toISOString().slice(0, 10);
      results.push(rowResult("alt_inventar", index + 1, inventoryNumber, isFutureDate ? "warning" : "accepted", isFutureDate ? "Übernommen, aber Anschaffungsdatum liegt in der Zukunft." : "Gerät übernommen.", rawData));
    }

    const importedDevices = await transaction.select({ id: devices.id, inventoryNumber: devices.inventoryNumber }).from(devices);
    const deviceByInventoryNumber = new Map(importedDevices.map((device) => [device.inventoryNumber, device.id]));
    for (const [index, source] of loanRows.entries()) {
      const inventoryNumber = source.inventoryNumber?.trim() ?? "";
      const borrower = source.borrower?.trim() ?? "";
      const borrowedAt = parseDate(source.borrowedAt);
      const returnedAt = parseDate(source.returnedAt);
      const sourceKey = `loan-${index + 1}`;
      const rawData = { inventarnummer: source.inventoryNumber, ausgeliehen_von: source.borrower, ausgeliehen_am: source.borrowedAt, zurueckgegeben_am: source.returnedAt };
      if (!deviceByInventoryNumber.has(inventoryNumber)) {
        results.push(rowResult("alt_ausleihen", index + 1, sourceKey, "rejected", "Keine gültige importierte Inventarnummer gefunden.", rawData));
        continue;
      }
      if (!borrower || !borrowedAt) {
        results.push(rowResult("alt_ausleihen", index + 1, sourceKey, "rejected", "Person oder Ausleihdatum fehlt bzw. ist ungültig.", rawData));
        continue;
      }
      if (source.returnedAt?.trim() && !returnedAt) {
        results.push(rowResult("alt_ausleihen", index + 1, sourceKey, "rejected", "Rückgabedatum hat kein unterstütztes Format.", rawData));
        continue;
      }
      if (returnedAt && returnedAt < borrowedAt) {
        results.push(rowResult("alt_ausleihen", index + 1, sourceKey, "rejected", "Rückgabe liegt vor der Ausleihe.", rawData));
        continue;
      }
      const inserted = await transaction.insert(loans).values({ sourceKey, deviceId: deviceByInventoryNumber.get(inventoryNumber)!, borrower, borrowedAt, returnedAt }).onConflictDoNothing({ target: loans.sourceKey }).returning({ id: loans.id });
      results.push(rowResult("alt_ausleihen", index + 1, sourceKey, inserted.length ? "accepted" : "skipped", inserted.length ? "Ausleihe übernommen." : "Ausleihe ist bereits importiert.", rawData));
    }

    await transaction.insert(importRows).values(results.map((result) => ({ runId: run.id, ...result })));
    const importedCount = results.filter((result) => result.status === "accepted" || result.status === "warning").length;
    const warningCount = results.filter((result) => result.status === "warning").length;
    const rejectedCount = results.filter((result) => result.status === "rejected").length;
    await transaction.update(importRuns).set({ finishedAt: new Date(), importedCount, warningCount, rejectedCount }).where(eq(importRuns.id, run.id));
    console.log(`Import abgeschlossen: ${importedCount} übernommen, ${warningCount} Warnungen, ${rejectedCount} abgelehnt.`);
  });
}

main().catch((error) => {
  console.error("Import fehlgeschlagen", error);
  process.exitCode = 1;
});