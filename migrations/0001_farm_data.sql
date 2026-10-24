CREATE TABLE farm_data (
  user_id TEXT PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '{"plots":[],"tx":[]}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);