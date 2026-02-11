/**
 * Moderation and Community Safety Types
 * Handles reporting, admin review, and enforcement
 */

export type ReportReason =
  | 'explicit'        // Explicit sexual content
  | 'harassment'      // Bullying, threats, harassment
  | 'spam'            // Spam/fake content
  | 'illegal'         // Illegal activity
  | 'misinformation'  // False information
  | 'other'           // User explains in details

export type ReportStatus =
  | 'pending'         // Awaiting review
  | 'reviewed'        // Admin reviewed
  | 'dismissed'       // Not actionable
  | 'actioned'        // Action was taken

export type ModerationActionType =
  | 'hide'            // Hide from public feed (author can see)
  | 'remove'          // Completely remove
  | 'warn_author'     // Send warning notification
  | 'dismiss_report'  // Mark report as invalid

export type DreamStatus =
  | 'active'          // Public in feed
  | 'hidden'          // Hidden from feed, visible to author
  | 'removed'         // Deleted after review
  | 'under_review'    // Currently being moderated

/**
 * Community Report - User reports inappropriate content
 * Reporter ID is anonymized via SHA-256 hash
 */
export interface CommunityReport {
  id: string
  dreamId: string
  reporterIdHash: string               // Anonymized reporter (SHA-256 hash)
  reportReason: ReportReason
  reportDetails?: string
  status: ReportStatus
  severityAuto: number                 // 0-3 from classifier
  createdAt: string
  reviewedAt?: string
  reviewedBy?: string
}

/**
 * Moderation Action - Admin enforcement action (audit trail)
 */
export interface ModerationAction {
  id: string
  dreamId: string
  actionType: ModerationActionType
  actionReason: string
  moderatorId: string
  reportIds: string[]                  // Which reports triggered this
  authorNotified: boolean
  createdAt: string
}

/**
 * Moderation Queue Item - Report with associated dream details
 */
export interface ModerationQueueItem extends CommunityReport {
  dreamTitle?: string
  dreamDescription?: string
  dreamIsAnonymous?: boolean
  dreamStatus?: DreamStatus
  dreamImageUrl?: string
  reportCount?: number
}

/**
 * Content Flag Severity
 */
export const SEVERITY_LEVELS = {
  0: { label: 'None', color: 'green', icon: '✓' },
  1: { label: 'Low', color: 'yellow', icon: '!' },
  2: { label: 'Medium', color: 'orange', icon: '⚠️' },
  3: { label: 'High', color: 'red', icon: '🚫' }
} as const

/**
 * Report reason descriptions for UI display
 */
export const REPORT_REASON_LABELS: Record<ReportReason, string> = {
  explicit: 'Explicit Sexual Content',
  harassment: 'Harassment or Bullying',
  spam: 'Spam or Fake Content',
  illegal: 'Illegal Activity',
  misinformation: 'False Information',
  other: 'Other'
}

/**
 * Moderation action descriptions
 */
export const MODERATION_ACTION_LABELS: Record<ModerationActionType, string> = {
  hide: 'Hide from Feed',
  remove: 'Remove Permanently',
  warn_author: 'Warn Author Only',
  dismiss_report: 'Dismiss Report'
}

/**
 * Get severity color for UI display
 */
export function getSeverityColor(severity: number): string {
  const level = Math.min(3, Math.max(0, severity))
  return SEVERITY_LEVELS[level as keyof typeof SEVERITY_LEVELS].color
}

/**
 * Get severity label for UI display
 */
export function getSeverityLabel(severity: number): string {
  const level = Math.min(3, Math.max(0, severity))
  return SEVERITY_LEVELS[level as keyof typeof SEVERITY_LEVELS].label
}

/**
 * Get reason label for UI display
 */
export function getReasonLabel(reason: ReportReason): string {
  return REPORT_REASON_LABELS[reason] || 'Unknown'
}

/**
 * Get action label for UI display
 */
export function getActionLabel(action: ModerationActionType): string {
  return MODERATION_ACTION_LABELS[action] || 'Unknown'
}
