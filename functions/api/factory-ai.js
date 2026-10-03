// Isolated read-only n8n bridge. No frontend or state-save functions are called.
const DATASETS = new Set([
  "materials", "workers", "transactions", "stockMovements",
  "articles", "shopkeepers", "bills", "gasVouchers",
]);

// Existing settings properties only; whole settings are never returned.
const SECTIONS = new Map([
  ["gasSupplier", "object"],
  ["gasExtraBalances", "array"],
  ["shoeBoxSuppliers", "array"],
  ["shoeSoleSuppliers", "array"],
  ["upperArticles", "array"],
  ["upperMaterials", "array"],
  ["upperDistributions", "array"],
  ["upperPendingRecords", "array"],
  ["lamination", "object"],
  ["magziBatavaSupplier", "object"],
]);
const REQUEST_FIELDS = new Set(["action", "dataset", "section", "offset", "limit"]);
const MAX_BODY_BYTES = 8192;
const READ_SQL = "SELECT dataset, data_json, updated_at FROM app_state WHERE dataset = ?1";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      ...(status === 405 ? { Allow: "POST" } : {}),
    },
  });
}

function failure(code, message, status) {
  return json({ ok: false, error: { code, message } }, status);
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

async function authenticate(request, env) {
  const secret = env?.FACTORY_AI_KEY;
  if (typeof secret !== "string" || !secret.trim()) {
    return failure("SERVICE_NOT_CONFIGURED", "Endpoint authentication is not configured.", 503);
  }
  const supplied = request.headers.get("X-Factory-Key");
  if (!supplied) return failure("UNAUTHORIZED", "Invalid or missing factory key.", 401);
  const encoder = new TextEncoder();
  const hashes = await Promise.all([secret, supplied].map(value =>
    crypto.subtle.digest("SHA-256", encoder.encode(value))
  ));
  const expected = new Uint8Array(hashes[0]), actual = new Uint8Array(hashes[1]);
  let difference = 0;
  for (let i = 0; i < expected.length; i++) difference |= expected[i] ^ actual[i];
  return difference === 0 ? null : failure("UNAUTHORIZED", "Invalid or missing factory key.", 401);
}

async function readBody(request) {
  const reader = request.body?.getReader();
  if (!reader) return { error: failure("INVALID_JSON", "Request body must be valid JSON.", 400) };
  const chunks = [];
  let length = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > MAX_BODY_BYTES) {
        await reader.cancel();
        return { error: failure("REQUEST_TOO_LARGE", "Request body exceeds 8 KB.", 413) };
      }
      chunks.push(value);
    }
    const bytes = new Uint8Array(length);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    return { body: JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)) };
  } catch {
    return { error: failure("INVALID_JSON", "Request body must be valid JSON.", 400) };
  } finally {
    reader.releaseLock();
  }
}

function validateReadRequest(body) {
  if (!isObject(body) || Object.keys(body).some(key => !REQUEST_FIELDS.has(key))) {
    return { error: failure("INVALID_REQUEST", "Only approved read request fields are accepted.", 400) };
  }
  if (body.action !== "read") {
    return { error: failure("INVALID_ACTION", "Only the read action is supported.", 400) };
  }
  const settings = body.dataset === "settings";
  if (settings ? !SECTIONS.has(body.section) : !DATASETS.has(body.dataset)) {
    return { error: failure("NOT_ALLOWED", "Requested dataset or settings section is not allowed.", 400) };
  }
  if (!settings && Object.hasOwn(body, "section")) {
    return { error: failure("INVALID_REQUEST", "Section is only supported for settings reads.", 400) };
  }
  const offset = Object.hasOwn(body, "offset") ? body.offset : 0;
  const limit = Object.hasOwn(body, "limit") ? body.limit : 50;
  if (!Number.isSafeInteger(offset) || offset < 0 || !Number.isSafeInteger(limit) || limit < 1 || limit > 100) {
    return { error: failure("INVALID_PAGINATION", "Offset must be a nonnegative integer; limit must be 1 to 100.", 400) };
  }
  return { dataset: body.dataset, section: settings ? body.section : null, offset, limit };
}

async function readDataset(env, query) {
  if (!env?.DB) return failure("SERVICE_NOT_CONFIGURED", "Database binding is not configured.", 503);
  const row = await env.DB.prepare(READ_SQL).bind(query.dataset).first();
  if (!row) return failure("DATASET_NOT_FOUND", "Requested dataset is not stored.", 404);
  let stored;
  try { stored = JSON.parse(row.data_json); }
  catch { return failure("INVALID_STORED_DATA", "Stored dataset contains invalid JSON.", 500); }
  let data = stored;
  if (query.section !== null) {
    if (!isObject(stored)) return failure("INVALID_STORED_DATA", "Stored settings have an invalid structure.", 500);
    if (!Object.hasOwn(stored, query.section)) {
      return failure("SECTION_NOT_FOUND", "Requested settings section is not stored.", 404);
    }
    data = stored[query.section];
  }
  const expectedType = query.section === null ? "array" : SECTIONS.get(query.section);
  if (expectedType === "array" ? !Array.isArray(data) : !isObject(data)) {
    return failure("INVALID_STORED_DATA", "Stored dataset or section has an invalid structure.", 500);
  }
  let pagination = null;
  if (Array.isArray(data)) {
    const total = data.length;
    data = data.slice(query.offset, query.offset + query.limit);
    pagination = { offset: query.offset, limit: query.limit, total, hasMore: query.offset < total - data.length };
  }
  return json({
    ok: true, readOnly: true, dataset: query.dataset, section: query.section,
    updatedAt: row.updated_at, data, pagination,
  });
}

export async function onRequest({ request, env }) {
  try {
    const authError = await authenticate(request, env);
    if (authError) return authError;
    if (request.method !== "POST") return failure("METHOD_NOT_ALLOWED", "Only POST is supported.", 405);
    const contentType = request.headers.get("Content-Type")?.split(";", 1)[0].trim().toLowerCase();
    if (contentType !== "application/json") return failure("UNSUPPORTED_MEDIA_TYPE", "Content-Type must be application/json.", 415);
    const parsed = await readBody(request);
    if (parsed.error) return parsed.error;
    const query = validateReadRequest(parsed.body);
    if (query.error) return query.error;
    return await readDataset(env, query);
  } catch {
    // Never expose database errors, stored JSON, request content, or secrets.
    return failure("READ_FAILED", "Unable to read the requested factory data.", 500);
  }
}
