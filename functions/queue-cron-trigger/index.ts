import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

/**
 * Queue Cron Trigger
 * Periodic cron job that triggers the video queue processor
 * 
 * Setup Instructions:
 * 1. Deploy this function
 * 2. Use cron service (e.g., cron-job.org, EasyCron) to call this endpoint every 2 minutes
 * 3. Or use GitHub Actions workflow with cron schedule
 * 
 * Example cron expression: "star/2 * * * *" (every 2 minutes)
 */

const PROCESS_VIDEO_QUEUE_URL = Deno.env.get("PROCESS_VIDEO_QUEUE_URL") || 
  "https://dream-interpreter-ai-app-8lvkkwdq.functions.blink.new/process-video-queue";

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  try {
    console.log('🕐 Cron trigger activated - calling queue processor...');

    // Call the queue processor
    const response = await fetch(PROCESS_VIDEO_QUEUE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();

    if (response.ok) {
      console.log('✅ Queue processor completed successfully');
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Queue processor triggered successfully',
          result,
          timestamp: new Date().toISOString(),
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    } else {
      console.error('❌ Queue processor failed:', result);
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Queue processor returned an error',
          error: result,
          timestamp: new Date().toISOString(),
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }
  } catch (error) {
    console.error("❌ Cron trigger error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Cron trigger failed",
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
});
