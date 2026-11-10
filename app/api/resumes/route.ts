import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/lib/supabase";
import { RESUME_BUCKET } from "@/lib/storage";
import { revalidatePath } from "next/cache";

const MAX_BYTES = 8 * 1024 * 1024;

/** Upload a resume PDF. Multipart form: `file` (PDF), `name` (optional label), `primary` ("on" to make it primary). */
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
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "PDF must be 8 MB or smaller." }, { status: 400 });

  const bytes = new Uint8Array(await file.arrayBuffer());
  const isPdf = bytes.length > 4 && bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46; // %PDF
  if (!isPdf) return NextResponse.json({ error: "That file isn't a PDF." }, { status: 400 });

  const rawName = String(form.get("name") ?? "").trim();
  const name = (rawName || file.name.replace(/\.pdf$/i, "") || "Resume").slice(0, 120);
  const makePrimary = form.get("primary") === "on";
  const storagePath = `${crypto.randomUUID()}.pdf`;

  const up = await db().storage.from(RESUME_BUCKET).upload(storagePath, bytes, { contentType: "application/pdf", upsert: false });
  if (up.error) return NextResponse.json({ error: `Upload failed: ${up.error.message}` }, { status: 500 });

  const count = await db().from("resumes").select("id", { count: "exact", head: true });
  const isPrimary = makePrimary || (count.count ?? 0) === 0;
  if (isPrimary) await db().from("resumes").update({ is_primary: false }).eq("is_primary", true);

  const ins = await db()
    .from("resumes")
    .insert({ name, storage_path: storagePath, size_bytes: file.size, is_primary: isPrimary })
    .select("id")
    .single();
  if (ins.error) {
    await db().storage.from(RESUME_BUCKET).remove([storagePath]);
    return NextResponse.json({ error: ins.error.message }, { status: 500 });
  }

  revalidatePath("/resume");
  return NextResponse.json({ ok: true, id: ins.data.id });
}
