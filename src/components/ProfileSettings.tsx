import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { RadioGroup, RadioGroupItem } from './ui/radio-group'
import { Checkbox } from './ui/checkbox'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Separator } from './ui/separator'
import { supabaseService } from '../lib/supabaseService'
import toast from 'react-hot-toast'
import { UserProfile } from '../types/profile'
import { Loader2, Save, Crown, Shield, Flame, Trophy, AlertTriangle, User, Settings, Lock, CreditCard } from 'lucide-react'
import { PricingPlans } from './PricingPlans'
import { ReferralCard } from './ReferralCard'
import { AdminDashboard } from './AdminDashboard'
import { isAdmin } from '../utils/roleChecking'
import { validateAndProcessAddOnPurchase } from '../utils/addOnPurchaseManager'
import type { SubscriptionTier, AddOnType } from '../types/subscription'
import { VoiceSelector } from './VoiceSelector'
import { DeleteAccountDialog } from './DeleteAccountDialog'
import { SensitiveContentSettings } from './SensitiveContentSettings'
import { createCheckoutSession, createPortalSession } from '../utils/stripeCheckout'
import { SubscriptionStatus } from './SubscriptionStatus'

interface ProfileSettingsProps {
  userProfile: UserProfile | null
  onProfileUpdated: () => void
}

