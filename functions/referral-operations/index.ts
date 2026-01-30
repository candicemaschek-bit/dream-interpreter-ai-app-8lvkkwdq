import { createClient } from "npm:@blinkdotnew/sdk@latest";

// CORS headers - required for browser calls
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, content-type",
};

interface ReferralOperation {
  operation:
    | "validate"
    | "generate"
    | "getUserCode"
    | "getStats"
    | "applyBonus";
  referralCode?: string;
  newUserId?: string;
  newUserEmail?: string;
}

async function handler(req: Request): Promise<Response> {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const projectId = Deno.env.get("BLINK_PROJECT_ID");
    const secretKey = Deno.env.get("BLINK_SECRET_KEY");

    if (!projectId || !secretKey) {
      return new Response(JSON.stringify({ error: "Missing config" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const blink = createClient({ projectId, secretKey });

    // Auth client for verification
    const authClient = createClient({
      projectId,
      auth: { mode: "headless" }
    });

    // Verify JWT token if provided (some operations require auth)
    const authHeader = req.headers.get("Authorization");
    let authenticatedUserId: string | null = null;

    if (authHeader) {
      try {
        const token = authHeader.replace(/^Bearer\s+/i, "");
        if (token) {
          authClient.auth.setToken(token);
          const user = await authClient.auth.me();
          if (user && user.id) {
            authenticatedUserId = user.id;
          }
        }
      } catch (authError) {
        console.warn("Auth verification failed:", authError);
      }
    }

    const body: ReferralOperation = await req.json();
    const { operation } = body;

    switch (operation) {
      case "validate": {
        // Validate referral code - does NOT require authentication
        // This is called during signup/onboarding with a referral code
        const { referralCode, newUserId, newUserEmail } = body;

        if (!referralCode) {
          return new Response(
            JSON.stringify({ success: false, message: "Referral code required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Find referral record using secret key (bypasses RLS)
        const referrals = await blink.db.referrals.list({
          where: { referralCode: referralCode.toUpperCase(), signupCompleted: "0" },
        });

        if (referrals.length === 0) {
          return new Response(
            JSON.stringify({
              success: false,
              message: "Invalid or already used referral code",
            }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const referral = referrals[0] as any;

        // If we have newUserId, apply the referral bonus
        if (newUserId && newUserEmail) {
          // Prevent self-referral
          if (referral.referrerUserId === newUserId) {
            return new Response(
              JSON.stringify({
                success: false,
                message: "Cannot use your own referral code",
              }),
              { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }

          // Update referral record
          await blink.db.referrals.update(referral.id, {
            referredUserId: newUserId,
            referredEmail: newUserEmail,
            signupCompleted: "1",
            bonusGranted: "1",
            completedAt: new Date().toISOString(),
          });

          // Grant bonus dream to referrer
          const referrerProfiles = await blink.db.userProfiles.list({
            where: { userId: referral.referrerUserId },
          });

          if (referrerProfiles.length > 0) {
            const referrerProfile = referrerProfiles[0] as any;
            await blink.db.userProfiles.update(referrerProfile.id, {
              referralBonusDreams: String(
                (parseInt(referrerProfile.referralBonusDreams || "0") || 0) + 1
              ),
              updatedAt: new Date().toISOString(),
            });
          }

          // Grant bonus dream to referred user (new user)
          const newUserProfiles = await blink.db.userProfiles.list({
            where: { userId: newUserId },
          });

          if (newUserProfiles.length > 0) {
            const newUserProfile = newUserProfiles[0] as any;
            await blink.db.userProfiles.update(newUserProfile.id, {
              referralBonusDreams: "1",
              updatedAt: new Date().toISOString(),
            });
          }

          return new Response(
            JSON.stringify({
              success: true,
              message:
                "Referral bonus applied! Both you and your friend received +1 dream analysis.",
            }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Just validating the code exists
        return new Response(
          JSON.stringify({
            success: true,
            message: "Valid referral code",
            valid: true,
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "generate": {
        // Generate a new referral code - requires authentication
        if (!authenticatedUserId) {
          return new Response(
            JSON.stringify({ error: "Authentication required" }),
            { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Generate random code
        const code = `DREAM-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

        // Check if code already exists
        const existing = await blink.db.referrals.list({
          where: { referralCode: code },
        });

        if (existing.length > 0) {
          // Try again with a different code
          const newCode = `DREAM-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
          await blink.db.referrals.create({
            id: `ref_${Date.now()}`,
            referrerUserId: authenticatedUserId,
            referralCode: newCode,
            signupCompleted: "0",
            bonusGranted: "0",
            createdAt: new Date().toISOString(),
            userId: authenticatedUserId,
          });

          return new Response(
            JSON.stringify({ success: true, code: newCode }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Create referral record
        await blink.db.referrals.create({
          id: `ref_${Date.now()}`,
          referrerUserId: authenticatedUserId,
          referralCode: code,
          signupCompleted: "0",
          bonusGranted: "0",
          createdAt: new Date().toISOString(),
          userId: authenticatedUserId,
        });

        return new Response(JSON.stringify({ success: true, code }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "getUserCode": {
        // Get existing referral code for user - requires authentication
        if (!authenticatedUserId) {
          return new Response(
            JSON.stringify({ error: "Authentication required" }),
            { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const referrals = await blink.db.referrals.list({
          where: { referrerUserId: authenticatedUserId },
        });

        if (referrals.length > 0) {
          const referral = referrals[0] as any;
          return new Response(
            JSON.stringify({ success: true, code: referral.referralCode }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Generate new code if doesn't exist
        const code = `DREAM-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
        await blink.db.referrals.create({
          id: `ref_${Date.now()}`,
          referrerUserId: authenticatedUserId,
          referralCode: code,
          signupCompleted: "0",
          bonusGranted: "0",
          createdAt: new Date().toISOString(),
          userId: authenticatedUserId,
        });

        return new Response(JSON.stringify({ success: true, code }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "getStats": {
        // Get referral statistics - requires authentication
        if (!authenticatedUserId) {
          return new Response(
            JSON.stringify({ error: "Authentication required" }),
            { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const referrals = await blink.db.referrals.list({
          where: { referrerUserId: authenticatedUserId },
        });

        const successful = referrals.filter(
          (r: any) => parseInt(r.signupCompleted || "0") > 0
        );

        const userProfiles = await blink.db.userProfiles.list({
          where: { userId: authenticatedUserId },
        });

        const bonusDreams =
          userProfiles.length > 0
            ? parseInt((userProfiles[0] as any).referralBonusDreams || "0") || 0
            : 0;

        return new Response(
          JSON.stringify({
            success: true,
            totalReferrals: referrals.length,
            successfulReferrals: successful.length,
            bonusDreams,
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: "Invalid operation" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
  } catch (error) {
    console.error("Referral operation error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal error",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}

Deno.serve(handler);