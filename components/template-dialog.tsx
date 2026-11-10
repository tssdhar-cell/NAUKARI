"use client";

import * as React from "react";
import { useActionState } from "react";
import { PencilIcon, PlusIcon } from "lucide-react";
import { toast } from "sonner";
import { saveTemplate } from "@/lib/actions/templates";
import type { FormState, Template } from "@/lib/types";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, FormError } from "@/components/field";
import { SubmitButton } from "@/components/submit-button";

export function TemplateDialog({ template }: { template?: Template }) {
  const [open, setOpen] = React.useState(false);
  const [state, action] = useActionState(async (prev: FormState, fd: FormData) => {
    const res = await saveTemplate(prev, fd);
    if (res.ok) {
      setOpen(false);
      toast.success(template ? "Template updated" : "Template created");
    }
    return res;
  }, {});
  const err = state.fieldErrors ?? {};

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={template ? <Button variant="ghost" size="icon-sm" aria-label="Edit template" /> : <Button />}
      >
        {template ? (
          <PencilIcon />
        ) : (
          <>
            <PlusIcon /> New template
          </>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{template ? "Edit template" : "New template"}</DialogTitle>
          <DialogDescription>
            A reusable draft. Leave blanks like <code>[company]</code> where you&apos;ll fill in details after copying.
          </DialogDescription>
        </DialogHeader>
        <form action={action} className="grid gap-4">
          {template && <input type="hidden" name="id" value={template.id} />}
          <FormError message={state.error && !state.fieldErrors ? state.error : undefined} />
          <Field label="Name" htmlFor="tpl-name" error={err.name}>
            <Input id="tpl-name" name="name" defaultValue={template?.name} placeholder="Cold intro" required />
          </Field>
          <Field label="Message" htmlFor="tpl-body" error={err.body}>
            <Textarea id="tpl-body" name="body" rows={9} defaultValue={template?.body} required />
          </Field>
          <div className="flex justify-end">
            <SubmitButton pendingText="Saving…">Save template</SubmitButton>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
