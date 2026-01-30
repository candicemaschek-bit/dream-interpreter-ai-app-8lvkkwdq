/**
 * Reflection Messages Edge Function
 * Handles all CRUD operations for reflection_messages table
 * Bypasses client-side 403 errors by using server-side authentication
 */

import { createClient } from "npm:@blinkdotnew/sdk@latest"

interface ReflectionMessage {
  id: string
  sessionId: string
  role: 'user' | 'assistant'
  content: string
  tokenCount?: number
  emotionalTags?: string
  referencedDreams?: string
  createdAt: string
}

const projectId = Deno.env.get('BLINK_PROJECT_ID')!

// Initialize Blink with secret key for server-side operations
const blink = createClient({
  projectId,
  secretKey: Deno.env.get('BLINK_SECRET_KEY')!
})

// Helper to verify token using Blink SDK
async function verifyToken(token: string): Promise<{ id: string } | null> {
  try {
    const userBlink = createClient({
      projectId,
      auth: { mode: "headless" }
    });
    userBlink.auth.setToken(token);
    
    const userData = await userBlink.auth.me();
    if (!userData || !userData.id) {
      console.error("Token verification failed: No user in response");
      return null;
    }

    return { id: userData.id };
  } catch (err) {
    console.error("Auth verification failed:", err);
    return null;
  }
}

Deno.serve(async (req: Request) => {
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  }

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const operation = url.searchParams.get('operation')

    // Verify user authentication from header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - missing token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    
    // Verify token and get user via direct API call
    const user = await verifyToken(token)
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    const userId = user.id

    switch (operation) {
      case 'list': {
        // GET /reflection-messages?operation=list&sessionId=xxx
        const sessionId = url.searchParams.get('sessionId')
        const limit = parseInt(url.searchParams.get('limit') || '50')

        if (!sessionId) {
          return new Response(
            JSON.stringify({ error: 'sessionId is required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Verify session belongs to user
        const session = await blink.db.reflectionSessions.get(sessionId)
        if (!session || session.userId !== userId) {
          return new Response(
            JSON.stringify({ error: 'Session not found or unauthorized' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        const messages = await blink.db.reflectionMessages.list({
          where: { sessionId },
          orderBy: { createdAt: 'asc' },
          limit
        })

        return new Response(
          JSON.stringify({ messages }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'create': {
        // POST /reflection-messages?operation=create
        const body = await req.json()
        const { sessionId, role, content, tokenCount, emotionalTags, referencedDreams } = body

        if (!sessionId || !role || !content) {
          return new Response(
            JSON.stringify({ error: 'sessionId, role, and content are required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Verify session belongs to user
        const session = await blink.db.reflectionSessions.get(sessionId)
        if (!session || session.userId !== userId) {
          return new Response(
            JSON.stringify({ error: 'Session not found or unauthorized' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        const now = new Date().toISOString()

        const message = await blink.db.reflectionMessages.create({
          id: messageId,
          sessionId,
          role,
          content,
          tokenCount: tokenCount || 0,
          emotionalTags: emotionalTags || null,
          referencedDreams: referencedDreams || null,
          createdAt: now
        })

        return new Response(
          JSON.stringify({ message }),
          { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'deleteBySession': {
        // DELETE /reflection-messages?operation=deleteBySession&sessionId=xxx
        const sessionId = url.searchParams.get('sessionId')

        if (!sessionId) {
          return new Response(
            JSON.stringify({ error: 'sessionId is required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Verify session belongs to user
        const session = await blink.db.reflectionSessions.get(sessionId)
        if (!session || session.userId !== userId) {
          return new Response(
            JSON.stringify({ error: 'Session not found or unauthorized' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        await blink.db.reflectionMessages.deleteMany({
          where: { sessionId }
        })

        return new Response(
          JSON.stringify({ success: true }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'count': {
        // GET /reflection-messages?operation=count&sessionId=xxx
        const sessionId = url.searchParams.get('sessionId')

        if (!sessionId) {
          return new Response(
            JSON.stringify({ error: 'sessionId is required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Verify session belongs to user
        const session = await blink.db.reflectionSessions.get(sessionId)
        if (!session || session.userId !== userId) {
          return new Response(
            JSON.stringify({ error: 'Session not found or unauthorized' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        const count = await blink.db.reflectionMessages.count({
          where: { sessionId }
        })

        return new Response(
          JSON.stringify({ count }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid operation. Use: list, create, deleteBySession, count' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
  } catch (error: any) {
    console.error('Error in reflection-messages function:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
