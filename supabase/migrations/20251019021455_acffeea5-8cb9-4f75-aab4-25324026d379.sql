-- Update increment_view_count function to handle contract_address
CREATE OR REPLACE FUNCTION public.increment_view_count(
  story_id_to_inc bigint,
  contract_addr text DEFAULT NULL
)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_count bigint;
BEGIN
  -- Upsert with contract_address
  INSERT INTO public.story_views (story_id, contract_address, view_count)
  VALUES (story_id_to_inc, contract_addr, 1)
  ON CONFLICT (story_id, contract_address)
  DO UPDATE SET view_count = story_views.view_count + 1
  RETURNING view_count INTO new_count;
  
  RETURN new_count;
END;
$$;