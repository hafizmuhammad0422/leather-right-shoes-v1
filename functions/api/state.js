/**
 * Leather Right Shoes — Cloudflare Pages Function
 *
 * Frontend contract (from the Master HTML):
 *   GET  /api/state
 *   PUT  /api/state
 *
 * D1 binding:
 *   env.DB
 *
 * The frontend sends one complete application-state object. This backend
 * stores each known dataset as JSON in its own row. Unknown rows are not
 * deleted by PUT, so future datasets can coexist without being wiped.
 */

const DATASETS = [
  "settings",
  "materials",
  "workers",
  "transactions",
  "stockMovements",
  "articles",
  "shopkeepers",
  "bills",
  "auditLog",
  "gasVouchers",
  "backups",
];

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

const RUNTIME_DATASETS = DATASETS.filter((name) => name !== "backups");
const SETTINGS_ROOTS = [
  "shoesPressManProduction", "shoesLaminationShopsProduction", "supplierProductionBilling",
  "upperArticles", "upperMaterials", "upperDistributions", "nextUpperVoucherNo",
  "upperPendingRecords", "upperManualPendingResets", "upperWeeklyLabourRecords", "productionKharchaAdjustments", "nextBillNo",
  "batamMansProduction", "batamMansProductionArticles", "batamMansProductionMaterials",
  "batamMansProductionVouchers", "batamMansMaterialDistributions", "batamMansExpenses",
  "batamMansPendingRecords", "nextBatamMansVoucherNo", "batamMansVerificationSlips", "nextBatamMansSlipNo",
  "finishedMansProduction", "finishedMansProductionArticles", "finishedMansProductionMaterials",
  "finishedMansProductionVouchers", "finishedMansMaterialDistributions", "finishedMansExpenses",
  "finishedMansPendingRecords", "nextFinishedMansVoucherNo", "finishedMansVerificationSlips", "nextFinishedMansSlipNo"
];
async function baselineHash(value) {
  const encoded = value === undefined ? "missing" : JSON.stringify(value);
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(encoded));
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
}
async function stateBaselines(state) {
  const baselines = {};
  for (const name of RUNTIME_DATASETS) {
    if (!Object.prototype.hasOwnProperty.call(state, name)) continue;
    baselines[name] = await baselineHash(state[name]);
    if (name === "settings") for (const root of SETTINGS_ROOTS) {
      baselines['settings/' + root] = await baselineHash(state.settings[root]);
    }
  }
  return baselines;
}
async function savePartialState({ env, request }, body) {
  const sectionsMode = stateMode(request) === "settings-sections";
  if (!isPlainObject(body) || body.version !== 1 || !isPlainObject(body.expected) ||
      !isPlainObject(body.updates) || (sectionsMode && !isPlainObject(body.set)) ||
      (!sectionsMode && Object.prototype.hasOwnProperty.call(body, 'set')) ||
      Object.keys(body).some(key => !['version', 'expected', 'updates', 'set'].includes(key))) {
    return json({ error: "Invalid partial-state envelope." }, 400);
  }
  const updates = body.updates, roots = sectionsMode ? Object.keys(body.set) : [];
  const names = Object.keys(updates), expected = Object.keys(body.expected);
  if ((!names.length && !roots.length) || names.some(name => !RUNTIME_DATASETS.includes(name) ||
      (sectionsMode && name === 'settings') ||
      (name === 'settings' ? !isPlainObject(updates[name]) : !Array.isArray(updates[name]))) ||
      roots.some(root => !SETTINGS_ROOTS.includes(root) ||
        (['shoesPressManProduction', 'shoesLaminationShopsProduction', 'supplierProductionBilling'].includes(root)
          ? !isPlainObject(body.set[root]) : root.startsWith('next')
          ? !Number.isSafeInteger(body.set[root]) || body.set[root] < 0 : !Array.isArray(body.set[root]))) ||
      expected.some(key => !(RUNTIME_DATASETS.includes(key) ||
        (key.startsWith('settings/') && SETTINGS_ROOTS.includes(key.slice(9)))) ||
        !/^[a-f0-9]{64}$/.test(body.expected[key])) ||
      names.some(name => !Object.prototype.hasOwnProperty.call(body.expected, name)) ||
      roots.some(root => !Object.prototype.hasOwnProperty.call(body.expected, 'settings/' + root))) {
    return json({ error: "Invalid partial datasets, sections, or baselines." }, 400);
  }
  const readNames = [...new Set([...names, ...expected.map(key => key.split('/')[0]), ...(roots.length ? ['settings'] : [])])];
  try {
    const rows = await env.DB.prepare(
      `SELECT dataset, data_json FROM app_state WHERE dataset IN (${readNames.map(() => '?').join(',')})`
    ).bind(...readNames).all();
    const raw = Object.fromEntries(rows.results.map(row => [row.dataset, row.data_json]));
    if (readNames.some(name => !Object.prototype.hasOwnProperty.call(raw, name))) {
      return json({ error: "conflict", message: "Required authoritative dataset is missing." }, 409);
    }
    const current = Object.fromEntries(readNames.map(name => [name, JSON.parse(raw[name])]));
    for (const key of expected) {
      const value = key.startsWith('settings/') ? current.settings[key.slice(9)] : current[key];
      if (await baselineHash(value) !== body.expected[key]) {
        return json({ error: "conflict", dataset: key, message: "Authoritative data changed. Reload before saving." }, 409);
      }
    }
    const writes = { ...updates };
    if (roots.length) {
      if (!isPlainObject(current.settings)) throw new Error('Invalid stored settings.');
      writes.settings = { ...current.settings, ...body.set };
    }
    const changed = Object.keys(writes).filter(name => JSON.stringify(writes[name]) !== raw[name]);
    const now = new Date().toISOString();
    const baselines = await stateBaselines(writes);
    if (changed.length) {
      // One UPDATE, one shared guard: all changed rows commit, or none do.
      // Exact stored JSON guards also catch legacy writers and timestamp collisions.
      const statement = env.DB.prepare(
        `WITH guard AS MATERIALIZED (SELECT 1 AS allowed WHERE
          ${readNames.map(() => 'EXISTS (SELECT 1 FROM app_state AS checked WHERE checked.dataset = ? AND checked.data_json = ?)').join(' AND ')})
          UPDATE app_state SET data_json = CASE dataset ${changed.map(() => 'WHEN ? THEN ?').join(' ')} ELSE data_json END,
          updated_at = ? WHERE dataset IN (${changed.map(() => '?').join(',')}) AND EXISTS (SELECT 1 FROM guard)`
      ).bind(...readNames.flatMap(name => [name, raw[name]]),
        ...changed.flatMap(name => [name, JSON.stringify(writes[name])]), now, ...changed);
      const result = await env.DB.batch([statement]);
      if (result[0]?.meta?.changes !== changed.length) {
        return json({ error: "conflict", message: "Authoritative data changed during save. No rows were written." }, 409);
      }
    }
    return json({ ok: true, saved: Object.keys(writes), updatedAt: now,
      baselines });
  } catch (error) {
    console.error("Partial state save failed:", error);
    return json({ error: "Partial cloud save failed. No partial application-state commit was accepted." }, 500);
  }
}

