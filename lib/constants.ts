export const PLATFORMS = [
  { value: "linkedin", label: "LinkedIn" },
  { value: "glassdoor", label: "Glassdoor" },
  { value: "instahyre", label: "Instahyre" },
  { value: "company_website", label: "Company Website" },
  { value: "other", label: "Other" },
] as const;

export const JOB_STATUSES = [
  { value: "saved", label: "Saved", tone: "bg-slate-100 text-slate-700 ring-slate-200", bar: "bg-slate-400" },
  { value: "applied", label: "Applied", tone: "bg-blue-50 text-blue-700 ring-blue-200", bar: "bg-blue-500" },
  { value: "interviewing", label: "Interviewing", tone: "bg-amber-50 text-amber-800 ring-amber-200", bar: "bg-amber-500" },
  { value: "offer", label: "Offer", tone: "bg-emerald-50 text-emerald-700 ring-emerald-200", bar: "bg-emerald-500" },
  { value: "rejected", label: "Rejected", tone: "bg-rose-50 text-rose-700 ring-rose-200", bar: "bg-rose-500" },
  { value: "withdrawn", label: "Withdrawn", tone: "bg-zinc-100 text-zinc-500 ring-zinc-200", bar: "bg-zinc-400" },
] as const;

export const CONTACT_STATUSES = [
  { value: "not_contacted", label: "Not contacted", tone: "bg-slate-100 text-slate-700 ring-slate-200" },
  { value: "contacted", label: "Contacted", tone: "bg-blue-50 text-blue-700 ring-blue-200" },
  { value: "responded", label: "Responded", tone: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  { value: "no_response", label: "No response", tone: "bg-amber-50 text-amber-800 ring-amber-200" },
  { value: "closed", label: "Closed", tone: "bg-zinc-100 text-zinc-500 ring-zinc-200" },
] as const;

export const METHODS = [
  { value: "linkedin", label: "LinkedIn" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "other", label: "Other" },
] as const;

export const ACTIVITY_TYPES = [
  { value: "note", label: "Note" },
  { value: "status_change", label: "Status change" },
  { value: "outreach", label: "Outreach" },
  { value: "follow_up", label: "Follow-up" },
  { value: "interview", label: "Interview" },
] as const;

export type Platform = (typeof PLATFORMS)[number]["value"];
export type JobStatus = (typeof JOB_STATUSES)[number]["value"];
export type ContactStatus = (typeof CONTACT_STATUSES)[number]["value"];
export type Method = (typeof METHODS)[number]["value"];
export type ActivityType = (typeof ACTIVITY_TYPES)[number]["value"];

const values = <T extends readonly { value: string }[]>(list: T) =>
  list.map((i) => i.value) as unknown as [T[number]["value"], ...T[number]["value"][]];

export const PLATFORM_VALUES = values(PLATFORMS);
export const JOB_STATUS_VALUES = values(JOB_STATUSES);
export const CONTACT_STATUS_VALUES = values(CONTACT_STATUSES);
export const METHOD_VALUES = values(METHODS);
export const ACTIVITY_TYPE_VALUES = values(ACTIVITY_TYPES);

export function labelOf(list: readonly { value: string; label: string }[], value: string | null | undefined) {
  return list.find((i) => i.value === value)?.label ?? value ?? "";
}
