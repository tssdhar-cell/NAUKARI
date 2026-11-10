import { getSession } from "@/lib/session";
import { db } from "@/lib/supabase";
import { todayIn } from "@/lib/dates";
import { env } from "@/lib/env";

const TABLES = {
  jobs: "jobs",
  contacts: "contacts",
  activities: "activities",
  templates: "templates",
} as const;

function csvCell(v: unknown) {
  if (v === null || v === undefined) return "";
  let s = typeof v === "object" ? JSON.stringify(v) : String(v);
  // Neutralise spreadsheet formula injection.
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
}

function toCsv(rows: Record<string, unknown>[]) {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  return [headers.join(","), ...rows.map((r) => headers.map((h) => csvCell(r[h])).join(","))].join("\r\n");
}

export async function GET(_req: Request, ctx: RouteContext<"/api/export/[table]">) {
  if (!(await getSession())) return new Response("Unauthorized", { status: 401 });

  const { table } = await ctx.params;
  if (!(table in TABLES)) return new Response("Not found", { status: 404 });

  const { data, error } = await db()
    .from(TABLES[table as keyof typeof TABLES])
    .select("*")
    .order("created_at", { ascending: true });
  if (error) return new Response(error.message, { status: 500 });

  const filename = `naukari-${table}-${todayIn(env().APP_TIMEZONE)}.csv`;
  return new Response("﻿" + toCsv(data ?? []), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
