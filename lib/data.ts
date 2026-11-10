import "server-only";
import { env } from "@/lib/env";
import { db } from "@/lib/supabase";
import { todayIn } from "@/lib/dates";
import type { Activity, ActivityWithRefs, Contact, Job, JobWithFollowUp, Template } from "@/lib/types";
import type { JobStatus } from "@/lib/constants";

const ACTIVITY_WITH_REFS = "*, job:jobs(id,title,company), contact:contacts(id,name)";

function unwrap<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data as T;
}

export function today() {
  return todayIn(env().APP_TIMEZONE);
}

/** Strip characters that would break PostgREST's `or=(...)` filter syntax. */
function cleanSearch(q: string) {
  return q.replace(/[,()%*\\:"]/g, " ").trim();
}

async function openFollowUpsByJob(jobIds?: string[]) {
  let query = db()
    .from("activities")
    .select("job_id, due_date")
    .eq("type", "follow_up")
    .is("completed_at", null)
    .not("job_id", "is", null)
    .order("due_date", { ascending: true });
  if (jobIds) query = query.in("job_id", jobIds);
  const rows = unwrap(await query) as { job_id: string; due_date: string }[];
  const map = new Map<string, string>();
  for (const r of rows) if (!map.has(r.job_id)) map.set(r.job_id, r.due_date);
  return map;
}

// ---------------------------------------------------------------------------
// Jobs
// ---------------------------------------------------------------------------
export type JobFilters = {
  q?: string;
  platform?: string;
  status?: string;
  sort?: "newest" | "oldest";
};

export async function getJobs(filters: JobFilters = {}): Promise<JobWithFollowUp[]> {
  let query = db().from("jobs").select("*");
  const q = filters.q ? cleanSearch(filters.q) : "";
  if (q) query = query.or(`company.ilike.%${q}%,title.ilike.%${q}%`);
  if (filters.platform) query = query.eq("platform", filters.platform);
  if (filters.status) query = query.eq("status", filters.status);
  const ascending = filters.sort === "oldest";
  query = query.order("date_added", { ascending }).order("created_at", { ascending });

  const jobs = unwrap(await query) as Job[];
  const followUps = await openFollowUpsByJob();
  return jobs.map((j) => ({ ...j, next_follow_up: followUps.get(j.id) ?? null }));
}

export async function getJob(id: string) {
  const res = await db().from("jobs").select("*").eq("id", id).maybeSingle();
  const job = unwrap(res) as Job | null;
  if (!job) return null;

  const [contactRows, activities, followUps] = await Promise.all([
    db().from("job_contacts").select("contact:contacts(*)").eq("job_id", id),
    db().from("activities").select(ACTIVITY_WITH_REFS).eq("job_id", id).order("created_at", { ascending: false }),
    openFollowUpsByJob([id]),
  ]);

  const contacts = (unwrap(contactRows) as unknown as { contact: Contact }[])
    .map((r) => r.contact)
    .sort((a, b) => a.name.localeCompare(b.name));

  return {
    job: { ...job, next_follow_up: followUps.get(id) ?? null } as JobWithFollowUp,
    contacts,
    activities: unwrap(activities) as ActivityWithRefs[],
  };
}

/** Earliest open follow-up activity for a job (used by the job form). */
export async function getOpenFollowUp(jobId: string) {
  const res = await db()
    .from("activities")
    .select("*")
    .eq("job_id", jobId)
    .eq("type", "follow_up")
    .is("completed_at", null)
    .order("due_date", { ascending: true })
    .limit(1)
    .maybeSingle();
  return unwrap(res) as Activity | null;
}

export async function getJobOptions() {
  const res = await db().from("jobs").select("id, title, company").order("date_added", { ascending: false });
  return unwrap(res) as Pick<Job, "id" | "title" | "company">[];
}

// ---------------------------------------------------------------------------
// Contacts
// ---------------------------------------------------------------------------
export async function getContacts(q?: string) {
  let query = db().from("contacts").select("*, job_contacts(count)");
  const s = q ? cleanSearch(q) : "";
  if (s) query = query.or(`name.ilike.%${s}%,company.ilike.%${s}%`);
  const rows = unwrap(await query.order("name")) as (Contact & { job_contacts: { count: number }[] })[];
  return rows.map(({ job_contacts, ...c }) => ({ ...c, job_count: job_contacts?.[0]?.count ?? 0 }));
}

export async function getContactOptions() {
  const res = await db().from("contacts").select("id, name, company").order("name");
  return unwrap(res) as Pick<Contact, "id" | "name" | "company">[];
}

export async function getContact(id: string) {
  const res = await db().from("contacts").select("*").eq("id", id).maybeSingle();
  const contact = unwrap(res) as Contact | null;
  if (!contact) return null;

  const [jobRows, activities] = await Promise.all([
    db().from("job_contacts").select("job:jobs(*)").eq("contact_id", id),
    db().from("activities").select(ACTIVITY_WITH_REFS).eq("contact_id", id).order("created_at", { ascending: false }),
  ]);

  return {
    contact,
    jobs: (unwrap(jobRows) as unknown as { job: Job }[]).map((r) => r.job),
    activities: unwrap(activities) as ActivityWithRefs[],
  };
}

// ---------------------------------------------------------------------------
// Follow-ups & interviews
// ---------------------------------------------------------------------------
export async function getFollowUps() {
  const [open, done] = await Promise.all([
    db()
      .from("activities")
      .select(ACTIVITY_WITH_REFS)
      .in("type", ["follow_up", "interview"])
      .is("completed_at", null)
      .not("due_date", "is", null)
      .order("due_date", { ascending: true })
      .order("due_time", { ascending: true, nullsFirst: true }),
    db()
      .from("activities")
      .select(ACTIVITY_WITH_REFS)
      .in("type", ["follow_up", "interview"])
      .not("completed_at", "is", null)
      .order("completed_at", { ascending: false })
      .limit(50),
  ]);

  const t = today();
  const openRows = unwrap(open) as ActivityWithRefs[];
  return {
    today: t,
    overdue: openRows.filter((a) => a.due_date! < t),
    dueToday: openRows.filter((a) => a.due_date === t),
    upcoming: openRows.filter((a) => a.due_date! > t),
    completed: unwrap(done) as ActivityWithRefs[],
  };
}

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------
export async function getDashboard() {
  const [jobsRes, followUps] = await Promise.all([
    db().from("jobs").select("*").order("date_added", { ascending: false }).order("created_at", { ascending: false }),
    getFollowUps(),
  ]);
  const jobs = unwrap(jobsRes) as Job[];

  const byStatus = jobs.reduce(
    (acc, j) => ({ ...acc, [j.status]: (acc[j.status] ?? 0) + 1 }),
    {} as Partial<Record<JobStatus, number>>,
  );
  const submitted: JobStatus[] = ["applied", "interviewing", "offer", "rejected"];
  const applied = jobs.filter((j) => j.date_applied || submitted.includes(j.status)).length;

  const weekAgo = new Date(Date.parse(`${followUps.today}T00:00:00Z`) - 6 * 86_400_000).toISOString().slice(0, 10);
  const pending = [...followUps.overdue, ...followUps.dueToday, ...followUps.upcoming];

  return {
    today: followUps.today,
    total: jobs.length,
    applied,
    byStatus,
    pendingFollowUps: pending.filter((a) => a.type === "follow_up").length,
    overdueFollowUps: followUps.overdue.filter((a) => a.type === "follow_up").length,
    addedThisWeek: jobs.filter((j) => j.date_added >= weekAgo).length,
    recentJobs: jobs.slice(0, 6),
    recentlyUpdated: [...jobs].sort((a, b) => b.updated_at.localeCompare(a.updated_at)).slice(0, 5),
    upcoming: pending.slice(0, 6),
  };
}

// ---------------------------------------------------------------------------
// Templates
// ---------------------------------------------------------------------------
export async function getTemplates() {
  const res = await db().from("templates").select("*").order("name");
  return unwrap(res) as Template[];
}
