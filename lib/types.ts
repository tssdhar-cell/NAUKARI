import type { ActivityType, ContactStatus, JobStatus, Method, Platform } from "@/lib/constants";

export type Job = {
  id: string;
  company: string;
  title: string;
  url: string | null;
  platform: Platform;
  location: string | null;
  description: string | null;
  experience: string | null;
  salary_range: string | null;
  status: JobStatus;
  date_added: string;
  date_applied: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type JobWithFollowUp = Job & { next_follow_up: string | null };

export type Contact = {
  id: string;
  name: string;
  company: string | null;
  designation: string | null;
  linkedin_url: string | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
  status: ContactStatus;
  created_at: string;
  updated_at: string;
};

export type Activity = {
  id: string;
  job_id: string | null;
  contact_id: string | null;
  type: ActivityType;
  title: string | null;
  body: string | null;
  method: Method | null;
  response_received: boolean | null;
  due_date: string | null;
  due_time: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ActivityWithRefs = Activity & {
  job: Pick<Job, "id" | "title" | "company"> | null;
  contact: Pick<Contact, "id" | "name"> | null;
};

export type Template = {
  id: string;
  name: string;
  body: string;
  created_at: string;
  updated_at: string;
};

export type FormState = {
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};
