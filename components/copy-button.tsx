"use client";

import * as React from "react";
import { CheckIcon, CopyIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function CopyButton({
  text,
  label = "Copy",
  ...props
}: { text: string; label?: string } & Omit<React.ComponentProps<typeof Button>, "onClick">) {
  const [copied, setCopied] = React.useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Couldn't copy — select the text and copy manually.");
    }
  }

  return (
    <Button type="button" variant="outline" onClick={copy} disabled={!text} {...props}>
      {copied ? <CheckIcon /> : <CopyIcon />}
      {label}
    </Button>
  );
}
