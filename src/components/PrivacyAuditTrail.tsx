/**
 * Privacy Audit Trail Component
 * 
 * Displays a timeline of privacy-related changes:
 * - When pattern tracking was enabled/disabled
 * - When redaction settings changed
 * - When data was exported
 * - Account creation date
 */

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Separator } from './ui/separator'
import { blink } from '../blink/client'
import {
  History,
  Brain,
  EyeOff,
  Download,
  UserPlus,
  CheckCircle2,
  XCircle,
  Loader2,
  Shield,
  Clock
} from 'lucide-react'

interface PrivacyAuditTrailProps {
  userId: string
}

interface AuditEntry {
  id: string
  actionType: string
  previousValue?: string
  newValue?: string
  metadata?: string
  createdAt: string
}

interface ParsedAuditEntry {
  id: string
  icon: React.ReactNode
  title: string
  description: string
  timestamp: Date
  type: 'enabled' | 'disabled' | 'info'
}

export function PrivacyAuditTrail({ userId }: PrivacyAuditTrailProps) {
  const [auditEntries, setAuditEntries] = useState<ParsedAuditEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadAuditTrail = async () => {
      try {
        // Load audit trail entries
        const entries = await blink.db.privacyAuditTrail.list({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          limit: 50
        }) as unknown as AuditEntry[]

        // Load user profile for account creation date
        const profiles = await blink.db.userProfiles.list({
          where: { userId }
        })

        // Load privacy settings for consent dates
        const privacySettings = await blink.db.userPrivacySettings.list({
          where: { userId }
        })

        const parsedEntries: ParsedAuditEntry[] = []

        // Parse audit trail entries
        entries.forEach((entry: AuditEntry) => {
          const parsed = parseAuditEntry(entry)
          if (parsed) {
            parsedEntries.push(parsed)
          }
        })

        // Add account creation entry
        if (profiles.length > 0) {
          const profile = profiles[0] as any
          parsedEntries.push({
            id: 'account-created',
            icon: <UserPlus className="w-4 h-4 text-blue-500" />,
            title: 'Account Created',
            description: 'Your Dreamcatcher AI account was created',
            timestamp: new Date(profile.createdAt || profile.created_at),
            type: 'info'
          })
        }

        // Add pattern tracking consent entry if exists
        if (privacySettings.length > 0) {
          const settings = privacySettings[0] as any
          const patternTrackingConsent = settings.patternTrackingConsent === '1' || settings.patternTrackingConsent === 1
          const consentDate = settings.patternTrackingConsentDate || settings.pattern_tracking_consent_date

          if (patternTrackingConsent && consentDate) {
            // Check if this entry already exists in audit trail
            const existingEntry = parsedEntries.find(e => 
              e.title.includes('Pattern Recognition') && 
              Math.abs(new Date(e.timestamp).getTime() - new Date(consentDate).getTime()) < 60000
            )
            
            if (!existingEntry) {
              parsedEntries.push({
                id: 'pattern-tracking-consent',
                icon: <Brain className="w-4 h-4 text-green-500" />,
                title: 'Pattern Recognition Enabled',
                description: 'You enabled AI pattern tracking across your dreams',
                timestamp: new Date(consentDate),
                type: 'enabled'
              })
            }
          }

          // Add redaction settings if enabled
          const redactTrauma = settings.redactTrauma === '1' || settings.redactTrauma === 1
          const redactSexuality = settings.redactSexuality === '1' || settings.redactSexuality === 1
          const redactViolence = settings.redactViolence === '1' || settings.redactViolence === 1
          const redactFears = settings.redactFears === '1' || settings.redactFears === 1

          const enabledRedactions = []
          if (redactTrauma) enabledRedactions.push('Trauma')
          if (redactSexuality) enabledRedactions.push('Sexuality')
          if (redactViolence) enabledRedactions.push('Violence')
          if (redactFears) enabledRedactions.push('Fears')

          if (enabledRedactions.length > 0) {
            const settingsDate = settings.updatedAt || settings.updated_at || settings.createdAt || settings.created_at
            
            // Check if this entry already exists
            const existingRedactEntry = parsedEntries.find(e => 
              e.title.includes('Content Redaction') &&
              Math.abs(new Date(e.timestamp).getTime() - new Date(settingsDate).getTime()) < 60000
            )

            if (!existingRedactEntry) {
              parsedEntries.push({
                id: 'redaction-settings',
                icon: <EyeOff className="w-4 h-4 text-green-500" />,
                title: 'Content Redaction Active',
                description: `Redacting: ${enabledRedactions.join(', ')}`,
                timestamp: new Date(settingsDate),
                type: 'enabled'
              })
            }
          }

          // Add onboarding privacy review if exists
          const onboardingPrivacyReviewedAt = settings.onboardingPrivacyReviewedAt || settings.onboarding_privacy_reviewed_at
          if (onboardingPrivacyReviewedAt) {
            parsedEntries.push({
              id: 'onboarding-privacy-reviewed',
              icon: <Shield className="w-4 h-4 text-primary" />,
              title: 'Privacy Settings Reviewed',
              description: 'You reviewed your privacy settings during onboarding',
              timestamp: new Date(onboardingPrivacyReviewedAt),
              type: 'info'
            })
          }
        }

        // Sort by timestamp descending
        parsedEntries.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())

        setAuditEntries(parsedEntries)
      } catch (error) {
        console.error('Error loading audit trail:', error)
      } finally {
        setLoading(false)
      }
    }

    loadAuditTrail()
  }, [userId])

  const parseAuditEntry = (entry: AuditEntry): ParsedAuditEntry | null => {
    const timestamp = new Date(entry.createdAt)

    switch (entry.actionType) {
      case 'PATTERN_TRACKING_ENABLED':
        return {
          id: entry.id,
          icon: <Brain className="w-4 h-4 text-green-500" />,
          title: 'Pattern Recognition Enabled',
          description: 'You enabled AI pattern tracking across your dreams',
          timestamp,
          type: 'enabled'
        }
      case 'PATTERN_TRACKING_DISABLED':
        return {
          id: entry.id,
          icon: <Brain className="w-4 h-4 text-red-500" />,
          title: 'Pattern Recognition Disabled',
          description: 'You disabled AI pattern tracking',
          timestamp,
          type: 'disabled'
        }
      case 'REDACTION_CHANGED':
        try {
          const metadata = entry.metadata ? JSON.parse(entry.metadata) : {}
          const changes = []
          if (metadata.trauma !== undefined) changes.push(`Trauma: ${metadata.trauma ? 'On' : 'Off'}`)
          if (metadata.sexuality !== undefined) changes.push(`Sexuality: ${metadata.sexuality ? 'On' : 'Off'}`)
          if (metadata.violence !== undefined) changes.push(`Violence: ${metadata.violence ? 'On' : 'Off'}`)
          if (metadata.fears !== undefined) changes.push(`Fears: ${metadata.fears ? 'On' : 'Off'}`)
          
          return {
            id: entry.id,
            icon: <EyeOff className="w-4 h-4 text-amber-500" />,
            title: 'Redaction Settings Changed',
            description: changes.join(', ') || 'Redaction preferences updated',
            timestamp,
            type: 'info'
          }
        } catch {
          return {
            id: entry.id,
            icon: <EyeOff className="w-4 h-4 text-amber-500" />,
            title: 'Redaction Settings Changed',
            description: 'Redaction preferences updated',
            timestamp,
            type: 'info'
          }
        }
      case 'DATA_EXPORTED':
        return {
          id: entry.id,
          icon: <Download className="w-4 h-4 text-blue-500" />,
          title: 'Data Exported',
          description: 'You exported a copy of your dream data',
          timestamp,
          type: 'info'
        }
      case 'CLOUD_ANALYSIS_ENABLED':
        return {
          id: entry.id,
          icon: <CheckCircle2 className="w-4 h-4 text-green-500" />,
          title: 'Cloud Analysis Enabled',
          description: 'You enabled cloud AI analysis for dream interpretations',
          timestamp,
          type: 'enabled'
        }
      case 'CLOUD_ANALYSIS_DISABLED':
        return {
          id: entry.id,
          icon: <XCircle className="w-4 h-4 text-red-500" />,
          title: 'Cloud Analysis Disabled',
          description: 'You disabled cloud AI analysis (local-only mode)',
          timestamp,
          type: 'disabled'
        }
      case 'PRIVACY_SETTINGS_SAVED':
        return {
          id: entry.id,
          icon: <Shield className="w-4 h-4 text-primary" />,
          title: 'Privacy Settings Updated',
          description: 'You saved changes to your privacy settings',
          timestamp,
          type: 'info'
        }
      default:
        return null
    }
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
          <p className="text-sm text-muted-foreground mt-2">Loading privacy history...</p>
        </CardContent>
      </Card>
    )
  }

  if (auditEntries.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="w-5 h-5 text-primary" />
            Privacy Activity Timeline
          </CardTitle>
          <CardDescription>
            Track your privacy setting changes over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground">
            <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No privacy activity recorded yet</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="w-5 h-5 text-primary" />
          Privacy Activity Timeline
        </CardTitle>
        <CardDescription>
          Track your privacy setting changes over time
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-[19px] top-0 bottom-0 w-[2px] bg-border" />

          {/* Timeline entries */}
          <div className="space-y-4">
            {auditEntries.map((entry, index) => (
              <div key={entry.id} className="relative flex gap-4">
                {/* Timeline dot */}
                <div className="relative z-10 flex-shrink-0 w-10 h-10 rounded-full bg-background border-2 border-border flex items-center justify-center">
                  {entry.icon}
                </div>

                {/* Content */}
                <div className="flex-1 pb-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-medium text-sm flex items-center gap-2">
                        {entry.title}
                        <Badge 
                          variant={
                            entry.type === 'enabled' ? 'default' :
                            entry.type === 'disabled' ? 'destructive' : 'secondary'
                          }
                          className="text-xs"
                        >
                          {entry.type === 'enabled' ? '✓' : entry.type === 'disabled' ? '✕' : '○'}
                        </Badge>
                      </h4>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {entry.description}
                      </p>
                    </div>
                    <div className="text-right text-xs text-muted-foreground flex-shrink-0">
                      <p className="font-medium">{formatDate(entry.timestamp)}</p>
                      <p>{formatTime(entry.timestamp)}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Utility function to log privacy audit events
 */
export async function logPrivacyAuditEvent(
  userId: string,
  actionType: string,
  previousValue?: string,
  newValue?: string,
  metadata?: Record<string, any>
) {
  try {
    await blink.db.privacyAuditTrail.create({
      id: `pat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      actionType,
      previousValue: previousValue || null,
      newValue: newValue || null,
      metadata: metadata ? JSON.stringify(metadata) : null,
      createdAt: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error logging privacy audit event:', error)
  }
}
