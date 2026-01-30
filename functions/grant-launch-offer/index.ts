import { createClient } from "npm:@blinkdotnew/sdk@^2.1.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, content-type",
};

async function handler(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const projectId = Deno.env.get("BLINK_PROJECT_ID");
    const secretKey = Deno.env.get("BLINK_SECRET_KEY");

    if (!projectId || !secretKey) {
      throw new Error("Missing config");
    }

    // Initialize with secret key for admin access (bypass RLS)
    const blink = createClient({ projectId, secretKey });

    // Initialize auth client for verification
    const authClient = createClient({ 
      projectId, 
      auth: { mode: "headless" } 
    });

    // Verify auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { 
        status: 401, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }
    
    console.log("Verifying token for grant-launch-offer...");
    let user;
    try {
      const auth = await (blink.auth as any).verifyToken(authHeader);
      if (auth.valid && auth.userId) {
        user = { id: auth.userId, email: auth.email };
      }
    } catch (authErr) {
      console.error("Token verification failed:", authErr);
    }

    if (!user || !user.id) {
      return new Response(JSON.stringify({ error: "Invalid token" }), { 
        status: 401, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }
    
    // Check if the caller is an admin to allow granting to others
    const callerId = user.id;
    const callerData = await blink.db.users.get(callerId);
    const isAdmin = callerData && String(callerData.role || '').toLowerCase() === 'admin';

    // Parse request body for targetUserId
    let targetUserId = callerId;
    if (req.method === "POST") {
      try {
        const body = await req.json();
        if (body.targetUserId && isAdmin) {
          targetUserId = body.targetUserId;
          console.log(`Admin ${callerId} is granting offer to ${targetUserId}`);
        }
      } catch (e) {
        // Not a JSON body or no targetUserId, default to caller
      }
    }
    
    const userId = targetUserId;

    // 1. Check if user already has offer
    const existing = await blink.db.launchOfferUsers.list({
      where: { userId },
      limit: 1
    });

    if (existing.length > 0) {
      const row = existing[0];
      return new Response(JSON.stringify({ 
        granted: true, 
        signupNumber: Number(row.signupNumber),
        message: "Already granted"
      }), { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    // 2. Count total offers (GLOBAL count because we use secretKey)
    const currentSignups = await blink.db.launchOfferUsers.count({});
    const limit = 500;

    console.log(`Current signups: ${currentSignups}, Limit: ${limit}`);

    if (currentSignups >= limit) {
      return new Response(JSON.stringify({ 
        granted: false, 
        message: `Launch offer is no longer available (signup limit reached: ${limit}).`
      }), { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    // 3. Grant offer
    const signupNumber = currentSignups + 1;
    const now = new Date().toISOString();
    
    await blink.db.launchOfferUsers.create({
      id: `lou_${userId}_${Date.now()}`,
      userId,
      signupNumber,
      offerActivated: 1,
      imagesGenerated: 0,
      createdAt: now,
      updatedAt: now,
    });

    return new Response(JSON.stringify({ 
      granted: true, 
      signupNumber,
      message: `Launch offer granted. You are signup #${signupNumber}/${limit}.`
    }), { 
      status: 200, 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });

  } catch (error: any) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}

Deno.serve(handler);