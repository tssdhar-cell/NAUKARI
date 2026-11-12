import type { Metadata } from "next";
import { FileTextIcon } from "lucide-react";
import { getResumes } from "@/lib/data";
import { env } from "@/lib/env";
import { EmptyState, PageHeader } from "@/components/page-header";
import { ResumeUpload } from "@/components/resume-upload";
import { ResumeList } from "@/components/resume-list";

export const metadata: Metadata = { title: "Resume" };

export default async function ResumePage() {
  const resumes = await getResumes();

  return (
    <>
      <PageHeader title="Resume" description="Keep every version of your resume here. Mark the one you usually send as primary." />
      <div className="grid gap-4">
        <ResumeUpload hasAny={resumes.length > 0} />
        {resumes.length === 0 ? (
          <EmptyState icon={FileTextIcon} title="No resume uploaded yet" description="Upload a PDF above. The first one becomes your primary." />
        ) : (
          <ResumeList resumes={resumes} timeZone={env().APP_TIMEZONE} />
        )}
      </div>
    </>
  );
}
