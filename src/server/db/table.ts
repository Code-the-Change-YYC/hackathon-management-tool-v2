import { pgTableCreator } from "drizzle-orm/pg-core";

// Prefixes every table with `hackathon_` (a create-t3-app default) so that,
// together with `tablesFilter` in drizzle.config.ts, drizzle-kit ignores any
// other app's tables in a shared database.
export const createTable = pgTableCreator((name) => `hackathon_${name}`);
