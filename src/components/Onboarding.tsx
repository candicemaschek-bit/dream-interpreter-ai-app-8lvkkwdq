import { memo, useCallback, useMemo, useState } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { RadioGroup, RadioGroupItem } from './ui/radio-group'
import { Checkbox } from './ui/checkbox'
import { Switch } from './ui/switch'
import { blink } from '../blink/client'
import { supabaseService } from '../lib/supabaseService'
import toast from 'react-hot-toast'
import { Sparkles, User, Gift, Shield, Lock, EyeOff, AlertTriangle, Brain } from 'lucide-react'
import { validateAndApplyReferral } from '../utils/referralSystem'
import { InfoTooltip } from './InfoTooltip'
import { checkAndGrantLaunchOffer } from '../utils/launchOfferManager'
import { ensureUserRecord } from '../utils/authHelpers'

interface OnboardingProps {
  onComplete: () => void
}

const StepIndicator = memo(({ currentStep, totalSteps }: { currentStep: number, totalSteps: number }) => (
  <div className="flex justify-center gap-2 pt-2">
    {Array.from({ length: totalSteps }).map((_, i) => (
      <div
        key={i}
        className={`h-2 w-2 rounded-full transition-colors duration-300 ${i + 1 === currentStep ? 'bg-primary' : 'bg-muted'}`}
      />
    ))}
  </div>
))

StepIndicator.displayName = 'StepIndicator'

