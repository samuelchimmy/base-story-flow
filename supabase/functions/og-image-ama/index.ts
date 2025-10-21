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
    const amaId = pathParts[pathParts.length - 1];

    console.log(`Generating OG image for AMA ${amaId}`);

    const svg = `
      <svg width="1200" height="800" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#0052FF;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#0033CC;stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="1200" height="800" fill="url(#bg)"/>
        <text x="600" y="300" font-family="Arial, sans-serif" font-size="72" font-weight="bold" fill="white" text-anchor="middle">BaseStory AMA</text>
        <text x="600" y="400" font-family="Arial, sans-serif" font-size="32" fill="white" text-anchor="middle" opacity="0.9">AMA #${amaId}</text>
        <text x="600" y="500" font-family="Arial, sans-serif" font-size="24" fill="white" text-anchor="middle" opacity="0.8">Ask Me Anything</text>
      </svg>
    `;

    return new Response(svg, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, immutable, no-transform, max-age=300',
      },
    });
  } catch (error) {
    console.error('Error generating OG image:', error);
    
    const errorSvg = `
      <svg width="1200" height="800" xmlns="http://www.w3.org/2000/svg">
        <rect width="1200" height="800" fill="#FF0000"/>
        <text x="600" y="400" font-family="Arial" font-size="48" fill="white" text-anchor="middle">Error Loading Image</text>
      </svg>
    `;

    return new Response(errorSvg, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=0',
      },
    });
  }
});
