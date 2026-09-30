-- Additive upgrade for an existing database. Apply once before deploying the dashboard.
-- This repository normally manages schema changes with pnpm db:push.
ALTER TABLE hackathon_event ADD COLUMN IF NOT EXISTS location text;
ALTER TABLE hackathon_event ADD COLUMN IF NOT EXISTS navigation_url text;
ALTER TABLE hackathon_hackathon_settings ADD COLUMN IF NOT EXISTS submission_deadline timestamptz;
ALTER TABLE hackathon_hackathon_settings ADD COLUMN IF NOT EXISTS judging_phase text NOT NULL DEFAULT 'not_started';
ALTER TABLE hackathon_hackathon_settings ADD COLUMN IF NOT EXISTS time_zone text NOT NULL DEFAULT 'America/Edmonton';
