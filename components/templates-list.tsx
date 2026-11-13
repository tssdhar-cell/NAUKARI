"use client";

import * as React from "react";
import type { Template } from "@/lib/types";
import { deleteTemplate } from "@/lib/actions/templates";
import { TemplateDialog } from "@/components/template-dialog";
import { ConfirmDelete } from "@/components/confirm-delete";
import { CopyButton } from "@/components/copy-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function TemplateCard({ template }: { template: Template }) {
  const [expanded, setExpanded] = React.useState(false);
  const bodyId = React.useId();
  return <li className="flex flex-col rounded-xl border bg-background p-4">
    <div className="mb-2 flex items-center gap-1">
      <h2 className="flex-1 truncate font-medium">{template.name}</h2>
      <TemplateDialog template={template} />
      <ConfirmDelete iconOnly label="Delete template" title={`Delete “${template.name}”?`} description="This can't be undone." onConfirm={deleteTemplate.bind(null, template.id)} successMessage="Template deleted" />
    </div>
    <p id={bodyId} className={`${expanded ? "" : "line-clamp-6"} flex-1 text-sm whitespace-pre-wrap text-muted-foreground`}>{template.body}</p>
    <div className="mt-3 flex flex-wrap gap-2">
      <CopyButton text={template.body} size="sm" />
      <Button variant="ghost" size="sm" aria-expanded={expanded} aria-controls={bodyId} onClick={() => setExpanded((value) => !value)}>{expanded ? "Show less" : "Read full message"}</Button>
    </div>
  </li>;
}

export function TemplatesList({ templates }: { templates: Template[] }) {
  const [query, setQuery] = React.useState("");
  const [visibleCount, setVisibleCount] = React.useState(12);
  const needle = query.trim().toLocaleLowerCase();
  const filtered = templates.filter((template) => `${template.name} ${template.body}`.toLocaleLowerCase().includes(needle));
  return <>
    <label htmlFor="template-filter" className="mb-1.5 block text-sm font-medium">Find a message template</label>
    <Input id="template-filter" type="search" value={query} onChange={(event) => { setQuery(event.target.value); setVisibleCount(12); }} placeholder="Search names or message text" />
    <p role="status" className="mt-1 mb-4 text-xs text-muted-foreground">{filtered.length} of {templates.length} templates</p>
    <ul className="grid items-start gap-3 md:grid-cols-2">{filtered.slice(0, visibleCount).map((template) => <TemplateCard key={template.id} template={template} />)}</ul>
    {!filtered.length && <p className="p-6 text-center text-sm text-muted-foreground">No matching templates. Try another term.</p>}
    {filtered.length > visibleCount && <Button className="mt-4" variant="outline" onClick={() => setVisibleCount((count) => count + 12)}>Show more templates ({filtered.length - visibleCount} remaining)</Button>}
  </>;
}
