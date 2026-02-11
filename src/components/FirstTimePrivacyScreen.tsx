/**
 * First Time Privacy Screen Component
 * 
 * Shown to users who haven't reviewed privacy settings during onboarding.
 * Acts as a soft gate - not blocking, but requires acknowledgment.
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Switch } from './ui/switch'
import { Label } from './ui/label'
import { Checkbox } from './ui/checkbox'
import { blink } from '../blink/client'
import toast from 'react-hot-toast'
import {
  Shield,
  Lock,
  EyeOff,
  Brain,
  Smartphone,
  ChevronRight,
  Sparkles,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react'
import { markPrivacyOnboardingReviewed } from '../utils/privacyScreenTracking'
import { logPrivacyAuditEvent } from './PrivacyAuditTrail'

interface FirstTimePrivacyScreenProps {
  userId: string
  onComplete: () => void
  onSkip?: () => void
}

export function FirstTimePrivacyScreen({ userId, onComplete, onSkip }: FirstTimePrivacyScreenProps) {
  const navigate = useNavigate()
  const [privacySettings, setPrivacySettings] = useState({
    patternTrackingConsent: false,
    redactTrauma: true,
    redactSexuality: true,
    redactViolence: false,
    redactFears: false
  })
  const [saving, setSaving] = useState(false)

  const handleSaveAndContinue = async () => {
    setSaving(true)
    try {
      const now = new Date().toISOString()

      // Check if settings already exist
      const existing = await blink.db.userPrivacySettings.list({
        where: { userId }
      })

      if (existing.length > 0) {
        await blink.db.userPrivacySettings.update(existing[0].id, {
          patternTrackingConsent: privacySettings.patternTrackingConsent ? '1' : '0',
          patternTrackingConsentDate: privacySettings.patternTrackingConsent ? now : null,
          redactTrauma: privacySettings.redactTrauma ? '1' : '0',
          redactSexuality: privacySettings.redactSexuality ? '1' : '0',
          redactViolence: privacySettings.redactViolence ? '1' : '0',
          redactFears: privacySettings.redactFears ? '1' : '0',
          onboardingPrivacyReviewedAt: now,
          updatedAt: now
        })
      } else {
        await blink.db.userPrivacySettings.create({
          id: `ups_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userId,
          patternTrackingConsent: privacySettings.patternTrackingConsent ? '1' : '0',
          patternTrackingConsentDate: privacySettings.patternTrackingConsent ? now : null,
          sensitiveContentFilter: '1',
          redactTrauma: privacySettings.redactTrauma ? '1' : '0',
          redactSexuality: privacySettings.redactSexuality ? '1' : '0',
          redactViolence: privacySettings.redactViolence ? '1' : '0',
          redactFears: privacySettings.redactFears ? '1' : '0',
          allowCloudAnalysis: '1',
          consentVersion: '2.0',
          onboardingPrivacyReviewedAt: now,
          createdAt: now,
          updatedAt: now
        })
      }

      // Log audit event
      await logPrivacyAuditEvent(userId, 'PRIVACY_SETTINGS_SAVED', undefined, undefined, {
        source: 'first_time_privacy_screen',
        patternTracking: privacySettings.patternTrackingConsent,
        redactTrauma: privacySettings.redactTrauma,
        redactSexuality: privacySettings.redactSexuality,
        redactViolence: privacySettings.redactViolence,
        redactFears: privacySettings.redactFears
      })

      toast.success('Privacy settings saved!')
      onComplete()
    } catch (error) {
      console.error('Error saving privacy settings:', error)
      toast.error('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const handleSkip = async () => {
    // Mark as reviewed even if skipped (uses defaults)
    await markPrivacyOnboardingReviewed(userId)
    onSkip?.() || onComplete()
  }

  const handleLearnMore = () => {
    navigate('/privacy-defaults')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-background to-blue-50 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-4 rounded-full bg-primary/10 border border-primary/20">
              <Shield className="h-10 w-10 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">Your Privacy Matters</CardTitle>
          <CardDescription className="text-base">
            Before you start dreaming, let's make sure your privacy is protected the way you want.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* On-Device Protection Info */}
          <div className="flex items-start gap-3 p-4 rounded-lg bg-green-500/10 border border-green-500/20">
            <Smartphone className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-green-700 dark:text-green-400">On-Device Protection</p>
              <p className="text-xs text-green-600 dark:text-green-500 mt-1">
                Sensitive content is classified locally on your device before cloud upload. Your private dreams stay private.
              </p>
            </div>
          </div>

          {/* Pattern Recognition Toggle */}
          <div className="flex items-start justify-between p-4 rounded-lg border bg-card">
            <div className="space-y-1 flex-1 mr-4">
              <Label className="font-medium flex items-center gap-2">
                <Brain className="w-4 h-4 text-primary" />
                Enable Pattern Recognition
              </Label>
              <p className="text-sm text-muted-foreground">
                Track recurring themes and emotions across your dreams for deeper insights
              </p>
            </div>
            <Switch
              checked={privacySettings.patternTrackingConsent}
              onCheckedChange={(checked) =>
                setPrivacySettings(s => ({ ...s, patternTrackingConsent: checked }))
              }
            />
          </div>

          {/* Default Redactions */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <EyeOff className="w-4 h-4 text-muted-foreground" />
              <Label className="font-medium">Content Protection (Defaults)</Label>
            </div>
            
            <div className="grid gap-2">
              <div className="flex items-center justify-between p-3 rounded border bg-card">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="redact-trauma-first"
                    checked={privacySettings.redactTrauma}
                    onCheckedChange={(checked) =>
                      setPrivacySettings(s => ({ ...s, redactTrauma: checked === true }))
                    }
                  />
                  <Label htmlFor="redact-trauma-first" className="text-sm cursor-pointer">
                    💔 Trauma & Loss
                  </Label>
                </div>
                <Badge variant="default" className="bg-green-600 text-xs">Recommended</Badge>
              </div>

              <div className="flex items-center justify-between p-3 rounded border bg-card">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="redact-sexuality-first"
                    checked={privacySettings.redactSexuality}
                    onCheckedChange={(checked) =>
                      setPrivacySettings(s => ({ ...s, redactSexuality: checked === true }))
                    }
                  />
                  <Label htmlFor="redact-sexuality-first" className="text-sm cursor-pointer">
                    💋 Intimate Content
                  </Label>
                </div>
                <Badge variant="default" className="bg-green-600 text-xs">Recommended</Badge>
              </div>

              <div className="flex items-center gap-2 p-3 rounded border bg-card">
                <Checkbox
                  id="redact-violence-first"
                  checked={privacySettings.redactViolence}
                  onCheckedChange={(checked) =>
                    setPrivacySettings(s => ({ ...s, redactViolence: checked === true }))
                  }
                />
                <Label htmlFor="redact-violence-first" className="text-sm cursor-pointer">
                  ⚔️ Violence
                </Label>
              </div>

              <div className="flex items-center gap-2 p-3 rounded border bg-card">
                <Checkbox
                  id="redact-fears-first"
                  checked={privacySettings.redactFears}
                  onCheckedChange={(checked) =>
                    setPrivacySettings(s => ({ ...s, redactFears: checked === true }))
                  }
                />
                <Label htmlFor="redact-fears-first" className="text-sm cursor-pointer">
                  😰 Fears & Phobias
                </Label>
              </div>
            </div>
          </div>

          {/* Info Note */}
          <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <AlertTriangle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-blue-600">
              You can change these settings anytime in your profile. We recommend keeping Trauma & Intimate Content protection enabled.
            </p>
          </div>

          {/* Actions */}
          <div className="space-y-3 pt-2">
            <Button onClick={handleSaveAndContinue} className="w-full" disabled={saving}>
              {saving ? (
                'Saving...'
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Save & Continue
                </>
              )}
            </Button>
            
            <div className="flex gap-2">
              <Button variant="ghost" onClick={handleSkip} className="flex-1" disabled={saving}>
                Skip for Now
              </Button>
              <Button variant="outline" onClick={handleLearnMore} className="flex-1" disabled={saving}>
                Learn More
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
