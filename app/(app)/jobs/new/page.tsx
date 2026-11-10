import type { Metadata } from "next";
import { today } from "@/lib/data";
import { PageHeader } from "@/components/page-header";
import { JobForm } from "@/components/job-form";

export const metadata: Metadata = { title: "Add job" };

export default function NewJobPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Add job" description="Paste the listing link and fill in the basics." />
      <JobForm today={today()} />
    </div>
  );
}
