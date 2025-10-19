-- Add story_created_at column to story_views table
ALTER TABLE story_views 
ADD COLUMN story_created_at bigint NOT NULL DEFAULT 0;

-- Drop the old primary key
ALTER TABLE story_views 
DROP CONSTRAINT story_views_pkey;

-- Create new composite primary key including created_at
ALTER TABLE story_views 
ADD PRIMARY KEY (contract_address, story_id, story_created_at);

-- Update the increment_view_count function to handle story_created_at
CREATE OR REPLACE FUNCTION increment_view_count(
  story_id_to_inc bigint,
  contract_addr text,
  story_created_at_ts bigint
)
RETURNS bigint AS $$
DECLARE
  current_count bigint;
BEGIN
  -- Insert or update the view count for this specific story instance
  INSERT INTO story_views (story_id, contract_address, story_created_at, view_count)
  VALUES (story_id_to_inc, contract_addr, story_created_at_ts, 1)
  ON CONFLICT (contract_address, story_id, story_created_at)
  DO UPDATE SET view_count = story_views.view_count + 1;
  
  -- Return the updated count
  SELECT view_count INTO current_count
  FROM story_views
  WHERE story_id = story_id_to_inc 
    AND contract_address = contract_addr
    AND story_created_at = story_created_at_ts;
  
  RETURN current_count;
END;
$$ LANGUAGE plpgsql;