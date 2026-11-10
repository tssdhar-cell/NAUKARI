import type { Metadata } from "next";
import { FileTextIcon } from "lucide-react";
import { getResumes, getResumeSources } from "@/lib/data";
import { env } from "@/lib/env";
import { EmptyState, PageHeader, Section } from "@/components/page-header";
import { ResumeUpload } from "@/components/resume-upload";
import { ResumeList } from "@/components/resume-list";
import { LatexEditor } from "@/components/latex-editor";

export const metadata: Metadata = { title: "Resume" };

export default async function ResumePage() {
  const [resumes, sources] = await Promise.all([getResumes(), getResumeSources()]);

  return (
    <>
      <PageHeader title="Resume" description="PDF versions to submit, and the LaTeX source to edit them from." />
      <div className="grid gap-8">
        <Section title="Versions">
          <div className="grid gap-4">
            <ResumeUpload hasAny={resumes.length > 0} />
            {resumes.length === 0 ? (
              <EmptyState icon={FileTextIcon} title="No resume uploaded yet" description="Upload a PDF above. The first one becomes your primary." />
            ) : (
              <ResumeList resumes={resumes} timeZone={env().APP_TIMEZONE} />
            )}
          </div>
        </Section>

        <Section title="LaTeX source">
          <LatexEditor sources={sources} />
        </Section>
      </div>
    </>
  );
}
