import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "npm:@blinkdotnew/sdk@^2.1.1";

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await req.json();
    const { email, password, secret } = body;

    // Validate required fields
    if (!email || !password || !secret) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: email, password, secret' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify the secret
    const adminSecret = Deno.env.get('ADMIN_SETUP_SECRET');
    if (secret !== adminSecret) {
      return new Response(
        JSON.stringify({ error: 'Invalid secret' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Blink client with service role key
    const blink = createClient({
      projectId: Deno.env.get('BLINK_PROJECT_ID') || 'dream-interpreter-ai-app-8lvkkwdq',
      auth: { mode: 'managed' }
    });

    // Create the admin user
    const user = await blink.auth.signUp({
      email,
      password,
      role: 'admin',
      metadata: {
        isAdmin: true,
        createdAt: new Date().toISOString(),
      }
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Admin user created successfully',
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error creating admin:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to create admin user',
        details: error.message
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