function stateMode(request) {
  return new URL(request.url).searchParams.get("mode");
}

function validateState(state, datasets = DATASETS) {
  if (!isPlainObject(state)) {
    return { ok: false, error: "Request body must be a JSON object." };
  }

  if (!isPlainObject(state.settings)) {
    return { ok: false, error: "Invalid or missing settings dataset." };
  }

  const arrayDatasets = datasets.filter((name) => name !== "settings");
  for (const name of arrayDatasets) {
    if (!Array.isArray(state[name])) {
      return { ok: false, error: `Invalid or missing ${name} dataset.` };
    }
  }

  return { ok: true };
}

// Explicit backup operations never replace or prune existing versions.
async function readBackups({ env, request }) {
  try {
    const day = new URL(request.url).searchParams.get("day");
    if (day !== null) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return json({ error: "Invalid backup day." }, 400);
      const row = await env.DB.prepare(
        `SELECT json_type(data_json) AS kind,
          EXISTS (SELECT 1 FROM json_each(CASE WHEN json_type(data_json) = 'array' THEN data_json ELSE '[]' END)
            WHERE substr(json_extract(value, '$.timestamp'), 1, 10) = ?) AS hasDay
         FROM app_state WHERE dataset = 'backups'`
      ).bind(day).first();
      if (row && row.kind !== "array") throw new Error("Invalid stored backups dataset.");
      return json({ hasDay: !!row?.hasDay });
    }
    const row = await env.DB.prepare("SELECT data_json FROM app_state WHERE dataset = 'backups'").first();
    const backups = row ? JSON.parse(row.data_json) : [];
    if (!Array.isArray(backups)) throw new Error("Invalid stored backups dataset.");
    return json({ backups });
  } catch (error) {
    console.error("Backup read failed:", error);
    return json({ error: "Cloud backups could not be read. Existing backups were not changed." }, 500);
  }
}

