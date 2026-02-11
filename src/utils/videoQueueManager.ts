/**
 * Video Queue Manager
 * Handles video generation queue, rate limiting, and webhook notifications
 */

import { blink } from '../blink/client';
import type { SubscriptionTier } from '../config/tierCapabilities';
import { withDbRateLimitGuard } from './rateLimitGuard';

/**
 * Cache for queue status to prevent excessive DB calls
 */
interface QueueStatusCache {
  data: {
    pending: number;
    processing: number;
    completed: number;
    failed: number;
    jobs: VideoQueueJob[];
  };
  timestamp: number;
  userId: string;
}

interface VideoLimitsCache {
  data: {
    limit: number;
    used: number;
    remaining: number;
    resetDate: string;
  };
  timestamp: number;
  userId: string;
  tier: SubscriptionTier;
}

// Cache storage
let queueStatusCache: QueueStatusCache | null = null;
let videoLimitsCache: VideoLimitsCache | null = null;
const CACHE_TTL_MS = 30000; // 30 seconds cache

// Request deduplication
let pendingQueueStatusRequest: Promise<any> | null = null;
let pendingVideoLimitsRequest: Promise<any> | null = null;

/**
 * Clear all caches (useful for forcing refresh after actions)
 */
export function clearVideoQueueCache(): void {
  queueStatusCache = null;
  videoLimitsCache = null;
}

