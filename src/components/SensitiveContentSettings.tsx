/**
 * Sensitive Content Settings Component
 * 
 * Allows users to configure which types of sensitive content
 * are automatically redacted before cloud AI analysis.
 * 
 * This is ALWAYS available (all tiers) as a privacy feature.
 */

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Switch } from './ui/switch'
import { Label } from './ui/label'
import { Badge } from './ui/badge'
import { Checkbox } from './ui/checkbox'
import { Separator } from './ui/separator'
import { blink } from '../blink/client'
import toast from 'react-hot-toast'
import {
  Shield,
  Lock,
  Eye,
  EyeOff,
  AlertTriangle,
  Brain,
  Cloud,
  Smartphone,
  Loader2,
  Save,
  RefreshCw,
  Download,
  Trash2,
  FileText,
  ExternalLink,
  Info,
  CheckCircle2,
  HelpCircle,
  History
} from 'lucide-react'
import { PrivacyAuditTrail, logPrivacyAuditEvent } from './PrivacyAuditTrail'

interface SensitiveContentSettingsProps {
  userId: string
  onSettingsChanged?: () => void
}

interface PrivacySettings {
  patternTrackingConsent: boolean
  sensitiveContentFilter: boolean
  redactTrauma: boolean
  redactSexuality: boolean
  redactViolence: boolean
  redactFears: boolean
  allowCloudAnalysis: boolean
}

