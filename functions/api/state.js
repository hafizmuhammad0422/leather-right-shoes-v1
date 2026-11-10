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
      `SELECT dataset, data_json, updated_at FROM app_state WHERE dataset IN (${readNames.map(() => '?').join(',')})`
    ).bind(...readNames).all();
    const raw = Object.fromEntries(rows.results.map(row => [row.dataset, row.data_json]));
    const timestamps = Object.fromEntries(rows.results.map(row => [row.dataset, row.updated_at]));
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
      // Checked updated_at timestamp guards ensure atomic CAS without binding massive JSON payloads into SQL parameters.
      const statement = env.DB.prepare(
        `WITH guard AS MATERIALIZED (SELECT 1 AS allowed WHERE
          ${readNames.map(() => 'EXISTS (SELECT 1 FROM app_state AS checked WHERE checked.dataset = ? AND checked.updated_at = ?)').join(' AND ')})
          UPDATE app_state SET data_json = CASE dataset ${changed.map(() => 'WHEN ? THEN ?').join(' ')} ELSE data_json END,
          updated_at = ? WHERE dataset IN (${changed.map(() => '?').join(',')}) AND EXISTS (SELECT 1 FROM guard)`
      ).bind(...readNames.flatMap(name => [name, timestamps[name]]),
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

// Backup-only storage limits; runtime datasets and legacy JSON stay unchanged.
const BACKUP_CHUNK_BYTES = 512 * 1024;
const BACKUP_MAX_BYTES = 16 * 1024 * 1024;
async function backupBytes(stream, limit) {
  const reader = stream.getReader(), parts = [];
  let length = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > limit) { await reader.cancel(); throw new Error('Backup exceeds the safe processing limit.'); }
      parts.push(value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const part of parts) { bytes.set(part, offset); offset += part.byteLength; }
  return bytes;
}
async function backupDigest(bytes) {
  return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)), byte => byte.toString(16).padStart(2, '0')).join('');
}
function validBackupVersion(version) {
  return isPlainObject(version) && typeof version.id === 'string' && !!version.id &&
    typeof version.timestamp === 'string' && Number.isFinite(Date.parse(version.timestamp)) && isPlainObject(version.data);
}
async function decodeBackup(env, entry) {
  const stored = JSON.parse(entry.data_json);
  if (!isPlainObject(stored) || entry.dataset !== 'backup-version:' + stored.id) throw new Error('Invalid backup identity.');
  if (!Object.prototype.hasOwnProperty.call(stored, 'formatVersion')) {
    if (!validBackupVersion(stored)) throw new Error('Invalid stored backup version.');
    return stored;
  }
  if (stored.formatVersion !== 2 || stored.codec !== 'gzip-base64' ||
      typeof stored.timestamp !== 'string' || !Number.isFinite(Date.parse(stored.timestamp)) ||
      typeof stored.token !== 'string' || !/^[a-f0-9-]{36}$/.test(stored.token) ||
      !/^[a-f0-9]{64}$/.test(stored.sha256) ||
      !Number.isSafeInteger(stored.rawBytes) || stored.rawBytes < 1 || stored.rawBytes > BACKUP_MAX_BYTES ||
      !Number.isSafeInteger(stored.encodedBytes) || stored.encodedBytes < 4 || stored.encodedBytes > BACKUP_MAX_BYTES ||
      stored.chunkCount !== Math.ceil(stored.encodedBytes / BACKUP_CHUNK_BYTES)) throw new Error('Invalid backup manifest.');
  const keys = Array.from({ length: stored.chunkCount }, (_, index) => 'backup-chunk:' + stored.token + ':' + index);
  const rows = await env.DB.prepare(`SELECT dataset, data_json FROM app_state WHERE dataset IN (${keys.map(() => '?').join(',')})`).bind(...keys).all();
  const chunks = new Map((rows.results || []).map(row => [row.dataset, JSON.parse(row.data_json)]));
  const encoded = keys.map((key, index) => {
    const chunk = chunks.get(key), expected = Math.min(BACKUP_CHUNK_BYTES, stored.encodedBytes - index * BACKUP_CHUNK_BYTES);
    if (typeof chunk !== 'string' || chunk.length !== expected) throw new Error('Missing or invalid backup chunk.');
    return chunk;
  }).join('');
  const binary = atob(encoded);
  if (btoa(binary) !== encoded) throw new Error('Invalid backup encoding.');
  const compressed = Uint8Array.from(binary, character => character.charCodeAt(0));
  const raw = await backupBytes(new Blob([compressed]).stream().pipeThrough(new DecompressionStream('gzip')), stored.rawBytes);
  if (raw.byteLength !== stored.rawBytes || await backupDigest(raw) !== stored.sha256) throw new Error('Backup checksum verification failed.');
  const version = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(raw));
  if (!validBackupVersion(version) || version.id !== stored.id || version.timestamp !== stored.timestamp ||
      !validateState(version.data, RUNTIME_DATASETS.filter(name => name !== 'gasVouchers')).ok ||
      ('gasVouchers' in version.data && !Array.isArray(version.data.gasVouchers))) throw new Error('Invalid decoded backup version.');
  return version;
}

