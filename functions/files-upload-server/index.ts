import { createClient } from "npm:@blinkdotnew/sdk";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, content-type",
};

async function handler(req: Request): Promise<Response> {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const projectId = Deno.env.get("BLINK_PROJECT_ID");
    const secretKey = Deno.env.get("BLINK_SECRET_KEY");

    if (!projectId || !secretKey) {
      console.error("Missing BLINK_PROJECT_ID or BLINK_SECRET_KEY");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const blink = createClient({ projectId, secretKey });

    // Verify auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing Authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Handle multipart form data
    let file: File | null = null;
    let path: string | null = null;

    try {
      const contentType = req.headers.get("content-type") || "";
      if (contentType.includes("multipart/form-data")) {
        const formData = await req.formData();
        const fileEntry = formData.get("file");
        if (fileEntry instanceof File) {
          file = fileEntry;
        }
        path = formData.get("path") as string;
      } else if (contentType.includes("application/json")) {
        // Handle base64 upload if needed
        const body = await req.json();
        if (body.file && body.filename) {
          // Decode base64 to Blob/File
          const base64Data = body.file.split(",")[1] || body.file;
          const binaryStr = atob(base64Data);
          const bytes = new Uint8Array(binaryStr.length);
          for (let i = 0; i < binaryStr.length; i++) {
            bytes[i] = binaryStr.charCodeAt(i);
          }
          file = new File([bytes], body.filename, { type: body.contentType || "application/octet-stream" });
          path = body.path;
        }
      }
    } catch (e) {
      console.error("Error parsing request body:", e);
      return new Response(JSON.stringify({ error: "Invalid request body" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!file) {
      return new Response(JSON.stringify({ error: "No file provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = user.id;
    // Default path if not provided
    const finalPath = path || `uploads/${userId}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;

    // Upload to storage
    const result = await blink.storage.upload(file, finalPath, { upsert: true });

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error processing upload:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}

Deno.serve(handler);