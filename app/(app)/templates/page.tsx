import type { Metadata } from "next";
import { MessageSquareTextIcon } from "lucide-react";
import { getTemplates } from "@/lib/data";
import { EmptyState, PageHeader } from "@/components/page-header";
import { TemplateDialog } from "@/components/template-dialog";
import { TemplatesList } from "@/components/templates-list";

export const metadata: Metadata = { title: "Templates" };

export default async function TemplatesPage() {
  const templates = await getTemplates();
  return (
    <>
      <PageHeader
        title="Message templates"
        description="Your drafts for reaching out — connection notes, cold emails, follow-ups."
        actions={<TemplateDialog />}
      />
      {templates.length === 0 ? (
        <EmptyState
          icon={MessageSquareTextIcon}
          title="No templates yet"
          description="Drafts of how you reach out — a LinkedIn connection note, a cold email, a follow-up. Copy, tweak, send."
        />
      ) : (
        <TemplatesList templates={templates} />
      )}
    </>
  );
}
