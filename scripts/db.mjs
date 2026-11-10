#!/usr/bin/env node
// Database migrations without copy-pasting SQL into the dashboard.
//
//   npm run db:new add_referral_column   → creates supabase/migrations/<timestamp>_add_referral_column.sql
//   npm run db:push                      → applies any migrations not yet run on the Supabase database
//   npm run db:push -- --dry-run         → shows what would run
//   npm run db:status                    → lists local files vs. what the database has applied
//
// Reads SUPABASE_DB_URL (Session pooler connection string) from .env.local.

import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(import.meta.url);
const cli = path.join(path.dirname(require.resolve("supabase/package.json")), "dist", "supabase.js");

if (existsSync(".env.local")) process.loadEnvFile(".env.local");

const [command, ...rest] = process.argv.slice(2);

function remote() {
  const url = process.env.SUPABASE_DB_URL;
  if (!url) {
    console.error("SUPABASE_DB_URL is not set in .env.local (Supabase → Connect → Connection String → Session pooler).");
    process.exit(1);
  }
  return `--remote=${url}`;
}

const args = {
  new: () => {
    if (!rest[0]) {
      console.error("Usage: npm run db:new <migration_name>");
      process.exit(1);
    }
    return ["migration", "new", ...rest];
  },
  push: () => ["db", "push", remote(), ...rest],
  status: () => ["migration", "list", remote(), ...rest],
}[command];

if (!args) {
  console.error("Usage: node scripts/db.mjs <new|push|status> [...args]");
  process.exit(1);
}

const result = spawnSync(process.execPath, [cli, ...args()], { stdio: "inherit" });
process.exit(result.status ?? 1);