async function appendBackup({ env }, body) {
  const version = body?.version;
  const day = body?.automaticDay ?? null;
  if (!isPlainObject(version) || typeof version.id !== "string" || !version.id ||
      typeof version.timestamp !== "string" || !Number.isFinite(Date.parse(version.timestamp)) ||
      !isPlainObject(version.data) ||
      !validateState(version.data, RUNTIME_DATASETS.filter((name) => name !== "gasVouchers")).ok ||
      (day !== null && (typeof day !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(day) || day !== version.timestamp.slice(0, 10)))) {
    return json({ error: "Invalid backup version." }, 400);
  }
  const now = new Date().toISOString();
  const encoded = JSON.stringify(version);
  try {
    // Append before the closing bracket, preserving old entries byte for byte.
    // Duplicate/daily checks and the append are one atomic D1 statement.
    const result = await env.DB.prepare(
      `INSERT INTO app_state (dataset, data_json, updated_at) VALUES ('backups', ?, ?)
       ON CONFLICT(dataset) DO UPDATE SET
         data_json = substr(app_state.data_json, 1, length(rtrim(app_state.data_json, char(9)||char(10)||char(13)||' ')) - 1)
           || CASE WHEN json_array_length(app_state.data_json) > 0 THEN ',' ELSE '' END
           || ? || substr(app_state.data_json, length(rtrim(app_state.data_json, char(9)||char(10)||char(13)||' '))),
         updated_at = excluded.updated_at
       WHERE json_type(app_state.data_json) = 'array'
         AND NOT EXISTS (SELECT 1 FROM json_each(app_state.data_json) WHERE json_extract(value, '$.id') = ?)
         AND (? IS NULL OR NOT EXISTS (SELECT 1 FROM json_each(app_state.data_json)
           WHERE substr(json_extract(value, '$.timestamp'), 1, 10) = ?))`
    ).bind('[' + encoded + ']', now, encoded, version.id, day, day).run();
    if (result.meta?.changes > 0) return json({ ok: true, saved: true, updatedAt: now });
    if (day !== null) {
      const response = await readBackups({ env, request: new Request('https://backup.invalid/api/state?mode=backups&day=' + day) });
      if (response.ok && (await response.json()).hasDay) return json({ ok: true, saved: false });
    }
    return json({ error: "Backup was not appended. Existing backups were not changed." }, 409);
  } catch (error) {
    console.error("Backup append failed:", error);
    return json({ error: "Cloud backup save failed. Existing backups were not changed." }, 500);
  }
}

