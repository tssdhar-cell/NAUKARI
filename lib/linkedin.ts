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

const WORK_TYPE: Record<string, string> = { "1": "on-site", "2": "remote", "3": "hybrid" };
const JOB_TYPE: Record<string, string> = { F: "full-time", P: "part-time", C: "contract", T: "temp", I: "internship" };
const EXPERIENCE: Record<string, string> = {
  "1": "intern",
  "2": "entry",
  "3": "associate",
  "4": "mid-senior",
  "5": "director",
  "6": "exec",
};

function mapList(value: string, map: Record<string, string>) {
  return value.split(",").map((x) => map[x] ?? x).join("/");
}

/** LinkedIn f_TPR=r86400 becomes "24 hours"; r604800 becomes "7 days". */
function timeWindow(tpr: string) {
  const secs = Number(tpr.replace(/^r/, ""));
  if (!secs || secs < 0) return "";
  const hours = Math.round(secs / 3600);
  if (hours <= 24) return hours <= 1 ? "1 hour" : `${hours} hours`;
  const days = Math.round(secs / 86400);
  return days === 1 ? "1 day" : `${days} days`;
}

/** Plain-words summary of a LinkedIn search, e.g. "AI Engineer, 24 hours, under 10, remote". */
export function describeLinkedIn(url: string) {
  const u = parseUrl(url);
  if (!u || !isLinkedIn(url)) return "";
  const p = u.searchParams;
  const parts: string[] = [];

  const kw = p.get("keywords")?.trim();
  if (kw) parts.push(kw);

  const tpr = p.get("f_TPR");
  if (tpr) {
    const w = timeWindow(tpr);
    if (w) parts.push(w);
  }
  if (p.get("f_EA") === "true") parts.push("under 10");
  if (p.get("f_AL") === "true") parts.push("easy apply");

  const wt = p.get("f_WT");
  if (wt) parts.push(mapList(wt, WORK_TYPE));
  const jt = p.get("f_JT");
  if (jt) parts.push(mapList(jt, JOB_TYPE));
  const exp = p.get("f_E");
  if (exp) parts.push(mapList(exp, EXPERIENCE));

  const loc = p.get("location")?.trim();
  if (loc) parts.push(loc);
  if (p.get("sortBy") === "DD") parts.push("newest first");

  return parts.join(", ");
}

// Query params job sites commonly use for the search text.
const KEYWORD_PARAMS = ["keywords", "q", "k", "query", "search", "text"];

/** One-line summary of any saved search: LinkedIn filters in plain words, otherwise "keywords, host". */
export function describeSearch(url: string) {
  const u = parseUrl(url);
  if (!u) return "";
  if (isLinkedIn(url)) return describeLinkedIn(url) || hostLabel(url);
  const kw = KEYWORD_PARAMS.map((k) => u.searchParams.get(k)?.trim()).find(Boolean);
  return [kw, hostLabel(url)].filter(Boolean).join(", ");
}

export function hostLabel(url: string) {
  const u = parseUrl(url);
  return u ? u.hostname.replace(/^www\./, "") : "";
}

/**
 * The site favicon via Google's favicon service.
 * Sites rarely serve /favicon.ico at a predictable path, and this needs no server code.
 */
export function faviconUrl(url: string | null | undefined, size = 64) {
  const host = url ? hostLabel(url) : "";
  return host ? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=${size}` : null;
}
