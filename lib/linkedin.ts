// Pure helpers for saved search URLs. Safe to use on client and server.

export function parseUrl(url: string): URL | null {
  try {
    const u = new URL(url.trim());
    return u.protocol === "http:" || u.protocol === "https:" ? u : null;
  } catch {
    return null;
  }
}

export function isLinkedIn(url: string) {
  const u = parseUrl(url);
  return !!u && /(^|\.)linkedin\.com$/i.test(u.hostname);
}

/** Keywords from a LinkedIn search URL, or "" if none. */
export function getKeywords(url: string) {
  const u = parseUrl(url);
  return u?.searchParams.get("keywords") ?? "";
}

/** Same URL with the keywords replaced (or removed when empty). */
export function setKeywords(url: string, keywords: string) {
  const u = parseUrl(url);
  if (!u) return url;
  const kw = keywords.trim();
  if (kw) u.searchParams.set("keywords", kw);
  else u.searchParams.delete("keywords");
  return u.toString();
}

// Params that pin one listing or one browsing session; they make a saved search stale.
const NOISE = ["currentJobId", "referralSearchId", "origin", "trackingId", "refId", "lipi", "licu"];

/** Drop per-session noise from a LinkedIn URL. Other sites are returned trimmed. */
export function cleanUrl(url: string) {
  const u = parseUrl(url);
  if (!u) return url.trim();
  if (isLinkedIn(url)) for (const p of NOISE) u.searchParams.delete(p);
  return u.toString();
}

/** Short human label for a LinkedIn filter set, e.g. "past 24h · under 10 applicants · remote". */
export function describeLinkedIn(url: string) {
  const u = parseUrl(url);
  if (!u || !isLinkedIn(url)) return "";
  const p = u.searchParams;
  const parts: string[] = [];
  const tpr = p.get("f_TPR");
  if (tpr) {
    const secs = Number(tpr.replace(/^r/, ""));
    if (secs === 86400) parts.push("past 24h");
    else if (secs === 604800) parts.push("past week");
    else if (secs === 2592000) parts.push("past month");
    else if (secs) parts.push(`past ${Math.round(secs / 3600)}h`);
  }
  if (p.get("f_EA") === "true") parts.push("under 10 applicants");
  if (p.get("f_AL") === "true") parts.push("easy apply");
  const wt = p.get("f_WT");
  if (wt) {
    const map: Record<string, string> = { "1": "on-site", "2": "remote", "3": "hybrid" };
    parts.push(wt.split(",").map((x) => map[x] ?? x).join("/"));
  }
  const exp = p.get("f_E");
  if (exp) {
    const map: Record<string, string> = { "1": "intern", "2": "entry", "3": "associate", "4": "mid-senior", "5": "director", "6": "exec" };
    parts.push(exp.split(",").map((x) => map[x] ?? x).join("/"));
  }
  return parts.join(" · ");
}

export function hostLabel(url: string) {
  const u = parseUrl(url);
  return u ? u.hostname.replace(/^www\./, "") : "";
}
