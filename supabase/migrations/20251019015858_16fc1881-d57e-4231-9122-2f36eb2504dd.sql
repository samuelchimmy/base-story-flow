-- Enable RLS on story_views table
ALTER TABLE public.story_views ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read view counts
CREATE POLICY "Anyone can read view counts"
ON public.story_views
FOR SELECT
USING (true);

-- Allow the service role to insert/update view counts (via edge function)
CREATE POLICY "Service role can manage view counts"
ON public.story_views
FOR ALL
USING (true);