/// <reference lib="deno.ns" />

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "npm:@blinkdotnew/sdk@^2.1.1";

const PROJECT_ID = "dream-interpreter-ai-app-8lvkkwdq";

// ═══════════════════════════════════════════════════════════════════
// CORS + response helpers
// ═══════════════════════════════════════════════════════════════════
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
  return jsonResponse({ valid: false, error: message, ...(extra || {}) }, status);
}

function getBearerToken(req: Request): string | null {
  const authHeader = req.headers.get("Authorization") || "";
  if (!authHeader.startsWith("Bearer ")) return null;
  const token = authHeader.slice("Bearer ".length).trim();
  return token.length > 0 ? token : null;
}

// ═══════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════
interface AddOnPurchaseRequest {
  addOnId: string;
  quantity?: number;
  userId?: string;
}

interface ValidationResponse {
  valid: boolean;
  error?: string;
  amount?: number;
  purchaseId?: string;
  transactionId?: string;
  addOnDetails?: {
    name: string;
    price: number;
    isRecurring: boolean;
  };
}

// Add-on definitions with prices
const ADD_ONS: Record<string, { name: string; price: number; isRecurring: boolean }> = {
  deep_dive_report: {
    name: "Dream Deep Dive Report",
    price: 4.99,
    isRecurring: false,
  },
  dreamworlds_pass: {
    name: "Additional DreamWorld",
    price: 6.99,
    isRecurring: false,
  },
  extra_dreamworld: {
    name: "DreamWorlds Bundle",
    price: 14.99,
    isRecurring: false,
  },
};

async function fetchUserProfile(blink: ReturnType<typeof createClient>, userId: string) {
  const profiles = await blink.db.userProfiles.list({
    where: { userId },
    limit: 1,
  });
  return profiles && profiles.length > 0 ? profiles[0] : null;
}

function validateAddOnAndQuantity(addOnId: string, quantity: number) {
  const addOn = ADD_ONS[addOnId];
  if (!addOn) {
    return { ok: false as const, error: `Invalid add-on ID: ${addOnId}` };
  }

  if (!Number.isFinite(quantity) || quantity < 1 || quantity > 100) {
    return { ok: false as const, error: "Quantity must be between 1 and 100" };
  }

  const amount = addOn.price * quantity;
  return {
    ok: true as const,
    amount,
    addOnDetails: { name: addOn.name, price: addOn.price, isRecurring: addOn.isRecurring },
  };
}

async function recordAddOnPurchase(params: {
  blink: ReturnType<typeof createClient>;
  userId: string;
  addOnId: string;
  quantity: number;
  amountUsd: number;
}) {
  const addOn = ADD_ONS[params.addOnId];

  const purchaseId = `addon_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  await params.blink.db.addOnPurchases.create({
    id: purchaseId,
    userId: params.userId,
    addOnId: params.addOnId,
    amountUsd: String(params.amountUsd),
    quantity: String(params.quantity),
    isRecurring: addOn.isRecurring ? "1" : "0",
    status: "pending",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  const transactionId = `txn_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  await params.blink.db.paymentTransactions.create({
    id: transactionId,
    userId: params.userId,
    type: "add_on",
    relatedId: purchaseId,
    amountUsd: String(params.amountUsd),
    currency: "USD",
    status: "pending",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  // Update analytics (best-effort)
  try {
    const analyticsEntries = await params.blink.db.addOnAnalytics.list({
      where: {
        AND: [{ userId: params.userId }, { addOnId: params.addOnId }],
      },
      limit: 1,
    });

    const analyticsEntry = analyticsEntries && analyticsEntries.length > 0 ? analyticsEntries[0] : null;

    if (analyticsEntry) {
      const newCount = Number(analyticsEntry.purchaseCount || 0) + 1;
      const newRevenue = Number(analyticsEntry.totalRevenueUsd || 0) + params.amountUsd;

      await params.blink.db.addOnAnalytics.update(analyticsEntry.id, {
        purchaseCount: String(newCount),
        totalRevenueUsd: String(newRevenue),
        lastPurchaseDate: new Date().toISOString(),
        customerLifetimeValueUsd: String(newRevenue),
        repeatCustomer: newCount > 1 ? "1" : "0",
        updatedAt: new Date().toISOString(),
      });
    } else {
      const analyticsId = `analytics_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
      await params.blink.db.addOnAnalytics.create({
        id: analyticsId,
        userId: params.userId,
        addOnId: params.addOnId,
        purchaseCount: "1",
        totalRevenueUsd: String(params.amountUsd),
        lastPurchaseDate: new Date().toISOString(),
        repeatCustomer: "0",
        customerLifetimeValueUsd: String(params.amountUsd),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
  } catch (analyticsError) {
    console.error("Error updating add-on analytics:", analyticsError);
  }

  return { purchaseId, transactionId };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return errorResponse("Method not allowed", 405);
  }

  const token = getBearerToken(req);
  if (!token) {
    return errorResponse("Missing or invalid Authorization header", 401, {
      code: "AUTH_HEADER_MISSING",
      hint: "Send Authorization: Bearer <token>",
    });
  }

  const blink = createClient({ projectId: PROJECT_ID, auth: { mode: "headless" } });
  blink.auth.setToken(token);

  let currentUserId: string | undefined;
  try {
    const me = await blink.auth.me();
    currentUserId = me?.id;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return errorResponse("Not authenticated", 401, { code: "AUTH_FAILED", details: msg });
  }

  if (!currentUserId) {
    return errorResponse("Not authenticated", 401, { code: "AUTH_FAILED" });
  }

  let body: AddOnPurchaseRequest;
  try {
    body = (await req.json()) as AddOnPurchaseRequest;
  } catch {
    return errorResponse("Invalid JSON", 400, { code: "INVALID_JSON" });
  }

  if (!body || typeof body.addOnId !== "string" || body.addOnId.trim() === "") {
    return errorResponse("addOnId is required", 400, { code: "INVALID_INPUT" });
  }

  if (body.userId && body.userId !== currentUserId) {
    return errorResponse("Authorization failed: userId mismatch", 403, { code: "USER_MISMATCH" });
  }

  const rawQty = body.quantity ?? 1;
  const quantity = typeof rawQty === "number" ? rawQty : Number(rawQty);

  // Verify profile exists (keeps tier logic consistent across the app)
  try {
    const profile = await fetchUserProfile(blink, currentUserId);
    if (!profile) {
      return errorResponse("User profile not found", 404, { code: "PROFILE_NOT_FOUND" });
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return errorResponse("Failed to fetch user profile", 500, { code: "PROFILE_FETCH_FAILED", details: msg });
  }

  const validation = validateAddOnAndQuantity(body.addOnId, quantity);
  if (!validation.ok) {
    return jsonResponse({ valid: false, error: validation.error }, 400);
  }

  const recorded = await recordAddOnPurchase({
    blink,
    userId: currentUserId,
    addOnId: body.addOnId,
    quantity,
    amountUsd: validation.amount,
  });

  const response: ValidationResponse = {
    valid: true,
    amount: validation.amount,
    addOnDetails: validation.addOnDetails,
    purchaseId: recorded.purchaseId,
    transactionId: recorded.transactionId,
  };

  return jsonResponse(response);
});
