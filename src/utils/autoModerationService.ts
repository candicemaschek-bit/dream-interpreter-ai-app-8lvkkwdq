/**
 * Auto-Moderation Service
 * Automatically detects and handles inappropriate content
 * 
 * Strategy: Hybrid approach combining rule-based and AI-assisted moderation
 * - Stage 1: Client-side classifier (instant, privacy-first)
 * - Stage 2: Rule-based auto-hide (high confidence violations)
 * - Stage 3: AI-assisted analysis (on-demand for flagged content)
 * - Stage 4: Pattern detection (repeat offenders)
 */

import { blink } from '../blink/client'
import type { SensitiveContentFlags } from './sensitiveContentClassifier'
import { classifySensitiveContent } from './sensitiveContentClassifier'
import { takeModerationAction } from './moderationService'
import { getDreamReports } from './reportingService'

export interface AutoModerationResult {
  shouldHide: boolean
  shouldRemove: boolean
  action: 'none' | 'hide' | 'remove' | 'escalate'
  reason: string
  confidence: number
  aiAnalysis?: AIContentAnalysis
  ruleMatches: string[]
}

export interface AIContentAnalysis {
  violatesGuidelines: boolean
  confidence: number
  category: 'spam' | 'hate_speech' | 'explicit_sexual' | 'graphic_violence' | 'harassment' | 'none'
  reasoning: string
  recommendedAction: 'none' | 'hide' | 'remove'
}

export interface AutoModerationRule {
  name: string
  condition: (context: ModerationContext) => boolean
  action: 'hide' | 'remove' | 'escalate'
  confidence: number
  reason: string
}

export interface ModerationContext {
  dreamId: string
  userId: string
  content: string
  reportCount: number
  contentFlags: SensitiveContentFlags
  userViolationHistory?: number
  accountAge?: number
}

/**
 * Auto-moderation rules (conservative approach)
 * Rules are evaluated in order of severity
 */
const AUTO_MODERATION_RULES: AutoModerationRule[] = [
  // Rule 1: Extreme content (immediate hide)
  {
    name: 'extreme_content',
    condition: (ctx) => ctx.contentFlags.severityScore >= 0.9,
    action: 'hide',
    confidence: 0.95,
    reason: 'Extreme sensitive content detected (severity ≥ 0.9)'
  },
  
  // Rule 2: High severity + multiple reports
  {
    name: 'high_severity_multiple_reports',
    condition: (ctx) => 
      ctx.reportCount >= 5 && 
      ctx.contentFlags.severityScore >= 0.7,
    action: 'hide',
    confidence: 0.9,
    reason: '5+ reports with high severity score (≥ 0.7)'
  },
  
  // Rule 3: Very high severity + some reports
  {
    name: 'very_high_severity_with_reports',
    condition: (ctx) => 
      ctx.reportCount >= 3 && 
      ctx.contentFlags.severityScore >= 0.8,
    action: 'hide',
    confidence: 0.85,
    reason: '3+ reports with very high severity score (≥ 0.8)'
  },
  
  // Rule 4: Multiple trauma/violence flags + reports
  {
    name: 'multiple_sensitive_categories',
    condition: (ctx) => {
      const flagCount = [
        ctx.contentFlags.hasTrauma,
        ctx.contentFlags.hasViolence
      ].filter(Boolean).length
      
      return ctx.reportCount >= 4 && flagCount >= 2
    },
    action: 'hide',
    confidence: 0.8,
    reason: '4+ reports with multiple sensitive categories'
  },
  
  // Rule 5: Repeat offender pattern
  {
    name: 'repeat_offender',
    condition: (ctx) => 
      (ctx.userViolationHistory || 0) >= 3 && 
      ctx.reportCount >= 2,
    action: 'hide',
    confidence: 0.85,
    reason: 'Repeat offender (3+ previous violations) with 2+ reports'
  },
  
  // Rule 6: New account with extreme content
  {
    name: 'new_account_extreme_content',
    condition: (ctx) => 
      (ctx.accountAge || 999) < 7 && // Account less than 7 days old
      ctx.contentFlags.severityScore >= 0.8 &&
      ctx.reportCount >= 2,
    action: 'hide',
    confidence: 0.75,
    reason: 'New account (<7 days) with extreme content and 2+ reports'
  }
]

