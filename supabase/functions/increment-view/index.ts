import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { storyId, contractAddress } = await req.json();

    if (!storyId || !contractAddress) {
      return new Response(
        JSON.stringify({ error: 'storyId and contractAddress are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Incrementing view count for story ${storyId}`);

    // Increment view count for this contract + story
    const { data: newCount, error } = await supabase.rpc('increment_view_count', {
      story_id_to_inc: storyId,
      contract_addr: contractAddress
    });

    if (error) {
      console.error('Error incrementing view count:', error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get updated view count scoped by contract
    const { data, error: fetchError } = await supabase
      .from('story_views')
      .select('view_count')
      .eq('story_id', storyId)
      .eq('contract_address', contractAddress)
      .maybeSingle();

    if (fetchError) {
      console.error('Error fetching updated view count:', fetchError);
      return new Response(
        JSON.stringify({ error: fetchError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`View count for story ${storyId} is now ${data?.view_count ?? newCount ?? 'unknown'}`);

    return new Response(
      JSON.stringify({ success: true, viewCount: data?.view_count ?? newCount ?? 0 }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});