-- Add contract namespacing to story views
BEGIN;

-- 1) Add contract_address column if missing
ALTER TABLE public.story_views
ADD COLUMN IF NOT EXISTS contract_address text;

-- 2) Create an index to speed up lookups by contract + story
CREATE INDEX IF NOT EXISTS idx_story_views_contract_story
ON public.story_views (contract_address, story_id);

COMMIT;