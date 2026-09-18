# Leather Right Shoes — Cloudflare Backend V1

This folder contains the backend/configuration designed specifically for the
current Master HTML contract.

## Files

- `functions/api/state.js`
  Cloudflare Pages Function implementing:
  - GET /api/state
  - PUT /api/state

- `schema.sql`
  Fresh Version 1 D1 schema. Creates only `app_state`.

- `wrangler.jsonc`
  Cloudflare Pages/D1 configuration.
  D1 binding is `DB`.
  Database name is `abidshoes`.

## D1 design

Table: `app_state`

| Column | Type | Key | Purpose |
|---|---|---|---|
| dataset | TEXT | PRIMARY KEY | Dataset name |
| data_json | TEXT | NOT NULL | JSON payload for that dataset |
| updated_at | TEXT | NOT NULL | Last successful PUT timestamp |

The backend stores these datasets:
settings, materials, workers, transactions, stockMovements,
articles, shopkeepers, bills, auditLog, gasVouchers, backups.

## Important safety behavior

- PUT uses a D1 batch so all 11 datasets are committed together.
- PUT validates the expected frontend structure before writing.
- Unknown rows in `app_state` are not deleted.
- GET returns `{empty:true}` when the table has no rows, matching the
  existing Master HTML's first-sync behavior. A partial 11-dataset state is
  rejected with HTTP 409 and `error: "incomplete"` so local and cloud state
  are not silently mixed.
- Database failures return HTTP 500 instead of silently replacing local data.
- No existing `app_records` table is dropped, altered, or deleted.
- No migration is executed by these files.

## Pages configuration

The project uses Cloudflare Pages Functions with the `functions/` directory. The Wrangler configuration therefore keeps the D1 binding but does not declare a separate `pages_build_output_dir`.

## Deployment is intentionally NOT performed

Before any deployment, review the files and create/apply the schema only when
you explicitly decide to do so.

For a Cloudflare Pages project, the intended structure is:

/
  index.html                  <-- your existing Master HTML
  wrangler.jsonc
  functions/
    api/
      state.js
  schema.sql

Do not replace your Master HTML with a shortened version. Keep the exact
current Master HTML as the frontend source of truth.

## Important security note

The current frontend contract has no authentication token or login credential
for `/api/state`. Therefore this backend deliberately does not invent an
authentication/business-logic layer that would change the existing frontend
contract. If the endpoint will be exposed publicly, Cloudflare Access or
another external protection layer should be considered before production use.
