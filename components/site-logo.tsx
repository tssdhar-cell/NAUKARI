"use client";

import * as React from "react";
import { GlobeIcon } from "lucide-react";
import { faviconUrl } from "@/lib/linkedin";
import { cn } from "@/lib/utils";

/**
 * A job site logo (its favicon) for board headers and the board dialog preview.
 * Falls back to the first letter of the name, or a globe when there is no name yet.
 */
export function SiteLogo({ url, name, className }: { url?: string | null; name?: string; className?: string }) {
  const src = faviconUrl(url);
  const [failedSrc, setFailedSrc] = React.useState<string | null>(null);
  const letter = name?.trim().charAt(0).toUpperCase() ?? "";

  if (src && failedSrc !== src) {
    return (
      <div
        className={cn(
          "flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-background",
          className,
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt=""
          width={24}
          height={24}
          decoding="async"
          referrerPolicy="no-referrer"
          className="size-6 rounded-[4px]"
          onError={() => setFailedSrc(src)}
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex size-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold",
        letter ? "bg-primary text-primary-foreground" : "border bg-background text-muted-foreground",
        className,
      )}
    >
      {letter || <GlobeIcon className="size-4" />}
    </div>
  );
}
