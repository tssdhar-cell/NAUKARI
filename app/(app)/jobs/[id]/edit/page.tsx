import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getJob, today } from "@/lib/data";
import { uuid } from "@/lib/validation";
import { PageHeader } from "@/components/page-header";
import { JobForm } from "@/components/job-form";

export const metadata: Metadata = { title: "Edit job" };

export default async function EditJobPage(props: PageProps<"/jobs/[id]/edit">) {
  const { id } = await props.params;
  if (!uuid.safeParse(id).success) notFound();
  const data = await getJob(id);
  if (!data) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Edit job" description={`${data.job.title} @ ${data.job.company}`} />
      <JobForm job={data.job} today={today()} />
    </div>
  );
}