// Explicit backup operations never replace or prune existing versions.
async function readBackups({ env, request }) {
  try {
    const params = new URL(request.url).searchParams;
    const day = params.get("day"), id = params.get('id');
    if (id !== null) {
      const entry = await env.DB.prepare('SELECT dataset, data_json FROM app_state WHERE dataset = ?').bind('backup-version:' + id).first();
      let version;
      if (entry) version = await decodeBackup(env, entry);
      else {
        const row = await env.DB.prepare("SELECT data_json FROM app_state WHERE dataset = 'backups'").first();
        const legacy = row ? JSON.parse(row.data_json) : [];
        if (!Array.isArray(legacy)) throw new Error('Invalid stored backups dataset.');
        version = legacy.find(item => item.id === id);
        if (version && !validBackupVersion(version)) throw new Error('Invalid stored backup version.');
      }
      if (!version) return json({ error: 'Backup version not found.' }, 404);
      return json({ version, verified: true, sha256: await backupDigest(new TextEncoder().encode(JSON.stringify(version))) });
    }
    if (day !== null) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return json({ error: "Invalid backup day." }, 400);
      const row = await env.DB.prepare(
        `SELECT json_type(data_json) AS kind,
          EXISTS (SELECT 1 FROM json_each(CASE WHEN json_type(data_json) = 'array' THEN data_json ELSE '[]' END)
            WHERE substr(json_extract(value, '$.timestamp'), 1, 10) = ?) AS hasDay
         FROM app_state WHERE dataset = 'backups'`
      ).bind(day).first();
      if (row && row.kind !== "array") throw new Error("Invalid stored backups dataset.");
      const separate = await env.DB.prepare(
        `SELECT 1 AS hasDay FROM app_state WHERE dataset GLOB 'backup-version:*'
         AND substr(json_extract(data_json, '$.timestamp'), 1, 10) = ? LIMIT 1`
      ).bind(day).first();
      return json({ hasDay: !!row?.hasDay || !!separate?.hasDay });
    }
    const row = await env.DB.prepare("SELECT data_json FROM app_state WHERE dataset = 'backups'").first();
    const backups = row ? JSON.parse(row.data_json) : [];
    if (!Array.isArray(backups)) throw new Error("Invalid stored backups dataset.");
    const separate = await env.DB.prepare(
      "SELECT dataset, data_json FROM app_state WHERE dataset GLOB 'backup-version:*' ORDER BY updated_at, dataset"
    ).all();
    for (const entry of separate.results || []) {
      backups.push(await decodeBackup(env, entry));
    }
    return json({ backups });
  } catch (error) {
    console.error("Backup read failed:", error);
    return json({ error: "Cloud backups could not be read. Existing backups were not changed." }, 500);
  }
}

