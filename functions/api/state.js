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

    return json({ state });
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

  if (stateMode(request) === "backups") return appendBackup({ env }, state);
  const datasets = stateMode(request) === "runtime" ? RUNTIME_DATASETS : DATASETS;
  const validation = validateState(state, datasets);
  if (!validation.ok) {
    return json({ error: validation.error }, 400);
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
