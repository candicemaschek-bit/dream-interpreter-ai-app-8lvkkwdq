/// <reference lib="deno.ns" />

import { createClient } from "npm:@blinkdotnew/sdk@latest";

/**
 * MINIMAL TRANSCRIPTION EDGE FUNCTION
 * 
 * Fresh implementation that works for all subscription tiers.
 * Uses Blink SDK's built-in transcription which is more reliable.
 * 
 * Phase 1: Basic transcription (current)
 * Phase 2: Add tier-based limits (TODO)
 * Phase 3: Add usage tracking (TODO)
 */

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
  console.error(`Error response: ${message}`, extra);
  return jsonResponse({ error: message, ...(extra || {}) }, status);
}

interface TranscriptionRequest {
  audioUrl: string;
  language?: string;
}

async function handler(req: Request): Promise<Response> {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return errorResponse("Method not allowed", 405);
  }

  // Check auth header exists
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return errorResponse("Missing Authorization header", 401, {
      code: "AUTH_HEADER_MISSING",
    });
  }

  try {
    // Initialize Blink client with server secret key
    const projectId = Deno.env.get("BLINK_PROJECT_ID") || "dream-interpreter-ai-app-8lvkkwdq";
    const secretKey = Deno.env.get("BLINK_SECRET_KEY");

    if (!secretKey) {
      console.error("BLINK_SECRET_KEY not configured");
      return errorResponse("Server configuration error", 500);
    }

    const blink = createClient({
      projectId,
      secretKey,
    });

    // Verify the user's token
    const token = authHeader.replace(/^Bearer\s+/i, "");
    let userId: string;

    try {
      const auth = await (blink.auth as any).verifyToken(token);
      
      if (!auth.valid || !auth.userId) {
        console.error("Token verification failed:", auth.error);
        return errorResponse("Invalid or expired token", 401, {
          code: "AUTH_FAILED",
          hint: "Please sign in again",
        });
      }

      userId = auth.userId;
      console.log("✅ Authenticated user:", userId);
    } catch (authErr) {
      console.error("Auth verification error:", authErr);
      return errorResponse("Authentication failed", 401, {
        code: "AUTH_FAILED",
      });
    }

    // Parse request body
    const body = (await req.json()) as TranscriptionRequest;
    const { audioUrl, language = "en" } = body || {};

    if (!audioUrl || typeof audioUrl !== "string" || audioUrl.trim() === "") {
      return errorResponse("audioUrl is required", 400, { code: "INVALID_INPUT" });
    }

    console.log("🎤 Transcribing audio:", audioUrl.substring(0, 100) + "...");

    // Use Blink SDK's built-in transcription
    const result = await blink.ai.transcribeAudio({
      audio: audioUrl,
      language: language,
    });

    const transcribedText = result.text || "";
    
    // Cap text length (10,000 chars max)
    const GLOBAL_CAP = 10_000;
    const finalText = transcribedText.length > GLOBAL_CAP 
      ? transcribedText.slice(0, GLOBAL_CAP) 
      : transcribedText;

    console.log("✅ Transcription successful, length:", finalText.length);

    return jsonResponse({
      text: finalText,
      provider: "blink",
    });

  } catch (error) {
    console.error("Transcription error:", error);
    
    const message = error instanceof Error ? error.message : "Transcription failed";
    
    // Check for specific error types
    if (message.toLowerCase().includes("not authenticated") || 
        message.toLowerCase().includes("unauthorized")) {
      return errorResponse("Authentication failed", 401, { code: "AUTH_FAILED" });
    }

    return errorResponse("Transcription failed", 500, {
      code: "TRANSCRIPTION_FAILED",
      details: message,
      hint: "Please try typing your dream instead.",
    });
  }
}

Deno.serve(handler);
