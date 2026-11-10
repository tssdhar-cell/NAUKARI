import type { Metadata } from "next";
import { MessageSquareTextIcon } from "lucide-react";
import { getTemplates } from "@/lib/data";
import { deleteTemplate } from "@/lib/actions/templates";
import { EmptyState, PageHeader } from "@/components/page-header";
import { TemplateDialog } from "@/components/template-dialog";
import { ConfirmDelete } from "@/components/confirm-delete";
import { CopyButton } from "@/components/copy-button";

export const metadata: Metadata = { title: "Templates" };

export default async function TemplatesPage() {
  const templates = await getTemplates();
  return (
    <>
      <PageHeader
        title="Message templates"
        description="Reusable messages for recruiters. Fill and copy them from any job page."
        actions={<TemplateDialog />}
      />
      {templates.length === 0 ? (
        <EmptyState
          icon={MessageSquareTextIcon}
          title="No templates yet"
          description="Example: “Hi {name}, I came across the {role} opening at {company} and would love to be considered…”"
        />
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {templates.map((t) => (
            <li key={t.id} className="flex flex-col rounded-xl border bg-background p-4">
              <div className="mb-2 flex items-center gap-1">
                <h2 className="flex-1 truncate font-medium">{t.name}</h2>
                <TemplateDialog template={t} />
                <ConfirmDelete
                  iconOnly
                  label="Delete template"
                  title={`Delete “${t.name}”?`}
                  description="This can't be undone."
                  onConfirm={deleteTemplate.bind(null, t.id)}
                  successMessage="Template deleted"
                />
              </div>
              <p className="line-clamp-6 flex-1 text-sm whitespace-pre-wrap text-muted-foreground">{t.body}</p>
              <CopyButton text={t.body} size="sm" className="mt-3 self-start" />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
