/**
 * ReflectAI Types
 * Types for the ReflectAI dream reflection and journaling feature
 */

import type { SubscriptionTier } from './subscription'

/**
 * ReflectAI Credits database type
 */
export interface ReflectAICreditsRow {
  id: string
  userId: string
  subscriptionTier: 'premium' | 'vip'
  creditsTotal: number
  creditsUsed: number
  creditsRemaining: number
  resetDate: string
  createdAt: string
  updatedAt: string
}

/**
 * ReflectAI Credits application type
 */
export interface ReflectAICredits {
  userId: string
  tier: 'premium' | 'vip'
  creditsTotal: number
  creditsUsed: number
  creditsRemaining: number
  resetDate: string
}

/**
 * Reflection Session database type
 */
export interface ReflectionSessionRow {
  id: string
  userId: string
  dreamId?: string
  sessionType: 'dream_reflection' | 'free_journaling' | 'pattern_exploration'
  creditsConsumed: number
  messageCount: number
  createdAt: string
  updatedAt: string
}

/**
 * Reflection Session application type
 */
export interface ReflectionSession {
  id: string
  userId: string
  dreamId?: string
  sessionType: 'dream_reflection' | 'free_journaling' | 'pattern_exploration'
  creditsConsumed: number
  messageCount: number
  createdAt: string
  updatedAt: string
}

/**
 * Reflection Message database type
 */
export interface ReflectionMessageRow {
  id: string
  sessionId: string
  role: 'user' | 'assistant'
  content: string
  tokenCount: number
  emotionalTags?: string // JSON array
  referencedDreams?: string // JSON array
  createdAt: string
}

/**
 * Reflection Message application type
 */
export interface ReflectionMessage {
  id: string
  sessionId: string
  role: 'user' | 'assistant'
  content: string
  tokenCount: number
  emotionalTags?: string[]
  referencedDreams?: string[]
  createdAt: string
}

/**
 * Conversion helpers for database rows to application types
 */

export function castReflectionMessage(
  row: ReflectionMessageRow
): ReflectionMessage {
  return {
    id: row.id,
    sessionId: row.sessionId,
    role: row.role,
    content: row.content,
    tokenCount: Number(row.tokenCount) || 0,
    emotionalTags: row.emotionalTags
      ? JSON.parse(row.emotionalTags)
      : undefined,
    referencedDreams: row.referencedDreams
      ? JSON.parse(row.referencedDreams)
      : undefined,
    createdAt: row.createdAt
  }
}

export function toReflectionMessageRow(
  msg: Partial<ReflectionMessage>
): Partial<ReflectionMessageRow> {
  return {
    emotionalTags: msg.emotionalTags
      ? JSON.stringify(msg.emotionalTags)
      : undefined,
    referencedDreams: msg.referencedDreams
      ? JSON.stringify(msg.referencedDreams)
      : undefined,
    tokenCount: msg.tokenCount
  }
}
