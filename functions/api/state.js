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

function validateState(state) {
  if (!isPlainObject(state)) {
    return { ok: false, error: "Request body must be a JSON object." };
  }

  if (!isPlainObject(state.settings)) {
    return { ok: false, error: "Invalid or missing settings dataset." };
  }

  const arrayDatasets = DATASETS.filter((name) => name !== "settings");
  for (const name of arrayDatasets) {
    if (!Array.isArray(state[name])) {
      return { ok: false, error: `Invalid or missing ${name} dataset.` };
    }
  }

  return { ok: true };
}

export async function onRequestGet({ env, request }) {
  if (!env?.DB) {
    return json({ error: "D1 binding DB is not configured." }, 500);
  }

  try {
    const rows = await env.DB
      .prepare(
        `SELECT dataset, data_json
         FROM app_state
         WHERE dataset IN (${DATASETS.map(() => "?").join(",")})`
      )
      .bind(...DATASETS)
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
    const missing = DATASETS.filter((dataset) => !found.has(dataset));

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

  const validation = validateState(state);
  if (!validation.ok) {
    return json({ error: validation.error }, 400);
  }

  const now = new Date().toISOString();

  try {
    // One transaction: either all supplied datasets are written, or none
    // of them are committed.
    const statements = DATASETS.map((dataset) =>
      env.DB
        .prepare(
          `INSERT INTO app_state (dataset, data_json, updated_at)
           VALUES (?, ?, ?)
           ON CONFLICT(dataset) DO UPDATE SET
             data_json = excluded.data_json,
             updated_at = excluded.updated_at`
        )
        .bind(dataset, JSON.stringify(state[dataset]), now)
    );

    await env.DB.batch(statements);

    return json({
      ok: true,
      saved: DATASETS,
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
