"use client";

import * as React from "react";
import Link from "next/link";
import { Loader2Icon, SendIcon } from "lucide-react";
import { toast } from "sonner";
import { addActivity } from "@/lib/actions/activities";
import type { Contact, Template } from "@/lib/types";
import { METHODS } from "@/lib/constants";
import { CopyButton } from "@/components/copy-button";
import { NativeSelect } from "@/components/native-select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export function fillTemplate(body: string, vars: { company?: string; role?: string; name?: string }) {
  return body
    .replaceAll("{company}", vars.company || "{company}")
    .replaceAll("{role}", vars.role || "{role}")
    .replaceAll("{name}", vars.name ? vars.name.split(" ")[0] : "{name}");
}

/** Pick a template, fill {company}/{role}/{name}, copy it, and log it as outreach. */
export function TemplateComposer({
  templates,
  contacts,
  jobId,
  company,
  role,
}: {
  templates: Template[];
  contacts: Pick<Contact, "id" | "name">[];
  jobId: string;
  company: string;
  role: string;
}) {
  const [templateId, setTemplateId] = React.useState(templates[0]?.id ?? "");
  const [contactId, setContactId] = React.useState(contacts[0]?.id ?? "");
  const [method, setMethod] = React.useState("linkedin");
  const [pending, startTransition] = React.useTransition();

  const fill = React.useCallback(
    (tid: string, cid: string) => {
      const t = templates.find((x) => x.id === tid);
      const c = contacts.find((x) => x.id === cid);
      return t ? fillTemplate(t.body, { company, role, name: c?.name }) : "";
    },
    [templates, contacts, company, role],
  );
  const [text, setText] = React.useState(() => fill(templateId, contactId));

  if (templates.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No templates yet.{" "}
        <Link href="/templates" className="font-medium text-foreground underline underline-offset-4">
          Create one
        </Link>{" "}
        to quickly draft recruiter messages.
      </p>
    );
  }

  function logAsSent() {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("type", "outreach");
      fd.set("job_id", jobId);
      if (contactId) fd.set("contact_id", contactId);
      fd.set("method", method);
      fd.set("body", text);
      const res = await addActivity({}, fd);
      if (res.error) toast.error(res.error);
      else toast.success("Logged in activity");
    });
  }

  return (
    <div className="grid gap-3">
      <div className="grid gap-2 sm:grid-cols-3">
        <NativeSelect
          aria-label="Template"
          options={templates.map((t) => ({ value: t.id, label: t.name }))}
          value={templateId}
          onChange={(e) => {
            setTemplateId(e.target.value);
            setText(fill(e.target.value, contactId));
          }}
        />
        <NativeSelect
          aria-label="Recruiter"
          options={contacts.map((c) => ({ value: c.id, label: c.name }))}
          placeholder="No recruiter"
          value={contactId}
          onChange={(e) => {
            setContactId(e.target.value);
            setText(fill(templateId, e.target.value));
          }}
        />
        <NativeSelect aria-label="Method" options={METHODS} value={method} onChange={(e) => setMethod(e.target.value)} />
      </div>
      <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={6} aria-label="Message" />
      <div className="flex flex-wrap gap-2">
        <CopyButton text={text} />
        <Button variant="secondary" onClick={logAsSent} disabled={!text || pending}>
          {pending ? <Loader2Icon className="animate-spin" /> : <SendIcon />} Log as sent
        </Button>
      </div>
    </div>
  );
}