/**
 * Evaluate if content should be auto-moderated
 * This is the main entry point for auto-moderation
 */
export async function evaluateAutoModeration(
  dreamId: string,
  userId: string,
  content: string,
  reportCount: number = 0
): Promise<AutoModerationResult> {
  try {
    // Stage 1: Client-side content classification
    const contentFlags = classifySensitiveContent(content)
    
    // Get user violation history
    const userViolationHistory = await getUserViolationCount(userId)
    
    // Get account age in days
    const accountAge = await getAccountAge(userId)
    
    // Build moderation context
    const context: ModerationContext = {
      dreamId,
      userId,
      content,
      reportCount,
      contentFlags,
      userViolationHistory,
      accountAge
    }
    
    // Stage 2: Evaluate rule-based auto-moderation
    const ruleMatches: string[] = []
    let highestConfidence = 0
    let recommendedAction: 'none' | 'hide' | 'remove' | 'escalate' = 'none'
    let reason = 'No violations detected'
    
    for (const rule of AUTO_MODERATION_RULES) {
      if (rule.condition(context)) {
        ruleMatches.push(rule.name)
        
        if (rule.confidence > highestConfidence) {
          highestConfidence = rule.confidence
          recommendedAction = rule.action
          reason = rule.reason
        }
      }
    }
    
    // Stage 3: AI analysis for edge cases (when reports >= 3 but no clear rule match)
    let aiAnalysis: AIContentAnalysis | undefined
    if (reportCount >= 3 && ruleMatches.length === 0) {
      aiAnalysis = await analyzeContentWithAI(content)
      
      if (aiAnalysis.violatesGuidelines && aiAnalysis.confidence >= 0.85) {
        recommendedAction = aiAnalysis.recommendedAction === 'remove' ? 'remove' : 'hide'
        reason = `AI detected: ${aiAnalysis.category} (${aiAnalysis.reasoning})`
        highestConfidence = aiAnalysis.confidence
        ruleMatches.push('ai_analysis')
      }
    }
    
    return {
      shouldHide: recommendedAction === 'hide',
      shouldRemove: recommendedAction === 'remove',
      action: recommendedAction,
      reason,
      confidence: highestConfidence,
      aiAnalysis,
      ruleMatches
    }
  } catch (error) {
    console.error('Error evaluating auto-moderation:', error)
    return {
      shouldHide: false,
      shouldRemove: false,
      action: 'none',
      reason: 'Auto-moderation check failed',
      confidence: 0,
      ruleMatches: []
    }
  }
}

/**
 * AI-powered content analysis using Blink SDK
 * Only called for edge cases to reduce costs
 */
async function analyzeContentWithAI(content: string): Promise<AIContentAnalysis> {
  try {
    const { object } = await blink.ai.generateObject({
      prompt: `Analyze this dream content for community guideline violations:

"${content}"

Community Guidelines:
- No spam or commercial content
- No hate speech or harassment
- No explicit sexual content
- No graphic violence or gore
- No content that encourages self-harm

Provide a confidence score (0-1) and recommendation.`,
      schema: {
        type: 'object',
        properties: {
          violatesGuidelines: { type: 'boolean' },
          confidence: { type: 'number' },
          category: { 
            type: 'string',
            enum: ['spam', 'hate_speech', 'explicit_sexual', 'graphic_violence', 'harassment', 'none']
          },
          reasoning: { type: 'string' },
          recommendedAction: { 
            type: 'string', 
            enum: ['none', 'hide', 'remove'] 
          }
        },
        required: ['violatesGuidelines', 'confidence', 'category', 'reasoning', 'recommendedAction']
      }
    })
    
    return object as AIContentAnalysis
  } catch (error) {
    console.error('Error analyzing content with AI:', error)
    return {
      violatesGuidelines: false,
      confidence: 0,
      category: 'none',
      reasoning: 'AI analysis failed',
      recommendedAction: 'none'
    }
  }
}