export async function onRequestGet({ env, request }) {
  if (!env?.DB) {
    return json({ error: "D1 binding DB is not configured." }, 500);
  }

  if (stateMode(request) === "backups") return readBackups({ env, request });
  const datasets = stateMode(request) === "runtime" ? RUNTIME_DATASETS : DATASETS;

  try {
    const rows = await env.DB
      .prepare(
        `SELECT dataset, data_json
         FROM app_state
         WHERE dataset IN (${datasets.map(() => "?").join(",")})`
      )
      .bind(...datasets)
      .all();

    const state = {};
    for (const row of rows.results || []) {
      try {
        state[row.dataset] = JSON.parse(row.data_json);
      } catch {
        return json(
          {
            error: "incomplete",
            message: `Stored dataset "${row.dataset}" contains invalid JSON. Local data was not changed.`,
            dataset: row.dataset,
          },
          500
        );
      }
    }

    // An empty database is explicitly reported so the Master HTML can use
    // its existing first-sync behavior.
    const found = new Set((rows.results || []).map((row) => row.dataset));
    const missing = datasets.filter((dataset) => !found.has(dataset));

    if (rows.results.length === 0) {
      return json({ empty: true });
    }

    if (missing.length > 0) {
      return json(
        {
          error: "incomplete",
          message: "Cloud application state is incomplete. Local data was not changed.",
          missing,
        },
        409
      );
    }

    return json(new URL(request.url).searchParams.get("baselines") === "1"
      ? { state, baselines: await stateBaselines(state) } : { state });
  } catch (error) {
    console.error("GET /api/state failed:", error);
    return json(
      { error: "Cloud database read failed. Local data was not changed." },
      500
    );
  }
}

export async function onRequestPut({ env, request }) {
  if (!env?.DB) {
    return json({ error: "D1 binding DB is not configured." }, 500);
  }

  let state;
  try {
    state = await request.json();
  } catch {
    return json({ error: "Request body is not valid JSON." }, 400);
  }

  if (["patch", "settings-sections"].includes(stateMode(request))) return savePartialState({ env, request }, state);
  if (stateMode(request) === "backups") return appendBackup({ env }, state);
  const datasets = stateMode(request) === "runtime" ? RUNTIME_DATASETS : DATASETS;
  const validation = validateState(state, datasets);
  if (!validation.ok) {
    return json({ error: validation.error }, 400);
  }

  // Optional CAS protection for current clients' runtime fallbacks. Legacy
  // requests without this header retain their existing complete-state contract.
  if (stateMode(request) === 'runtime' && request.headers.has('X-State-Baselines')) {
    let expected;
    try { expected = JSON.parse(request.headers.get('X-State-Baselines')); }
    catch { return json({ error: 'Invalid runtime save baselines.' }, 400); }
    return savePartialState({ env, request }, { version: 1, updates: state, expected });
  }

  const now = new Date().toISOString();

  try {
    // Compare inside the transaction so concurrent writes cannot invalidate a
    // separate read/filter step. Identical JSON rows are not rewritten.
    // One transaction: either all changed datasets are written, or none
    // of them are committed.
    const statements = datasets.map((dataset) =>
      env.DB
        .prepare(
          `INSERT INTO app_state (dataset, data_json, updated_at)
           VALUES (?, ?, ?)
           ON CONFLICT(dataset) DO UPDATE SET
             data_json = excluded.data_json,
             updated_at = excluded.updated_at
           WHERE app_state.data_json IS NOT excluded.data_json`
        )
        .bind(dataset, JSON.stringify(state[dataset]), now)
    );

    await env.DB.batch(statements);

    return json({
      ok: true,
      saved: datasets,
      updatedAt: now,
      ...(new URL(request.url).searchParams.get("baselines") === "1" ? { baselines: await stateBaselines(state) } : {}),
    });
  } catch (error) {
    console.error("PUT /api/state failed:", error);
    return json(
      { error: "Cloud database save failed. No partial application-state commit was accepted." },
      500
    );
  }
}

export async function onRequest(context) {
  const method = context.request.method.toUpperCase();

  if (method === "GET") return onRequestGet(context);
  if (method === "PUT") return onRequestPut(context);

  return new Response("Method Not Allowed", {
    status: 405,
    headers: {
      Allow: "GET, PUT",
    },
  });
}
