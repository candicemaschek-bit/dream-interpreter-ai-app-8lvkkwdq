import { createClient } from "npm:@blinkdotnew/sdk@latest";

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
      return new Response(JSON.stringify({ error: "Missing config" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const blink = createClient({ projectId, secretKey });
    
    // Auth client for verification
    const authClient = createClient({ 
      projectId, 
      auth: { mode: "headless" } 
    });
    
    let userId: string | null = null;
    let userRole: string | null = null;
    const authHeader = req.headers.get("Authorization");
    
    if (authHeader) {
      try {
        const token = authHeader.replace(/^Bearer\s+/i, "");
        if (token) {
          authClient.auth.setToken(token);
          const user = await authClient.auth.me();
          if (user && user.id) {
            userId = user.id;
            userRole = user.role || null;
          }
        }
      } catch (authError) {
        console.warn("Auth verification failed:", authError);
      }
    }
    
    const body = await req.json();
    const { operation } = body;
    
    if (!operation) {
      return new Response(JSON.stringify({ error: "Missing operation parameter" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    
    let result: any;
    
    switch (operation) {
      case "getGlobalSetting": {
        const { key } = body;
        if (!key) {
          return new Response(JSON.stringify({ error: "Missing key parameter" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }
        
        const settings = await blink.db.globalSettings.list({ where: { key } });
        result = { success: true, value: settings[0]?.value || null };
        break;
      }
      
      case "setGlobalSetting": {
        if (userRole !== "admin") {
          return new Response(JSON.stringify({ error: "Admin access required" }), {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }
        
        const { key, value } = body;
        if (!key || value === undefined) {
          return new Response(JSON.stringify({ error: "Missing key or value parameter" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }
        
        await blink.db.globalSettings.upsert({
          key,
          value: String(value),
          updatedAt: new Date().toISOString(),
          userId: userId || "system"
        });
        
        result = { success: true, message: "Global setting updated" };
        break;
      }
      
      case "getLeaderboard": {
        const { limit = 100 } = body;
        const entries = await blink.db.leaderboardEntries.list({
          orderBy: { rank: "asc" },
          limit
        });
        result = { success: true, entries };
        break;
      }
      
      case "checkEarlyAccess": {
        const { email } = body;
        if (!email) {
          return new Response(JSON.stringify({ error: "Missing email parameter" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }
        
        const entries = await blink.db.earlyAccessList.list({ where: { email } });
        result = {
          success: true,
          hasAccess: entries.length > 0,
          entry: entries[0] || null
        };
        break;
      }
      
      case "listEarlyAccess": {
        // Admin only
        if (userRole !== "admin") {
          return new Response(JSON.stringify({ error: "Admin access required" }), {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }
        
        const { limit = 1000 } = body;
        const entries = await blink.db.earlyAccessList.list({
          orderBy: { createdAt: "desc" },
          limit
        });
        result = { success: true, entries };
        break;
      }
      
      case "createEarlyAccess": {
        const { name, email, tier, userId: providedUserId } = body;
        if (!name || !email || !tier) {
          return new Response(JSON.stringify({ error: "Missing required parameters" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }
        
        await blink.db.earlyAccessList.create({
          id: `ea_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: String(name).trim(),
          email: String(email).toLowerCase().trim(),
          tier: String(tier),
          userId: providedUserId || userId || null,
          createdAt: new Date().toISOString(),
          invitationSent: "0"
        });
        
        result = { success: true, message: "Early access entry created" };
        break;
      }
      
      default:
        return new Response(JSON.stringify({ error: `Unknown operation: ${operation}` }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
    }
    
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ 
      error: "Internal error",
      message: error instanceof Error ? error.message : String(error)
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
}

Deno.serve(handler);