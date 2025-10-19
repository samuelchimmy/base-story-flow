import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { contractAddress, stories } = await req.json();

    if (!contractAddress || !stories) {
      return new Response(
        JSON.stringify({ error: 'contractAddress and stories array are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch view counts for all story instances
    const { data, error } = await supabase
      .from('story_views')
      .select('story_id, story_created_at, view_count')
      .eq('contract_address', contractAddress);

    if (error) {
      console.error('Error fetching views:', error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Map view counts by matching both story_id and created_at timestamp
    const counts: Record<string, number> = {};
    
    for (const story of stories) {
      const matchingView = data?.find(
        (v: any) => String(v.story_id) === String(story.id) && 
                    String(v.story_created_at) === String(story.createdAt)
      );
      counts[String(story.id)] = matchingView?.view_count || 0;
    }

    return new Response(
      JSON.stringify({ success: true, counts }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (e) {
    console.error('Unexpected error:', e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});