async function appendBackup({ env }, body) {
  const version = body?.version;
  const day = body?.automaticDay ?? null;
  if (!isPlainObject(version) || typeof version.id !== "string" || !version.id || version.id.length > 200 ||
      typeof version.timestamp !== "string" || !Number.isFinite(Date.parse(version.timestamp)) ||
      !isPlainObject(version.data) ||
      !validateState(version.data, RUNTIME_DATASETS.filter((name) => name !== "gasVouchers")).ok ||
      ('gasVouchers' in version.data && !Array.isArray(version.data.gasVouchers)) ||
      (day !== null && (typeof day !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(day) || day !== version.timestamp.slice(0, 10)))) {
    return json({ error: "Invalid backup version." }, 400);
  }
  const now = new Date().toISOString();
  const raw = new TextEncoder().encode(JSON.stringify(version));
  const dataset = 'backup-version:' + version.id;
  if (raw.byteLength > BACKUP_MAX_BYTES) {
    return json({ error: 'Backup exceeds the 16 MiB safe processing limit. Existing backups were not changed.' }, 413);
  }
  try {
    const compressed = await backupBytes(new Blob([raw]).stream().pipeThrough(new CompressionStream('gzip')), BACKUP_MAX_BYTES);
    let binary = '';
    for (let offset = 0; offset < compressed.length; offset += 32768) binary += String.fromCharCode(...compressed.subarray(offset, offset + 32768));
    const payload = btoa(binary);
    if (payload.length > BACKUP_MAX_BYTES) return json({ error: 'Encoded backup exceeds the safe processing limit. Existing backups were not changed.' }, 413);
    const manifest = { formatVersion: 2, id: version.id, timestamp: version.timestamp, codec: 'gzip-base64',
      token: crypto.randomUUID(), rawBytes: raw.byteLength, encodedBytes: payload.length,
      sha256: await backupDigest(raw), chunkCount: Math.ceil(payload.length / BACKUP_CHUNK_BYTES) };
    const encoded = JSON.stringify(manifest);
    // The admission INSERT and its chunks share one transaction. The unique
    // token ensures a rejected duplicate cannot attach chunks to another save.
    const admission = env.DB.prepare(
      `INSERT INTO app_state (dataset, data_json, updated_at)
       SELECT ?, ?, ?
       WHERE NOT EXISTS (SELECT 1 FROM app_state WHERE dataset = 'backups' AND json_type(data_json) <> 'array')
         AND NOT EXISTS (SELECT 1 FROM app_state, json_each(app_state.data_json)
           WHERE dataset = 'backups' AND (json_extract(value, '$.id') = ?
             OR (? IS NOT NULL AND substr(json_extract(value, '$.timestamp'), 1, 10) = ?)))
         AND NOT EXISTS (SELECT 1 FROM app_state WHERE dataset GLOB 'backup-version:*'
           AND (dataset = ? OR (? IS NOT NULL AND substr(json_extract(data_json, '$.timestamp'), 1, 10) = ?)))
       ON CONFLICT(dataset) DO NOTHING`
    ).bind(dataset, encoded, now, version.id, day, day, dataset, day, day);
    const chunks = Array.from({ length: manifest.chunkCount }, (_, index) => env.DB.prepare(
      `INSERT INTO app_state (dataset, data_json, updated_at) SELECT ?, ?, ?
       WHERE EXISTS (SELECT 1 FROM app_state WHERE dataset = ? AND data_json = ?)`
    ).bind('backup-chunk:' + manifest.token + ':' + index,
      JSON.stringify(payload.slice(index * BACKUP_CHUNK_BYTES, (index + 1) * BACKUP_CHUNK_BYTES)), now, dataset, encoded));
    const result = await env.DB.batch([admission, ...chunks]);
    if (result[0]?.meta?.changes > 0) {
      const stored = await env.DB.prepare('SELECT dataset, data_json FROM app_state WHERE dataset = ?').bind(dataset).first();
      if (!stored) throw new Error('Saved backup manifest is missing.');
      const verified = await decodeBackup(env, stored);
      if (JSON.stringify(verified) !== JSON.stringify(version)) throw new Error('Backup read-back does not match the saved snapshot.');
      return json({ ok: true, saved: true, verified: true, id: version.id, sha256: manifest.sha256, updatedAt: now });
    }
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
    if (datasets.includes('backups')) {
      const response = await readBackups({ env, request: new Request('https://backup.invalid/api/state?mode=backups') });
      if (!response.ok) return response;
      const { backups } = await response.json();
      if (found.has('backups') || backups.length) {
        state.backups = backups;
        found.add('backups');
      }
    }
    const missing = datasets.filter((dataset) => !found.has(dataset));

    if (found.size === 0) {
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
