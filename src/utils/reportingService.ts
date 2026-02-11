/**
 * Community Dream Reporting Service
 * Handles user reports with anonymity protection
 */

import { blink } from '../blink/client'
import type { ReportReason } from '../types/moderation'

/**
 * Hash reporter ID to protect anonymity using SHA-256
 * @param userId - The user ID to hash
 * @returns Irreversible hash of the user ID (cannot be reversed)
 */
async function hashReporterId(userId: string): Promise<string> {
  try {
    // Add app salt to make rainbow table attacks more difficult
    const salt = import.meta.env.VITE_APP_SALT || 'dreamcatcher-salt'
    const encoder = new TextEncoder()
    const data = encoder.encode(userId + salt)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  } catch (error) {
    console.error('Error hashing reporter ID:', error)
    throw new Error('Failed to hash reporter ID')
  }
}

/**
 * Report a community dream
 * Reporter ID is anonymized via SHA-256 hash before storage
 *
 * @param dreamId - The ID of the dream being reported
 * @param reason - The reason for reporting
 * @param details - Optional additional details from reporter
 * @returns Success status and report ID (or error)
 */
export async function reportDream(
  dreamId: string,
  reason: ReportReason,
  details?: string
): Promise<{ success: boolean; reportId?: string; error?: string }> {
  try {
    // Get current user
    const user = await blink.auth.me()
    if (!user) {
      return { success: false, error: 'Must be logged in to report' }
    }

    // Hash reporter ID for anonymity
    const reporterHash = await hashReporterId(user.id)

    // Check if user already reported this dream (prevent spam)
    const existingReports = await blink.db.communityReports.list({
      where: {
        dreamId: dreamId,
        reporterIdHash: reporterHash
      },
      limit: 1
    })

    if (existingReports.length > 0) {
      return { success: false, error: 'You have already reported this dream' }
    }

    // Get dream to check content flags
    const dream = await blink.db.communityDreams.get(dreamId)

    if (!dream) {
      return { success: false, error: 'Dream not found' }
    }

    // Check content flags for auto-severity assessment
    let severityAuto = 0
    try {
      const flagResults = await blink.db.dreamContentFlags.list({
        where: { dreamId: dream.dreamId },
        limit: 1
      })

      if (flagResults.length > 0) {
        const flag = flagResults[0]
        // Convert 0-1 score to 0-3 severity level
        severityAuto = Math.ceil(parseFloat(String(flag.severityScore || '0')) * 3)
      }
    } catch (flagError) {
      console.error('Error getting content flags:', flagError)
      severityAuto = 0
    }

    // Create report
    const reportId = `rep_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    await blink.db.communityReports.create({
      id: reportId,
      dreamId,
      userId: user.id,
      reporterIdHash: reporterHash,
      reportReason: reason,
      reportDetails: details || null,
      status: 'pending',
      severityAuto,
      createdAt: new Date().toISOString()
    })

    // Increment report count on dream
    const currentCount = Number(dream.reportCount || 0)
    
    // Auto-set status to under_review if threshold reached
    const updateData: any = {
      reportCount: currentCount + 1
    }
    
    if (currentCount + 1 >= 3) {
      updateData.status = 'under_review'
    }

    await blink.db.communityDreams.update(dreamId, updateData)

    // Auto-moderation check: evaluate if content should be automatically hidden/removed
    // Import at runtime to avoid circular dependencies
    const { checkAutoModerationOnReport } = await import('./autoModerationService')
    
    try {
      const autoModResult = await checkAutoModerationOnReport(
        dreamId,
        dream.userId,
        `${dream.title} ${dream.description} ${dream.interpretation || ''}`
      )
      
      if (autoModResult.autoModerated) {
        console.log('[AUTO-MODERATION] Action taken on dream:', dreamId, autoModResult.result)
      }
    } catch (autoModError) {
      console.error('Auto-moderation check failed:', autoModError)
      // Continue even if auto-moderation fails
    }

    return { success: true, reportId }
  } catch (error) {
    console.error('Error reporting dream:', error)
    return { success: false, error: 'Failed to submit report' }
  }
}

/**
 * Get the count of pending reports for dashboard badge
 */
export async function getPendingReportCount(): Promise<number> {
  try {
    const count = await blink.db.communityReports.count({
      where: { status: 'pending' }
    })
    return count
  } catch (error) {
    console.error('Error getting pending report count:', error)
    return 0
  }
}

/**
 * Get all reports for a specific dream
 */
export async function getDreamReports(dreamId: string): Promise<any[]> {
  try {
    const reports = await blink.db.communityReports.list({
      where: { dreamId },
      orderBy: { createdAt: 'desc' }
    })
    return reports
  } catch (error) {
    console.error('Error getting dream reports:', error)
    return []
  }
}

/**
 * Get total report statistics for dashboard
 */
export async function getReportStatistics(): Promise<{
  totalReports: number
  pendingReports: number
  reviewedReports: number
  dismissedReports: number
  actionedReports: number
}> {
  try {
    // We can't do complex aggregation with simple CRUD easily in one go efficiently without SQL on server.
    // But since this is client-side code, we must use CRUD.
    // If there are many reports, fetching all might be slow. 
    // Best approach given constraints: fetch counts separately or fetch all if not too many.
    // Let's fetch counts separately for status.
    
    // Actually, blink.db.communityReports.count() allows filtering.
    // We need 5 counts.
    
    const [total, pending, reviewed, dismissed, actioned] = await Promise.all([
      blink.db.communityReports.count(),
      blink.db.communityReports.count({ where: { status: 'pending' } }),
      blink.db.communityReports.count({ where: { status: 'reviewed' } }),
      blink.db.communityReports.count({ where: { status: 'dismissed' } }),
      blink.db.communityReports.count({ where: { status: 'actioned' } })
    ])

    return {
      totalReports: total,
      pendingReports: pending,
      reviewedReports: reviewed,
      dismissedReports: dismissed,
      actionedReports: actioned
    }
  } catch (error) {
    console.error('Error getting report statistics:', error)
    return {
      totalReports: 0,
      pendingReports: 0,
      reviewedReports: 0,
      dismissedReports: 0,
      actionedReports: 0
    }
  }
}
