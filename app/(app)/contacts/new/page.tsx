import type { Metadata } from "next";
import { getJob } from "@/lib/data";
import { uuid } from "@/lib/validation";
import { PageHeader } from "@/components/page-header";
import { ContactForm } from "@/components/contact-form";

export const metadata: Metadata = { title: "Add recruiter" };

export default async function NewContactPage(props: PageProps<"/contacts/new">) {
  const sp = await props.searchParams;
  const jobId = typeof sp.job === "string" && uuid.safeParse(sp.job).success ? sp.job : null;
  const job = jobId ? (await getJob(jobId))?.job : null;

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Add recruiter" />
      <ContactForm linkJob={job ? { id: job.id, company: job.company, title: job.title } : undefined} />
    </div>
  );
}
