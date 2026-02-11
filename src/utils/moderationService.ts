/**
 * Moderation Service
 * Admin enforcement actions and audit trail management
 */

import { blink } from '../blink/client'
import type { ModerationActionType } from '../types/moderation'

/**
 * Take a moderation action on a community dream
 * Logs to audit trail and updates dream status
 *
 * @param dreamId - The dream being moderated
 * @param actionType - Type of action to take
 * @param actionReason - Human-readable reason for action
 * @param reportIds - Which reports triggered this action
 * @returns Success status or error
 */
export async function takeModerationAction(
  dreamId: string,
  actionType: ModerationActionType,
  actionReason: string,
  reportIds: string[]
): Promise<{ success: boolean; error?: string; actionId?: string }> {
  try {
    const moderator = await blink.auth.me()
    if (!moderator) {
      return { success: false, error: 'Not authenticated' }
    }

    // Create audit trail entry
    const actionId = `act_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    await blink.db.sql(
      `INSERT INTO moderation_actions
       (id, dream_id, action_type, action_reason, moderator_id, report_ids, author_notified, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 0, ?)`,
      [
        actionId,
        dreamId,
        actionType,
        actionReason,
        moderator.id,
        JSON.stringify(reportIds),
        new Date().toISOString()
      ]
    )

    // Determine new dream status based on action
    let newStatus: string
    switch (actionType) {
      case 'hide':
        newStatus = 'hidden'
        break
      case 'remove':
        newStatus = 'removed'
        break
      case 'warn_author':
        newStatus = 'active'
        break
      case 'dismiss_report':
        newStatus = 'active'
        break
      default:
        newStatus = 'active'
    }

    // Update dream status
    await blink.db.communityDreams.update(dreamId, {
      status: newStatus,
      updatedAt: new Date().toISOString()
    })

    // Update report statuses to 'actioned'
    for (const reportId of reportIds) {
      await blink.db.sql(
        `UPDATE community_reports 
         SET status = ?, reviewed_at = ?, reviewed_by = ?
         WHERE id = ?`,
        ['actioned', new Date().toISOString(), moderator.id, reportId]
      )
    }

    // Send notification to author (if applicable)
    if (actionType !== 'dismiss_report') {
      try {
        const dreams = await blink.db.communityDreams.list({
          where: { id: dreamId },
          limit: 1
        })

        if (dreams.length > 0 && Number(dreams[0].isAnonymous) === 0) {
          // Only notify non-anonymous authors
          await notifyAuthorOfModerationAction(
            dreams[0].userId,
            actionType,
            actionReason
          )
        }
      } catch (error) {
        console.error('Error notifying author:', error)
        // Don't fail the entire operation if notification fails
      }
    }

    return { success: true, actionId }
  } catch (error) {
    console.error('Error taking moderation action:', error)
    return { success: false, error: 'Failed to apply moderation action' }
  }
}

/**
 * Send notification to dream author about moderation action
 * Keeps reporter identity hidden
 *
 * @param authorId - User ID of the dream author
 * @param actionType - Type of action taken
 * @param reason - Reason for the action
 */
async function notifyAuthorOfModerationAction(
  authorId: string,
  actionType: ModerationActionType,
  reason: string
): Promise<void> {
  // Generic messages that don't reveal reporter identity
  const messages: Record<ModerationActionType, string> = {
    hide: 'Your dream was hidden from Dreamstream after community review. ',
    remove: 'Your dream was removed from Dreamstream after community review. ',
    warn_author: 'Your dream received a community guideline warning. ',
    dismiss_report: '' // Never send notification for dismissals
  }

  const message = messages[actionType] + (reason ? `Reason: ${reason}` : '')

  if (message) {
    console.log(`[NOTIFICATION] Author ${authorId}: ${message}`)
    // TODO: Integrate with actual notification system
    // await sendNotificationToUser(authorId, { title: 'Dream Moderated', body: message })
  }
}

/**
 * Get paginated reports for moderation queue
 *
 * @param status - Filter by report status
 * @param limit - Number of reports to fetch
 * @param offset - Pagination offset
 * @returns List of reports with dream details
 */
export async function getReportsForQueue(
  status: string = 'pending',
  limit: number = 20,
  offset: number = 0
): Promise<any[]> {
  try {
    const whereClause = status !== 'all' ? `WHERE r.status = '${status}'` : ''
    const result = await blink.db.sql<any>(
      `SELECT 
        r.*,
        cd.title as dream_title,
        cd.description as dream_description,
        cd.image_url as dream_image_url,
        cd.is_anonymous as dream_is_anonymous,
        cd.user_id as author_id,
        cd.status as dream_status,
        cd.report_count as report_count
       FROM community_reports r
       INNER JOIN community_dreams cd ON r.dream_id = cd.id
       ${whereClause}
       ORDER BY r.created_at DESC
       LIMIT ? OFFSET ?`,
      [limit, offset]
    )
    return result.rows
  } catch (error) {
    console.error('Error getting reports for queue:', error)
    return []
  }
}

/**
 * Get full details of a specific report
 */
export async function getReportDetails(reportId: string): Promise<any> {
  try {
    const result = await blink.db.sql<any>(
      `SELECT 
        r.*,
        cd.title as dream_title,
        cd.description as dream_description,
        cd.image_url as dream_image_url,
        cd.is_anonymous as dream_is_anonymous,
        cd.user_id as author_id,
        cd.status as dream_status,
        cd.report_count as report_count
       FROM community_reports r
       INNER JOIN community_dreams cd ON r.dream_id = cd.id
       WHERE r.id = ?
       LIMIT 1`,
      [reportId]
    )
    return result.rows.length > 0 ? result.rows[0] : null
  } catch (error) {
    console.error('Error getting report details:', error)
    return null
  }
}

/**
 * Get audit trail (moderation actions) with pagination
 */
export async function getAuditTrail(
  limit: number = 50,
  offset: number = 0
): Promise<any[]> {
  try {
    const result = await blink.db.sql<any>(
      `SELECT 
        ma.*,
        cd.title as dream_title,
        u.display_name as moderator_name
       FROM moderation_actions ma
       LEFT JOIN community_dreams cd ON ma.dream_id = cd.id
       LEFT JOIN users u ON ma.moderator_id = u.id
       ORDER BY ma.created_at DESC
       LIMIT ? OFFSET ?`,
      [limit, offset]
    )
    return result.rows
  } catch (error) {
    console.error('Error getting audit trail:', error)
    return []
  }
}

/**
 * Get all reports related to a specific dream
 */
export async function getDreamReportDetails(dreamId: string): Promise<any[]> {
  try {
    const result = await blink.db.sql<any>(
      `SELECT * FROM community_reports 
       WHERE dream_id = ? 
       ORDER BY created_at DESC`,
      [dreamId]
    )
    return result.rows
  } catch (error) {
    console.error('Error getting dream reports:', error)
    return []
  }
}

/**
 * Get moderation statistics for admin dashboard
 */
export async function getModerationStats(): Promise<{
  totalReports: number
  pendingReports: number
  dreamsUnderReview: number
  dreamsHidden: number
  dreamsRemoved: number
  averageReviewTime: number
}> {
  try {
    const result = await blink.db.sql<any>(
      `SELECT 
        (SELECT COUNT(*) FROM community_reports) as total_reports,
        (SELECT COUNT(*) FROM community_reports WHERE status = 'pending') as pending_reports,
        (SELECT COUNT(*) FROM community_dreams WHERE status = 'under_review') as dreams_under_review,
        (SELECT COUNT(*) FROM community_dreams WHERE status = 'hidden') as dreams_hidden,
        (SELECT COUNT(*) FROM community_dreams WHERE status = 'removed') as dreams_removed
       FROM community_reports
       LIMIT 1`
    )

    if (result.rows.length === 0) {
      return {
        totalReports: 0,
        pendingReports: 0,
        dreamsUnderReview: 0,
        dreamsHidden: 0,
        dreamsRemoved: 0,
        averageReviewTime: 0
      }
    }

    const stats = result.rows[0]
    return {
      totalReports: parseInt(stats.total_reports || '0'),
      pendingReports: parseInt(stats.pending_reports || '0'),
      dreamsUnderReview: parseInt(stats.dreams_under_review || '0'),
      dreamsHidden: parseInt(stats.dreams_hidden || '0'),
      dreamsRemoved: parseInt(stats.dreams_removed || '0'),
      averageReviewTime: 0 // Can calculate if needed
    }
  } catch (error) {
    console.error('Error getting moderation stats:', error)
    return {
      totalReports: 0,
      pendingReports: 0,
      dreamsUnderReview: 0,
      dreamsHidden: 0,
      dreamsRemoved: 0,
      averageReviewTime: 0
    }
  }
}