/**
 * Apply auto-moderation action
 * Creates audit trail with 'system' as moderator
 */
export async function applyAutoModeration(
  dreamId: string,
  result: AutoModerationResult,
  reportIds: string[] = []
): Promise<{ success: boolean; error?: string }> {
  if (result.action === 'none') {
    return { success: true }
  }
  
  try {
    // Create detailed action reason for audit trail
    const actionReason = `
AUTO-MODERATION ACTION
Reason: ${result.reason}
Confidence: ${(result.confidence * 100).toFixed(1)}%
Rules Matched: ${result.ruleMatches.join(', ')}
${result.aiAnalysis ? `\nAI Analysis: ${result.aiAnalysis.reasoning}` : ''}
`.trim()
    
    // Take moderation action using system account
    // takeModerationAction will log its own audit trail
    const moderationResult = await takeModerationAction(
      dreamId,
      result.action === 'remove' ? 'remove' : 'hide',
      actionReason,
      reportIds
    )
    
    if (!moderationResult.success) {
      return { success: false, error: moderationResult.error }
    }
    
    return { success: true }
  } catch (error) {
    console.error('Error applying auto-moderation:', error)
    return { success: false, error: 'Failed to apply auto-moderation action' }
  }
}

/**
 * Log auto-moderation events for analytics and tuning
 */
