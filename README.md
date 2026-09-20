Update/Generate better-auth schema: npx auth@latest generate --output ./lib/db/auth-schema.ts 
Update database: npx drizzle-kit push

## Legacy data import

1. Set `DATABASE_URL` to a PostgreSQL database in `.env.local`.
2. Apply the Drizzle schema: `npm run db:push`.
3. Import the supplied raw export: `npm run db:import`.
4. Open `/` for the persisted report or `/api/import-report` for JSON.

The importer loads the supplied SQL into staging tables inside one transaction, normalizes supported dates, validates required values and date order, and records every source row in `import_rows`. Invalid inventory rows are rejected; duplicate inventory numbers keep the first valid row; future acquisition dates are accepted with a warning; loans referencing rejected or unknown devices are rejected. Source keys make repeated runs idempotent.