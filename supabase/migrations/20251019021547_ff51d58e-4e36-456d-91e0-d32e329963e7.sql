-- Set default contract_address for existing null rows and update PK
BEGIN;

-- Update existing NULL contract_address rows to use the current contract
UPDATE public.story_views 
SET contract_address = '0x8766cB332ABcAb9B7B77C8415313631072838a9C'
WHERE contract_address IS NULL;

-- Now drop the old PK and create a new composite one
ALTER TABLE public.story_views DROP CONSTRAINT IF EXISTS story_views_pkey;
ALTER TABLE public.story_views 
ADD CONSTRAINT story_views_pkey PRIMARY KEY (story_id, contract_address);

-- Make contract_address NOT NULL to prevent future issues
ALTER TABLE public.story_views 
ALTER COLUMN contract_address SET NOT NULL;

COMMIT;