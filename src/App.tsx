import { useEffect, useState, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { DreamInput } from './components/DreamInput'
import { DreamLibrary } from './components/DreamLibrary'
import { DreamTrends } from './components/DreamTrends'
import { ProfileSettings } from './components/ProfileSettings'
import { Onboarding } from './components/Onboarding'
import { SignIn } from './components/SignIn'
import { VideoGenerationNotifications } from './components/VideoGenerationNotifications'
import { InlineReauthDialog } from './components/InlineReauthDialog'
import { PWAInstallPrompt } from './components/PWAInstallPrompt'
import { OfflineIndicator } from './components/OfflineIndicator'
import { EngagementNotification, useEngagementNotification } from './components/EngagementNotificationCenter'
import { SecondDreamEngagementToast } from './components/SecondDreamEngagementToast'
import { Button } from './components/ui/button'
import { ThemeToggle } from './components/ui/theme-toggle'
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetClose } from './components/ui/sheet'
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from './components/ui/tooltip'
import { Sparkles, User, LogOut, TrendingUp, Settings, Mic, Shield, BookOpen, TreeDeciduous, Users, Map as MapIcon, Menu } from 'lucide-react'
import { blink } from './blink/client'
import { UserProfile } from './types/profile'
import { supabaseService } from './lib/supabaseService'
import { logPlatformInfo } from './utils/platformDetection'
import { isAdmin } from './utils/roleChecking'
import { useInlineReauth } from './hooks/useInlineReauth'
import { ensureUserRecord } from './utils/authHelpers'
import { ReauthRetryProvider } from './contexts/ReauthRetryContext'
import { initializeSessionManager, stopSessionManager } from './utils/sessionManager'
import { logReauthAttempt } from './utils/authTelemetry'
import { EngagementGuide } from './utils/engagementGuide'
import { trackEngagementInteraction, updateUserLastEngagement } from './utils/engagementTracking'
import { withDbRateLimitGuard } from './utils/rateLimitGuard'
import { getEngagementMessage } from './config/engagementPrompts'
import { canTranscribeAudio } from './utils/subscriptionHelpers'
import { getLaunchOfferStatus } from './utils/launchOfferManager'
import type { UserProfileRow } from './types/blink'

type View = 'input' | 'library' | 'trends' | 'settings'

