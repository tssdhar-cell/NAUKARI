// Runtime unit tests: execute the real TypeScript modules with mocked I/O.
// These verify application behavior, not PostgreSQL SQL/concurrency semantics.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";

function loadModule(file, dependencies) {
  const output = ts.transpileModule(readFileSync(new URL(`../${file}`, import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const exports = {};
  vm.runInNewContext(output, {
    exports,
    require(name) {
      if (!(name in dependencies)) throw new Error(`Unexpected dependency: ${name}`);
      return dependencies[name];
    },
    crypto: { randomUUID: () => "uploaded-file" },
    Uint8Array,
    Error,
  }, { filename: file });
  return exports;
}

const throwIf = (result) => {
  if (result.error) throw new Error(result.error.message);
};

function actions(rpcError = null) {
  const calls = [];
  const subject = loadModule("lib/actions/resumes.ts", {
    "@/lib/supabase": { db: () => ({ rpc: async (...args) => {
      calls.push(["rpc", ...args]);
      return { error: rpcError };
    } }) },
    "@/lib/session": { requireSession: async () => calls.push(["session"]) },
    "next/cache": { revalidatePath: (path) => calls.push(["revalidate", path]) },
    "@/lib/data": {},
    "@/lib/validation": { uuid: { safeParse: () => ({ success: true }) } },
    "@/lib/actions/helpers": { throwIf, dbError: (error) => ({ error: error.message }) },
    "@/lib/storage": { RESUME_BUCKET: "resumes" },
  });
  return { subject, calls };
}

test("primary selection authenticates and uses one RPC before refreshing resume page", async () => {
  const { subject, calls } = actions();
  assert.deepEqual(JSON.parse(JSON.stringify(await subject.setPrimaryResume("resume-id"))), { ok: true });
  assert.deepEqual(JSON.parse(JSON.stringify(calls)), [
    ["session"], ["rpc", "set_primary_resume", { p_resume_id: "resume-id" }], ["revalidate", "/resume"],
  ]);
});

test("failed primary RPC returns error and does not refresh", async () => {
  const { subject, calls } = actions({ message: "Resume not found" });
  assert.equal((await subject.setPrimaryResume("missing-id")).error, "Resume not found");
  assert.deepEqual(calls.map(([kind]) => kind), ["session", "rpc"]);
});

function storage(rpcError = null, uploadError = null) {
  const calls = [];
  const subject = loadModule("lib/resume-storage.ts", {
    "server-only": {},
    "@/lib/storage": { RESUME_BUCKET: "resumes" },
    "@/lib/supabase": { db: () => ({
      rpc: async (name, args) => {
        calls.push(["rpc", name, args]);
        return { data: rpcError ? null : "new-resume-id", error: rpcError };
      },
      storage: { from: (bucket) => {
        assert.equal(bucket, "resumes");
        return {
          upload: async (path) => { calls.push(["upload", path]); return { error: uploadError }; },
          remove: async (paths) => { calls.push(["remove", paths]); return { error: null }; },
        };
      } },
    }) },
  });
  return { subject, calls };
}

test("uploaded PDF is registered atomically with correct metadata", async () => {
  const { subject, calls } = storage();
  const result = await subject.storeResumePdf(new Uint8Array([1, 2, 3]), " Resume A ", true);
  assert.equal(result.id, "new-resume-id");
  assert.deepEqual(JSON.parse(JSON.stringify(calls)), [
    ["upload", "uploaded-file.pdf"],
    ["rpc", "register_resume", { p_name: "Resume A", p_storage_path: "uploaded-file.pdf", p_size_bytes: 3, p_make_primary: true }],
  ]);
});

test("registration failure removes newly uploaded file and surfaces the error", async () => {
  const { subject, calls } = storage({ message: "duplicate storage path" });
  await assert.rejects(subject.storeResumePdf(new Uint8Array([1]), "Resume", false), /duplicate storage path/);
  assert.deepEqual(calls.map(([kind]) => kind), ["upload", "rpc", "remove"]);
  assert.deepEqual(Array.from(calls[2][1]), ["uploaded-file.pdf"]);
});

test("upload failure does not register metadata or touch existing files", async () => {
  const { subject, calls } = storage(null, { message: "Storage unavailable" });
  await assert.rejects(subject.storeResumePdf(new Uint8Array([1]), "Resume", false), /Upload failed: Storage unavailable/);
  assert.deepEqual(calls, [["upload", "uploaded-file.pdf"]]);
});
