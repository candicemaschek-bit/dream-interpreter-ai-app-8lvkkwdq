import { createClient } from 'jsr:@blinkdotnew/sdk'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

export default async function reqHandler(req: Request) {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Blink SDK with service role (bypass RLS)
    const blink = createClient({
      projectId: Deno.env.get('BLINK_PROJECT_ID')!,
      secretKey: Deno.env.get('BLINK_SECRET_KEY')!
    })

    const body = await req.json()
    const { territory, limit = 20 } = body

    // Query community dreams without RLS restrictions
    const where: any = { status: 'active' }
    if (territory && territory !== 'general') {
      where.territory = territory
    }

    const dreams = await blink.db.communityDreams.list({
      where,
      orderBy: { likeCount: 'desc' },
      limit: Number(limit)
    })

    return new Response(JSON.stringify(dreams), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
}
