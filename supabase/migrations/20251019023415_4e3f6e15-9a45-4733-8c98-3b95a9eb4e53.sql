-- Drop old increment_view_count functions that don't use story_created_at
DROP FUNCTION IF EXISTS increment_view_count(bigint, text);
DROP FUNCTION IF EXISTS increment_view_count(bigint);

-- Drop the old primary key if it exists
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'story_views_pkey' 
    AND conrelid = 'story_views'::regclass
  ) THEN
    ALTER TABLE story_views DROP CONSTRAINT story_views_pkey;
  END IF;
END $$;

-- Create new composite primary key including created_at
ALTER TABLE story_views 
ADD PRIMARY KEY (contract_address, story_id, story_created_at);