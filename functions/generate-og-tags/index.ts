import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "npm:@blinkdotnew/sdk@^2.1.1";

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS });
  }

  try {
    const url = new URL(req.url);
    const dreamId = url.searchParams.get('dreamId');

    if (!dreamId) {
      return new Response(
        JSON.stringify({ error: 'Missing dreamId parameter' }),
        {
          status: 400,
          headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        }
      );
    }

    // Initialize Blink SDK
    const blink = createClient({
      projectId: Deno.env.get('BLINK_PROJECT_ID') || 'dream-interpreter-ai-app-8lvkkwdq',
      auth: { mode: 'managed' }
    });

    // Fetch dream data from database
    const dreams = await blink.db.dreams.list({
      where: { id: dreamId },
      limit: 1
    });

    if (dreams.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Dream not found' }),
        {
          status: 404,
          headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        }
      );
    }

    const dream = dreams[0] as any;

    // Truncate text for OG descriptions
    const truncateText = (text: string, maxLength: number): string => {
      if (!text || text.length <= maxLength) return text || '';
      return `${text.substring(0, maxLength - 3)}...`;
    };

    // Generate OG metadata
    const ogData = {
      title: `Dream: ${dream.title || 'Untitled Dream'} | Dreamcatcher`,
      description: truncateText(
        dream.description || 'Explore this dream interpretation',
        200
      ),
      url: `${url.origin}/dream/${dreamId}`,
      image: dream.imageUrl || `${url.origin}/og-default-image.png`,
      type: 'article',
      siteName: 'Dream Catcher AI',
      interpretation: truncateText(
        dream.interpretation || 'AI-powered dream analysis',
        150
      ),
    };

    // Generate HTML with OG meta tags
    const htmlResponse = generateOGHtml(ogData);

    return new Response(htmlResponse, {
      status: 200,
      headers: {
        ...CORS_HEADERS,
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=86400',
      },
    });
  } catch (error) {
    console.error('OG generation error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to generate OG tags',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      }
    );
  }
});

function generateOGHtml(ogData: {
  title: string;
  description: string;
  url: string;
  image: string;
  type: string;
  siteName: string;
  interpretation: string;
}): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  
  <!-- Primary Meta Tags -->
  <title>${escapeHtml(ogData.title)}</title>
  <meta name="title" content="${escapeHtml(ogData.title)}">
  <meta name="description" content="${escapeHtml(ogData.description)}">
  
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="${escapeHtml(ogData.type)}">
  <meta property="og:url" content="${escapeHtml(ogData.url)}">
  <meta property="og:title" content="${escapeHtml(ogData.title)}">
  <meta property="og:description" content="${escapeHtml(ogData.description)}">
  <meta property="og:image" content="${escapeHtml(ogData.image)}">
  <meta property="og:site_name" content="${escapeHtml(ogData.siteName)}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  
  <!-- Twitter Card -->
  <meta property="twitter:card" content="summary_large_image">
  <meta property="twitter:url" content="${escapeHtml(ogData.url)}">
  <meta property="twitter:title" content="${escapeHtml(ogData.title)}">
  <meta property="twitter:description" content="${escapeHtml(ogData.description)}">
  <meta property="twitter:image" content="${escapeHtml(ogData.image)}">
  
  <!-- Additional Meta -->
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="${escapeHtml(ogData.url)}">
  
  <!-- Redirect to React app after crawler reads OG tags -->
  <meta http-equiv="refresh" content="0;url=${escapeHtml(ogData.url)}">
  <script>
    // Immediate redirect for browsers (crawlers ignore JS)
    window.location.href = "${escapeHtml(ogData.url)}";
  </script>
</head>
<body>
  <h1>${escapeHtml(ogData.title)}</h1>
  <p>${escapeHtml(ogData.description)}</p>
  <p><strong>Interpretation:</strong> ${escapeHtml(ogData.interpretation)}</p>
  <p><a href="${escapeHtml(ogData.url)}">View full dream interpretation</a></p>
  
  <noscript>
    <meta http-equiv="refresh" content="0;url=${escapeHtml(ogData.url)}">
  </noscript>
</body>
</html>`;
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}
