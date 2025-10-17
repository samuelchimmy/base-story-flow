-- Phase 2: Create AMA tables

-- Create amas table
CREATE TABLE IF NOT EXISTS public.amas (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  creator_address TEXT NOT NULL,
  heading TEXT NOT NULL,
  description TEXT,
  requires_tip BOOLEAN DEFAULT false,
  tip_amount NUMERIC DEFAULT 0.1,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create ama_messages table
CREATE TABLE IF NOT EXISTS public.ama_messages (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  ama_id BIGINT NOT NULL REFERENCES public.amas(id) ON DELETE CASCADE,
  sender_sub_account TEXT NOT NULL,
  content TEXT NOT NULL,
  love_count INTEGER DEFAULT 0,
  tip_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on amas table
ALTER TABLE public.amas ENABLE ROW LEVEL SECURITY;

-- Enable RLS on ama_messages table
ALTER TABLE public.ama_messages ENABLE ROW LEVEL SECURITY;

-- RLS policies for amas table
-- Allow public read access
CREATE POLICY "Public read access for amas"
  ON public.amas
  FOR SELECT
  USING (true);

-- Allow anyone to insert (no authentication required for demo)
CREATE POLICY "Anyone can create AMAs"
  ON public.amas
  FOR INSERT
  WITH CHECK (true);

-- RLS policies for ama_messages table
-- Allow public read access only if the parent AMA is public
CREATE POLICY "Public read access for public AMA messages"
  ON public.ama_messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.amas
      WHERE amas.id = ama_messages.ama_id
      AND amas.is_public = true
    )
  );

-- Allow anyone to insert messages (no authentication required for demo)
CREATE POLICY "Anyone can send messages"
  ON public.ama_messages
  FOR INSERT
  WITH CHECK (true);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_ama_messages_ama_id ON public.ama_messages(ama_id);
CREATE INDEX IF NOT EXISTS idx_amas_creator_address ON public.amas(creator_address);