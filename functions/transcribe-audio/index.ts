/// <reference lib="deno.ns" />

import { createClient } from "npm:@blinkdotnew/sdk@latest";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
};

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

function errorResponse(message: string, status = 500, extra?: Record<string, unknown>) {
  return jsonResponse({ error: message, ...(extra || {}) }, status);
}

interface TranscriptionRequest {
  audioUrl: string;
  language?: string;
}

interface TranscriptionResponse {
  text: string;
  duration?: number;
  provider: "replicate";
  alerts?: string[];
}

interface UserProfileRow {
  id: string;
  userId: string;
  subscriptionTier?: "free" | "pro" | "premium" | "vip" | string;
  transcriptionsThisMonth?: number | string;
  transcriptionsLifetime?: number | string;
}

const TRANSCRIPTION_LIMITS: Record<string, number> = {
  free: 2,
  pro: 10,
  premium: 20,
  vip: 25,
};

const LIFETIME_TRANSCRIPTION_LIMITS: Record<string, number> = {
  free: 2,
};

const ALERT_COOLDOWN_MS = 1000 * 60 * 60;
const alertLastSentByKey: Record<string, number> = {};

function nowMs() {
  return Date.now();
}

function parseAlertEmails(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw.split(",").map((s) => s.trim()).filter(Boolean);
}

async function maybeSendAlertEmail(blink: ReturnType<typeof createClient>, params: {
  key: string;
  subject: string;
  text: string;
  html?: string;
}) {
  const to = parseAlertEmails(Deno.env.get("REPLICATE_ALERT_EMAILS"));
  if (to.length === 0) return;

  const last = alertLastSentByKey[params.key] || 0;
  if (nowMs() - last < ALERT_COOLDOWN_MS) return;

  try {
    await blink.notifications.email({
      to,
      subject: params.subject,
      text: params.text,
      html: params.html,
    });
    alertLastSentByKey[params.key] = nowMs();
  } catch (err) {
    console.error("Failed to send alert email:", err);
  }
}

function getReplicateLowCreditsAlertFlags(): { isLow: boolean; remaining?: number; threshold?: number } {
  const remainingRaw = Deno.env.get("REPLICATE_CREDITS_REMAINING");
  const thresholdRaw = Deno.env.get("REPLICATE_CREDITS_LOW_THRESHOLD");
  const remaining = remainingRaw ? Number(remainingRaw) : undefined;
  const threshold = thresholdRaw ? Number(thresholdRaw) : undefined;

  if (remaining == null || Number.isNaN(remaining)) return { isLow: false };
  const t = threshold != null && !Number.isNaN(threshold) ? threshold : 10;
  return { isLow: remaining <= t, remaining, threshold: t };
}

/**
 * Transcribe audio using Replicate Whisper v3 large model
 * Includes a fallback to a secondary model version if the primary one fails
 * 
 * Model versions updated January 2026:
 * - Primary: 80996966 (latest, cuda11.8-python3.11-torch2.0.1-X64)
 * - Fallback: cdd97b25 (stable auto-upgraded version)
 */
