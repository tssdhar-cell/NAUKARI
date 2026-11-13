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
    const ins = await db().rpc("register_resume", {
      p_name: (name.trim() || "Resume").slice(0, 120),
      p_storage_path: storagePath,
      p_size_bytes: bytes.byteLength,
      p_make_primary: makePrimary,
    });
    throwIf(ins);
    if (typeof ins.data !== "string") throw new Error("Resume registration did not return an id.");
    return { id: ins.data };
  } catch (e) {
    await db().storage.from(RESUME_BUCKET).remove([storagePath]);
    throw e;
  }
}
