/// <reference lib="deno.ns" />

import { createClient } from "npm:@blinkdotnew/sdk@latest";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

function errorResponse(message: string, status = 500, code = "INTERNAL_ERROR") {
  return jsonResponse({ error: message, code }, status);
}

const projectId = Deno.env.get("BLINK_PROJECT_ID")!;
const secretKey = Deno.env.get("BLINK_SECRET_KEY")!;

// Helper to verify token using Blink SDK (same pattern as reflection-messages)
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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return errorResponse("Method not allowed", 405, "METHOD_NOT_ALLOWED");
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return errorResponse("Missing Authorization header", 401, "AUTH_REQUIRED");
  }

  try {
    if (!projectId || !secretKey) {
      throw new Error("Missing server configuration");
    }

    const adminBlink = createClient({ projectId, secretKey });
    const token = authHeader.replace(/^Bearer\s+/i, "");

    // Verify token using SDK-based approach
    const user = await verifyToken(token);
    if (!user) {
      return errorResponse("Authentication failed", 401, "AUTH_FAILED");
    }

    const userId = user.id;

    // Check tier
    const profiles = await adminBlink.db.userProfiles.list({ where: { userId }, limit: 1 });
    if (!profiles || profiles.length === 0) {
      return errorResponse("User profile not found", 404, "NOT_FOUND");
    }

    const tier = profiles[0].subscriptionTier || "free";
    if (tier !== "premium" && tier !== "vip") {
      return errorResponse("Weekly reflections require a Premium or VIP subscription", 403, "TIER_LOCKED");
    }

    // Check if a report was generated recently (last 6 days)
    const recentReports = await adminBlink.db.patternInsights.list({
      where: { userId, insightType: "weekly_summary" },
      orderBy: { generatedAt: "desc" },
      limit: 1
    });

    if (recentReports.length > 0) {
      const lastGenerated = new Date(recentReports[0].generatedAt);
      const daysSince = (Date.now() - lastGenerated.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSince < 6) {
        return errorResponse(`Your weekly reflection is still fresh. Check back in ${Math.ceil(6 - daysSince)} days.`, 400, "ALREADY_GENERATED");
      }
    }

    // Aggregate dreams from the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const dreams = await adminBlink.db.dreams.list({
      where: { userId },
      limit: 100
    });

    const recentDreams = dreams.filter((d: any) => new Date(d.createdAt) > sevenDaysAgo);

    if (recentDreams.length < 3) {
      return errorResponse(`Log at least 3 dreams this week to generate a reflection. You have ${recentDreams.length}.`, 400, "INSUFFICIENT_DATA");
    }

    // Aggregate themes and emotions if possible
    const dreamSummaries = recentDreams.map((d: any) => `- ${d.title}: ${d.description.substring(0, 200)}...`).join("\n");

    // Call AI to synthesize
    const prompt = `You are a Psychological Dream Analyst. Synthesize the following dreams from the past 7 days into a cohesive "Weekly Retrospective".
    
Dreams this week:
${dreamSummaries}

Requirements:
1. Identify the core "Subconscious Theme of the Week".
2. Write a 3-4 sentence narrative summary that connects these dreams.
3. Be insightful, supportive, and use Jungian/Archetypal concepts where appropriate.
4. Do NOT give medical advice.

Respond in JSON format:
{
  "title": "A title for this week (e.g. 'The Threshold of Transition')",
  "description": "The narrative summary...",
  "confidence": 0.85 (how strongly the dreams connect)
}`;

    const aiResponse = await adminBlink.ai.generateText({
      prompt,
      model: "gpt-4.1-mini",
      maxTokens: 1000
    });

    let result;
    try {
      const text = aiResponse.text.replace(/```json\n?|```/g, "").trim();
      result = JSON.parse(text);
    } catch (e) {
      console.error("AI Parse Error:", e, aiResponse.text);
      throw new Error("Failed to parse AI response");
    }

    // Save to pattern_insights
    const insightId = `weekly_${Date.now()}`;
    const newInsight = {
      id: insightId,
      userId,
      insightType: "weekly_summary",
      title: result.title,
      description: result.description,
      confidence: result.confidence || 0.8,
      supportingDreams: JSON.stringify(recentDreams.map((d: any) => d.id)),
      generatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await adminBlink.db.patternInsights.create(newInsight);

    return jsonResponse(newInsight);
  } catch (error) {
    console.error("Weekly Report Error:", error);
    return errorResponse(error instanceof Error ? error.message : "Failed to generate weekly report");
  }
});