export interface VideoQueueJob {
  id: string;
  userId: string;
  dreamId?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  priority: number;
  imageUrl: string;
  prompt: string;
  subscriptionTier: SubscriptionTier;
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

export interface VideoGenerationLimits {
  id: string;
  userId: string;
  subscriptionTier: SubscriptionTier;
  videosGeneratedThisMonth: number;
  lastResetDate: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Video generation limits per tier
 * Only VIP tier has access to Dreamworlds (45-second cinematic videos)
 */
export const VIDEO_LIMITS: Record<SubscriptionTier, number> = {
  free: 0,      // No video generation for free tier
  pro: 0,       // No video generation for Pro tier
  premium: 20,  // 20 videos per month for Premium tier
  vip: 25,      // 25 videos per month for VIP (includes 1 Dreamworld)
};

/**
 * Priority levels for queue processing
 */
export const PRIORITY_LEVELS = {
  vip: 100,     // VIP users get highest priority
  premium: 50,  // Premium users get medium priority
  pro: 25,      // Pro users (if enabled in future)
  free: 0,      // Free users (if enabled in future)
};

/**
 * Generate unique ID for queue jobs
 */
function generateJobId(): string {
  return `vq_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generate unique ID for limits tracking
 */
function generateLimitId(): string {
  return `vl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Check if user has reached video generation limit
 */
export async function checkVideoLimit(
  userId: string,
  tier: SubscriptionTier
): Promise<{ allowed: boolean; remaining: number; limit: number; resetDate: string }> {
  const limit = VIDEO_LIMITS[tier];
  
  // If tier has no video access, deny immediately
  if (limit === 0) {
    return {
      allowed: false,
      remaining: 0,
      limit: 0,
      resetDate: getNextMonthResetDate(),
    };
  }

  // Get or create usage record
  const usage = await getOrCreateVideoLimits(userId, tier);
  
  // Check if we need to reset monthly counter
  if (shouldResetMonthlyUsage(usage.lastResetDate)) {
    await resetMonthlyVideoLimits(userId, tier);
    return {
      allowed: true,
      remaining: limit - 1,
      limit,
      resetDate: getNextMonthResetDate(),
    };
  }

  const remaining = Math.max(0, limit - usage.videosGeneratedThisMonth);
  
  return {
    allowed: remaining > 0,
    remaining: remaining > 0 ? remaining - 1 : 0,
    limit,
    resetDate: getNextMonthResetDate(),
  };
}

/**
 * Get or create video limits record for user
 */
async function getOrCreateVideoLimits(
  userId: string,
  tier: SubscriptionTier
): Promise<VideoGenerationLimits> {
  const existing = await withDbRateLimitGuard(`videoQueue:limits:${userId}`, () =>
    blink.db.videoGenerationLimits.list({
      where: { userId },
      limit: 1,
    })
  );

  if (existing.length > 0) {
    return existing[0] as VideoGenerationLimits;
  }

  // Create new record
  const newLimits: VideoGenerationLimits = {
    id: generateLimitId(),
    userId,
    subscriptionTier: tier,
    videosGeneratedThisMonth: 0,
    lastResetDate: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await blink.db.videoGenerationLimits.create(newLimits);
  return newLimits;
}

/**
 * Determine if monthly usage should be reset
 */
function shouldResetMonthlyUsage(lastResetDate: string): boolean {
  const last = new Date(lastResetDate);
  const now = new Date();
  return last.getFullYear() !== now.getFullYear() || last.getMonth() !== now.getMonth();
}

/**
 * Reset monthly video limits for user
 */
async function resetMonthlyVideoLimits(userId: string, tier: SubscriptionTier): Promise<void> {
  const existing = await withDbRateLimitGuard(`videoQueue:limits:${userId}`, () =>
    blink.db.videoGenerationLimits.list({
      where: { userId },
      limit: 1,
    })
  );

  if (existing.length > 0) {
    await blink.db.videoGenerationLimits.update(existing[0].id, {
      videosGeneratedThisMonth: 0,
      subscriptionTier: tier,
      lastResetDate: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }
}

/**
 * Get next month's reset date
 */
function getNextMonthResetDate(): string {
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return nextMonth.toISOString();
}

/**
 * Add video generation job to queue
 */
export async function addToQueue(params: {
  userId: string;
  dreamId?: string;
  imageUrl: string;
  prompt: string;
  subscriptionTier: SubscriptionTier;
  durationSeconds: number;
  webhookUrl?: string;
}): Promise<{ success: boolean; jobId?: string; error?: string }> {
  try {
    // Check if user is within limits
    const limitCheck = await checkVideoLimit(params.userId, params.subscriptionTier);
    
    if (!limitCheck.allowed) {
      return {
        success: false,
        error: `Video generation limit reached. You have ${limitCheck.remaining} videos remaining this month. Limit resets on ${new Date(limitCheck.resetDate).toLocaleDateString()}.`,
      };
    }

    // Determine priority based on tier
    const priority = PRIORITY_LEVELS[params.subscriptionTier];

    // Create queue job
    const job: VideoQueueJob = {
      id: generateJobId(),
      userId: params.userId,
      dreamId: params.dreamId,
      status: 'pending',
      priority,
      imageUrl: params.imageUrl,
      prompt: params.prompt,
      subscriptionTier: params.subscriptionTier,
      durationSeconds: params.durationSeconds,
      framesGenerated: 0,
      webhookUrl: params.webhookUrl,
      webhookSent: false,
      retryCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await blink.db.videoGenerationQueue.create(job);

    // Increment usage counter
    await incrementVideoUsage(params.userId, params.subscriptionTier);

    return {
      success: true,
      jobId: job.id,
    };
  } catch (error) {
    console.error('Failed to add job to queue:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add to queue',
    };
  }
}

/**
 * Increment video usage counter
 */
async function incrementVideoUsage(userId: string, tier: SubscriptionTier): Promise<void> {
  const existing = await withDbRateLimitGuard(`videoQueue:limits:${userId}`, () =>
    blink.db.videoGenerationLimits.list({
      where: { userId },
      limit: 1,
    })
  );

  if (existing.length > 0) {
    const current = existing[0];
    await blink.db.videoGenerationLimits.update(current.id, {
      videosGeneratedThisMonth: Number(current.videosGeneratedThisMonth) + 1,
      subscriptionTier: tier,
      updatedAt: new Date().toISOString(),
    });
  }
}

/**
 * Get queue status for user
 */
export async function getQueueStatus(userId: string): Promise<{
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  jobs: VideoQueueJob[];
}> {
  // Check cache first
  const now = Date.now();
  if (
    queueStatusCache &&
    queueStatusCache.userId === userId &&
    now - queueStatusCache.timestamp < CACHE_TTL_MS
  ) {
    return queueStatusCache.data;
  }

  // Deduplicate concurrent requests
  if (pendingQueueStatusRequest) {
    return pendingQueueStatusRequest;
  }

  try {
    pendingQueueStatusRequest = (async () => {
      const jobs = await withDbRateLimitGuard(`videoQueue:status:${userId}`, () =>
        blink.db.videoGenerationQueue.list({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          limit: 50,
        })
      );

      const typedJobs = jobs as VideoQueueJob[];

      const result = {
        pending: typedJobs.filter(j => j.status === 'pending').length,
        processing: typedJobs.filter(j => j.status === 'processing').length,
        completed: typedJobs.filter(j => j.status === 'completed').length,
        failed: typedJobs.filter(j => j.status === 'failed').length,
        jobs: typedJobs,
      };

      // Update cache
      queueStatusCache = {
        data: result,
        timestamp: Date.now(),
        userId,
      };

      return result;
    })();

    return await pendingQueueStatusRequest;
  } catch (error) {
    console.error('Failed to get queue status:', error);
    // Return cached data on error if available
    if (queueStatusCache && queueStatusCache.userId === userId) {
      return queueStatusCache.data;
    }
    return {
      pending: 0,
      processing: 0,
      completed: 0,
      failed: 0,
      jobs: [],
    };
  } finally {
    pendingQueueStatusRequest = null;
  }
}

/**
 * Get next job from queue (highest priority first)
 */
export async function getNextJob(): Promise<VideoQueueJob | null> {
  try {
    const jobs = await blink.db.videoGenerationQueue.list({
      where: { status: 'pending' },
      orderBy: { priority: 'desc', createdAt: 'asc' },
      limit: 1,
    });

    return jobs.length > 0 ? (jobs[0] as VideoQueueJob) : null;
  } catch (error) {
    console.error('Failed to get next job:', error);
    return null;
  }
}

/**
 * Update job status
 */
export async function updateJobStatus(
  jobId: string,
  status: VideoQueueJob['status'],
  data?: {
    videoUrl?: string;
    framesGenerated?: number;
    errorMessage?: string;
  }
): Promise<void> {
  try {
    const updates: any = {
      status,
      updatedAt: new Date().toISOString(),
    };

    if (status === 'processing') {
      updates.startedAt = new Date().toISOString();
    }

    if (status === 'completed' || status === 'failed') {
      updates.completedAt = new Date().toISOString();
    }

    if (data?.videoUrl) {
      updates.videoUrl = data.videoUrl;
    }

    if (data?.framesGenerated !== undefined) {
      updates.framesGenerated = data.framesGenerated;
    }

    if (data?.errorMessage) {
      updates.errorMessage = data.errorMessage;
    }

    await blink.db.videoGenerationQueue.update(jobId, updates);
  } catch (error) {
    console.error('Failed to update job status:', error);
  }
}

/**
 * Send webhook notification for completed job
 */
export async function sendWebhookNotification(job: VideoQueueJob): Promise<boolean> {
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

    // Mark webhook as sent
    await blink.db.videoGenerationQueue.update(job.id, {
      webhookSent: success,
      updatedAt: new Date().toISOString(),
    });

    return success;
  } catch (error) {
    console.error('Failed to send webhook:', error);
    return false;
  }
}

/**
 * Get job by ID
 */
export async function getJob(jobId: string): Promise<VideoQueueJob | null> {
  try {
    const jobs = await blink.db.videoGenerationQueue.list({
      where: { id: jobId },
      limit: 1,
    });

    return jobs.length > 0 ? (jobs[0] as VideoQueueJob) : null;
  } catch (error) {
    console.error('Failed to get job:', error);
    return null;
  }
}

/**
 * Retry failed job
 */
export async function retryJob(jobId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const job = await getJob(jobId);
    
    if (!job) {
      return { success: false, error: 'Job not found' };
    }

    if (job.status !== 'failed') {
      return { success: false, error: 'Only failed jobs can be retried' };
    }

    if (job.retryCount >= 3) {
      return { success: false, error: 'Maximum retry attempts reached' };
    }

    await blink.db.videoGenerationQueue.update(jobId, {
      status: 'pending',
      retryCount: job.retryCount + 1,
      errorMessage: undefined,
      updatedAt: new Date().toISOString(),
    });

    return { success: true };
  } catch (error) {
    console.error('Failed to retry job:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to retry job',
    };
  }
}

/**
 * Get user's current usage and limits
 */
export async function getUserVideoLimits(
  userId: string,
  tier: SubscriptionTier
): Promise<{
  limit: number;
  used: number;
  remaining: number;
  resetDate: string;
}> {
  const limit = VIDEO_LIMITS[tier];
  
  if (limit === 0) {
    return {
      limit: 0,
      used: 0,
      remaining: 0,
      resetDate: getNextMonthResetDate(),
    };
  }

  // Check cache first
  const now = Date.now();
  if (
    videoLimitsCache &&
    videoLimitsCache.userId === userId &&
    videoLimitsCache.tier === tier &&
    now - videoLimitsCache.timestamp < CACHE_TTL_MS
  ) {
    return videoLimitsCache.data;
  }

  // Deduplicate concurrent requests
  if (pendingVideoLimitsRequest) {
    return pendingVideoLimitsRequest;
  }

  try {
    pendingVideoLimitsRequest = (async () => {
      const usage = await getOrCreateVideoLimits(userId, tier);
      
      // Check if we need to reset
      if (shouldResetMonthlyUsage(usage.lastResetDate)) {
        await resetMonthlyVideoLimits(userId, tier);
        const result = {
          limit,
          used: 0,
          remaining: limit,
          resetDate: getNextMonthResetDate(),
        };
        
        videoLimitsCache = {
          data: result,
          timestamp: Date.now(),
          userId,
          tier,
        };
        
        return result;
      }

      const used = usage.videosGeneratedThisMonth;
      const remaining = Math.max(0, limit - used);

      const result = {
        limit,
        used,
        remaining,
        resetDate: getNextMonthResetDate(),
      };
      
      videoLimitsCache = {
        data: result,
        timestamp: Date.now(),
        userId,
        tier,
      };

      return result;
    })();

    return await pendingVideoLimitsRequest;
  } catch (error) {
    console.error('Failed to get video limits:', error);
    if (videoLimitsCache && videoLimitsCache.userId === userId) {
      return videoLimitsCache.data;
    }
    return {
      limit,
      used: 0,
      remaining: limit,
      resetDate: getNextMonthResetDate(),
    };
  } finally {
    pendingVideoLimitsRequest = null;
  }
}