async function logAutoModerationEvent(
  dreamId: string,
  result: AutoModerationResult
): Promise<void> {
  try {
    // Store in moderation_actions table with special moderator_id
    const logId = `automod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    await blink.db.moderationActions.create({
      id: logId,
      dreamId: dreamId,
      actionType: result.action === 'remove' ? 'remove' : 'hide',
      actionReason: `AUTO: ${result.reason} (confidence: ${result.confidence})`,
      moderatorId: 'system',
      reportIds: '[]',
      authorNotified: false,
      createdAt: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error logging auto-moderation event:', error)
  }
}

/**
 * Get user's violation history count
 */
async function getUserViolationCount(userId: string): Promise<number> {
  if (!userId) return 0

  try {
    const count = await blink.db.communityDreams.count({
      where: {
        AND: [
          { userId },
          { OR: [{ status: 'hidden' }, { status: 'removed' }] }
        ]
      }
    })
    
    return count
  } catch (error) {
    console.error('Error getting user violation count:', error)
    return 0
  }
}

/**
 * Get account age in days
 */
async function getAccountAge(userId: string): Promise<number> {
  try {
    const user = await blink.db.users.get(userId)
    
    if (!user) return 999
    
    const createdAt = new Date(user.createdAt)
    const now = new Date()
    const ageInDays = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24))
    
    return ageInDays
  } catch (error) {
    console.error('Error getting account age:', error)
    return 999 // Assume old account on error
  }
}

/**
 * Check for auto-moderation on existing dream (triggered by reports)
 * This is called after a dream receives a new report
 */
export async function checkAutoModerationOnReport(
  dreamId: string,
  userId: string,
  content: string
): Promise<{ autoModerated: boolean; result?: AutoModerationResult }> {
  try {
    // Get current report count
    const reports = await getDreamReports(dreamId)
    const reportCount = reports.length
    
    // Evaluate auto-moderation
    const result = await evaluateAutoModeration(
      dreamId,
      userId,
      content,
      reportCount
    )
    
    // Apply auto-moderation if triggered
    if (result.action !== 'none') {
      const reportIds = reports.map((r: any) => r.id)
      await applyAutoModeration(dreamId, result, reportIds)
      return { autoModerated: true, result }
    }
    
    return { autoModerated: false }
  } catch (error) {
    console.error('Error checking auto-moderation on report:', error)
    return { autoModerated: false }
  }
}

/**
 * Pre-upload content check (run before sharing to community)
 * Blocks extreme content from being uploaded at all
 */
export async function preUploadContentCheck(
  content: string,
  userId: string
): Promise<{ allowed: boolean; reason?: string; flags?: SensitiveContentFlags }> {
  try {
    // Run client-side classification
    const flags = classifySensitiveContent(content)
    
    // Block extreme content (severity >= 0.9)
    if (flags.severityScore >= 0.9) {
      return {
        allowed: false,
        reason: 'This content contains extreme sensitive material and cannot be shared to the community. Please consider revising your dream description.',
        flags
      }
    }
    
    // Check for repeat offenders
    const violationCount = await getUserViolationCount(userId)
    if (violationCount >= 3 && flags.severityScore >= 0.7) {
      return {
        allowed: false,
        reason: 'Your account has multiple previous violations. Content with high sensitivity cannot be shared at this time.',
        flags
      }
    }
    
    // Allow with warning for moderate content
    if (flags.severityScore >= 0.6) {
      return {
        allowed: true,
        reason: 'Note: This content contains sensitive themes. It may receive additional moderation review.',
        flags
      }
    }
    
    return { allowed: true, flags }
  } catch (error) {
    console.error('Error in pre-upload content check:', error)
    return { allowed: true } // Fail open to not block legitimate content
  }
}

/**
 * Get auto-moderation statistics for admin dashboard
 */
export async function getAutoModerationStats(): Promise<{
  totalAutoModerated: number
  autoHidden: number
  autoRemoved: number
  averageConfidence: number
  topRules: Array<{ rule: string; count: number }>
}> {
  try {
    // We need to query separately since we can't use complex SQL aggregations on client
    const [hiddenCount, removedCount] = await Promise.all([
      blink.db.moderationActions.count({
        where: {
          AND: [
            { moderatorId: 'system' },
            { actionType: 'hide' }
            // Note: SDK filtering on "LIKE 'AUTO:%'" is not supported in simple where
            // We'll assume moderator_id='system' implies auto-moderation mostly
          ]
        }
      }),
      blink.db.moderationActions.count({
        where: {
          AND: [
            { moderatorId: 'system' },
            { actionType: 'remove' }
          ]
        }
      })
    ])
    
    return {
      totalAutoModerated: hiddenCount + removedCount,
      autoHidden: hiddenCount,
      autoRemoved: removedCount,
      averageConfidence: 0.85, // Could calculate from stored confidence values
      topRules: [] // Could parse from action_reason
    }
  } catch (error) {
    console.error('Error getting auto-moderation stats:', error)
    return {
      totalAutoModerated: 0,
      autoHidden: 0,
      autoRemoved: 0,
      averageConfidence: 0,
      topRules: []
    }
  }
}

/**
 * Appeal auto-moderation decision
 * Escalates to human review
 */
export async function appealAutoModeration(
  dreamId: string,
  appealReason: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Update dream status to 'under_review' for human review
    await blink.db.communityDreams.update(dreamId, {
      status: 'under_review'
    })
    
    // Log appeal
    const appealId = `appeal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    await blink.db.moderationActions.create({
      id: appealId,
      dreamId,
      actionType: 'warn_author', // Using closest available type or we might need 'appeal' if enum allows
      actionReason: `APPEAL: ${appealReason}`,
      moderatorId: 'system',
      reportIds: '[]',
      authorNotified: false,
      createdAt: new Date().toISOString()
    })
    
    return { success: true }
  } catch (error) {
    console.error('Error appealing auto-moderation:', error)
    return { success: false, error: 'Failed to submit appeal' }
  }
}