export function ProfileSettings({ userProfile, onProfileUpdated }: ProfileSettingsProps) {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  // NOTE: Must be declared before any memo/effect that references it.
  const [userIsAdmin, setUserIsAdmin] = useState(false)
  const [checkingAdmin, setCheckingAdmin] = useState(true)

  const allowedTabs = useMemo(() => {
    const base = ['account', 'privacy', 'preferences', 'subscription']
    if (userIsAdmin) base.push('admin')
    return base
  }, [userIsAdmin])

  const initialTab = useMemo(() => {
    const tab = (searchParams.get('tab') || '').toLowerCase()
    return allowedTabs.includes(tab) ? tab : 'account'
  }, [allowedTabs, searchParams])

  const [activeTab, setActiveTab] = useState<string>(initialTab)

  useEffect(() => {
    setActiveTab(initialTab)
  }, [initialTab])

  const [formData, setFormData] = useState({
    name: '',
    age: '',
    dateOfBirth: '',
    gender: 'none' as 'male' | 'female' | 'none' | 'both',
    nightmareProne: false,
    recurringDreams: false,
    preferredTtsVoice: 'nova'
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [streakData, setStreakData] = useState<{ currentStreak: number; bestStreak: number } | null>(null)
  const [userEmail, setUserEmail] = useState<string>('')

  useEffect(() => {
    if (userProfile) {
      setFormData({
        name: userProfile.name,
        age: userProfile.age.toString(),
        dateOfBirth: (userProfile as any).dateOfBirth || '',
        gender: userProfile.gender,
        nightmareProne: Number(userProfile.nightmareProne) > 0,
        recurringDreams: Number(userProfile.recurringDreams) > 0,
        preferredTtsVoice: (userProfile as any).preferredTtsVoice || 'nova'
      })
      setIsLoading(false)
    }
  }, [userProfile])

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const currentUser = await blink.auth.me()
        if (!currentUser?.id) {
          setUserIsAdmin(false)
          setCheckingAdmin(false)
          return
        }
        
        // Store user email for delete account dialog
        if (currentUser.email) {
          setUserEmail(currentUser.email)
        }
        
        const adminStatus = await isAdmin(currentUser.id)
        setUserIsAdmin(adminStatus)
      } catch (error) {
        console.error('Error checking admin status:', error)
        setUserIsAdmin(false)
      } finally {
        setCheckingAdmin(false)
      }
    }

    checkAdminStatus()
  }, [])

  // Fetch streak data from gamification_profiles
  useEffect(() => {
    const fetchStreakData = async () => {
      if (!userProfile?.userId) return
      
      const client = supabaseService.supabase
      if (!client) return

      try {
        const { data, error } = await client
          .from('gamification_profiles')
          .select('current_streak, best_streak')
          .eq('user_id', userProfile.userId)
          .single()
        
        if (data) {
          setStreakData({
            currentStreak: Number(data.current_streak) || 0,
            bestStreak: Number(data.best_streak) || 0
          })
        }
      } catch (error) {
        console.error('Error fetching streak data:', error)
      }
    }

    fetchStreakData()
  }, [userProfile?.userId])

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Please enter your name')
      return
    }

    const age = parseInt(formData.age)
    if (isNaN(age) || age < 5 || age > 120) {
      toast.error('Please enter a valid age between 5 and 120')
      return
    }

    if (!userProfile) return

    setIsSaving(true)
    try {
      const profile = await supabaseService.getProfile(userProfile.userId)
      if (profile) {
        await supabaseService.upsertProfile({
          ...profile,
          name: formData.name,
          age: age,
          gender: formData.gender,
          nightmare_prone: formData.nightmareProne,
          recurring_dreams: formData.recurringDreams,
          preferred_tts_voice: formData.preferredTtsVoice,
          updated_at: new Date().toISOString()
        } as any)
      }

      toast.success('Profile updated successfully!')
      onProfileUpdated()
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('Failed to update profile. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSelectPlan = async (tier: SubscriptionTier) => {
    // This is called from PricingPlans component which now handles Stripe directly
    // Keep for backwards compatibility
    toast.success(`Plan selected: ${tier}`)
  }

  const handlePurchaseAddOn = async (addOnId: AddOnType) => {
    try {
      const result = await validateAndProcessAddOnPurchase({
        addOnId,
        quantity: 1
      })

      if (result.valid) {
        toast.success(`${result.addOnDetails?.name} - ${result.amount?.toFixed(2)} (Purchase ID: ${result.purchaseId})`)
      } else {
        toast.error(result.error || 'Failed to process add-on purchase')
      }
    } catch (error) {
      console.error('Error processing add-on purchase:', error)
      toast.error('Failed to process add-on purchase')
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground mt-4">Loading profile...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <Tabs
        value={activeTab}
        onValueChange={(nextTab) => {
          setActiveTab(nextTab)
          const next = new URLSearchParams(searchParams)
          next.set('tab', nextTab)
          setSearchParams(next, { replace: true })
        }}
        className="w-full"
      >
        <TabsList className={`grid w-full ${userIsAdmin ? 'grid-cols-5' : 'grid-cols-4'}`}>
          <TabsTrigger value="account" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            <span className="hidden sm:inline">Account</span>
          </TabsTrigger>
          <TabsTrigger value="privacy" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            <span className="hidden sm:inline">Privacy</span>
          </TabsTrigger>
          <TabsTrigger value="preferences" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">Preferences</span>
          </TabsTrigger>
          <TabsTrigger value="subscription" className="flex items-center gap-2">
            <Crown className="w-4 h-4" />
            <span className="hidden sm:inline">Subscription</span>
          </TabsTrigger>
          {userIsAdmin && (
            <TabsTrigger value="admin" className="flex items-center gap-2">
              <Lock className="w-4 h-4" />
              <span className="hidden sm:inline">Admin</span>
            </TabsTrigger>
          )}
        </TabsList>

        {/* ACCOUNT BASICS TAB */}
        <TabsContent value="account" className="space-y-6">
          {/* Streak Display Card */}
          {streakData && (
            <Card className="w-full bg-gradient-to-br from-primary/5 via-secondary/50 to-accent/5 border-primary/20">
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-500/20">
                        <Flame className="w-5 h-5 text-orange-500" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Current Streak</p>
                        <p className="text-2xl font-bold text-foreground">{streakData.currentStreak} days</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-yellow-500/20 to-amber-500/20 border border-yellow-500/20">
                        <Trophy className="w-5 h-5 text-yellow-500" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Best Streak</p>
                        <p className="text-2xl font-bold text-foreground">{streakData.bestStreak} days</p>
                      </div>
                    </div>
                  </div>
                  {streakData.currentStreak > 0 && (
                    <p className="text-sm text-muted-foreground hidden md:block">
                      Keep dreaming to maintain your streak! 
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="w-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                Account Basics
              </CardTitle>
              <CardDescription>
                Your personal information and account details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  placeholder="Enter your name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">Date of Birth</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  disabled
                  className="bg-muted cursor-not-allowed"
                />
                <p className="text-xs text-muted-foreground">
                  Date of Birth cannot be changed
                </p>
              </div>

              <div className="space-y-3">
                <Label>Sex (for personalized visuals)</Label>
                <RadioGroup value={formData.gender} disabled>
                  <div className="flex items-center space-x-2 opacity-60">
                    <RadioGroupItem value="male" id="male" disabled />
                    <Label htmlFor="male" className="font-normal">Male</Label>
                  </div>
                  <div className="flex items-center space-x-2 opacity-60">
                    <RadioGroupItem value="female" id="female" disabled />
                    <Label htmlFor="female" className="font-normal">Female</Label>
                  </div>
                  <div className="flex items-center space-x-2 opacity-60">
                    <RadioGroupItem value="both" id="both" disabled />
                    <Label htmlFor="both" className="font-normal">Both/Fluid</Label>
                  </div>
                  <div className="flex items-center space-x-2 opacity-60">
                    <RadioGroupItem value="none" id="none" disabled />
                    <Label htmlFor="none" className="font-normal">Prefer not to specify</Label>
                  </div>
                </RadioGroup>
                <p className="text-xs text-muted-foreground">
                  Sex cannot be changed
                </p>
              </div>

              <Button onClick={handleSave} disabled={isSaving} className="w-full">
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Danger Zone - Delete Account */}
          <Card className="border-destructive/30 bg-destructive/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="w-5 h-5" />
                Danger Zone
              </CardTitle>
              <CardDescription>
                Irreversible actions that will permanently affect your account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg border border-destructive/30 bg-background">
                <div>
                  <h4 className="font-medium text-destructive">Delete Account</h4>
                  <p className="text-sm text-muted-foreground">
                    Permanently delete your account and all associated data. This action cannot be undone.
                  </p>
                </div>
                <DeleteAccountDialog
                  userId={userProfile?.userId || ''}
                  userEmail={userEmail}
                  onAccountDeleted={() => {
                    window.location.href = '/'
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* PRIVACY & SECURITY TAB */}
        <TabsContent value="privacy" className="space-y-6">
          {userProfile?.userId && (
            <SensitiveContentSettings 
              userId={userProfile.userId} 
              onSettingsChanged={onProfileUpdated}
            />
          )}
        </TabsContent>

        {/* PREFERENCES TAB */}
        <TabsContent value="preferences" className="space-y-6">
          {userProfile?.subscriptionTier === 'free' && <ReferralCard />}

          <Card className="w-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-primary" />
                Dream Experience Settings
              </CardTitle>
              <CardDescription>
                Customize how AI interprets your dreams
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start space-x-3 p-4 rounded-lg border bg-card">
                <Checkbox
                  id="nightmare"
                  checked={formData.nightmareProne}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, nightmareProne: checked === true })
                  }
                />
                <div className="space-y-1">
                  <Label htmlFor="nightmare" className="font-medium cursor-pointer">
                    I experience nightmares
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    We'll provide supportive interpretations and coping insights
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-4 rounded-lg border bg-card">
                <Checkbox
                  id="recurring"
                  checked={formData.recurringDreams}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, recurringDreams: checked === true })
                  }
                />
                <div className="space-y-1">
                  <Label htmlFor="recurring" className="font-medium cursor-pointer">
                    I have recurring dreams
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    We'll track patterns and help identify recurring themes
                  </p>
                </div>
              </div>

              {userProfile?.subscriptionTier === 'vip' && (
                <div className="space-y-2 p-4 rounded-lg border bg-card">
                  <VoiceSelector
                    currentVoice={formData.preferredTtsVoice}
                    onVoiceChange={(voice) => setFormData({ ...formData, preferredTtsVoice: voice })}
                  />
                </div>
              )}

              <Button onClick={handleSave} disabled={isSaving} className="w-full">
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Preferences
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SUBSCRIPTION & BILLING TAB */}
        <TabsContent value="subscription" className="space-y-8">
          {userProfile?.userId && (
            <SubscriptionStatus 
              userId={userProfile.userId} 
              currentTier={userProfile.subscriptionTier as SubscriptionTier} 
            />
          )}

          <Separator />

          <PricingPlans
            currentTier={userProfile?.subscriptionTier || 'free'}
            onSelectPlan={handleSelectPlan}
            onPurchaseAddOn={handlePurchaseAddOn}
          />
        </TabsContent>

        {/* ADMIN TAB */}
        {userIsAdmin && (
          <TabsContent value="admin" className="space-y-6">
            <div className="border rounded-lg overflow-hidden bg-card">
              <AdminDashboard hideHeader={true} />
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
