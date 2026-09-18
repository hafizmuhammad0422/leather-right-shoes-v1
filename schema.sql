-- Leather Right Shoes — Fresh Version 1 D1 schema
-- This SQL only creates the new application-state table if it does not exist.
-- It does NOT drop, delete, reset, or alter any existing table.

CREATE TABLE IF NOT EXISTS app_state (
  dataset TEXT PRIMARY KEY NOT NULL,
  data_json TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_app_state_updated_at
ON app_state(updated_at);
