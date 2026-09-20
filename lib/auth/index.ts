import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/lib/db"; // your drizzle instance
import * as schema from "@/lib/db/schema"; // your drizzle schema
import { admin } from "better-auth/plugins";

export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: "pg", // or "mysql", "sqlite"
        schema
    }),
    plugins: [
        admin()
    ],
    emailAndPassword: {
        enabled: true,
    },
});

export type Session = typeof auth.$Infer.Session;