function App() {
  // Force visual refresh
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [authError, setAuthError] = useState<string | null>(null)
  const [view, setView] = useState<View>('input')
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  // If we land on /dashboard with a tab query (e.g. ?tab=account), open Settings view.
  const tabParam = (searchParams.get('tab') || '').toLowerCase()
  useEffect(() => {
    if (tabParam) setView('settings')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabParam])
  const [newDreamId, setNewDreamId] = useState<string | null>(null) // Store ID of newly created dream
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [needsOnboarding, setNeedsOnboarding] = useState(false)
  const [userIsAdmin, setUserIsAdmin] = useState(false)
  
  // Track which input tab should be active - defaults to 'voice' for voice-enabled users, 'text' otherwise
  const canUseVoiceTranscription = !!userProfile && canTranscribeAudio({ 
    subscriptionTier: userProfile.subscriptionTier as any,
    hasLaunchOffer: !!userProfile.hasLaunchOffer
  })
  
  // Use 'voice' as internal default if transcription is available, 'text' otherwise
  const [activeInputTab, setActiveInputTab] = useState<'voice' | 'text' | 'symbols' | 'image'>(
    'text' // Start with text, will transition once profile loads
  )
  
  // Use ref to track if we've already set the initial default tab based on capabilities
  const initialTabSetRef = useRef(false)
  useEffect(() => {
    if (userProfile && !initialTabSetRef.current) {
      if (canUseVoiceTranscription) {
        console.log('🎙️ App launch: User has transcription access, setting default tab to voice')
        setActiveInputTab('voice')
      } else {
        console.log('📝 App launch: User does not have transcription access, keeping text tab')
        setActiveInputTab('text')
      }
      initialTabSetRef.current = true
    }
  }, [userProfile, canUseVoiceTranscription])

  // Keep navigation + input tab consistent with tier capabilities
  // If voice is not available, fall back to text.
  useEffect(() => {
    if (!canUseVoiceTranscription && activeInputTab === 'voice') {
      setActiveInputTab('text')
    }
  }, [canUseVoiceTranscription, activeInputTab])

  // Use ref to track logout state (accessible in auth listener without re-running effect)
  const isLoggingOutRef = useRef(false)
  
  // Inline re-authentication hook
  const { needsReauth, userEmail, clearReauth, cancelReauth } = useInlineReauth()

  // Engagement notification system
  const { notification, showNotification, closeNotification, NotificationComponent } = useEngagementNotification()
  const engagementCheckTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  // Second dream engagement toast state
  const [showSecondDreamToast, setShowSecondDreamToast] = useState(false)
  const secondDreamToastTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Listen for dream logged events - Second Dream Engagement Toast
  useEffect(() => {
    const handleDreamLogged = async (event: any) => {
      const { dreamId, hasImage } = event.detail
      
      if (!user?.id) return

      try {
        // Check if user has dismissed this toast
        const hasDissmissed = localStorage.getItem('dreamcatcher_engagement_toast_dismissed') === 'true'
        if (hasDissmissed) {
          console.log('Engagement toast dismissed by user preference')
          return
        }

        // Get user's dream count and subscription tier
        const profiles = await withDbRateLimitGuard(`app:dreamLoggedProfile:${user.id}`, () =>
          blink.db.userProfiles.list({ where: { userId: user.id }, limit: 1 })
        )
        if (profiles.length === 0) return

        const profile = profiles[0] as any
        const dreamsAnalyzedLifetime = Number(profile.dreams_analyzed_lifetime) || 0
        const subscriptionTier = profile.subscription_tier || 'free'

        // Only show for Free tier users on their 2nd dream
        if (subscriptionTier === 'free' && dreamsAnalyzedLifetime === 2) {
          // Clear any existing timeout
          if (secondDreamToastTimeoutRef.current) {
            clearTimeout(secondDreamToastTimeoutRef.current)
          }

          // Show toast after 5 seconds
          secondDreamToastTimeoutRef.current = setTimeout(() => {
            setShowSecondDreamToast(true)
            trackEngagementInteraction(user.id, 'SECOND_DREAM_SHARE', 'no_interaction')
          }, 5000)
        }
      } catch (error) {
        console.warn('Error handling dream logged event:', error)
      }
    }

    window.addEventListener('dreamLogged', handleDreamLogged)
    return () => {
      window.removeEventListener('dreamLogged', handleDreamLogged)
      if (secondDreamToastTimeoutRef.current) {
        clearTimeout(secondDreamToastTimeoutRef.current)
      }
    }
  }, [user?.id, navigate])

  useEffect(() => {
    // Log platform info on app initialization
    logPlatformInfo()

    let mounted = true
    let sessionManagerInitialized = false
    
    try {
      const unsubscribe = blink.auth.onAuthStateChanged((state) => {
        if (!mounted) return
        
        console.log('Auth state changed:', { 
          isLoading: state.isLoading, 
          hasUser: !!state.user, 
          isLoggingOut: isLoggingOutRef.current 
        })
        
        // CRITICAL FIX: Don't restore session if user is actively logging out
        if (isLoggingOutRef.current && state.user) {
          console.log('🚫 [App] Ignoring auth state change - logout in progress')
          return
        }
        
        // SOLUTION 3: Initialize session manager only when user is authenticated
        if (state.user && !sessionManagerInitialized) {
          console.log('🔐 [App] User authenticated, initializing session manager')
          initializeSessionManager()
          sessionManagerInitialized = true
        } else if (!state.user && sessionManagerInitialized && !isLoggingOutRef.current) {
          console.log('🔓 [App] User logged out, stopping session manager')
          stopSessionManager()
          sessionManagerInitialized = false
        }
        
        setUser(state.user)
        setIsLoading(state.isLoading)
        setAuthError(null) // Clear any previous errors
      })
      
      return () => {
        mounted = false
        unsubscribe()
        if (sessionManagerInitialized) {
          stopSessionManager() // SOLUTION 3: Clean up on unmount
        }
      }
    } catch (error) {
      console.error('Auth listener error:', error)
      setAuthError('Authentication system unavailable. Please refresh the page.')
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (user) {
      // OPTIMIZATION: Load profile and admin status in parallel
      checkUserDataInParallel()
      // Initialize engagement system for this user
      initializeEngagementSystem()
      
      // Ensure user record exists in DB and check launch offer
      // This covers cases where signup/login redirect happened before DB sync
      ensureUserRecord(user).catch(err => 
        console.warn('Background user record sync failed:', err)
      )
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  // Listen for navigation to settings from engagement toast
  useEffect(() => {
    const handleNavigateToSettings = () => {
      setView('settings')
    }
    window.addEventListener('navigateToSettings', handleNavigateToSettings)
    return () => window.removeEventListener('navigateToSettings', handleNavigateToSettings)
  }, [])

  /**
   * Initialize engagement system and check for behavioral triggers
   */
  async function initializeEngagementSystem() {
    try {
      if (!user?.id) return

      // Clear any existing timeout
      if (engagementCheckTimeoutRef.current) {
        clearTimeout(engagementCheckTimeoutRef.current)
      }

      // Fetch dreams to build engagement context from Supabase
      const dreams = await supabaseService.getDreams(user.id)
      
      const { data: gamification } = await supabaseService.supabase
        .from('gamification_profiles')
        .select('*')
        .eq('user_id', user.id)
        .limit(1)

      const dreamData = {
        totalCount: dreams.length,
        lastLoggedAt: dreams.length > 0 ? (dreams as any)[0].created_at : null,
        thisMonthCount: dreams.filter((d: any) => {
          const dreamDate = new Date(d.created_at)
          const now = new Date()
          return dreamDate.getMonth() === now.getMonth() && dreamDate.getFullYear() === now.getFullYear()
        }).length,
        recurringSymbols: [],
        hasImages: dreams.some((d: any) => d.image_url),
        hasVideo: false
      }

      // Determine engagement trigger
      const userState = {
        userId: user.id,
        totalDreamsLogged: dreamData.totalCount,
        lastDreamLoggedAt: dreamData.lastLoggedAt,
        currentStreak: gamification && gamification.length > 0 ? (gamification[0] as any).current_streak || 0 : 0,
        bestStreak: gamification && gamification.length > 0 ? (gamification[0] as any).best_streak || 0 : 0,
        lastAppOpenedAt: user.last_sign_in,
        subscriptionTier: userProfile?.subscriptionTier || 'free',
        recurringSymbols: dreamData.recurringSymbols,
        lastEngagementMessageAt: null,
        dreamsThisMonth: dreamData.thisMonthCount,
        hasGeneratedImages: dreamData.hasImages,
        hasGeneratedVideo: dreamData.hasVideo
      }

      const trigger = EngagementGuide.determineBehaviorTrigger(userState)

      if (trigger && EngagementGuide.shouldShowMessage(userState, 4)) {
        const message = EngagementGuide.getAdaptiveMessage({
          trigger: trigger.trigger,
          userState,
          variables: trigger.variables,
          priority: trigger.priority
        })

        if (message) {
          // Show notification after a brief delay for better UX
          engagementCheckTimeoutRef.current = setTimeout(() => {
            showNotification(message.message, message.trigger, message.priority)
            trackEngagementInteraction(user.id, message.trigger, 'no_interaction')
            updateUserLastEngagement(user.id)
          }, 800)
        }
      }
    } catch (error) {
      console.warn('Engagement system initialization error:', error)
    }
  }

  async function checkUserDataInParallel() {
    try {
      // Execute checks in parallel for faster loading
      const [profileResult, adminResult, launchOfferResult] = await Promise.allSettled([
        supabaseService.getProfile(user.id),
        isAdmin(user.id),
        getLaunchOfferStatus(user.id)
      ])

      // Handle profile and launch offer result
      if (profileResult.status === 'fulfilled') {
        const profile = profileResult.value
        if (!profile) {
          setNeedsOnboarding(true)
        } else {
          // Get launch offer status
          let hasLaunchOffer = false
          if (launchOfferResult.status === 'fulfilled') {
            hasLaunchOffer = launchOfferResult.value.hasLaunchOffer
          }

          const processedProfile = {
            ...profile,
            age: profile.age,
            nightmareProne: profile.nightmare_prone,
            recurringDreams: profile.recurring_dreams,
            onboardingCompleted: profile.onboarding_completed,
            hasLaunchOffer // Inject into profile object
          }
          setUserProfile(processedProfile as unknown as UserProfile)
          setNeedsOnboarding(false)
        }
      } else {
        console.error('Error checking onboarding:', profileResult.reason)
      }

      // Handle admin result
      if (adminResult.status === 'fulfilled') {
        setUserIsAdmin(adminResult.value)
      } else {
        console.error('Error checking admin status:', adminResult.reason)
        setUserIsAdmin(false)
      }
    } catch (error) {
      console.error('Error loading user data:', error)
    }
  }

  async function checkOnboardingStatus() {
    try {
      const [profile, launchOffer] = await Promise.all([
        supabaseService.getProfile(user.id),
        getLaunchOfferStatus(user.id)
      ])
      
      if (!profile) {
        setNeedsOnboarding(true)
      } else {
        // Ensure age is a number
        const processedProfile = {
          ...profile,
          age: profile.age,
          nightmareProne: profile.nightmare_prone,
          recurringDreams: profile.recurring_dreams,
          onboardingCompleted: profile.onboarding_completed,
          hasLaunchOffer: launchOffer.hasLaunchOffer
        }
        setUserProfile(processedProfile as unknown as UserProfile)
        setNeedsOnboarding(false)
      }
    } catch (error) {
      console.error('Error checking onboarding:', error)
    }
  }

  const handleOnboardingComplete = () => {
    setNeedsOnboarding(false)
    checkOnboardingStatus()
  }

  const handleSignOut = async () => {
    try {
      console.log('🚪 [App] User initiated logout')
      
      // Step 1: Set logout flag to prevent auth state listener from restoring session
      isLoggingOutRef.current = true
      
      // Step 2: Stop session manager to prevent auto-refresh
      stopSessionManager()
      
      // Step 3: Clear user state immediately to prevent UI flicker
      setUser(null)
      setUserProfile(null)
      
      // Step 4: Logout from Blink SDK (clears tokens from localStorage)
      await blink.auth.signOut()
      
      // Step 5: Clear any remaining auth-related data from localStorage
      try {
        // Clear any keys that might persist auth state
        const keysToRemove = Object.keys(localStorage).filter(key => 
          key.includes('blink') || 
          key.includes('auth') || 
          key.includes('token') ||
          key.includes('dreamcatcher')
        )
        keysToRemove.forEach(key => localStorage.removeItem(key))
        console.log('🗑️ [App] Cleared localStorage auth data:', keysToRemove.length, 'keys')
      } catch (storageError) {
        console.warn('⚠️ [App] Could not clear localStorage:', storageError)
      }
      
      console.log('✅ [App] Logout completed successfully')
      
      // Step 6: Reset logout flag after a brief delay
      setTimeout(() => { isLoggingOutRef.current = false }, 1000)
      
      // Step 7: Force navigate to landing page
      window.location.href = '/'
    } catch (error) {
      console.error('❌ [App] Logout error:', error)
      // Even if logout fails, clear local state and navigate
      setUser(null)
      setUserProfile(null)
      isLoggingOutRef.current = false
      window.location.href = '/' // Force full page reload to landing
    }
  }

  const handleDreamCreated = (dreamId?: string) => {
    console.log('🎯 handleDreamCreated called with:', { dreamId })
    
    // Store the newly created dream ID for highlighting
    if (dreamId) {
      console.log('📚 Navigating to library and highlighting new dream:', dreamId)
      setNewDreamId(dreamId)
      
      // STRATEGY 1 FIX: Direct navigation to specific dream ID using URL hash
      window.location.hash = `#dream-${dreamId}`
    }
    
    // Always navigate to library after dream creation
    setView('library')
    setRefreshTrigger(prev => prev + 1)
    
    // Reset input tab preference for next time if they had voice capability
    if (canUseVoiceTranscription) {
      setActiveInputTab('voice')
    } else {
      setActiveInputTab('text')
    }
    
    console.log('✅ Navigation to library complete')
  }

  const handleReauthSuccess = async () => {
    const startTime = Date.now()
    
    // clearReauth will automatically retry all pending API calls
    await clearReauth()
    
    const durationMs = Date.now() - startTime
    const retriedCalls = 0 // Will be tracked by clearReauth internally
    
    // Log successful auto-retry to telemetry
    try {
      const currentUser = await blink.auth.me()
      await logReauthAttempt({
        userId: currentUser?.id,
        userEmail: currentUser?.email,
        method: 'auto_retry',
        success: true,
        durationMs,
        retriedCalls
      })
    } catch (error) {
      console.warn('Could not log reauth success telemetry:', error)
    }
    
    // OPTIMIZATION: Refresh user data in parallel
    checkUserDataInParallel()
  }

  const handleReauthCancel = () => {
    // Cancel reauth and clear retry queue
    cancelReauth()
  }

  // Show inline reauth dialog when user is logged in but token expired
  const showInlineReauth = needsReauth && user

  if (authError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <img src="/logo_new.png" alt="Error" className="w-16 h-16 mx-auto mb-4 opacity-50 grayscale" />
          <h2 className="text-xl font-semibold mb-2">Authentication Error</h2>
          <p className="text-muted-foreground mb-4">{authError}</p>
          <Button onClick={() => window.location.reload()}>
            Refresh Page
          </Button>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="relative">
            <img src="/logo_new.png" alt="Loading..." className="w-16 h-16 animate-pulse mx-auto mb-4 opacity-50" />
            <div className="absolute inset-0 w-16 h-16 mx-auto">
              <div className="w-full h-full border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
            </div>
          </div>
          <p className="text-muted-foreground mt-4">Initializing...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    // User not authenticated - nothing to render here
    // The router will handle showing the landing page via the / route
    return null
  }

  if (needsOnboarding) {
    return <Onboarding onComplete={handleOnboardingComplete} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      {/* Header with Navigation */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          {/* Title Row */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <img src="/logo_new.png" alt="Dreamcatcher AI" className="w-8 h-8 object-contain" />
              <h1 className="text-lg sm:text-2xl font-serif font-bold tracking-wide">Dreamcatcher AI</h1>
            </div>
          
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
                <User className="w-4 h-4" />
                <span>{user.email}</span>
              </div>
              <Button variant="outline" size="sm" onClick={handleSignOut} className="hidden md:flex">
                <LogOut className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Sign Out</span>
              </Button>
            </div>
          </div>
          
          {/* Navigation Buttons Row */}
          <div className="flex items-center gap-2 w-full justify-between md:justify-start flex-wrap">
            <div className="flex gap-2">
            {/* Record Dream button - Only shows as highlighted when voice tab is active */}
            {canUseVoiceTranscription ? (
              <Button
                variant={view === 'input' && activeInputTab === 'voice' ? 'default' : 'outline'}
                onClick={() => {
                  setView('input')
                  setActiveInputTab('voice')
                }}
                size="sm"
                className="relative"
              >
                <Mic className="w-4 h-4 mr-2" />
                Record Dream
              </Button>
            ) : (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="inline-block">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled
                        className="opacity-60 cursor-not-allowed"
                      >
                        <Mic className="w-4 h-4 mr-2" />
                        Record Dream
                      </Button>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-xs">
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Upgrade to Pro for this feature</p>
                      <p className="text-xs text-muted-foreground">
                        Go to <span className="font-medium">New Dream</span> to capture your first dream.
                      </p>
                      <div className="flex gap-2 pt-1">
                        <Button size="sm" onClick={() => navigate('/pricing')}>
                          Upgrade
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setView('input')
                            setActiveInputTab('text')
                          }}
                        >
                          New Dream
                        </Button>
                      </div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            {/* New Dream button - Highlighted when text/symbols/image tabs are active */}
            <Button
              variant={view === 'input' && (activeInputTab === 'text' || activeInputTab === 'symbols' || activeInputTab === 'image') ? 'default' : 'outline'}
              onClick={() => {
                setView('input')
                setActiveInputTab('text')
              }}
              size="sm"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              New Dream
            </Button>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex gap-2">
            <Button
              variant={view === 'library' ? 'default' : 'outline'}
              onClick={() => setView('library')}
              size="sm"
            >
              <img src="/logo_new.png" alt="Dreams" className="w-4 h-4 mr-2 opacity-70" />
              My Dreams
            </Button>
            <Button
              variant={view === 'trends' ? 'default' : 'outline'}
              onClick={() => setView('trends')}
              size="sm"
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Dream Trends
            </Button>
            <Button
              variant={view === 'settings' ? 'default' : 'outline'}
              onClick={() => setView('settings')}
              size="sm"
            >
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    onClick={() => navigate('/dream-map')}
                    size="sm"
                    className="border-indigo-500/50 text-indigo-600 hover:bg-indigo-50"
                  >
                    <MapIcon className="w-4 h-4 mr-2" />
                    Dreamscape
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                  <p>Visualize collective dream archetypes in an experimental shifting landscape of the human subconscious.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {(userProfile?.subscriptionTier === 'premium' || userProfile?.subscriptionTier === 'vip') && (
              <>
                <Button
                  variant="outline"
                  onClick={() => navigate('/reflect-ai')}
                  size="sm"
                  className="border-primary/50 text-primary hover:bg-primary/10"
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  Reflection Journal
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate('/symbol-orchard')}
                  size="sm"
                  className="border-green-500/50 text-green-600 hover:bg-green-50"
                >
                  <TreeDeciduous className="w-4 h-4 mr-2" />
                  Symbol Orchard
                </Button>
              </>
            )}
            {userIsAdmin && (
              <Button
                variant="outline"
                onClick={() => navigate('/admin')}
                size="sm"
                className="border-primary/50 text-primary hover:bg-primary/10"
              >
                <Shield className="w-4 h-4 mr-2" />
                Admin Panel
              </Button>
            )}
            </div>

            {/* Mobile Hamburger Menu */}
            <div className="md:hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu className="w-5 h-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right">
                  <SheetHeader>
                    <SheetTitle>Menu</SheetTitle>
                  </SheetHeader>
                  <div className="flex flex-col gap-3 mt-6">
                    <SheetClose asChild>
                      <Button
                        variant={view === 'library' ? 'default' : 'outline'}
                        onClick={() => setView('library')}
                        className="w-full justify-start"
                      >
                        <img src="/logo_new.png" alt="Dreams" className="w-4 h-4 mr-2 opacity-70" />
                        My Dreams
                      </Button>
                    </SheetClose>
                    <SheetClose asChild>
                      <Button
                        variant={view === 'trends' ? 'default' : 'outline'}
                        onClick={() => setView('trends')}
                        className="w-full justify-start"
                      >
                        <TrendingUp className="w-4 h-4 mr-2" />
                        Dream Trends
                      </Button>
                    </SheetClose>
                    <SheetClose asChild>
                      <Button
                        variant={view === 'settings' ? 'default' : 'outline'}
                        onClick={() => setView('settings')}
                        className="w-full justify-start"
                      >
                        <Settings className="w-4 h-4 mr-2" />
                        Settings
                      </Button>
                    </SheetClose>
                    <SheetClose asChild>
                      <Button
                        variant="outline"
                        onClick={() => navigate('/dream-map')}
                        className="w-full justify-start border-indigo-500/50 text-indigo-600 hover:bg-indigo-50"
                      >
                        <MapIcon className="w-4 h-4 mr-2" />
                        Dreamscape
                      </Button>
                    </SheetClose>

                    {(userProfile?.subscriptionTier === 'premium' || userProfile?.subscriptionTier === 'vip') && (
                      <>
                        <SheetClose asChild>
                          <Button
                            variant="outline"
                            onClick={() => navigate('/reflect-ai')}
                            className="w-full justify-start border-primary/50 text-primary hover:bg-primary/10"
                          >
                            <BookOpen className="w-4 h-4 mr-2" />
                            Reflection Journal
                          </Button>
                        </SheetClose>
                        <SheetClose asChild>
                          <Button
                            variant="outline"
                            onClick={() => navigate('/symbol-orchard')}
                            className="w-full justify-start border-green-500/50 text-green-600 hover:bg-green-50"
                          >
                            <TreeDeciduous className="w-4 h-4 mr-2" />
                            Symbol Orchard
                          </Button>
                        </SheetClose>
                      </>
                    )}
                    {userIsAdmin && (
                      <SheetClose asChild>
                        <Button
                          variant="outline"
                          onClick={() => navigate('/admin')}
                          className="w-full justify-start border-primary/50 text-primary hover:bg-primary/10"
                        >
                          <Shield className="w-4 h-4 mr-2" />
                          Admin Panel
                        </Button>
                      </SheetClose>
                    )}
                    
                    <div className="h-px bg-border my-2" />
                    
                    <div className="flex items-center gap-2 px-2 py-2 text-sm text-muted-foreground">
                      <User className="w-4 h-4" />
                      <span className="truncate">{user?.email}</span>
                    </div>
                    
                    <SheetClose asChild>
                      <Button variant="destructive" onClick={handleSignOut} className="w-full justify-start">
                        <LogOut className="w-4 h-4 mr-2" />
                        Sign Out
                      </Button>
                    </SheetClose>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="pb-12">
          {view === 'input' ? (
            <DreamInput 
              onDreamCreated={handleDreamCreated} 
              userProfile={userProfile} 
              initialTab={activeInputTab}
              onTabChange={setActiveInputTab}
            />
          ) : view === 'library' ? (
            <DreamLibrary 
              onNewDream={() => {
                setView('input')
                setActiveInputTab('text')
                setNewDreamId(null)
              }} 
              refreshTrigger={refreshTrigger} 
              newDreamId={newDreamId || undefined}
            />
          ) : view === 'trends' ? (
            <DreamTrends subscriptionTier={userProfile?.subscriptionTier || 'free'} />
          ) : (
            <ProfileSettings userProfile={userProfile} onProfileUpdated={checkOnboardingStatus} />
          )}
        </div>
      </div>

      {/* Video Generation Notifications */}
      {user && userProfile && (
        <VideoGenerationNotifications
          userId={user.id}
          onVideoComplete={(jobId, videoUrl) => {
            console.log('Video completed:', jobId, videoUrl)
            // Optionally trigger a refresh of the dream library
            setRefreshTrigger(prev => prev + 1)
          }}
        />
      )}

      {/* Inline Re-authentication Dialog - Applies to all tiers */}
      {showInlineReauth && (
        <InlineReauthDialog
          open={showInlineReauth}
          onSuccess={handleReauthSuccess}
          onCancel={handleReauthCancel}
          userEmail={userEmail}
          message="Your session has expired. Please sign in again to continue using Dreamcatcher AI."
        />
      )}

      {/* PWA Install Prompt */}
      <PWAInstallPrompt />
      
      {/* Offline Indicator */}
      <OfflineIndicator />

      {/* Engagement Notification */}
      {NotificationComponent}

      {/* Second Dream Engagement Toast - Free Tier Only */}
      <SecondDreamEngagementToast
        isOpen={showSecondDreamToast}
        onClose={() => setShowSecondDreamToast(false)}
        onDontShowAgain={() => {
          localStorage.setItem('dreamcatcher_engagement_toast_dismissed', 'true')
          setShowSecondDreamToast(false)
        }}
      />
    </div>
  )
}

export default App