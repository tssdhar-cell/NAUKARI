import type { Metadata } from "next";
import Link from "next/link";
import { BriefcaseBusinessIcon, PlusIcon, SearchXIcon } from "lucide-react";
import { getJobs, today } from "@/lib/data";
import { EmptyState, PageHeader } from "@/components/page-header";
import { JobFilters } from "@/components/job-filters";
import { JobsKanban, JobsTable } from "@/components/jobs-list";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = { title: "Jobs" };

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function JobsPage(props: PageProps<"/jobs">) {
  const sp = await props.searchParams;
  const filters = {
    q: one(sp.q),
    platform: one(sp.platform),
    status: one(sp.status),
    sort: one(sp.sort) === "oldest" ? ("oldest" as const) : ("newest" as const),
  };
  const view = one(sp.view) === "kanban" ? "kanban" : "table";
  const jobs = await getJobs(filters);
  const filtered = !!(filters.q || filters.platform || filters.status);

  return (
    <>
      <PageHeader
        title="Jobs"
        description={`${jobs.length} ${filtered ? "matching" : "saved"} job${jobs.length === 1 ? "" : "s"}`}
        actions={
          <Link href="/jobs/new" className={buttonVariants({ className: "hidden md:inline-flex" })}>
            <PlusIcon /> Add job
          </Link>
        }
      />
      <JobFilters />
      {jobs.length === 0 ? (
        filtered ? (
          <EmptyState icon={SearchXIcon} title="No matches" description="Try a different search or clear the filters." />
        ) : (
          <EmptyState
            icon={BriefcaseBusinessIcon}
            title="No jobs yet"
            description="Paste a job link from LinkedIn, Glassdoor, Instahyre or a careers page to start tracking."
            action={
              <Link href="/jobs/new" className={buttonVariants()}>
                <PlusIcon /> Add job
              </Link>
            }
          />
        )
      ) : view === "kanban" ? (
        <JobsKanban jobs={jobs} today={today()} />
      ) : (
        <JobsTable jobs={jobs} today={today()} />
      )}
    </>
  );
}
