import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/session";
import { MAX_RESUME_BYTES, looksLikePdf, storeResumePdf } from "@/lib/resume-storage";

/** Upload an existing resume PDF. Multipart form: `file` (PDF), `name` (optional label), `primary` ("on" to make it primary). */
export async function POST(req: Request) {
  if (!(await getSession())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid upload." }, { status: 400 });
  }
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) return NextResponse.json({ error: "Choose a PDF file." }, { status: 400 });
  if (file.size > MAX_RESUME_BYTES) return NextResponse.json({ error: "PDF must be 8 MB or smaller." }, { status: 400 });

  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!looksLikePdf(bytes)) return NextResponse.json({ error: "That file isn't a PDF." }, { status: 400 });

  const rawName = String(form.get("name") ?? "").trim();
  const name = rawName || file.name.replace(/\.pdf$/i, "") || "Resume";

  try {
    const { id } = await storeResumePdf(bytes, name, form.get("primary") === "on");
    revalidatePath("/resume");
    return NextResponse.json({ ok: true, id });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Upload failed." }, { status: 500 });
  }
}
