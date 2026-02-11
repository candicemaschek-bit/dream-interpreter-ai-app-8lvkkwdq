/**
 * Pattern Privacy Consent Modal
 * 
 * Explicit consent modal for pattern tracking features.
 * Required before any sensitive dream data is analyzed.
 */

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from './ui/dialog'
import { Button } from './ui/button'
import { Checkbox } from './ui/checkbox'
import { Label } from './ui/label'
import { Switch } from './ui/switch'
import { Card, CardContent } from './ui/card'
import { Badge } from './ui/badge'
import { blink } from '../blink/client'
import {
  Shield,
  Eye,
  EyeOff,
  Brain,
  Lock,
  AlertTriangle,
  ChartBar,
  Sparkles,
  Info
} from 'lucide-react'
import toast from 'react-hot-toast'

interface PatternPrivacyConsentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: string
  onConsentGranted: () => void
  onConsentDenied: () => void
  tier: 'free' | 'pro' | 'premium' | 'vip'
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

const CONSENT_VERSION = '1.0'

export function PatternPrivacyConsentModal({
  open,
  onOpenChange,
  userId,
  onConsentGranted,
  onConsentDenied,
  tier
}: PatternPrivacyConsentModalProps) {
  const [settings, setSettings] = useState<PrivacySettings>({
    patternTrackingConsent: false,
    sensitiveContentFilter: true,
    redactTrauma: true,
    redactSexuality: true,
    redactViolence: false,
    redactFears: false,
    allowCloudAnalysis: true
  })
  const [step, setStep] = useState<'intro' | 'settings' | 'confirm'>('intro')
  const [saving, setSaving] = useState(false)
  const [readTerms, setReadTerms] = useState(false)

  const isPremiumOrVIP = tier === 'premium' || tier === 'vip'

  const handleSaveConsent = async () => {
    if (!settings.patternTrackingConsent) {
      onConsentDenied()
      onOpenChange(false)
      return
    }

    setSaving(true)
    try {
      // Check if settings exist
      const existing = await blink.db.userPrivacySettings.list({
        where: { userId }
      })

      const privacyData = {
        userId,
        patternTrackingConsent: settings.patternTrackingConsent ? '1' : '0',
        patternTrackingConsentDate: new Date().toISOString(),
        sensitiveContentFilter: settings.sensitiveContentFilter ? '1' : '0',
        redactTrauma: settings.redactTrauma ? '1' : '0',
        redactSexuality: settings.redactSexuality ? '1' : '0',
        redactViolence: settings.redactViolence ? '1' : '0',
        redactFears: settings.redactFears ? '1' : '0',
        allowCloudAnalysis: settings.allowCloudAnalysis ? '1' : '0',
        consentVersion: CONSENT_VERSION,
        updatedAt: new Date().toISOString()
      }

      if (existing.length > 0) {
        await blink.db.userPrivacySettings.update(existing[0].id, privacyData)
      } else {
        await blink.db.userPrivacySettings.create({
          id: `ups_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          ...privacyData,
          createdAt: new Date().toISOString()
        })
      }

      toast.success('Privacy settings saved')
      onConsentGranted()
      onOpenChange(false)
    } catch (error) {
      console.error('Error saving privacy settings:', error)
      toast.error('Failed to save settings. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleDecline = () => {
    onConsentDenied()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        {step === 'intro' && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
                <DialogTitle className="text-2xl">Pattern Recognition Privacy</DialogTitle>
              </div>
              <DialogDescription className="text-base">
                Your dream privacy matters. Review how pattern tracking works before enabling.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* What Pattern Recognition Does */}
              <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
                <CardContent className="pt-4 space-y-3">
                  <div className="flex items-center gap-2 text-primary font-semibold">
                    <Brain className="w-5 h-5" />
                    <span>What Pattern Recognition Does</span>
                    {isPremiumOrVIP ? (
                      <Badge variant="secondary" className="ml-auto">
                        {tier === 'vip' ? 'VIP' : 'Premium'}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="ml-auto">Premium Feature</Badge>
                    )}
                  </div>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <ChartBar className="w-4 h-4 mt-0.5 text-primary/70" />
                      <span>Tracks recurring themes, symbols, and emotions across your dreams</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Sparkles className="w-4 h-4 mt-0.5 text-primary/70" />
                      <span>Identifies nightmare patterns and stress indicators</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Eye className="w-4 h-4 mt-0.5 text-primary/70" />
                      <span>Generates personalized insights based on your dream history</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              {/* Privacy Protection */}
              <Card className="border-green-500/20 bg-gradient-to-br from-green-500/5 to-transparent">
                <CardContent className="pt-4 space-y-3">
                  <div className="flex items-center gap-2 text-green-600 font-semibold">
                    <Lock className="w-5 h-5" />
                    <span>Your Privacy is Protected</span>
                  </div>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <Shield className="w-4 h-4 mt-0.5 text-green-500/70" />
                      <span><strong>On-device classification</strong> happens before any cloud upload</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <EyeOff className="w-4 h-4 mt-0.5 text-green-500/70" />
                      <span><strong>Sensitive content redaction</strong> lets you control what's analyzed</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Lock className="w-4 h-4 mt-0.5 text-green-500/70" />
                      <span><strong>You control</strong> which dreams are analyzed for patterns</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              {/* Sensitive Content Warning */}
              <Card className="border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-transparent">
                <CardContent className="pt-4 space-y-3">
                  <div className="flex items-center gap-2 text-amber-600 font-semibold">
                    <AlertTriangle className="w-5 h-5" />
                    <span>Sensitive Content Handling</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Dreams often contain sensitive themes like trauma, fears, or intimate content. 
                    In the next step, you can choose which types of content to <strong>automatically redact</strong> before 
                    AI analysis.
                  </p>
                </CardContent>
              </Card>
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={handleDecline}>
                Not Now
              </Button>
              <Button onClick={() => setStep('settings')}>
                Configure Privacy Settings
              </Button>
            </DialogFooter>
          </>
        )}

        {step === 'settings' && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20">
                  <EyeOff className="w-6 h-6 text-primary" />
                </div>
                <DialogTitle className="text-2xl">Content Privacy Settings</DialogTitle>
              </div>
              <DialogDescription className="text-base">
                Control what sensitive content is redacted before cloud analysis.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Main Toggle */}
              <Card className="border-primary/20">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label className="text-base font-semibold">Enable Pattern Recognition</Label>
                      <p className="text-sm text-muted-foreground">
                        Track themes, emotions, and patterns across your dreams
                      </p>
                    </div>
                    <Switch
                      checked={settings.patternTrackingConsent}
                      onCheckedChange={(checked) => 
                        setSettings(s => ({ ...s, patternTrackingConsent: checked }))
                      }
                    />
                  </div>
                </CardContent>
              </Card>

              {settings.patternTrackingConsent && (
                <>
                  {/* Sensitive Content Filter */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Shield className="w-5 h-5 text-primary" />
                      <Label className="text-base font-semibold">Sensitive Content Redaction</Label>
                    </div>
                    <p className="text-sm text-muted-foreground -mt-2">
                      Select content types to automatically redact before AI analysis. 
                      Redacted content stays on your device only.
                    </p>

                    <div className="grid gap-3">
                      <div className="flex items-start space-x-3 p-3 rounded-lg border bg-card hover:bg-accent/5 transition-colors">
                        <Checkbox
                          id="redact-trauma"
                          checked={settings.redactTrauma}
                          onCheckedChange={(checked) => 
                            setSettings(s => ({ ...s, redactTrauma: checked === true }))
                          }
                        />
                        <div className="space-y-1">
                          <Label htmlFor="redact-trauma" className="font-medium cursor-pointer">
                            💔 Trauma & Loss
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            Abuse, death, accidents, PTSD triggers, grief
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-3 p-3 rounded-lg border bg-card hover:bg-accent/5 transition-colors">
                        <Checkbox
                          id="redact-sexuality"
                          checked={settings.redactSexuality}
                          onCheckedChange={(checked) => 
                            setSettings(s => ({ ...s, redactSexuality: checked === true }))
                          }
                        />
                        <div className="space-y-1">
                          <Label htmlFor="redact-sexuality" className="font-medium cursor-pointer">
                            💋 Intimate Content
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            Sexual themes, nudity, romantic intimacy
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-3 p-3 rounded-lg border bg-card hover:bg-accent/5 transition-colors">
                        <Checkbox
                          id="redact-violence"
                          checked={settings.redactViolence}
                          onCheckedChange={(checked) => 
                            setSettings(s => ({ ...s, redactViolence: checked === true }))
                          }
                        />
                        <div className="space-y-1">
                          <Label htmlFor="redact-violence" className="font-medium cursor-pointer">
                            ⚔️ Violence
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            Fighting, blood, weapons, aggression
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-3 p-3 rounded-lg border bg-card hover:bg-accent/5 transition-colors">
                        <Checkbox
                          id="redact-fears"
                          checked={settings.redactFears}
                          onCheckedChange={(checked) => 
                            setSettings(s => ({ ...s, redactFears: checked === true }))
                          }
                        />
                        <div className="space-y-1">
                          <Label htmlFor="redact-fears" className="font-medium cursor-pointer">
                            😰 Fears & Phobias
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            Common dream fears (falling, chasing, teeth)
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Cloud Analysis Toggle */}
                  <Card className="border-blue-500/20">
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label className="text-base font-medium flex items-center gap-2">
                            <Info className="w-4 h-4 text-blue-500" />
                            Allow Cloud-Based AI Analysis
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            Non-sensitive content will be analyzed by AI for deeper insights
                          </p>
                        </div>
                        <Switch
                          checked={settings.allowCloudAnalysis}
                          onCheckedChange={(checked) => 
                            setSettings(s => ({ ...s, allowCloudAnalysis: checked }))
                          }
                        />
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={() => setStep('intro')}>
                Back
              </Button>
              <Button onClick={() => setStep('confirm')}>
                Review & Confirm
              </Button>
            </DialogFooter>
          </>
        )}

        {step === 'confirm' && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20">
                  <Shield className="w-6 h-6 text-green-600" />
                </div>
                <DialogTitle className="text-2xl">Confirm Your Settings</DialogTitle>
              </div>
              <DialogDescription className="text-base">
                Review your privacy choices before enabling pattern recognition.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <Card>
                <CardContent className="pt-4 space-y-3">
                  <div className="flex items-center justify-between py-2 border-b">
                    <span className="font-medium">Pattern Recognition</span>
                    <Badge variant={settings.patternTrackingConsent ? "default" : "secondary"}>
                      {settings.patternTrackingConsent ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </div>
                  
                  {settings.patternTrackingConsent && (
                    <>
                      <div className="text-sm space-y-2">
                        <p className="font-medium text-muted-foreground">Content Redaction:</p>
                        <div className="flex flex-wrap gap-2">
                          {settings.redactTrauma && (
                            <Badge variant="outline">💔 Trauma</Badge>
                          )}
                          {settings.redactSexuality && (
                            <Badge variant="outline">💋 Intimacy</Badge>
                          )}
                          {settings.redactViolence && (
                            <Badge variant="outline">⚔️ Violence</Badge>
                          )}
                          {settings.redactFears && (
                            <Badge variant="outline">😰 Fears</Badge>
                          )}
                          {!settings.redactTrauma && !settings.redactSexuality && 
                           !settings.redactViolence && !settings.redactFears && (
                            <span className="text-muted-foreground">None selected</span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between py-2 border-t">
                        <span className="text-sm">Cloud AI Analysis</span>
                        <Badge variant={settings.allowCloudAnalysis ? "default" : "secondary"}>
                          {settings.allowCloudAnalysis ? 'Allowed' : 'Local Only'}
                        </Badge>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              <div className="flex items-start space-x-3 p-3 rounded-lg border bg-card">
                <Checkbox
                  id="read-terms"
                  checked={readTerms}
                  onCheckedChange={(checked) => setReadTerms(checked === true)}
                />
                <div className="space-y-1">
                  <Label htmlFor="read-terms" className="text-sm cursor-pointer">
                    I understand that pattern recognition will analyze my dream content 
                    according to the settings above. I can change these settings anytime 
                    in my profile.
                  </Label>
                </div>
              </div>
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={() => setStep('settings')}>
                Back
              </Button>
              <Button 
                onClick={handleSaveConsent}
                disabled={!readTerms || saving}
              >
                {saving ? 'Saving...' : 'Save & Enable'}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
