import { getSession } from "@/lib/session";
import { db } from "@/lib/supabase";
import { getResume } from "@/lib/data";
import { RESUME_BUCKET } from "@/lib/storage";
import { uuid } from "@/lib/validation";

/** Stream a stored resume PDF. `?download=1` forces a download instead of inline preview. */
export async function GET(req: Request, ctx: RouteContext<"/api/resumes/[id]">) {
  if (!(await getSession())) return new Response("Unauthorized", { status: 401 });

  const { id } = await ctx.params;
  if (!uuid.safeParse(id).success) return new Response("Not found", { status: 404 });
  const resume = await getResume(id);
  if (!resume) return new Response("Not found", { status: 404 });

  const dl = await db().storage.from(RESUME_BUCKET).download(resume.storage_path);
  if (dl.error || !dl.data) return new Response("File missing", { status: 404 });

  const download = new URL(req.url).searchParams.get("download") === "1";
  const filename = `${resume.name.replace(/[^\w.-]+/g, "_")}.pdf`;
  return new Response(dl.data, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Length": String(dl.data.size),
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${filename}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