async function transcribeWithReplicate(audioUrl: string, language: string): Promise<{ text: string; predictionId?: string }> {
  const REPLICATE_API_TOKEN = Deno.env.get("REPLICATE");

  if (!REPLICATE_API_TOKEN) {
    throw new Error("REPLICATE token not configured");
  }

  // Updated model versions for Whisper v3 large (January 2026)
  // See: https://replicate.com/openai/whisper/versions
  const versions = [
    "8099696689d249cf8e3c4f1ef77a4889f073cdf78850a6f9ca31dfd26f840298", // Latest (cuda11.8-python3.11-torch2.0.1-X64)
    "cdd97b257f93cb89dede1c7584e3f3dfc969571b357dbcee08e793740bedd854", // Fallback (auto-upgraded stable)
  ];

  let lastError: Error | null = null;

  for (let i = 0; i < versions.length; i++) {
    const version = versions[i];
    const isFallback = i > 0;

    try {
      console.log(`Starting Replicate transcription (attempt ${i + 1}/${versions.length}) using version: ${version}`);

      const createResponse = await fetch("https://api.replicate.com/v1/predictions", {
        method: "POST",
        headers: {
          Authorization: "Bearer " + REPLICATE_API_TOKEN,
          "Content-Type": "application/json",
          Prefer: "wait=60",
        },
        body: JSON.stringify({
          version: version,
          input: {
            audio: audioUrl,
            language: language,
            model: "large-v3",
            transcription: "plain text",
            translate: false,
          },
        }),
      });

      if (!createResponse.ok) {
        const errorText = await createResponse.text();
        console.error(`Replicate create error (${version}):`, errorText);
        
        if (createResponse.status === 402) throw new Error("INSUFFICIENT_CREDITS");
        if (createResponse.status === 429) throw new Error("REPLICATE_RATE_LIMIT");
        
        // If it's a 4xx error (not 402/429), it might be a model-specific issue, so try fallback
        // If it's a 5xx error, definitely try fallback
        if (i < versions.length - 1) {
          console.warn(`Attempt ${i + 1} failed with status ${createResponse.status}, trying fallback model...`);
          continue;
        }
        
        throw new Error(`Failed to create prediction: ${createResponse.status}`);
      }

      const prediction = await createResponse.json();
      console.log("Prediction created:", prediction.id, "Status:", prediction.status);

      if (prediction.status === "succeeded") {
        const output = prediction.output;
        if (typeof output === "string") return { text: output, predictionId: prediction.id };
        if (output && output.transcription) return { text: output.transcription, predictionId: prediction.id };
        if (output && output.text) return { text: output.text, predictionId: prediction.id };
        return { text: JSON.stringify(output), predictionId: prediction.id };
      }
      
      if (prediction.status === "failed") {
        if (i < versions.length - 1) {
          console.warn(`Prediction ${prediction.id} failed, trying fallback model...`);
          continue;
        }
        throw new Error(prediction.error || "Transcription failed");
      }
      
      if (prediction.status === "canceled") {
        throw new Error("Transcription was canceled");
      }

      // Poll for completion if not immediately done
      const maxAttempts = 15;
      let pollInterval = 1500;
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        await new Promise((resolve) => setTimeout(resolve, pollInterval));
        pollInterval = Math.min(5000, Math.round(pollInterval * 1.25));

        const statusResponse = await fetch("https://api.replicate.com/v1/predictions/" + prediction.id, {
          headers: {
            Authorization: "Bearer " + REPLICATE_API_TOKEN,
          },
        });

        if (!statusResponse.ok) {
          if (statusResponse.status === 402) throw new Error("INSUFFICIENT_CREDITS");
          if (statusResponse.status === 429) throw new Error("REPLICATE_RATE_LIMIT");
          console.error("Status check failed:", statusResponse.status);
          continue;
        }

        const status = await statusResponse.json();
        console.log("Poll", attempt + 1, "Status:", status.status);

        if (status.status === "succeeded") {
          const output = status.output;
          if (typeof output === "string") return { text: output, predictionId: prediction.id };
          if (output && output.transcription) return { text: output.transcription, predictionId: prediction.id };
          if (output && output.text) return { text: output.text, predictionId: prediction.id };
          return { text: JSON.stringify(output), predictionId: prediction.id };
        }
        
        if (status.status === "failed") {
          if (i < versions.length - 1) {
            console.warn(`Poll for ${prediction.id} returned failed status, trying fallback model...`);
            break; // Break polling, continue to next version in outer loop
          }
          throw new Error(status.error || "Transcription failed");
        }
        
        if (status.status === "canceled") throw new Error("Transcription was canceled");
      }

      // If we got here and it's not the last version, it might have timed out
      if (i < versions.length - 1) {
        console.warn(`Model version ${version} timed out, trying fallback...`);
        continue;
      }
      
      throw new Error("REPLICATE_TIMEOUT");
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      
      // Don't retry for credit/rate limit issues
      if (lastError.message === "INSUFFICIENT_CREDITS" || lastError.message === "REPLICATE_RATE_LIMIT") {
        throw lastError;
      }
      
      if (i < versions.length - 1) {
        console.warn(`Error with model ${version}: ${lastError.message}, trying fallback...`);
        continue;
      }
      
      throw lastError;
    }
  }

  throw lastError || new Error("Transcription failed after trying all versions");
}

