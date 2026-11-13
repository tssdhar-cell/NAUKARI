// Runs actual migrations/SQL assertions in disposable, in-memory PostgreSQL.
// Optional test dependency: npm install --prefix node_modules/.audit-tools --no-save --package-lock=false @electric-sql/pglite
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";

const moduleUrl = process.env.PGLITE_MODULE
  ?? new URL("../node_modules/.audit-tools/node_modules/@electric-sql/pglite/dist/index.js", import.meta.url).href;
const { PGlite } = await import(moduleUrl);
const db = new PGlite();
const migrationDir = new URL("../supabase/migrations/", import.meta.url);
const migrations = (await readdir(migrationDir)).filter((name) => name.endsWith(".sql")).sort();
const cleanup = "20261113010000_cleanup_legacy_tables.sql";
const cleanupIndex = migrations.indexOf(cleanup);
assert.ok(cleanupIndex > 0, "Expected cleanup migration after initial schema and atomic RPC migration");

try {
  await db.exec(`
    create role anon;
    create role authenticated;
    create role service_role bypassrls;
    grant usage on schema public to anon, authenticated, service_role;
    grant usage on language plpgsql to service_role;
    alter default privileges in schema public grant all on tables to service_role;
    create schema storage;
    create table storage.buckets (
      id text primary key, name text, public boolean,
      file_size_limit bigint, allowed_mime_types text[]
    );
  `);
  for (const name of migrations.slice(0, cleanupIndex)) {
    await db.exec(await readFile(new URL(name, migrationDir), "utf8"));
  }
  const cleanupSql = await readFile(new URL(cleanup, migrationDir), "utf8");

  // Verify nonempty legacy tables abort cleanup without removing any table/data.
  await db.exec("insert into public.resume_docs(name) values ('Preserve me')");
  await assert.rejects(db.exec(cleanupSql), /Cleanup stopped.*resume_docs.*contains data/);
  await db.exec("rollback");
  assert.equal((await db.query("select count(*)::int as count from public.resume_docs")).rows[0].count, 1);
  assert.equal((await db.query("select to_regclass('public.jobs') is not null as present")).rows[0].present, true);
  assert.equal((await db.query("select to_regprocedure('public.set_primary_resume(uuid)') is not null as present")).rows[0].present, true);
  assert.equal((await db.query("select to_regprocedure('public.register_resume(text,text,integer,boolean)') is not null as present")).rows[0].present, true);
  await db.exec("delete from public.resume_docs");
  console.log("PASS: cleanup refuses nonempty tables, preserves schema/data, and keeps committed RPC migration");

  // Unexpected dependencies must stop the entire cleanup (no CASCADE).
  await db.exec("create view public.test_jobs_dependency as select id from public.jobs");
  await assert.rejects(db.exec(cleanupSql), /depend/);
  await db.exec("rollback");
  assert.equal((await db.query("select to_regclass('public.activities') is not null as present")).rows[0].present, true);
  await db.exec("drop view public.test_jobs_dependency");
  console.log("PASS: unexpected dependencies roll back cleanup");

  await db.exec(cleanupSql);
  for (const name of migrations.slice(cleanupIndex + 1)) {
    await db.exec(await readFile(new URL(name, migrationDir), "utf8"));
  }
  await db.exec(await readFile(new URL("../supabase/tests/resumes.sql", import.meta.url), "utf8"));
  console.log("PASS: migrations, retained RLS, RPC permissions, primary switching, missing IDs, failed insert rollback");

  // Check actual public-role execution is denied, beyond catalog ACL assertions.
  for (const role of ["anon", "authenticated"]) {
    for (const sql of [
      "select public.set_primary_resume('00000000-0000-0000-0000-000000000000')",
      "select public.register_resume('Denied', 'denied.pdf', 10, true)",
    ]) {
      await db.exec(`begin; set local role ${role}`);
      await assert.rejects(db.exec(sql), /permission denied/);
      await db.exec("rollback");
    }
  }
  console.log("PASS: anon/authenticated cannot execute either RPC");
  console.log("NOTE: embedded PostgreSQL uses one connection; multi-session advisory-lock contention requires local Supabase/Postgres.");
} finally {
  await db.close();
}
