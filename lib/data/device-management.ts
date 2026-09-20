import { asc } from "drizzle-orm";

import { isAuthenticated } from "@/lib/auth/guard";
import { db } from "@/lib/db";
import { devices } from "@/lib/db/schema";

export async function getManagedDevices() {
  await isAuthenticated({ behavior: "error", permissions: { inventory: ["update"] } });
  return db.select().from(devices).orderBy(asc(devices.name), asc(devices.inventoryNumber));
}