async function handler(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return errorResponse("Method not allowed", 405);
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return errorResponse("Missing or invalid Authorization header", 401, {
      code: "AUTH_HEADER_MISSING",
      hint: "Send Authorization: Bearer <token>",
    });
  }

  try {
    const projectId = Deno.env.get("BLINK_PROJECT_ID") || "dream-interpreter-ai-app-8lvkkwdq";
    const secretKey = Deno.env.get("BLINK_SECRET_KEY");
    const publishableKey = Deno.env.get("BLINK_PUBLISHABLE_KEY");

    console.log(`🚀 Transcription request for project: ${projectId}`);
    console.log(`ℹ️ Environment Check: secretKey=${!!secretKey}, publishableKey=${!!publishableKey}`);

    if (!secretKey) {
      console.error("BLINK_SECRET_KEY not configured");
      return errorResponse("Server configuration error", 500, {
        code: "CONFIG_ERROR",
        hint: "BLINK_SECRET_KEY not set",
      });
    }

    const blink = createClient({
      projectId,
      secretKey,
    });
    console.log("✅ Admin client created successfully");

    // Verify auth token using SDK me() approach with the admin client
    // Since we have the secretKey, we can verify tokens manually or use me() on a user-scoped client
    console.log("🔍 Verifying auth token...");
    let currentUserId: string;
    let currentUserEmail: string | undefined;

    try {
      const token = authHeader.replace(/^Bearer\s+/i, "");
      const userClient = createClient({ 
        projectId,
        publishableKey,
        auth: { mode: 'headless' }
      });
      userClient.auth.setToken(token);
      
      const user = await userClient.auth.me();
      
      if (!user || !user.id) {
        console.error("❌ Token verification failed: User not found");
        return errorResponse("Token expired or invalid", 401, {
          code: "AUTH_FAILED",
          hint: "Client should refresh token and retry",
        });
      }

      currentUserId = user.id;
      currentUserEmail = user.email;
      console.log("✅ Authenticated user:", currentUserId);
    } catch (authErr) {
      const errMsg = authErr instanceof Error ? authErr.message : String(authErr);
      console.error("❌ Auth verification error:", errMsg);
      
      return errorResponse("Authentication error", 401, {
        code: "AUTH_FAILED",
        hint: "Client should fetch a fresh token and retry",
        details: errMsg
      });
    }

    // Now use the admin client to query user profiles
    console.log("📋 Querying userProfiles for userId:", currentUserId);
    const profiles = await blink.db.userProfiles.list({
      where: { userId: currentUserId },
      limit: 1,
    });

    // 📊 Diagnostic log: Check what userProfiles.list() returns
    console.log("📊 blink.db.userProfiles.list() returned:", {
      isArray: Array.isArray(profiles),
      length: profiles?.length,
      firstItem: profiles?.[0] ? JSON.stringify(profiles[0]).substring(0, 200) : "undefined",
      userId: currentUserId,
    });

    const profile = profiles?.[0] as UserProfileRow | undefined;
    let tier = "free";
    let used = 0;
    let lifetimeUsed = 0;

    if (!profile) {
      console.log("⚠️ No profile found for user:", currentUserId, "Using default free tier limits.");
      // Option: Create a minimal profile here or just proceed with defaults
      tier = "free";
      used = 0;
      lifetimeUsed = 0;
    } else {
      console.log("📊 Profile data found:", {
        id: profile.id,
        userId: profile.userId,
        subscriptionTier: profile.subscriptionTier,
        transcriptionsThisMonth: profile.transcriptionsThisMonth,
        transcriptionsLifetime: profile.transcriptionsLifetime,
      });
      tier = String(profile.subscriptionTier || "free").toLowerCase();
      used = Number(profile.transcriptionsThisMonth ?? 0) || 0;
      lifetimeUsed = Number(profile.transcriptionsLifetime ?? 0) || 0;
    }

    console.log(`✅ Transcription access check for tier: ${tier}`);

    // Get the monthly limit for this tier (default to free tier limit for unknown tiers)
    const limit = TRANSCRIPTION_LIMITS[tier] ?? TRANSCRIPTION_LIMITS["free"] ?? 2;
    const lifetimeLimit = LIFETIME_TRANSCRIPTION_LIMITS[tier];

    console.log(`Tier: ${tier}, Monthly limit: ${limit}, Used this month: ${used}, Lifetime used: ${lifetimeUsed}`);

    // Check lifetime limit first (mainly for free tier)
    if (lifetimeLimit !== undefined && lifetimeUsed >= lifetimeLimit) {
      console.log(`User reached lifetime limit: ${lifetimeUsed}/${lifetimeLimit}`);
      return errorResponse("TRANSCRIPTION_LIFETIME_LIMIT_REACHED", 402, {
        code: "TRANSCRIPTION_LIFETIME_LIMIT_REACHED",
        tier,
        used: lifetimeUsed,
        limit: lifetimeLimit,
        hint: `Free tier is limited to ${lifetimeLimit} transcriptions lifetime`,
      });
    }

    // Check monthly limit
    if (used >= limit) {
      console.log(`User reached monthly limit: ${used}/${limit}`);
      return errorResponse("TRANSCRIPTION_LIMIT_REACHED", 402, {
        code: "TRANSCRIPTION_LIMIT_REACHED",
        tier,
        used,
        limit,
        hint: `${tier} tier limit is ${limit} transcriptions per month`,
      });
    }

    const body = (await req.json()) as TranscriptionRequest;
    const { audioUrl, language = "en" } = body || ({} as TranscriptionRequest);

    if (!audioUrl || typeof audioUrl !== "string" || audioUrl.trim() === "") {
      return errorResponse("audioUrl is required", 400, { code: "INVALID_INPUT" });
    }

    console.log("🎤 Transcribing audio from URL:", audioUrl);

    // Debug log for Replicate token presence
    const replicateToken = Deno.env.get("REPLICATE");
    if (replicateToken) {
      console.log("✅ Replicate token found (masked):", replicateToken.substring(0, 4) + "...");
    } else {
      console.error("❌ Replicate token MISSING in environment");
      return errorResponse("Transcription service not configured", 500, {
        code: "CONFIG_ERROR",
        hint: "REPLICATE token not set",
      });
    }

    const alerts: string[] = [];

    const lowCredit = getReplicateLowCreditsAlertFlags();
    if (lowCredit.isLow) {
      alerts.push("REPLICATE_CREDITS_LOW");
      await maybeSendAlertEmail(blink, {
        key: "replicate_credits_low",
        subject: "[Dreamcatcher AI] Replicate credits low",
        text: "Replicate credits low (remaining=" + lowCredit.remaining + ", threshold=" + lowCredit.threshold + ").",
      });
    }

    // Use Replicate ONLY - no Blink AI fallback
    let rawText = "";
    try {
      const result = await transcribeWithReplicate(audioUrl, language);
      rawText = result.text;
      console.log("✅ Replicate transcription successful");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`❌ Replicate transcription failed: ${msg}`);

      // Send alert for credit issues
      if (msg === "INSUFFICIENT_CREDITS") {
        alerts.push("REPLICATE_CREDITS_DEPLETED");
        await maybeSendAlertEmail(blink, {
          key: "replicate_credits_depleted",
          subject: "[Dreamcatcher AI] Replicate out of credits (402)",
          text: "Replicate returned 402 (out of credits). User=" + currentUserId + ". Transcription failed.",
        });
        return errorResponse("INSUFFICIENT_CREDITS", 402, { 
          code: "INSUFFICIENT_CREDITS",
          hint: "Please contact support - transcription credits are depleted"
        });
      }

      if (msg === "REPLICATE_RATE_LIMIT") {
        return errorResponse("REPLICATE_RATE_LIMIT", 429, { 
          code: "REPLICATE_RATE_LIMIT",
          hint: "Too many requests - please try again in a moment"
        });
      }

      if (msg === "REPLICATE_TIMEOUT") {
        return errorResponse("REPLICATE_TIMEOUT", 504, { 
          code: "REPLICATE_TIMEOUT",
          hint: "Transcription is taking too long - please try again"
        });
      }

      // Generic transcription error
      return errorResponse("Transcription failed", 500, {
        code: "TRANSCRIPTION_FAILED",
        details: msg,
        hint: "Please try typing your dream instead.",
      });
    }

    const GLOBAL_DREAM_INPUT_CAP = 10_000;
    const trimmed = rawText.trim();
    const capped = trimmed.length > GLOBAL_DREAM_INPUT_CAP ? trimmed.slice(0, GLOBAL_DREAM_INPUT_CAP) : trimmed;

    const response: TranscriptionResponse = {
      text: capped,
      provider: "replicate",
      alerts: alerts.length > 0 ? alerts : undefined,
    };

    console.log("✅ Transcription successful, text length:", response.text.length);

    // Update usage counters
    try {
      const updateData: Record<string, unknown> = {
        transcriptionsThisMonth: used + 1,
        transcriptionsLifetime: lifetimeUsed + 1,
        updatedAt: new Date().toISOString()
      };
      
      if (profile?.id) {
        console.log("📝 Updating profile usage counters:", profile.id);
        await blink.db.userProfiles.update(profile.id, updateData);
      } else {
        console.log("📝 Creating minimal profile for user:", currentUserId);
        // This handles cases where user hasn't completed onboarding yet
        await blink.db.userProfiles.create({
          id: `profile_${currentUserId}_auto`,
          userId: currentUserId,
          name: currentUserEmail?.split("@")[0] || "Dreamer",
          age: 18, // Default age
          gender: "none",
          subscriptionTier: "free",
          onboardingCompleted: "0",
          createdAt: new Date().toISOString(),
          ...updateData,
        });
      }
      console.log("✅ Usage counters updated successfully");
    } catch (usageErr) {
      console.warn("Failed to update transcription usage:", usageErr);
    }

    return jsonResponse(response);
  } catch (error) {
    console.error("Transcription error:", error);

    const message = error instanceof Error ? error.message : "Transcription failed";

    // Don't mask TypeErrors as auth errors
    if (error instanceof TypeError) {
       return errorResponse("Server configuration error: " + message, 500);
    }

    const lower = message.toLowerCase();
    if (
      lower.includes("not authenticated") ||
      lower.includes("unauthorized") ||
      lower.includes("no access-token") ||
      lower.includes("auth")
    ) {
      return errorResponse("Not authenticated", 401, {
        code: "AUTH_FAILED",
        hint: "Client should fetch a fresh token and retry",
        details: message,
      });
    }

    if (message === "INSUFFICIENT_CREDITS") {
      return errorResponse("INSUFFICIENT_CREDITS", 402, { code: "INSUFFICIENT_CREDITS" });
    }

    if (message === "TRANSCRIPTION_NOT_AVAILABLE") {
      return errorResponse("TRANSCRIPTION_NOT_AVAILABLE", 403, { code: "TRANSCRIPTION_NOT_AVAILABLE" });
    }

    if (message === "TRANSCRIPTION_LIMIT_REACHED") {
      return errorResponse("TRANSCRIPTION_LIMIT_REACHED", 402, { code: "TRANSCRIPTION_LIMIT_REACHED" });
    }

    if (message === "TRANSCRIPTION_LIFETIME_LIMIT_REACHED") {
      return errorResponse("TRANSCRIPTION_LIFETIME_LIMIT_REACHED", 402, { code: "TRANSCRIPTION_LIFETIME_LIMIT_REACHED" });
    }

    if (message === "REPLICATE_TIMEOUT") {
      return errorResponse("REPLICATE_TIMEOUT", 504, { code: "REPLICATE_TIMEOUT" });
    }

    if (message === "REPLICATE_RATE_LIMIT") {
      return errorResponse("REPLICATE_RATE_LIMIT", 429, { code: "REPLICATE_RATE_LIMIT" });
    }

    return errorResponse(message, 500, {
      code: "TRANSCRIPTION_FAILED",
      details: "Please try typing your dream instead.",
    });
  }
}

Deno.serve(handler);