export function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    name: '',
    dobDay: '',
    dobMonth: '',
    dobYear: '',
    gender: 'none' as 'male' | 'female' | 'none' | 'both',
    nightmareProne: false,
    recurringDreams: false,
    referralCode: ''
  })
  const [privacySettings, setPrivacySettings] = useState({
    patternTrackingConsent: false,
    redactTrauma: true,
    redactSexuality: true,
    redactViolence: false,
    redactFears: false
  })
  const [referralProcessing, setReferralProcessing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleStep2Continue = useCallback(() => {
    setStep(3) // Go to privacy step
  }, [])

  const handleStep3Continue = useCallback(() => {
    setStep(4) // Go to referral step
  }, [])

  const handlePrevStep = useCallback(() => {
    setStep(prev => Math.max(1, prev - 1))
  }, [])

  const handleNextStep = useCallback(() => {
    setStep(prev => Math.min(4, prev + 1))
  }, [])

  const updateFormData = useCallback((updates: Partial<typeof formData>) => {
    setFormData(prev => ({ ...prev, ...updates }))
  }, [])

  const updatePrivacySettings = useCallback((updates: Partial<typeof privacySettings>) => {
    setPrivacySettings(prev => ({ ...prev, ...updates }))
  }, [])

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error('Please enter your name')
      return
    }

    if (!formData.dobDay || !formData.dobMonth || !formData.dobYear) {
      toast.error('Please complete your date of birth')
      return
    }

    const day = parseInt(formData.dobDay, 10)
    const month = parseInt(formData.dobMonth, 10)
    const year = parseInt(formData.dobYear, 10)

    if (day < 1 || day > 31 || isNaN(day)) {
      toast.error('Please enter a valid day (1-31)')
      return
    }

    if (month < 1 || month > 12 || isNaN(month)) {
      toast.error('Please enter a valid month (1-12)')
      return
    }

    if (year < 1900 || year > new Date().getFullYear() || isNaN(year)) {
      toast.error('Please enter a valid year')
      return
    }

    // Construct date and validate it's a real date
    const birthDate = new Date(year, month - 1, day)

    // Check if the constructed date matches the input (handles invalid dates like 31st February)
    if (birthDate.getDate() !== day || birthDate.getMonth() !== month - 1 || birthDate.getFullYear() !== year) {
      toast.error('Please enter a valid date')
      return
    }

    // Calculate age from date of birth
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }

    if (age < 5 || age > 120) {
      toast.error('Please enter a valid date of birth (age must be between 5 and 120)')
      return
    }

    // Format date as YYYY-MM-DD for storage
    const dateOfBirthString = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`

    setIsSubmitting(true)

    try {
      const user = await blink.auth.me()

      // Ensure user record exists in DB (sync auth to DB)
      await ensureUserRecord(user)

      const now = new Date().toISOString()

      // Load profile from Supabase
      const profile = await supabaseService.getProfile(user.id)

      // Create/update user profile (idempotent)
      // AI will track patterns intelligently from dream submissions
      if (profile) {
        await supabaseService.upsertProfile({
          ...profile,
          name: formData.name,
          age: age,
          date_of_birth: dateOfBirthString,
          gender: formData.gender,
          nightmare_prone: formData.nightmareProne,
          recurring_dreams: formData.recurringDreams,
          onboarding_completed: true,
          updated_at: now,
        } as any)
      } else {
        await supabaseService.upsertProfile({
          id: `profile_${user.id}`,
          user_id: user.id,
          name: formData.name,
          age: age,
          date_of_birth: dateOfBirthString,
          gender: formData.gender,
          nightmare_prone: formData.nightmareProne,
          recurring_dreams: formData.recurringDreams,
          subscription_tier: 'free',
          onboarding_completed: true,
          created_at: now,
          updated_at: now,
        } as any)
      }

      // 🎉 Check and grant launch offer (first 500 signups)
      const launchOfferResult = await checkAndGrantLaunchOffer(user.id)
      // Only log launch offer internally (not visible to user)
      if (launchOfferResult.granted && launchOfferResult.signupNumber) {
        console.log(`✅ Launch offer granted to user #${launchOfferResult.signupNumber}`)
        // Don't show toast - launch offer benefit is internal, not visible to user
      }

      // Save privacy settings (idempotent)
      const client = supabaseService.supabase
      if (client) {
        const { data: existingPrivacy } = await client
          .from('user_privacy_settings')
          .select('*')
          .eq('user_id', user.id)
          .limit(1)

        const privacyRow = {
          user_id: user.id,
          pattern_tracking_consent: privacySettings.patternTrackingConsent,
          pattern_tracking_consent_date: privacySettings.patternTrackingConsent ? now : null,
          sensitive_content_filter: true,
          redact_trauma: privacySettings.redactTrauma,
          redact_sexuality: privacySettings.redactSexuality,
          redact_violence: privacySettings.redactViolence,
          redact_fears: privacySettings.redactFears,
          allow_cloud_analysis: true,
          consent_version: '2.0',
          updated_at: now,
        }

        if (existingPrivacy && existingPrivacy.length > 0) {
          await client
            .from('user_privacy_settings')
            .update(privacyRow)
            .eq('id', existingPrivacy[0].id)
        } else {
          await client
            .from('user_privacy_settings')
            .insert({
              id: `ups_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              ...privacyRow,
              created_at: now,
            })
        }
      }

      // Process referral code if provided
      if (formData.referralCode.trim()) {
        setReferralProcessing(true)
        const result = await validateAndApplyReferral(
          formData.referralCode.trim().toUpperCase(),
          user.id,
          user.email
        )

        if (result.success) {
          toast.success(result.message, { duration: 5000 })
        } else {
          toast.error(result.message)
        }
        setReferralProcessing(false)
      }

      toast.success('Welcome to Dreamcatcher AI! 🌙')
      onComplete()
    } catch (error) {
      console.error('Error saving profile:', error)
      toast.error('Failed to save profile. Please try again.')
    } finally {
      setIsSubmitting(false)
      setReferralProcessing(false)
    }
  }

  // Memoized step contents to prevent unnecessary re-renders of the entire card
  const stepContent = useMemo(() => {
    switch (step) {
      case 1:
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="Enter your name"
                value={formData.name}
                onChange={(e) => updateFormData({ name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label>Date of Birth</Label>
                <InfoTooltip
                  content={
                    <div className="space-y-2">
                      <p className="font-medium">Date of Birth helps AI understand life stage context in dream interpretation.</p>
                      <p className="text-xs">This information is:</p>
                      <ul className="text-xs space-y-1 ml-2">
                        <li>• Stored securely (encrypted)</li>
                        <li>• Used only for interpretation (never for marketing)</li>
                        <li>• Not shared with third parties</li>
                        <li>• Deletable if you delete your account</li>
                      </ul>
                    </div>
                  }
                  side="top"
                />
              </div>
              <div className="flex gap-2">
                <div className="w-[80px]">
                  <Input
                    type="text"
                    placeholder="DD"
                    value={formData.dobDay}
                    onChange={(e) => {
                      let value = e.target.value.replace(/\D/g, '')
                      if (value.length > 2) value = value.slice(0, 2)
                      updateFormData({ dobDay: value })
                    }}
                    maxLength={2}
                    className="text-center"
                  />
                </div>
                <div className="w-[80px]">
                  <Input
                    type="text"
                    placeholder="MM"
                    value={formData.dobMonth}
                    onChange={(e) => {
                      let value = e.target.value.replace(/\D/g, '')
                      if (value.length > 2) value = value.slice(0, 2)
                      updateFormData({ dobMonth: value })
                    }}
                    maxLength={2}
                    className="text-center"
                  />
                </div>
                <div className="w-[120px]">
                  <Input
                    type="text"
                    placeholder="YYYY"
                    value={formData.dobYear}
                    onChange={(e) => {
                      let value = e.target.value.replace(/\D/g, '')
                      if (value.length > 4) value = value.slice(0, 4)
                      updateFormData({ dobYear: value })
                    }}
                    maxLength={4}
                    className="text-center"
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                This information cannot be changed later
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Label>Gender (for personalized visuals)</Label>
                <InfoTooltip
                  content="Creates dream images that reflect you. Choose 'Prefer not to specify' for neutral imagery."
                  side="top"
                />
              </div>
              <RadioGroup
                value={formData.gender}
                onValueChange={(value: 'male' | 'female' | 'none' | 'both') =>
                  updateFormData({ gender: value })
                }
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="male" id="male" />
                  <Label htmlFor="male" className="font-normal cursor-pointer">Male</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="female" id="female" />
                  <Label htmlFor="female" className="font-normal cursor-pointer">Female</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="both" id="both" />
                  <Label htmlFor="both" className="font-normal cursor-pointer">Both/Fluid</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="none" id="none" />
                  <Label htmlFor="none" className="font-normal cursor-pointer">Prefer not to specify</Label>
                </div>
              </RadioGroup>
              <p className="text-xs text-muted-foreground">
                This information cannot be changed later
              </p>
            </div>

            <Button onClick={handleNextStep} className="w-full">
              Continue
            </Button>
          </>
        )
      case 2:
        return (
          <>
            <div className="space-y-4">
              <div className="flex items-start space-x-3 p-4 rounded-lg border bg-card hover:border-primary/50 transition-colors">
                <Checkbox
                  id="nightmare"
                  checked={formData.nightmareProne}
                  onCheckedChange={(checked) =>
                    updateFormData({ nightmareProne: checked === true })
                  }
                />
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="nightmare" className="font-medium cursor-pointer">
                      I experience nightmares
                    </Label>
                    <InfoTooltip
                      content="Helps AI provide supportive interpretations. This stays private (not shared in community feed). You can disable pattern tracking anytime in settings."
                      side="top"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Our AI will track patterns and provide supportive interpretations automatically
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-4 rounded-lg border bg-card hover:border-accent/50 transition-colors">
                <Checkbox
                  id="recurring"
                  checked={formData.recurringDreams}
                  onCheckedChange={(checked) =>
                    updateFormData({ recurringDreams: checked === true })
                  }
                />
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="recurring" className="font-medium cursor-pointer">
                      I have recurring dreams
                    </Label>
                    <InfoTooltip
                      content="Helps AI detect cycles and deeper meanings. This stays private (not shared in community feed). You can manage pattern tracking anytime."
                      side="top"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Our AI will detect recurring themes and help you understand their meaning
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200">
                <div className="flex items-start gap-2">
                  <Sparkles className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-foreground">
                      Intelligent Pattern Tracking
                    </p>
                    <p className="text-xs text-muted-foreground">
                      No need for lengthy forms! Our AI automatically tracks nightmare patterns and recurring dream cycles as you submit your dreams.
                      {formData.nightmareProne || formData.recurringDreams ? ' Premium and VIP members get advanced cycle detection and deeper insights.' : ''}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={handlePrevStep} className="w-full">
                Back
              </Button>
              <Button onClick={handleStep2Continue} className="w-full">
                Continue
              </Button>
            </div>
          </>
        )
      case 3:
        return (
          <>
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                <Lock className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-green-700">Your Privacy is Protected</p>
                  <p className="text-xs text-green-600 mt-1">
                    On-device classification detects sensitive content before cloud upload. You control what gets analyzed.
                  </p>
                </div>
              </div>

              <div className="flex items-start justify-between p-4 rounded-lg border bg-card">
                <div className="space-y-1 flex-1 mr-4">
                  <Label className="font-medium flex items-center gap-2">
                    <Brain className="w-4 h-4 text-primary" />
                    Enable Pattern Recognition
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Track recurring themes and emotions across your dreams
                  </p>
                </div>
                <Switch
                  checked={privacySettings.patternTrackingConsent}
                  onCheckedChange={(checked) =>
                    updatePrivacySettings({ patternTrackingConsent: checked })
                  }
                />
              </div>

              {privacySettings.patternTrackingConsent && (
                <div className="space-y-3 p-4 rounded-lg border bg-accent/5">
                  <Label className="font-medium flex items-center gap-2">
                    <EyeOff className="w-4 h-4 text-muted-foreground" />
                    Sensitive Content Redaction
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Select content types to automatically redact before AI analysis.
                  </p>

                  <div className="grid gap-2">
                    <div className="flex items-start space-x-3 p-3 rounded border bg-card hover:bg-accent/5 transition-colors">
                      <Checkbox
                        id="redact-trauma"
                        checked={privacySettings.redactTrauma}
                        onCheckedChange={(checked) =>
                          updatePrivacySettings({ redactTrauma: checked === true })
                        }
                      />
                      <div className="space-y-1">
                        <Label htmlFor="redact-trauma" className="font-medium cursor-pointer text-sm">
                          💔 Trauma & Loss
                        </Label>
                        <p className="text-xs text-muted-foreground">Abuse, accidents, grief</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3 p-3 rounded border bg-card hover:bg-accent/5 transition-colors">
                      <Checkbox
                        id="redact-sexuality"
                        checked={privacySettings.redactSexuality}
                        onCheckedChange={(checked) =>
                          updatePrivacySettings({ redactSexuality: checked === true })
                        }
                      />
                      <div className="space-y-1">
                        <Label htmlFor="redact-sexuality" className="font-medium cursor-pointer text-sm">
                          💋 Intimate Content
                        </Label>
                        <p className="text-xs text-muted-foreground">Sexual themes, intimacy</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3 p-3 rounded border bg-card hover:bg-accent/5 transition-colors">
                      <Checkbox
                        id="redact-violence"
                        checked={privacySettings.redactViolence}
                        onCheckedChange={(checked) =>
                          updatePrivacySettings({ redactViolence: checked === true })
                        }
                      />
                      <div className="space-y-1">
                        <Label htmlFor="redact-violence" className="font-medium cursor-pointer text-sm">
                          ⚔️ Violence
                        </Label>
                        <p className="text-xs text-muted-foreground">Fighting, weapons, aggression</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3 p-3 rounded border bg-card hover:bg-accent/5 transition-colors">
                      <Checkbox
                        id="redact-fears"
                        checked={privacySettings.redactFears}
                        onCheckedChange={(checked) =>
                          updatePrivacySettings({ redactFears: checked === true })
                        }
                      />
                      <div className="space-y-1">
                        <Label htmlFor="redact-fears" className="font-medium cursor-pointer text-sm">
                          😰 Fears & Phobias
                        </Label>
                        <p className="text-xs text-muted-foreground">Falling, chasing, common fears</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <AlertTriangle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-blue-600">
                  You can change these settings anytime in your profile. This step is optional—you can skip and configure later.
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={handlePrevStep} className="w-full">
                Back
              </Button>
              <Button onClick={handleStep3Continue} className="w-full">
                Continue to Referral
              </Button>
            </div>
          </>
        )
      case 4:
        return (
          <>
            <div className="space-y-4">
              <div className="p-4 rounded-lg border-2 border-dashed border-primary/30 bg-primary/5">
                <div className="flex items-center gap-2 mb-2">
                  <Gift className="h-5 w-5 text-primary" />
                  <Label htmlFor="referralCode" className="text-base font-semibold">
                    Have a referral code? (Optional)
                  </Label>
                </div>
                <Input
                  id="referralCode"
                  placeholder="Enter code (e.g., DREAM-A7K3)"
                  value={formData.referralCode}
                  onChange={(e) => updateFormData({ referralCode: e.target.value.toUpperCase() })}
                  className="uppercase"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  💡 Both you and your friend will get +1 bonus dream analysis!
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={handlePrevStep} className="w-full">
                Back
              </Button>
              <Button
                onClick={handleSubmit}
                className="w-full"
                disabled={isSubmitting || referralProcessing}
              >
                <Sparkles className="mr-2 h-4 w-4" />
                {isSubmitting || referralProcessing ? 'Processing...' : 'Complete Setup'}
              </Button>
            </div>
          </>
        )
      default:
        return null
    }
  }, [step, formData, privacySettings, referralProcessing, isSubmitting, handleNextStep, handlePrevStep, handleStep2Continue, handleStep3Continue, updateFormData, updatePrivacySettings, handleSubmit])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-background to-purple-50 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {step === 1 ? (
              <User className="h-12 w-12 text-primary" />
            ) : step === 2 ? (
              <img src="/logo_new.png" alt="Dreams" className="h-12 w-12 opacity-70" />
            ) : step === 3 ? (
              <Shield className="h-12 w-12 text-primary" />
            ) : (
              <Gift className="h-12 w-12 text-primary" />
            )}
          </div>
          <CardTitle className="text-2xl">
            {step === 1 ? 'Tell us about yourself' : step === 2 ? 'Your dream experiences' : step === 3 ? 'Your Privacy Settings' : 'Get bonus dream analyses'}
          </CardTitle>
          <CardDescription>
            {step === 1
              ? 'This helps us personalize your dream interpretations and visuals'
              : step === 2
              ? 'Understanding your dream patterns helps us provide better insights'
              : step === 3
              ? 'Control how your dream content is analyzed and protected'
              : 'Enter a referral code to unlock extra dream analyses for free'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {stepContent}
          <StepIndicator currentStep={step} totalSteps={4} />
        </CardContent>
      </Card>
    </div>
  )
}
