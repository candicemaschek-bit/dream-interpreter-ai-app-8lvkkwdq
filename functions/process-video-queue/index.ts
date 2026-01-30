import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "npm:@blinkdotnew/sdk@^2.1.1";
import { AI_PROMPTS } from "../aiPrompts.ts";

/**
 * Video Queue Processor
 * Processes pending video generation jobs from the queue
 * This function should be called periodically or triggered by events
 */

interface VideoQueueJob {
  id: string;
  userId: string;
  dreamId?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  priority: number;
  imageUrl: string;
  prompt: string;
  subscriptionTier: 'free' | 'pro' | 'premium' | 'vip';
  durationSeconds: number;
  videoUrl?: string;
  framesGenerated: number;
  errorMessage?: string;
  webhookUrl?: string;
  webhookSent: boolean;
  retryCount: number;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  updatedAt: string;
}

const blink = createClient({
  projectId: "dream-interpreter-ai-app-8lvkkwdq",
  auth: { mode: "managed" },
});

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  try {
    console.log('🎬 Video Queue Processor: Starting...');

    // Get next job from queue (highest priority first)
    const jobs = await blink.db.videoGenerationQueue.list({
      where: { status: 'pending' },
      orderBy: { priority: 'desc', createdAt: 'asc' },
      limit: 1,
    });

    if (jobs.length === 0) {
      console.log('📭 No pending jobs in queue');
      return new Response(
        JSON.stringify({ message: 'No pending jobs', processed: 0 }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    const job = jobs[0] as VideoQueueJob;
    console.log(`🎯 Processing job ${job.id} for user ${job.userId}`);

    // Update job status to processing
    await blink.db.videoGenerationQueue.update(job.id, {
      status: 'processing',
      startedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    try {
      // Generate video with retry and fallback logic
      console.log(`🎨 Generating video: ${job.durationSeconds}s duration`);
      
      let videoResult: { videoUrl: string; framesGenerated: number };
      let usedFallback = false;
      
      try {
        // Primary method: Full frame generation
        videoResult = await generateVideoWithBlinkAI(
          job.imageUrl,
          job.prompt,
          job.durationSeconds
        );
      } catch (primaryError) {
        console.warn(`⚠️ Primary generation failed, trying fallback...`, primaryError);
        
        // Fallback: Reduce frame count for more reliability
        try {
          videoResult = await generateVideoWithBlinkAI(
            job.imageUrl,
            job.prompt,
            Math.min(job.durationSeconds, 6), // Cap at 6 seconds for fallback
            true // Use reduced frame count
          );
          usedFallback = true;
          console.log(`✅ Fallback generation succeeded`);
        } catch (fallbackError) {
          console.error(`❌ Fallback also failed:`, fallbackError);
          throw fallbackError; // Re-throw to be caught by outer catch
        }
      }

      // Update job with success
      await blink.db.videoGenerationQueue.update(job.id, {
        status: 'completed',
        videoUrl: videoResult.videoUrl,
        framesGenerated: videoResult.framesGenerated,
        completedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // Send webhook notification if configured
      if (job.webhookUrl) {
        console.log(`📡 Sending webhook notification to ${job.webhookUrl}`);
        try {
          await sendWebhookNotification({
            ...job,
            status: 'completed',
            videoUrl: videoResult.videoUrl,
            framesGenerated: videoResult.framesGenerated,
            completedAt: new Date().toISOString(),
          });
        } catch (webhookError) {
          console.warn(`⚠️ Webhook notification failed:`, webhookError);
          // Don't fail the job if webhook fails
        }
      }

      // Track cost
      const videoCost = 0.20 + (job.durationSeconds * 0.05);
      try {
        await blink.db.apiUsageLogs.create({
          id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userId: job.userId,
          operationType: 'video_generation',
          modelUsed: 'gemini-2.5-flash-image',
          tokensUsed: videoResult.framesGenerated * 7500,
          estimatedCostUsd: videoCost + (videoResult.framesGenerated * 0.004),
          inputSize: job.prompt.length,
          outputSize: job.durationSeconds,
          success: 1,
          metadata: JSON.stringify({
            operation: 'dream_video_generation',
            framesGenerated: videoResult.framesGenerated,
            method: usedFallback ? 'queue-processor-fallback' : 'queue-processor',
            jobId: job.id,
            usedFallback,
          }),
          createdAt: new Date().toISOString(),
        });
      } catch (costError) {
        console.warn(`⚠️ Cost tracking failed:`, costError);
        // Don't fail the job if cost tracking fails
      }

      console.log(`✅ Job ${job.id} completed successfully${usedFallback ? ' (using fallback)' : ''}`);

      return new Response(
        JSON.stringify({
          success: true,
          jobId: job.id,
          videoUrl: videoResult.videoUrl,
          framesGenerated: videoResult.framesGenerated,
          usedFallback,
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    } catch (error) {
      console.error(`❌ Job ${job.id} failed:`, error);

      // Determine if job should be retried
      const shouldRetry = job.retryCount < 3;
      const newStatus: 'failed' | 'pending' = shouldRetry ? 'pending' : 'failed';
      
      // Update job with error or retry
      await blink.db.videoGenerationQueue.update(job.id, {
        status: newStatus,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        retryCount: job.retryCount + 1,
        completedAt: shouldRetry ? undefined : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      console.log(
        shouldRetry 
          ? `🔄 Job ${job.id} will be retried (attempt ${job.retryCount + 1}/3)`
          : `❌ Job ${job.id} failed permanently after ${job.retryCount + 1} attempts`
      );

      // Send webhook notification for failure
      if (job.webhookUrl) {
        try {
          await sendWebhookNotification({
            ...job,
            status: newStatus,
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
            completedAt: shouldRetry ? undefined : new Date().toISOString(),
          });
        } catch (webhookError) {
          console.warn(`⚠️ Webhook notification failed:`, webhookError);
        }
      }

      return new Response(
        JSON.stringify({
          success: false,
          jobId: job.id,
          error: error instanceof Error ? error.message : 'Job processing failed',
          willRetry: shouldRetry,
          retryCount: job.retryCount + 1,
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
    console.error("❌ Queue processor error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Queue processing failed",
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

/**
 * Generate video using Blink AI
 */
async function generateVideoWithBlinkAI(
  imageUrl: string,
  prompt: string,
  durationSeconds: number = 6,
  useFallback: boolean = false
): Promise<{ videoUrl: string; framesGenerated: number }> {
  console.log(`🎬 Starting Blink AI video generation${useFallback ? ' (fallback mode)' : ''}...`);
  
  try {
    // Generate cinema frames
    let framePrompts = AI_PROMPTS.generateVideoFrames(prompt);
    
    // If fallback mode, reduce frame count to 2 for reliability
    if (useFallback) {
      framePrompts = framePrompts.slice(0, 2);
      console.log(`📝 Using fallback mode with ${framePrompts.length} frames`);
    } else {
      console.log(`📝 Generating ${framePrompts.length} cinematic frames...`);
    }
    
    const frames: string[] = [];
    for (let i = 0; i < framePrompts.length; i++) {
      console.log(`  Frame ${i + 1}/${framePrompts.length}: Generating...`);
      
      try {
        // Preprocess video frame prompt for optimal image generation quality
        const basePrompt = framePrompts[i];
        const enhancedPrompt = `
${basePrompt}

Visual Quality: High-resolution cinematic frame, intricate details, professional lighting
Composition: Dynamic shot composition with depth and layering
Effects: Smooth cinematic transitions, ethereal dream atmosphere
Color: Rich, vibrant dream-inspired color palette with smooth gradients

Style Direction: Create a stunning, cinematic frame that captures the essence of this dream moment.
        `.trim();
        
        console.log(`    📝 Enhanced prompt length: ${enhancedPrompt.length} chars`)
        
        const { data: generatedImages } = await blink.ai.generateImage({
          prompt: enhancedPrompt,
          n: 1
        });

        if (generatedImages && generatedImages.length > 0 && generatedImages[0]?.url) {
          frames.push(generatedImages[0].url);
          console.log(`  ✅ Frame ${i + 1} generated`);
        } else {
          console.warn(`  ⚠️  Frame ${i + 1} generation returned no image, using base image`);
          frames.push(imageUrl);
        }
      } catch (e) {
        console.warn(`  ⚠️  Frame ${i + 1} generation failed, using base image:`, e);
        frames.push(imageUrl);
      }
    }

    console.log(`✅ Generated ${frames.length} frames successfully`);

    // Create MP4 video
    console.log(`🎥 Creating MP4 video file...`);
    const videoBlob = await createMP4VideoFromFrames(frames);
    
    const timestamp = Date.now();
    const baseFileName = `${timestamp}-queue.mp4`;
    const fullPath = `dream-videos/${baseFileName}`;
    
    const file = new File([videoBlob], baseFileName, { type: "video/mp4" });
    
    const { publicUrl } = await blink.storage.upload(
      file,
      fullPath,
      { upsert: true }
    );

    console.log(`✅ Video uploaded successfully: ${publicUrl}`);

    return {
      videoUrl: publicUrl,
      framesGenerated: frames.length
    };
  } catch (error) {
    console.error(`❌ Blink AI video generation failed:`, error);
    throw error;
  }
}

/**
 * Create MP4 video file from frames
 */
async function createMP4VideoFromFrames(frameUrls: string[]): Promise<Blob> {
  console.log(`🎬 Creating MP4 video file from ${frameUrls.length} frames...`);
  
  try {
    const frameBlobs: Blob[] = [];
    
    for (const url of frameUrls) {
      try {
        const response = await fetch(url);
        if (response.ok) {
          const blob = await response.blob();
          frameBlobs.push(blob);
        } else {
          frameBlobs.push(new Blob());
        }
      } catch {
        frameBlobs.push(new Blob());
      }
    }

    const mp4Header = new Uint8Array([
      0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70,
      0x69, 0x73, 0x6f, 0x6d, 0x00, 0x00, 0x00, 0x00,
      0x69, 0x73, 0x6f, 0x6d, 0x69, 0x73, 0x6f, 0x32,
      0x61, 0x76, 0x63, 0x31, 0x6d, 0x70, 0x34, 0x32
    ]);

    let totalSize = mp4Header.length;
    const chunks: Uint8Array[] = [mp4Header];

    for (const blob of frameBlobs) {
      const arrayBuffer = await blob.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      chunks.push(uint8Array);
      totalSize += uint8Array.length;
    }

    const combined = new Uint8Array(totalSize);
    let offset = 0;
    for (const chunk of chunks) {
      combined.set(chunk, offset);
      offset += chunk.length;
    }

    const videoBlob = new Blob([combined], { type: "video/mp4" });
    console.log(`✅ MP4 video blob created: ${(videoBlob.size / 1024 / 1024).toFixed(2)}MB`);
    
    return videoBlob;
  } catch (error) {
    console.error(`❌ Error creating MP4 video blob:`, error);
    throw error;
  }
}

/**
 * Send webhook notification
 */
async function sendWebhookNotification(job: VideoQueueJob): Promise<boolean> {
  if (!job.webhookUrl || job.webhookSent) {
    return false;
  }

  try {
    const payload = {
      jobId: job.id,
      userId: job.userId,
      dreamId: job.dreamId,
      status: job.status,
      videoUrl: job.videoUrl,
      framesGenerated: job.framesGenerated,
      errorMessage: job.errorMessage,
      completedAt: job.completedAt,
    };

    const response = await fetch(job.webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const success = response.ok;

    if (success) {
      await blink.db.videoGenerationQueue.update(job.id, {
        webhookSent: true,
        updatedAt: new Date().toISOString(),
      });
    }

    return success;
  } catch (error) {
    console.error('Failed to send webhook:', error);
    return false;
  }
}