export function SensitiveContentSettings({
  userId,
  onSettingsChanged
}: SensitiveContentSettingsProps) {
  const [settings, setSettings] = useState<PrivacySettings>({
    patternTrackingConsent: false,
    sensitiveContentFilter: true,
    redactTrauma: true,
    redactSexuality: true,
    redactViolence: false,
    redactFears: false,
    allowCloudAnalysis: true
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [originalSettings, setOriginalSettings] = useState<PrivacySettings | null>(null)
  const [consentDate, setConsentDate] = useState<string | null>(null)

  // Load existing settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const existing = await blink.db.userPrivacySettings.list({
          where: { userId }
        })

        if (existing.length > 0) {
          const s = existing[0]
          const loadedSettings = {
            patternTrackingConsent: s.patternTrackingConsent === '1' || s.patternTrackingConsent === 1,
            sensitiveContentFilter: s.sensitiveContentFilter === '1' || s.sensitiveContentFilter === 1 || s.sensitiveContentFilter === undefined,
            redactTrauma: s.redactTrauma === '1' || s.redactTrauma === 1,
            redactSexuality: s.redactSexuality === '1' || s.redactSexuality === 1,
            redactViolence: s.redactViolence === '1' || s.redactViolence === 1,
            redactFears: s.redactFears === '1' || s.redactFears === 1,
            allowCloudAnalysis: s.allowCloudAnalysis === '1' || s.allowCloudAnalysis === 1 || s.allowCloudAnalysis === undefined
          }
          setSettings(loadedSettings)
          setOriginalSettings(loadedSettings)
          if (s.patternTrackingConsentDate) {
            setConsentDate(s.patternTrackingConsentDate)
          }
        }
      } catch (error) {
        console.error('Error loading privacy settings:', error)
      } finally {
        setLoading(false)
      }
    }

    loadSettings()
  }, [userId])

  // Track changes
  useEffect(() => {
    if (originalSettings) {
      const changed = JSON.stringify(settings) !== JSON.stringify(originalSettings)
      setHasChanges(changed)
    }
  }, [settings, originalSettings])

  const handleSave = async () => {
    setSaving(true)
    try {
      const existing = await blink.db.userPrivacySettings.list({
        where: { userId }
      })

      const now = new Date().toISOString()
      const privacyData = {
        userId,
        patternTrackingConsent: settings.patternTrackingConsent ? '1' : '0',
        sensitiveContentFilter: settings.sensitiveContentFilter ? '1' : '0',
        redactTrauma: settings.redactTrauma ? '1' : '0',
        redactSexuality: settings.redactSexuality ? '1' : '0',
        redactViolence: settings.redactViolence ? '1' : '0',
        redactFears: settings.redactFears ? '1' : '0',
        allowCloudAnalysis: settings.allowCloudAnalysis ? '1' : '0',
        updatedAt: now
      }

      if (existing.length > 0) {
        const updateData: Record<string, string> = { ...privacyData }
        // Update consent date if pattern tracking was just enabled
        if (settings.patternTrackingConsent && !originalSettings?.patternTrackingConsent) {
          updateData.patternTrackingConsentDate = now
          setConsentDate(now)
        }
        await blink.db.userPrivacySettings.update(existing[0].id, updateData)
      } else {
        await blink.db.userPrivacySettings.create({
          id: `ups_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          ...privacyData,
          patternTrackingConsentDate: settings.patternTrackingConsent ? now : null,
          consentVersion: '2.0',
          createdAt: now
        })
        if (settings.patternTrackingConsent) {
          setConsentDate(now)
        }
      }

      // Log audit events for changed settings
      if (originalSettings) {
        if (settings.patternTrackingConsent !== originalSettings.patternTrackingConsent) {
          await logPrivacyAuditEvent(
            userId,
            settings.patternTrackingConsent ? 'PATTERN_TRACKING_ENABLED' : 'PATTERN_TRACKING_DISABLED',
            String(originalSettings.patternTrackingConsent),
            String(settings.patternTrackingConsent)
          )
        }

        if (settings.allowCloudAnalysis !== originalSettings.allowCloudAnalysis) {
          await logPrivacyAuditEvent(
            userId,
            settings.allowCloudAnalysis ? 'CLOUD_ANALYSIS_ENABLED' : 'CLOUD_ANALYSIS_DISABLED',
            String(originalSettings.allowCloudAnalysis),
            String(settings.allowCloudAnalysis)
          )
        }

        // Check if any redaction settings changed
        const redactionChanged = 
          settings.redactTrauma !== originalSettings.redactTrauma ||
          settings.redactSexuality !== originalSettings.redactSexuality ||
          settings.redactViolence !== originalSettings.redactViolence ||
          settings.redactFears !== originalSettings.redactFears

        if (redactionChanged) {
          await logPrivacyAuditEvent(
            userId,
            'REDACTION_CHANGED',
            undefined,
            undefined,
            {
              trauma: settings.redactTrauma,
              sexuality: settings.redactSexuality,
              violence: settings.redactViolence,
              fears: settings.redactFears
            }
          )
        }
      }

      setOriginalSettings(settings)
      setHasChanges(false)
      toast.success('Privacy settings saved')
      onSettingsChanged?.()
    } catch (error) {
      console.error('Error saving privacy settings:', error)
      toast.error('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    if (originalSettings) {
      setSettings(originalSettings)
    }
  }

  const handleExportData = async () => {
    setExporting(true)
    try {
      // Fetch all user dreams
      const dreams = await blink.db.dreams.list({
        where: { userId },
        orderBy: { createdAt: 'desc' }
      })

      // Fetch user profile
      const profiles = await blink.db.userProfiles.list({
        where: { userId }
      })

      // Fetch privacy settings
      const privacySettings = await blink.db.userPrivacySettings.list({
        where: { userId }
      })

      const exportData = {
        exportDate: new Date().toISOString(),
        exportVersion: '2.0',
        user: {
          id: userId,
          profile: profiles[0] || null,
          privacySettings: privacySettings[0] || null
        },
        dreams: dreams.map(d => ({
          id: d.id,
          title: d.title,
          description: d.description,
          interpretation: d.interpretation,
          inputType: d.inputType,
          tags: d.tags,
          createdAt: d.createdAt,
          updatedAt: d.updatedAt
        })),
        totalDreams: dreams.length
      }

      // Create and download JSON file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `dreamworlds-export-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      // Log data export to audit trail
      await logPrivacyAuditEvent(
        userId,
        'DATA_EXPORTED',
        undefined,
        undefined,
        { dreamCount: dreams.length, exportDate: exportData.exportDate }
      )

      toast.success(`Exported ${dreams.length} dreams successfully`)
    } catch (error) {
      console.error('Error exporting data:', error)
      toast.error('Failed to export data')
    } finally {
      setExporting(false)
    }
  }

  const redactionCount = [
    settings.redactTrauma,
    settings.redactSexuality,
    settings.redactViolence,
    settings.redactFears
  ].filter(Boolean).length

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
          <p className="text-sm text-muted-foreground mt-2">Loading privacy settings...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Main Privacy Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                Dream Privacy & Content Control
              </CardTitle>
              <CardDescription>
                Control how your dream content is analyzed and what sensitive themes are redacted
              </CardDescription>
            </div>
            {hasChanges && (
              <Badge variant="outline" className="text-amber-500 border-amber-500/30">
                Unsaved Changes
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* AI Training Disclosure */}
          <div className="flex items-start gap-3 p-4 rounded-lg bg-green-500/10 border border-green-500/20">
            <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-green-700 dark:text-green-400">You Control Your Privacy</p>
              <p className="text-xs text-green-600 dark:text-green-500 mt-1">
                Keep dreams private by default, choose anonymous sharing, and redact sensitive content before cloud analysis. We don't automatically process your personal details—you decide what to share.
              </p>
            </div>
          </div>

          {/* On-Device Classification Info */}
          <div className="flex items-start gap-3 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <Smartphone className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-blue-700 dark:text-blue-400">On-Device Classification</p>
              <p className="text-xs text-blue-600 dark:text-blue-500 mt-1">
                Sensitive content is classified locally on your device before any cloud upload.
                This means sensitive content is detected without ever leaving your device first.
              </p>
            </div>
          </div>

          <Separator />

          {/* Pattern Tracking Toggle */}
          <div className="flex items-start justify-between p-4 rounded-lg border bg-card">
            <div className="space-y-1 flex-1 mr-4">
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4 text-primary" />
                <Label className="font-medium">Pattern Recognition</Label>
                <Badge variant="secondary" className="text-xs">Premium+</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Track recurring themes, emotions, and symbols across your dreams for deeper insights
              </p>
              {consentDate && settings.patternTrackingConsent && (
                <p className="text-xs text-muted-foreground mt-2">
                  ✓ Consent given on {new Date(consentDate).toLocaleDateString()}
                </p>
              )}
            </div>
            <Switch
              checked={settings.patternTrackingConsent}
              onCheckedChange={(checked) => 
                setSettings(s => ({ ...s, patternTrackingConsent: checked }))
              }
            />
          </div>

          {/* Sensitive Content Redaction */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <EyeOff className="w-4 h-4 text-muted-foreground" />
                <Label className="font-medium">Content Redaction</Label>
                <button 
                  className="text-muted-foreground hover:text-foreground"
                  title="Select which sensitive content types to automatically redact before AI analysis"
                >
                  <HelpCircle className="w-4 h-4" />
                </button>
              </div>
              <Badge variant="outline">
                {redactionCount} of 4 enabled
              </Badge>
            </div>
            
            <p className="text-sm text-muted-foreground">
              Select content types to automatically redact before AI analysis. 
              Redacted content stays on your device and is not sent to cloud services.
            </p>

            <div className="grid gap-3">
              {/* Trauma */}
              <div className="flex items-start space-x-3 p-3 rounded-lg border bg-card hover:bg-accent/5 transition-colors">
                <Checkbox
                  id="redact-trauma-settings"
                  checked={settings.redactTrauma}
                  onCheckedChange={(checked) => 
                    setSettings(s => ({ ...s, redactTrauma: checked === true }))
                  }
                />
                <div className="space-y-1 flex-1">
                  <Label htmlFor="redact-trauma-settings" className="font-medium cursor-pointer flex items-center gap-2">
                    💔 Trauma & Loss
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Abuse, death, accidents, PTSD triggers, grief, abandonment
                  </p>
                </div>
                <Badge variant={settings.redactTrauma ? "default" : "outline"} className="text-xs">
                  {settings.redactTrauma ? 'Redacting' : 'Off'}
                </Badge>
              </div>

              {/* Sexuality */}
              <div className="flex items-start space-x-3 p-3 rounded-lg border bg-card hover:bg-accent/5 transition-colors">
                <Checkbox
                  id="redact-sexuality-settings"
                  checked={settings.redactSexuality}
                  onCheckedChange={(checked) => 
                    setSettings(s => ({ ...s, redactSexuality: checked === true }))
                  }
                />
                <div className="space-y-1 flex-1">
                  <Label htmlFor="redact-sexuality-settings" className="font-medium cursor-pointer flex items-center gap-2">
                    💋 Intimate Content
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Sexual themes, nudity, romantic intimacy, body-related content
                  </p>
                </div>
                <Badge variant={settings.redactSexuality ? "default" : "outline"} className="text-xs">
                  {settings.redactSexuality ? 'Redacting' : 'Off'}
                </Badge>
              </div>

              {/* Violence */}
              <div className="flex items-start space-x-3 p-3 rounded-lg border bg-card hover:bg-accent/5 transition-colors">
                <Checkbox
                  id="redact-violence-settings"
                  checked={settings.redactViolence}
                  onCheckedChange={(checked) => 
                    setSettings(s => ({ ...s, redactViolence: checked === true }))
                  }
                />
                <div className="space-y-1 flex-1">
                  <Label htmlFor="redact-violence-settings" className="font-medium cursor-pointer flex items-center gap-2">
                    ⚔️ Violence
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Fighting, blood, weapons, aggression, war, attacks
                  </p>
                </div>
                <Badge variant={settings.redactViolence ? "default" : "outline"} className="text-xs">
                  {settings.redactViolence ? 'Redacting' : 'Off'}
                </Badge>
              </div>

              {/* Fears */}
              <div className="flex items-start space-x-3 p-3 rounded-lg border bg-card hover:bg-accent/5 transition-colors">
                <Checkbox
                  id="redact-fears-settings"
                  checked={settings.redactFears}
                  onCheckedChange={(checked) => 
                    setSettings(s => ({ ...s, redactFears: checked === true }))
                  }
                />
                <div className="space-y-1 flex-1">
                  <Label htmlFor="redact-fears-settings" className="font-medium cursor-pointer flex items-center gap-2">
                    😰 Fears & Phobias
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Common dream fears (falling, chasing, teeth falling out, being trapped)
                  </p>
                </div>
                <Badge variant={settings.redactFears ? "default" : "outline"} className="text-xs">
                  {settings.redactFears ? 'Redacting' : 'Off'}
                </Badge>
              </div>
            </div>
          </div>

          <Separator />

          {/* Cloud Analysis Toggle */}
          <div className="flex items-start justify-between p-4 rounded-lg border bg-card">
            <div className="space-y-1 flex-1 mr-4">
              <div className="flex items-center gap-2">
                <Cloud className="w-4 h-4 text-blue-500" />
                <Label className="font-medium">Cloud AI Analysis</Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Allow non-sensitive content to be analyzed by AI for deeper insights.
                Disable for fully local-only dream storage.
              </p>
            </div>
            <Switch
              checked={settings.allowCloudAnalysis}
              onCheckedChange={(checked) => 
                setSettings(s => ({ ...s, allowCloudAnalysis: checked }))
              }
            />
          </div>

          {/* Warning for disabled cloud */}
          {!settings.allowCloudAnalysis && (
            <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-amber-700 dark:text-amber-400">Cloud Analysis Disabled</p>
                <p className="text-xs text-amber-600 dark:text-amber-500 mt-1">
                  Dream interpretations will be limited without cloud AI analysis.
                  Your dreams will be stored locally only. Video generation will not be available.
                </p>
              </div>
            </div>
          )}

          {/* Save/Reset Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            {hasChanges && (
              <Button variant="outline" onClick={handleReset} disabled={saving}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Reset
              </Button>
            )}
            <Button onClick={handleSave} disabled={!hasChanges || saving}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Privacy Activity Timeline */}
      <PrivacyAuditTrail userId={userId} />

      {/* Data Rights Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Your Data Rights
          </CardTitle>
          <CardDescription>
            Export, download, or delete your data at any time
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Export Data */}
          <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Download className="w-4 h-4 text-green-500" />
                <Label className="font-medium">Export Your Data</Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Download all your dreams and account data as JSON
              </p>
            </div>
            <Button 
              variant="outline" 
              onClick={handleExportData} 
              disabled={exporting}
            >
              {exporting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </>
              )}
            </Button>
          </div>

          {/* View Privacy Policy */}
          <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-primary" />
                <Label className="font-medium">Privacy Policy</Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Read our full privacy policy and data practices
              </p>
            </div>
            <Button variant="outline" asChild>
              <Link to="/privacy">
                <ExternalLink className="w-4 h-4 mr-2" />
                View
              </Link>
            </Button>
          </div>

          {/* Delete Account (Source of Truth) */}
          <div className="flex items-start justify-between gap-4 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
            <div className="flex items-start gap-3">
              <Trash2 className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-700 dark:text-red-400">Delete Account</p>
                <p className="text-xs text-red-600 dark:text-red-500 mt-1">
                  Account deletion is handled in <strong>Settings → Account → Danger Zone</strong>. This is the in-app, self-serve way to permanently delete your account and associated data.
                </p>
                <p className="text-xs text-red-600/90 dark:text-red-500/90 mt-2">
                  If you can’t access your account, you can also contact{' '}
                  <a href="mailto:privacy@dreamworlds.io" className="underline hover:no-underline">
                    privacy@dreamworlds.io
                  </a>
                  .
                </p>
              </div>
            </div>
            <Button variant="outline" asChild>
              <Link to="/dashboard?tab=account">Go to Danger Zone</Link>
            </Button>
          </div>

          {/* Legal Links */}
          <div className="pt-4 border-t flex flex-wrap gap-4 text-sm">
            <Link to="/terms" className="text-muted-foreground hover:text-primary flex items-center gap-1">
              <FileText className="w-3 h-3" />
              Terms of Service
            </Link>
            <Link to="/privacy" className="text-muted-foreground hover:text-primary flex items-center gap-1">
              <Shield className="w-3 h-3" />
              Privacy Policy
            </Link>
            <a href="mailto:privacy@dreamworlds.io" className="text-muted-foreground hover:text-primary flex items-center gap-1">
              <Info className="w-3 h-3" />
              Contact Privacy Team
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
