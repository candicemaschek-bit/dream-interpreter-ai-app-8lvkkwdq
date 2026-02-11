/**
 * Cost Tracking Utility
 * Monitors API usage and estimates costs for Blink credit consumption
 * 
 * ⚠️ IMPORTANT: Cost constants are imported from src/config/tierCosts.ts
 * DO NOT define cost values here - use the central config instead.
 */

import { blink } from '../blink/client';
import {
  PRICING,
  IMAGE_COSTS,
  TEXT_MODEL_COSTS,
  VIDEO_COSTS,
  TTS_COSTS,
  STORAGE_COSTS,
  calculateTextGenerationCost as calcTextCost,
  calculateImageCost as calcImageCost,
  calculateTTSCost as calcTTSCost,
  type TextModelKey,
} from '../config/tierCosts';
import { supabaseService } from '../lib/supabaseService';

// Re-export PRICING for backward compatibility
export { PRICING };

export interface UsageLogEntry {
  id: string;
  userId: string;
  operationType: 'image_generation' | 'ai_interpretation' | 'video_generation' | 'text_generation';
  modelUsed?: string;
  tokensUsed: number;
  estimatedCostUsd: number;
  inputSize?: number;
  outputSize?: number;
  success: boolean;
  errorMessage?: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface MonthlySummary {
  userId: string;
  yearMonth: string;
  totalOperations: number;
  totalTokens: number;
  totalCostUsd: number;
  imageGenerations: number;
  aiInterpretations: number;
  videoGenerations: number;
  updatedAt: string;
}

/**
 * Generate unique ID for tracking entries
 */
function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Log API usage to database
 */
export async function logApiUsage(params: {
  userId: string;
  operationType: UsageLogEntry['operationType'];
  modelUsed?: string;
  tokensUsed?: number;
  estimatedCostUsd: number;
  inputSize?: number;
  outputSize?: number;
  success?: boolean;
  errorMessage?: string;
  metadata?: Record<string, any>;
}): Promise<void> {
  try {
    const client = supabaseService.supabase
    if (!client) return

    const entry = {
      id: generateId('log'),
      user_id: params.userId,
      operation_type: params.operationType,
      model_used: params.modelUsed || 'unknown',
      tokens_used: params.tokensUsed || 0,
      estimated_cost_usd: params.estimatedCostUsd,
      input_size: params.inputSize || 0,
      output_size: params.outputSize || 0,
      success: params.success !== false ? 1 : 0,
      error_message: params.errorMessage,
      metadata: params.metadata ? JSON.stringify(params.metadata) : '{}',
      created_at: new Date().toISOString(),
    };

    await client.from('api_usage_logs').insert(entry);

    // Update monthly summary
    await updateMonthlySummary(params.userId, params.operationType, params.estimatedCostUsd);
  } catch (error) {
    console.error('Failed to log API usage:', error);
  }
}

/**
 * Update monthly usage summary
 */
async function updateMonthlySummary(
  userId: string,
  operationType: UsageLogEntry['operationType'],
  cost: number
): Promise<void> {
  try {
    const client = supabaseService.supabase
    if (!client) return

    const now = new Date();
    const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // Try to get existing summary from Supabase
    const { data: summaries, error: fetchError } = await client
      .from('monthly_usage_summary')
      .select('*')
      .eq('user_id', userId)
      .eq('year_month', yearMonth)
      .limit(1);

    if (summaries && summaries.length > 0) {
      const summary = summaries[0];
      // Update existing summary
      await client
        .from('monthly_usage_summary')
        .update({
          total_operations: Number(summary.total_operations) + 1,
          total_cost_usd: Number(summary.total_cost_usd) + cost,
          image_generations:
            operationType === 'image_generation'
              ? Number(summary.image_generations) + 1
              : Number(summary.image_generations),
          ai_interpretations:
            operationType === 'ai_interpretation'
              ? Number(summary.ai_interpretations) + 1
              : Number(summary.ai_interpretations),
          video_generations:
            operationType === 'video_generation'
              ? Number(summary.video_generations) + 1
              : Number(summary.video_generations),
          updated_at: new Date().toISOString(),
        })
        .eq('id', summary.id);
    } else {
      // Create new summary
      await client.from('monthly_usage_summary').insert({
        id: generateId('summary'),
        user_id: userId,
        year_month: yearMonth,
        total_operations: 1,
        total_tokens: 0,
        total_cost_usd: cost,
        image_generations: operationType === 'image_generation' ? 1 : 0,
        ai_interpretations: operationType === 'ai_interpretation' ? 1 : 0,
        video_generations: operationType === 'video_generation' ? 1 : 0,
        updated_at: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error('Failed to update monthly summary:', error);
  }
}

/**
 * Calculate cost for image generation
 * Uses centralized costs from tierCosts.ts
 */
export function calculateImageGenerationCost(imageCount: number = 1): number {
  return calcImageCost(imageCount, true);
}

/**
 * Calculate cost for text generation
 * Uses centralized costs from tierCosts.ts
 */
export function calculateTextGenerationCost(
  model: TextModelKey,
  inputTokens: number,
  outputTokens: number
): number {
  return calcTextCost(model, inputTokens, outputTokens);
}

/**
 * Calculate cost for video generation
 * @deprecated Use calculateVideoCost from tierCosts.ts for new video cost model
 */
export function calculateVideoGenerationCost(durationSeconds: number): number {
  return VIDEO_COSTS.BASE_PROCESSING + 
         (durationSeconds * 0.05); // Legacy calculation for backward compatibility
}

/**
 * Calculate cost for TTS generation
 * Uses centralized costs from tierCosts.ts
 * @param characterCount - Number of characters to convert to speech
 * @returns Estimated cost in USD
 */
export function calculateTTSCost(characterCount: number): number {
  return calcTTSCost(characterCount);
}

/**
 * Estimate TTS duration in seconds
 * @param characterCount - Number of characters to convert to speech
 * @returns Estimated duration in seconds
 */
export function estimateTTSDuration(characterCount: number): number {
  const wordCount = characterCount / TTS_COSTS.CHARACTERS_PER_WORD;
  const durationMinutes = wordCount / TTS_COSTS.AVERAGE_WORDS_PER_MINUTE;
  return Math.ceil(durationMinutes * 60);
}

/**
 * Get user's monthly usage
 */
export async function getUserMonthlyUsage(userId: string): Promise<MonthlySummary | null> {
  try {
    const client = supabaseService.supabase
    if (!client) return null

    const now = new Date();
    const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const { data: summaries, error } = await client
      .from('monthly_usage_summary')
      .select('*')
      .eq('user_id', userId)
      .eq('year_month', yearMonth)
      .limit(1);

    if (summaries && summaries.length > 0) {
      const summary = summaries[0];
      return {
        userId: summary.user_id,
        yearMonth: summary.year_month,
        totalOperations: Number(summary.total_operations),
        totalTokens: Number(summary.total_tokens),
        totalCostUsd: Number(summary.total_cost_usd),
        imageGenerations: Number(summary.image_generations),
        aiInterpretations: Number(summary.ai_interpretations),
        videoGenerations: Number(summary.video_generations),
        updatedAt: summary.updated_at,
      };
    }

    return null;
  } catch (error) {
    console.error('Failed to get monthly usage:', error);
    return null;
  }
}

/**
 * Get detailed usage logs for a user
 */
export async function getUserUsageLogs(
  userId: string,
  options?: {
    limit?: number;
    operationType?: UsageLogEntry['operationType'];
    startDate?: string;
    endDate?: string;
  }
): Promise<UsageLogEntry[]> {
  try {
    const client = supabaseService.supabase
    if (!client) return []

    let query = client
      .from('api_usage_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(options?.limit || 100);
    
    if (options?.operationType) {
      query = query.eq('operation_type', options.operationType);
    }

    const { data: logs, error } = await query;

    if (!logs) return [];

    return logs.map(log => ({
      id: log.id,
      userId: log.user_id,
      operationType: log.operation_type as UsageLogEntry['operationType'],
      modelUsed: log.model_used,
      tokensUsed: Number(log.tokens_used),
      estimatedCostUsd: Number(log.estimated_cost_usd),
      inputSize: Number(log.input_size),
      outputSize: Number(log.output_size),
      success: Number(log.success) > 0,
      errorMessage: log.error_message,
      metadata: log.metadata ? JSON.parse(log.metadata as string) : {},
      createdAt: log.created_at,
    }));
  } catch (error) {
    console.error('Failed to get usage logs:', error);
    return [];
  }
}

/**
 * Calculate projected monthly cost based on current usage
 */
export async function calculateProjectedMonthlyCost(userId: string): Promise<{
  currentCost: number;
  projectedCost: number;
  daysElapsed: number;
  daysInMonth: number;
}> {
  const summary = await getUserMonthlyUsage(userId);
  
  if (!summary) {
    return {
      currentCost: 0,
      projectedCost: 0,
      daysElapsed: 0,
      daysInMonth: 30,
    };
  }

  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysElapsed = now.getDate();
  
  const projectedCost = summary.totalCostUsd * (daysInMonth / daysElapsed);

  return {
    currentCost: summary.totalCostUsd,
    projectedCost,
    daysElapsed,
    daysInMonth,
  };
}

/**
 * Get cost breakdown by operation type
 */
export async function getCostBreakdown(userId: string): Promise<{
  imageGeneration: number;
  aiInterpretation: number;
  videoGeneration: number;
  total: number;
}> {
  try {
    const logs = await getUserUsageLogs(userId);
    
    const breakdown = {
      imageGeneration: 0,
      aiInterpretation: 0,
      videoGeneration: 0,
      total: 0,
    };

    logs.forEach(log => {
      if (log.success) {
        breakdown.total += log.estimatedCostUsd;
        
        switch (log.operationType) {
          case 'image_generation':
            breakdown.imageGeneration += log.estimatedCostUsd;
            break;
          case 'ai_interpretation':
            breakdown.aiInterpretation += log.estimatedCostUsd;
            break;
          case 'video_generation':
            breakdown.videoGeneration += log.estimatedCostUsd;
            break;
        }
      }
    });

    return breakdown;
  } catch (error) {
    console.error('Failed to get cost breakdown:', error);
    return {
      imageGeneration: 0,
      aiInterpretation: 0,
      videoGeneration: 0,
      total: 0,
    };
  }
}

/**
 * Log ReflectAI usage
 * Tracks text generation calls for the dream reflection feature
 */
export async function logReflectAIUsage(params: {
  userId: string
  sessionId: string
  tokensUsed: number
  estimatedCostUsd: number
  messageRole: 'user' | 'assistant'
}): Promise<void> {
  try {
    await logApiUsage({
      userId: params.userId,
      operationType: 'text_generation',
      modelUsed: 'gpt-4.1-mini',
      tokensUsed: params.tokensUsed,
      estimatedCostUsd: params.estimatedCostUsd,
      metadata: {
        sessionId: params.sessionId,
        messageRole: params.messageRole,
        feature: 'reflect_ai'
      }
    })
  } catch (error) {
    console.error('Failed to log ReflectAI usage:', error)
  }
}

/**
 * Calculate estimated cost for ReflectAI message
 * Based on gpt-4.1-mini pricing with estimated tokens
 * Uses centralized costs from tierCosts.ts
 */
export function estimateReflectAICost(
  inputTokens: number,
  outputTokens: number
): number {
  return calcTextCost('gpt-4.1-mini', inputTokens, outputTokens)
}