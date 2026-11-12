import "server-only";
import { db } from "@/lib/supabase";
import { RESUME_BUCKET } from "@/lib/storage";

export const MAX_RESUME_BYTES = 8 * 1024 * 1024;

export function looksLikePdf(bytes: Uint8Array) {
  return bytes.length > 4 && bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46; // %PDF
}

function throwIf(res: { error: { message: string } | null }) {
  if (res.error) throw new Error(res.error.message);
}

/**
 * Put a PDF in the private bucket and add a row to `resumes`.
 * The first version ever stored becomes primary automatically.
 */
export async function storeResumePdf(bytes: Uint8Array, name: string, makePrimary: boolean): Promise<{ id: string }> {
  const storagePath = `${crypto.randomUUID()}.pdf`;
  const up = await db().storage.from(RESUME_BUCKET).upload(storagePath, bytes, { contentType: "application/pdf", upsert: false });
  if (up.error) throw new Error(`Upload failed: ${up.error.message}`);

  try {
    const count = await db().from("resumes").select("id", { count: "exact", head: true });
    throwIf(count);
    const isPrimary = makePrimary || (count.count ?? 0) === 0;
    if (isPrimary) throwIf(await db().from("resumes").update({ is_primary: false }).eq("is_primary", true));

    const ins = await db()
      .from("resumes")
      .insert({ name: (name.trim() || "Resume").slice(0, 120), storage_path: storagePath, size_bytes: bytes.byteLength, is_primary: isPrimary })
      .select("id")
      .single();
    throwIf(ins);
    return { id: ins.data!.id };
  } catch (e) {
    await db().storage.from(RESUME_BUCKET).remove([storagePath]);
    throw e;
  }
}
