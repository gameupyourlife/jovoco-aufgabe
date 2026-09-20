export * from "./auth-schema";
import { user } from "./auth-schema";
import { date, integer, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const testTable = pgTable("test", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
});

export const legacyInventory = pgTable("alt_inventar", {
  inventoryNumber: text("inventarnummer"),
  name: text("bezeichnung"),
  category: text("kategorie"),
  quantity: text("menge"),
  acquiredAt: text("angeschafft_am"),
});

export const legacyLoans = pgTable("alt_ausleihen", {
  inventoryNumber: text("inventarnummer"),
  borrower: text("ausgeliehen_von"),
  borrowedAt: text("ausgeliehen_am"),
  returnedAt: text("zurueckgegeben_am"),
});

export const importRuns = pgTable("import_runs", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  sourceFile: text("source_file").notNull(),
  startedAt: timestamp("started_at", { withTimezone: true }).defaultNow().notNull(),
  finishedAt: timestamp("finished_at", { withTimezone: true }),
  importedCount: integer("imported_count").default(0).notNull(),
  warningCount: integer("warning_count").default(0).notNull(),
  rejectedCount: integer("rejected_count").default(0).notNull(),
});

export const devices = pgTable("devices", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  sourceKey: text("source_key").unique().notNull(),
  inventoryNumber: text("inventory_number").notNull().unique(),
  name: text().notNull(),
  category: text().notNull(),
  quantity: integer().notNull(),
  acquiredAt: date("acquired_at").notNull(),
});

export const loans = pgTable("loans", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  sourceKey: text("source_key").unique().notNull(),
  deviceId: integer("device_id").notNull().references(() => devices.id),
  borrowerUserId: text("borrower_user_id").references(() => user.id, { onDelete: "set null" }),
  borrower: text().notNull(),
  borrowedAt: date("borrowed_at").notNull(),
  dueAt: date("due_at"),
  returnedAt: date("returned_at"),
});

export const reservations = pgTable("reservations", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  deviceId: integer("device_id").notNull().references(() => devices.id),
  reserverUserId: text("reserver_user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  reserver: text().notNull(),
  startsAt: date("starts_at").notNull(),
  endsAt: date("ends_at").notNull(),
  status: text().notNull().default("active"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const loanDurationRules = pgTable("loan_duration_rules", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  category: text().unique().notNull(),
  durationDays: integer("duration_days").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const importRows = pgTable("import_rows", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  runId: integer("run_id").notNull().references(() => importRuns.id, { onDelete: "cascade" }),
  sourceTable: text("source_table").notNull(),
  sourceRow: integer("source_row").notNull(),
  sourceKey: text("source_key").notNull(),
  status: text().notNull(),
  message: text().notNull(),
  rawData: jsonb("raw_data").notNull(),
});
