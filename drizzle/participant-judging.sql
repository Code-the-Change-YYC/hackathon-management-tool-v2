-- Existing criteria remain shared across every round.
ALTER TABLE hackathon_criteria ADD COLUMN IF NOT EXISTS round_ids uuid[] NOT NULL DEFAULT '{}'::uuid[];
