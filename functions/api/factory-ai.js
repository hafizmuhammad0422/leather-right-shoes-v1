// Isolated read-only n8n bridge. No frontend or state-save functions are called.
import { MODULE_REGISTRY, validateKnowledgeRequest, requiredDatasets, executeKnowledge, project } from '../../lib/factory-knowledge.js';
const DATASETS=new Set(Object.values(MODULE_REGISTRY).flatMap(m=>Object.values(m.sources).map(s=>s.dataset)).filter(d=>d!=='settings'));
// Only registered settings roots; the entire settings object is never permitted.
const SECTIONS=new Map(Object.values(MODULE_REGISTRY).flatMap(m=>Object.values(m.sources).filter(s=>s.dataset==='settings'&&s.path).map(s=>[s.path.split('.')[0],s.rootType||'array'])));

// Direct reviewed fallback for Whole Factory Materials.
// This keeps the endpoint read-only and exposes only approved non-sensitive fields
// even if an older registry build does not advertise this settings root.
const WHOLE_FACTORY_MATERIALS_SECTION = "wholeFactoryMaterials";
const WHOLE_FACTORY_MATERIALS_SCHEMA = {
  factoryName: true,
  address: true,
  shoeSoleSuppliers: [{
    id: true, name: true, code: true, category: true, phone: true, whatsapp: true,
    mobile: true, address: true, location: true, status: true, archived: true,
    deletedAt: true, deleted: true, tags: true,
    products: [{
      id: true, name: true, code: true, articleNo: true, category: true,
      unit: true, customUnit: true, rate: true, ratePerUnit: true, itemPrice: true,
      stock: true, stockItems: true, stockBoxes: true, boxes: true, items: true, atoms: true
    }],
    purchases: [{
      id: true, productId: true, productName: true, date: true, createdAt: true,
      updatedAt: true, editedAt: true, deletedAt: true, deleted: true, status: true,
      voucherNo: true, qty: true, unit: true, boxes: true, items: true, atoms: true,
      rate: true, ratePerUnit: true, itemPrice: true, amount: true, time: true
    }],
    receiveVouchers: [{
      id: true, voucherNo: true, date: true, createdAt: true, updatedAt: true,
      editedAt: true, deletedAt: true, deleted: true, status: true,
      purchaseIds: true, workerTotalBoxesSnapshot: true, rateSnapshot: true,
      amountSnapshot: true
    }],
    account: {
      openingAmount: true, currentPaid: true, cycleStart: true, advanceBalance: true,
      payments: [{
        id: true, date: true, createdAt: true, updatedAt: true, deletedAt: true,
        deleted: true, status: true, amount: true
      }]
    },
    extraBalances: [{
      id: true, date: true, createdAt: true, updatedAt: true, deletedAt: true,
      deleted: true, status: true, amount: true
    }]
  }],
  supplierProductionBilling: {
    accounts: {
      "*": {
        supplierId: true, supplierName: true, openingAmount: true, updatedAt: true
      }
    },
    bills: [{
      id: true, supplierId: true, supplierName: true, voucherNo: true,
      date: true, createdAt: true, updatedAt: true, pendingAmount: true,
      totalAmount: true,
      lines: [{
        articleId: true, articleName: true, materialId: true, materialName: true,
        qty: true, unit: true, rate: true, amount: true
      }]
    }],
    nextVoucherNo: true
  },
  nextShoeSoleReceiveVoucherNo: true
};

if (!SECTIONS.has(WHOLE_FACTORY_MATERIALS_SECTION)) {
  SECTIONS.set(WHOLE_FACTORY_MATERIALS_SECTION, "object");
}
const REQUEST_FIELDS = new Set(["action", "dataset", "section", "offset", "limit"]);
const MAX_BODY_BYTES = 8192;
const READ_SQL = "SELECT dataset, data_json, updated_at FROM app_state WHERE dataset = ?1";
const KNOWLEDGE_SQL = "SELECT dataset, data_json, updated_at FROM app_state WHERE dataset IN (SELECT value FROM json_each(?1))";

// Legacy read remains supported, but only registry-approved fields are exposed.
function approvedReadSchema(dataset, section) {
  let schema = {};
  function merge(a, b) {
    for (const [key, value] of Object.entries(b)) {
      if(value===true||value==='number')a[key]=value;
      else if (Array.isArray(value)) { if (!Array.isArray(a[key])) a[key] = [{}]; merge(a[key][0], value[0]); }
      else { if (!isObject(a[key])) a[key] = {}; merge(a[key], value); }
    }
  }
  for (const module of Object.values(MODULE_REGISTRY)) for (const source of Object.values(module.sources)) {
    if (source.dataset !== dataset) continue;
    let nested = source.schema;
    for (const part of source.path.split('.').filter(Boolean).reverse()) nested = part === '*' ? [nested] : { [part]: nested };
    if (Array.isArray(nested)) continue;
    merge(schema, nested);
  }
  if (section !== null) {
    if (dataset === "settings" && section === WHOLE_FACTORY_MATERIALS_SECTION) {
      const combined = {};
      merge(combined, WHOLE_FACTORY_MATERIALS_SCHEMA);
      if (isObject(schema[section])) merge(combined, schema[section]);
      return combined;
    }
    return schema[section];
  }
  return [schema];
}

async function readKnowledge(env, query) {
  const datasets = requiredDatasets(query), state = {}, sources = [];
  if (datasets.length) {
    if (!env?.DB) return failure('SERVICE_NOT_CONFIGURED', 'Database binding is not configured.', 503);
    const result = await env.DB.prepare(KNOWLEDGE_SQL).bind(JSON.stringify(datasets)).all();
    for (const row of result.results || []) {
      if (!datasets.includes(row.dataset)) continue;
      let data;
      try { data = JSON.parse(row.data_json); }
      catch { return failure('INVALID_STORED_DATA', 'Stored dataset contains invalid JSON.', 500); }
      if (row.dataset === 'settings' ? !isObject(data) : !Array.isArray(data)) return failure('INVALID_STORED_DATA', 'Stored dataset has an invalid structure.', 500);
      state[row.dataset] = data;
      sources.push({ dataset: row.dataset, updated_at: row.updated_at });
    }
  }
  const result = executeKnowledge(query, state);
  return json({ ok: true, readOnly: true, action: query.action, sources, ...result });
}

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
  const schema = approvedReadSchema(query.dataset, query.section);
  if (!schema) return failure('NOT_ALLOWED', 'Requested fields are not registered.', 400);
  data = project(data, schema);
  if (data === undefined) return failure('INVALID_STORED_DATA', 'Stored dataset or section has an invalid structure.', 500);
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
    if (parsed.body?.action !== 'read') {
      const checked = validateKnowledgeRequest(parsed.body);
      if (checked.error) return failure(checked.error, 'Invalid or unapproved knowledge request.', 400);
      return await readKnowledge(env, checked.query);
    }
    const query = validateReadRequest(parsed.body);
    if (query.error) return query.error;
    return await readDataset(env, query);
  } catch {
    // Never expose database errors, stored JSON, request content, or secrets.
    return failure("READ_FAILED", "Unable to read the requested factory data.", 500);
  }
}
