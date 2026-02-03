import { createClient } from "npm:@blinkdotnew/sdk";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, content-type",
};

// Helper for hashing (same as client-side)
async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(token)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

async function handler(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const projectId = Deno.env.get("BLINK_PROJECT_ID");
    const secretKey = Deno.env.get("BLINK_SECRET_KEY");

    if (!projectId || !secretKey) {
      return new Response(
        JSON.stringify({ error: "Missing config" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { email, tokenId } = await req.json();

    const blink = createClient({ projectId, secretKey });
    
    let userId: string | null = null;
    let userEmail: string | null = null;
    let userDisplayName: string | null = null;

    if (email) {
      // Find user by email
      const users = await blink.db.users.list({
        where: { email },
        limit: 1,
      });
      if (users.length > 0) {
        userId = users[0].id;
        userEmail = users[0].email;
        userDisplayName = users[0].displayName || users[0].display_name;
      }
    } else if (tokenId) {
      // tokenId is actually the raw token from URL
      const lookupHash = await hashToken(tokenId.substring(0, 10));
      // Find user by token
      const tokens = await blink.db.emailVerificationTokens.list({
        where: { lookupHash },
        limit: 1,
      });
      if (tokens.length > 0) {
        userId = tokens[0].userId || tokens[0].user_id;
        const users = await blink.db.users.list({
          where: { id: userId },
          limit: 1,
        });
        if (users.length > 0) {
          userEmail = users[0].email;
          userDisplayName = users[0].displayName || users[0].display_name;
        }
      }
    }

    if (!userId || !userEmail) {
      return new Response(
        JSON.stringify({ error: "User not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate new token
    const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const tokenHash = await hashToken(token);
    const lookupHash = await hashToken(token.substring(0, 10)); // Simplified lookup hash
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours

    // Create new token record
    await blink.db.emailVerificationTokens.create({
      id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      tokenHash,
      lookupHash,
      expiresAt,
      createdAt: new Date().toISOString(),
    });

    // Send email
    const baseUrl = "https://dream-interpreter-ai-app-8lvkkwdq.sites.blink.new";
    const verificationUrl = `${baseUrl}/verify-email?token=${token}`;

    await blink.notifications.email({
      to: userEmail,
      subject: "Verify Your Dreamcatcher AI Account",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #6d28d9; margin: 0;">Dreamcatcher AI</h1>
          </div>
          <p>Hi ${userDisplayName || 'Dream Explorer'},</p>
          <p>Please click the button below to verify your email address and start exploring the hidden meanings in your dreams.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" style="background-color: #6d28d9; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Verify Email Address</a>
          </div>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #6d28d9;">${verificationUrl}</p>
          <p>This link will expire in 24 hours.</p>
          <p>If you didn't request this, you can safely ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 12px; color: #666; text-align: center;">© 2026 Dreamcatcher AI • Unlock your subconscious</p>
        </div>
      `,
      text: `Verify Your Email: ${verificationUrl}`
    });

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}

Deno.serve(handler);
