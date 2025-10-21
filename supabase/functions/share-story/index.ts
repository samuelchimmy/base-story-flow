import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const storyId = pathParts[pathParts.length - 1];
    
    const contractAddress = url.searchParams.get('contract') || '0x8766cB332ABcAb9B7B77C8415313631072838a9C';
    const createdAt = url.searchParams.get('createdAt') || '';

    console.log(`Generating share page for story ${storyId}`);

    const appUrl = 'https://basestory.app';
    const imageUrl = `https://ewqoryvormjvzumqaarf.supabase.co/functions/v1/og-image-story/${storyId}?contract=${contractAddress}&createdAt=${createdAt}`;
    const redirectUrl = `${appUrl}/?story=${storyId}&contract=${contractAddress}&createdAt=${createdAt}`;

    const miniappMetadata = {
      version: "1",
      imageUrl: imageUrl,
      button: {
        title: "View Story",
        action: {
          type: "launch_miniapp",
          name: "BaseStory",
          url: redirectUrl,
          splashImageUrl: `${appUrl}/splash.png`,
          splashBackgroundColor: "#0052FF"
        }
      }
    };

    const frameMetadata = {
      version: "1",
      imageUrl: imageUrl,
      button: {
        title: "View Story",
        action: {
          type: "launch_frame",
          name: "BaseStory",
          url: redirectUrl,
          splashImageUrl: `${appUrl}/splash.png`,
          splashBackgroundColor: "#0052FF"
        }
      }
    };

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>BaseStory - Story #${storyId}</title>
  <meta name="description" content="View this anonymous story on BaseStory">
  
  <!-- Open Graph -->
  <meta property="og:title" content="BaseStory - Story #${storyId}">
  <meta property="og:description" content="Anonymous story on Base blockchain">
  <meta property="og:image" content="${imageUrl}">
  <meta property="og:type" content="website">
  
  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="BaseStory - Story #${storyId}">
  <meta name="twitter:description" content="Anonymous story on Base blockchain">
  <meta name="twitter:image" content="${imageUrl}">
  
  <!-- Farcaster Miniapp -->
  <meta property="fc:miniapp" content='${JSON.stringify(miniappMetadata)}'>
  <meta property="fc:frame" content='${JSON.stringify(frameMetadata)}'>
  
  <meta http-equiv="refresh" content="0; url=${redirectUrl}">
  <script>window.location.href = '${redirectUrl}';</script>
</head>
<body>
  <p>Redirecting to story...</p>
  <p>If not redirected, <a href="${redirectUrl}">click here</a>.</p>
</body>
</html>`;

    return new Response(html, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=300',
      },
    });
  } catch (error) {
    console.error('Error generating share page:', error);
    return new Response('Error generating share page', {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
    });
  }
});
