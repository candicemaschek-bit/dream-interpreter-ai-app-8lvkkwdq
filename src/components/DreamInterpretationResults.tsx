// DEPRECATED: This component is no longer used for immediate results display.
// Navigation now goes directly to DreamLibrary which opens the DreamCard.
// Keeping for reference or potential future use in detailed share pages.
import { Card, CardContent } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Sparkles, Save, Lock, Crown, Heart, Brain, Link as LinkIcon, Volume2, VolumeX, Loader2, AlertCircle } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { blink } from '../blink/client'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import type { SubscriptionTier } from '../types/subscription'
import type { UserProfileRow } from '../types/blink'
import { DreamShareButton } from './DreamShareButton'
import { TTSConfirmationDialog } from './TTSConfirmationDialog'
import { FirstDreamCelebration } from './FirstDreamCelebration'
// ReflectAIToast removed - user requested single Reflect AI button only in Section 5
import { ReflectAIMarketingModal } from './ReflectAIMarketingModal'
import { PatternPrivacyConsentModal } from './PatternPrivacyConsentModal'
import { logApiUsage, calculateTTSCost, estimateTTSDuration } from '../utils/costTracking'
import { shouldResetMonthlyUsage } from '../utils/subscriptionHelpers'
import { checkPrivacyConsentNeeded, savePrivacyConsent } from '../utils/privacyConsentCheckpoint'
import { useNavigate } from 'react-router-dom'
import '../types/blink'
import { getLaunchOfferStatus } from '../utils/launchOfferManager'

interface DreamInterpretationResultsProps {
  dreamId: string
  title: string
  description: string
  interpretation: string
  imageUrl?: string
  tags?: string[]
  onSave: () => void
  subscriptionTier?: SubscriptionTier
  isFirstDream?: boolean
  dreamsRemaining?: number
}

export function DreamInterpretationResults({
  dreamId,
  title,
  description,
  interpretation,
  imageUrl,
  tags,
  onSave,
  subscriptionTier = 'free',
  isFirstDream = false,
  dreamsRemaining = 0
}: DreamInterpretationResultsProps) {
  const navigate = useNavigate()
  
  // Guard clause at component entry - early return if interpretation is missing
  if (!interpretation || typeof interpretation !== 'string' || interpretation.trim().length === 0) {
    console.error('❌ Invalid interpretation data:', { interpretation, type: typeof interpretation, length: interpretation?.length })
    return (
      <div className="w-full max-w-3xl mx-auto p-6">
        <Card className="overflow-hidden shadow-xl border-2 border-purple-200">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-lg font-semibold text-red-900 mb-2">Unable to display interpretation</p>
            <p className="text-gray-600 mb-6">The dream interpretation data is missing or invalid. This might be a temporary issue.</p>
            <Button onClick={() => window.location.reload()} className="bg-gradient-to-r from-purple-600 to-violet-600">
              Reload & Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }
  
  const [isSavingLibrary, setIsSavingLibrary] = useState(false)
  const [isGeneratingTTS, setIsGeneratingTTS] = useState(false)
  const [ttsAudioUrl, setTtsAudioUrl] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [ttsError, setTtsError] = useState<string | null>(null)
  const [showTTSConfirmation, setShowTTSConfirmation] = useState(false)
  const [showFirstDreamCelebration, setShowFirstDreamCelebration] = useState(false)
  const [ttsUsageData, setTtsUsageData] = useState<{
    generationsThisMonth: number
    costThisMonth: number
    lastResetDate: string | null
  } | null>(null)
  const [userPreferredVoice, setUserPreferredVoice] = useState<string>('nova')
  // Removed: const [showReflectToast, setShowReflectToast] = useState(false)
  const [showReflectAIMarketingModal, setShowReflectAIMarketingModal] = useState(false)
  const [showPrivacyConsentModal, setShowPrivacyConsentModal] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const guidanceSectionRef = useRef<HTMLDivElement>(null)
  
  // State for voice settings toast
  const [showVoiceSettingsToast, setShowVoiceSettingsToast] = useState(false)
  const [launchOfferStatus, setLaunchOfferStatus] = useState<{
    hasLaunchOffer: boolean
    signupNumber?: number
  } | null>(null)
  
  // Check privacy consent and launch offer status on component mount
  useEffect(() => {
    const checkPrivacy = async () => {
      try {
        const user = await blink.auth.me()
        
        // Check privacy consent
        const privacyCheck = await checkPrivacyConsentNeeded(user.id)
        
        if (privacyCheck.needsConsent) {
          console.log('📋 Privacy consent needed before showing interpretation')
          setShowPrivacyConsentModal(true)
        }
        
        // Check launch offer status
        try {
          const launchOffer = await getLaunchOfferStatus(user.id)
          if (launchOffer.hasLaunchOffer) {
            setLaunchOfferStatus({
              hasLaunchOffer: true,
              signupNumber: launchOffer.signupNumber
            })
            console.log(`🎉 Launch offer user #${launchOffer.signupNumber}/500`)
          } else {
            setLaunchOfferStatus({ hasLaunchOffer: false })
          }
        } catch (launchError) {
          console.warn('⚠️ Error checking launch offer status:', launchError)
          setLaunchOfferStatus({ hasLaunchOffer: false })
        }
      } catch (error) {
        console.error('Error checking privacy consent:', error)
        // Don't block user if check fails
      }
    }
    
    checkPrivacy()
  }, [])
  


  // Removed: Reflect AI toast trigger - user requested single button only in Section 5 Guidance

  // Load TTS usage data on mount
  useEffect(() => {
    const loadTTSUsage = async () => {
      try {
        const user = await blink.auth.me()
        const userProfiles = await blink.db.userProfiles.list({
          where: { userId: user.id }
        })
        
        if (userProfiles.length > 0) {
          const profile = userProfiles[0] as UserProfileRow
          
          // Reset monthly TTS usage if needed
          let generationsThisMonth = Number(profile.ttsGenerationsThisMonth) || 0
          let costThisMonth = Number(profile.ttsCostThisMonthUsd) || 0
          let lastResetDate = profile.ttsLastResetDate
          
          if (shouldResetMonthlyUsage(lastResetDate)) {
            generationsThisMonth = 0
            costThisMonth = 0
            lastResetDate = new Date().toISOString()
            
            await blink.db.userProfiles.update(profile.id, {
              ttsGenerationsThisMonth: 0,
              ttsCostThisMonthUsd: 0,
              ttsLastResetDate: lastResetDate,
              updatedAt: new Date().toISOString()
            })
          }
          
          setTtsUsageData({
            generationsThisMonth,
            costThisMonth,
            lastResetDate
          })
          setUserPreferredVoice((profile as any).preferredTtsVoice || 'nova')
        }
      } catch (error) {
        console.error('Error loading TTS usage:', error)
      }
    }
    
    // TTS available for VIP tier only
    if (subscriptionTier === 'vip') {
      loadTTSUsage()
    }
  }, [subscriptionTier])

  const handleSaveToLibrary = async () => {
    setIsSavingLibrary(true)
    try {
      // Dream is already saved in DB during interpretation
      toast.success('✨ Dream saved to your library!', {
        duration: 2000,
        icon: '📚'
      })
      await new Promise(resolve => setTimeout(resolve, 800))
      
      // Show celebration modal after first dream for free tier users
      if (isFirstDream && subscriptionTier === 'free') {
        setShowFirstDreamCelebration(true)
      } else {
        // Call onSave callback which triggers navigation to library
        onSave()
      }
    } catch (error) {
      console.error('Error saving to library:', error)
      toast.error('Failed to save dream')
    } finally {
      setIsSavingLibrary(false)
    }
  }

  const handleCelebrationClose = () => {
    setShowFirstDreamCelebration(false)
    // Navigate to library after celebration
    onSave()
  }

  const handleUpgradeClick = () => {
    navigate('/pricing')
  }

  const handleShowTTSConfirmation = () => {
    // Check tier access - VIP only
    if (subscriptionTier !== 'vip') {
      toast.error('Text-to-Speech is only available for VIP (Star) tier')
      return
    }

    // Check monthly budget limit ($0.94)
    if (ttsUsageData && ttsUsageData.costThisMonth >= 0.94) {
      toast.error('Monthly TTS budget limit reached. Resets next month.')
      return
    }

    // Show confirmation dialog
    setShowTTSConfirmation(true)
  }

  const handleGenerateTTS = async () => {
    setIsGeneratingTTS(true)
    setTtsError(null)

    try {
      const user = await blink.auth.me()
      const textToSpeak = `${title}. ${interpretation}`
      
      // Generate TTS using Blink AI
      const { url: audioUrl } = await blink.ai.generateSpeech({
        text: textToSpeak,
        voice: userPreferredVoice as 'nova' | 'alloy' | 'echo' | 'fable' | 'onyx' | 'shimmer'
      })

      setTtsAudioUrl(audioUrl)

      // Track TTS usage
      const actualCost = calculateTTSCost(textToSpeak.length)
      const estimatedDuration = estimateTTSDuration(textToSpeak.length)
      
      await logApiUsage({
        userId: user.id,
        operationType: 'text_generation',
        modelUsed: 'tts-1',
        tokensUsed: textToSpeak.length,
        estimatedCostUsd: actualCost,
        inputSize: textToSpeak.length,
        outputSize: 1,
        metadata: { 
          operation: 'tts_generation', 
          dreamId,
          voice: userPreferredVoice,
          characterCount: textToSpeak.length,
          estimatedDuration
        }
      })

      // Update user profile with TTS usage
      const userProfiles = await blink.db.userProfiles.list({
        where: { userId: user.id }
      })
      
      if (userProfiles.length > 0) {
        const profile = userProfiles[0] as UserProfileRow
        const newGenerations = (ttsUsageData?.generationsThisMonth || 0) + 1
        const newCost = (ttsUsageData?.costThisMonth || 0) + actualCost
        
        await blink.db.userProfiles.update(profile.id, {
          ttsGenerationsThisMonth: newGenerations,
          ttsCostThisMonthUsd: newCost,
          updatedAt: new Date().toISOString()
        })
        
        setTtsUsageData({
          generationsThisMonth: newGenerations,
          costThisMonth: newCost,
          lastResetDate: ttsUsageData?.lastResetDate || new Date().toISOString()
        })
      }

      // Log analytics event
      blink.analytics.log('tts_generation_completed', {
        dream_id: dreamId,
        dream_title: title,
        character_count: textToSpeak.length,
        estimated_duration_seconds: estimatedDuration,
        actual_cost_usd: actualCost,
        subscription_tier: subscriptionTier
      })

      // Show success toast (VIP tier - no cost display)
      toast.success((t) => (
        <div>
          <p className="font-semibold">Audio narration generated! 🎉</p>
          <p className="text-sm text-gray-600 mt-1">{estimatedDuration}s narration ready to play</p>
        </div>
      ), {
        duration: 4000,
        style: {
          borderRadius: '8px',
          boxShadow: '0 10px 30px rgba(139, 92, 246, 0.2)',
        }
      })
      
      // Show Voice Settings toast for VIP users (check localStorage for dismissal)
      const voiceToastDismissed = localStorage.getItem('vip-voice-settings-toast-dismissed') === 'true'
      if (!voiceToastDismissed) {
        setTimeout(() => {
          setShowVoiceSettingsToast(true)
        }, 1000) // Show 1 second after TTS success
      }

    } catch (error) {
      console.error('Error generating TTS:', error)
      
      let userFriendlyMessage = 'We couldn\'t generate the audio narration. Please try again.'
      
      if (error instanceof Error) {
        const errorMsg = error.message.toLowerCase()
        
        if (errorMsg.includes('network') || errorMsg.includes('fetch')) {
          userFriendlyMessage = 'Network connection issue. Please check your internet and try again.'
        } else if (errorMsg.includes('auth') || errorMsg.includes('token')) {
          userFriendlyMessage = 'Your session has expired. Please refresh the page and sign in again.'
        } else if (errorMsg.includes('rate') || errorMsg.includes('limit')) {
          userFriendlyMessage = 'Too many requests. Please wait a moment and try again.'
        } else if (errorMsg.includes('timeout')) {
          userFriendlyMessage = 'The request took too long. Please try again.'
        } else if (errorMsg.includes('invalid')) {
          userFriendlyMessage = 'The dream text couldn\'t be processed. Please try a different dream.'
        }
      }
      
      setTtsError(userFriendlyMessage)
      toast.error(userFriendlyMessage)
    } finally {
      setIsGeneratingTTS(false)
    }
  }

  // Removed: handleReflectToastClose and handleReflectToastDismiss - toast removed

  const handleReflectAIClick = () => {
    // Check if user has access to Reflect AI (Premium+ only)
    const canAccessReflect = subscriptionTier === 'premium' || subscriptionTier === 'vip'
    
    if (!canAccessReflect) {
      // Show marketing modal for Free/Pro users
      setShowReflectAIMarketingModal(true)
      return
    }
    
    // Store full dream data for ReflectAI to analyze and generate personalized prompts
    sessionStorage.setItem('dreamReflectionContext', JSON.stringify({
      title,
      description,
      interpretation, // Full interpretation for AI analysis
      guidance: sections.guidance,
      symbols: sections.keySymbols,
      emotionalThemes: sections.emotionalThemes,
      lifeConnections: sections.lifeConnections,
      tags: tags || []
    }))
    navigate('/reflect-ai')
  }

  const handlePlayPause = () => {
    if (!audioRef.current) {
      if (ttsAudioUrl) {
        audioRef.current = new Audio(ttsAudioUrl)
        audioRef.current.onended = () => setIsPlaying(false)
        audioRef.current.onerror = () => {
          toast.error('Failed to play audio')
          setIsPlaying(false)
        }
      }
    }

    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
        setIsPlaying(false)
      } else {
        audioRef.current.play()
        setIsPlaying(true)
      }
    }
  }

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [])

  // ENHANCED: Parse interpretation into structured sections with comprehensive validation
  const parseInterpretationSections = (text: string) => {
    // Comprehensive null/undefined/invalid checks
    if (!text || typeof text !== 'string') {
      console.error('❌ parseInterpretationSections received invalid text:', { text, type: typeof text, length: text?.length })
      return {
        overallMeaning: 'Unable to display interpretation - invalid data format',
        keySymbols: '',
        emotionalThemes: '',
        lifeConnections: '',
        guidance: '',
        reflectionPrompts: ''
      }
    }
    
    const trimmedText = text.trim()
    if (trimmedText.length === 0) {
      console.error('❌ parseInterpretationSections received empty text')
      return {
        overallMeaning: 'No interpretation content available',
        keySymbols: '',
        emotionalThemes: '',
        lifeConnections: '',
        guidance: '',
        reflectionPrompts: ''
      }
    }
    
    // Additional validation for non-printable characters
    if (!/^[\s\S]*$/.test(trimmedText)) {
      console.error('❌ parseInterpretationSections received text with invalid characters')
      return {
        overallMeaning: 'Interpretation contains invalid characters',
        keySymbols: '',
        emotionalThemes: '',
        lifeConnections: '',
        guidance: '',
        reflectionPrompts: ''
      }
    }
    
    const sections = {
      overallMeaning: '',
      keySymbols: '',
      emotionalThemes: '',
      lifeConnections: '',
      guidance: '',
      reflectionPrompts: ''
    }
    
    const overallMatch = text.match(/1\.?\s*Overall Meaning[:\n]+([\s\S]*?)(?=(?:2\.?\s*Key|\n2\.)|$)/i) ||
                        text.match(/Overall Meaning[:\n]+([\s\S]*?)(?=(?:Key Symbols|Symbol Interpretations)|$)/i)
    
    const symbolsMatch = text.match(/2\.?\s*Key Symbols[\n]*[:\n]+([\s\S]*?)(?=(?:3\.?\s*Emotional|\n3\.)|$)/i) ||
                        text.match(/Key Symbols[\n]*[:\n]+([\s\S]*?)(?=(?:Emotional|\n3\.)|$)/i)
    
    const emotionalMatch = text.match(/3\.?\s*Emotional Themes[:\n]+([\s\S]*?)(?=(?:4\.?\s*Potential|\n4\.)|$)/i) ||
                          text.match(/Emotional Themes[:\n]+([\s\S]*?)(?=(?:Life|Potential|\n4\.)|$)/i)
    
    const lifeMatch = text.match(/4\.?\s*Potential Life Connections[:\n]+([\s\S]*?)(?=(?:5\.?\s*Guidance|\n5\.)|$)/i) ||
                     text.match(/Life Connections[:\n]+([\s\S]*?)(?=(?:Guidance|Reflection|\n5\.)|$)/i)

    const guidanceMatch = text.match(/5\.?\s*Guidance[\n]*[:\n]+([\s\S]*?)$/i) ||
                         text.match(/Guidance[\n]*[:\n]+([\s\S]*?)$/i) ||
                         text.match(/5\.?\s*Guidance & Reflection[\n]*[:\n]+([\s\S]*?)$/i) ||
                         text.match(/5\.?\s*Reflection Prompts[\n]*[:\n]+([\s\S]*?)$/i)

    const reflectionMatch = text.match(/Reflection Prompts[:\n]+([\s\S]*?)$/i)

    sections.overallMeaning = overallMatch?.[1]?.trim() || text.trim()
    sections.keySymbols = symbolsMatch?.[1]?.trim() || ''
    sections.emotionalThemes = emotionalMatch?.[1]?.trim() || ''
    sections.lifeConnections = lifeMatch?.[1]?.trim() || ''
    sections.guidance = guidanceMatch?.[1]?.trim() || ''
    sections.reflectionPrompts = reflectionMatch?.[1]?.trim() || ''
    
    // Log parsing results for debugging
    console.log('📊 Interpretation Parsing Results:', {
      overallMeaningLength: sections.overallMeaning.length,
      keySymbolsLength: sections.keySymbols.length,
      emotionalThemesLength: sections.emotionalThemes.length,
      lifeConnectionsLength: sections.lifeConnections.length,
      guidanceLength: sections.guidance.length,
      reflectionPromptsLength: sections.reflectionPrompts.length,
      totalTextLength: text.length
    })
    
    // ENHANCED: If parsing failed, show raw interpretation but also try semantic extraction
    if (!sections.overallMeaning || sections.overallMeaning.length < 50) {
      console.log('⚠️ Structured parsing failed, attempting semantic extraction')
      
      // Try to extract content using semantic patterns instead of strict numbering
      const semanticOverall = text.match(/(?:meaning|interpretation|overview)[\s\n]*[:\n]+([\s\S]*?)(?=symbols|emotional|life|guidance|$)/i)
      const semanticSymbols = text.match(/(?:symbols|symbolism|imagery)[\s\n]*[:\n]+([\s\S]*?)(?=emotional|life|guidance|$)/i)
      const semanticEmotional = text.match(/(?:emotional|feelings|mood)[\s\n]*[:\n]+([\s\S]*?)(?=life|guidance|$)/i)
      const semanticLife = text.match(/(?:life|reality|waking)[\s\n]*[:\n]+([\s\S]*?)(?=guidance|$)/i)
      const semanticGuidance = text.match(/(?:guidance|advice|recommendations)[\s\n]*[:\n]+([\s\S]*?)$/i)
      
      return {
        overallMeaning: semanticOverall?.[1]?.trim() || text.trim(), // Show entire interpretation as last resort
        keySymbols: semanticSymbols?.[1]?.trim() || '',
        emotionalThemes: semanticEmotional?.[1]?.trim() || '',
        lifeConnections: semanticLife?.[1]?.trim() || '',
        guidance: semanticGuidance?.[1]?.trim() || '',
        reflectionPrompts: reflectionMatch?.[1]?.trim() || ''
      }
    }
    
    return sections
  }

  const sections = parseInterpretationSections(interpretation)
  
  // Tier-based access logic
  const showFullAccess = true // All tiers get full access to all sections
  const showReflectAIButton = true // All tiers get Reflect AI button in Guidance
  const showSymbolicaAI = subscriptionTier === 'premium' || subscriptionTier === 'vip' // Premium+ gets SymbolicaAI
  const showTTS = subscriptionTier === 'vip' // Only VIP gets TTS
  const isFreeTier = subscriptionTier === 'free' // Define isFreeTier for conditional rendering

  // Store reflection prompts in dream record if they exist
  useEffect(() => {
    if (sections.reflectionPrompts && sections.reflectionPrompts.trim()) {
      const updateDreamWithPrompts = async () => {
        try {
          await blink.db.dreams.update(dreamId, {
            metadata: JSON.stringify({
              reflectionPrompts: sections.reflectionPrompts
            }),
            updatedAt: new Date().toISOString()
          })
        } catch (error) {
          console.warn('Failed to store reflection prompts:', error)
        }
      }
      updateDreamWithPrompts()
    }
  }, [dreamId, sections.reflectionPrompts])

  const UpgradeCTA = ({ message }: { message: string }) => (
    <div className="mt-4 p-4 bg-gradient-to-r from-purple-50 to-violet-50 border border-purple-200 rounded-lg">
      <p className="text-sm text-purple-900 mb-3">{message}</p>
      <Button size="sm" className="w-full bg-gradient-to-r from-purple-600 to-violet-600">
        <Crown className="w-4 h-4 mr-2" />
        Upgrade to Pro
      </Button>
    </div>
  )

  const SectionCard = ({ 
    title, 
    icon, 
    children, 
    locked = false 
  }: { 
    title: string
    icon: React.ReactNode
    children: React.ReactNode
    locked?: boolean
  }) => (
    <Card className="relative">
      <CardContent className="pt-6">
        <div className="flex items-center gap-2 mb-4">
          {icon}
          <h3 className="text-lg font-semibold">{title}</h3>
          {locked && <Lock className="w-4 h-4 text-amber-600 ml-auto" />}
        </div>
        {children}
      </CardContent>
    </Card>
  )

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="w-full max-w-3xl mx-auto space-y-6"
    >
      <Card className="overflow-hidden shadow-xl border-2 border-purple-200">
        <CardContent className="p-0">
          {/* Image at Top */}
          <div className="w-full">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="relative w-full aspect-video bg-gradient-to-br from-purple-100 to-violet-100 overflow-hidden"
            >
              {imageUrl && imageUrl?.trim() ? (
                <>
                  <img
                    src={imageUrl}
                    alt={title}
                    className="w-full h-full object-cover"
                    crossOrigin="anonymous"
                    loading="eager"
                    onError={(e) => {
                      console.error('❌ Image failed to load:', imageUrl)
                      e.currentTarget.style.display = 'none'
                      toast.error('Failed to display dream image')
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
                  <div className="absolute bottom-6 left-6 right-6">
                    <h2 className="text-3xl font-serif text-white mb-2">{title}</h2>
                    {tags && Array.isArray(tags) && tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {tags.map((tag, idx) => (
                          <Badge key={`${tag}-${idx}`} variant="secondary" className="bg-white/20 backdrop-blur-sm text-white border-white/30">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center p-8">
                    {isFreeTier ? (
                      <>
                        <Sparkles className="w-16 h-16 text-purple-400 mx-auto mb-4" />
                        <h2 className="text-2xl font-serif text-purple-900 mb-2">{title}</h2>
                        <p className="text-purple-700 mb-4">Want to visualize your dream?</p>
                        <Button className="bg-gradient-to-r from-purple-600 to-violet-600">
                          <Crown className="w-4 h-4 mr-2" />
                          Upgrade to Pro
                        </Button>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-16 h-16 text-purple-400 mx-auto mb-4 opacity-50" />
                        <h2 className="text-3xl font-serif text-purple-900 mb-2">{title}</h2>
                        <p className="text-purple-600">No dream image available</p>
                      </>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </div>

          {/* Structured Interpretation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="p-8 space-y-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                <h3 className="text-xl font-semibold text-purple-900">Dream Interpretation</h3>
                {launchOfferStatus?.hasLaunchOffer && (
                  <Badge variant="secondary" className="ml-2 bg-amber-100 text-amber-700 border-amber-300 animate-pulse">
                    🎉 Launch Offer #{launchOfferStatus.signupNumber}/500
                  </Badge>
                )}
              </div>
              
              {/* TTS Feature - VIP tier only with $0.94 budget */}
              {showTTS && ttsUsageData && (
                <div className="flex items-center gap-2">
                  {!ttsAudioUrl ? (
                    <Button
                      onClick={handleShowTTSConfirmation}
                      disabled={isGeneratingTTS}
                      size="sm"
                      variant="outline"
                      className="gap-2"
                    >
                      {isGeneratingTTS ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-4 h-4" />
                          Listen
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button
                      onClick={handlePlayPause}
                      size="sm"
                      variant="outline"
                      className="gap-2"
                    >
                      {isPlaying ? (
                        <>
                          <VolumeX className="w-4 h-4" />
                          Pause
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-4 h-4" />
                          Play
                        </>
                      )}
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* TTS Error Display */}
            {ttsError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg mb-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-900">{ttsError}</p>
                </div>
              </div>
            )}

            {/* 1. Overall Meaning - FULL for everyone */}
            <SectionCard
              title="1. Overall Meaning"
              icon={<Brain className="w-5 h-5 text-purple-600" />}
            >
              <div className="max-h-96 overflow-y-auto pr-2">
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap text-base md:text-sm">
                  {sections.overallMeaning || interpretation}
                </p>
              </div>
            </SectionCard>

            {/* 2. Key Symbols - FULL ACCESS for all tiers + SymbolicaAI badge for Premium/VIP */}
            <Card className="relative">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  <h3 className="text-lg font-semibold">2. Key Symbols & Their Significance</h3>
                  {showSymbolicaAI && (
                    <Badge variant="secondary" className="ml-auto bg-purple-100 text-purple-700">
                      + SymbolicaAI
                    </Badge>
                  )}
                </div>
                <div className="max-h-96 overflow-y-auto pr-2">
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap text-base md:text-sm">
                    {sections.keySymbols || 'Symbol analysis is being processed...'}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* 3. Emotional Themes - FULL for everyone */}
            <SectionCard
              title="3. Emotional Themes"
              icon={<Heart className="w-5 h-5 text-purple-600" />}
            >
              <div className="max-h-96 overflow-y-auto pr-2">
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap text-base md:text-sm">
                  {sections.emotionalThemes || 'Emotional analysis is being processed...'}
                </p>
              </div>
            </SectionCard>

            {/* 4. Potential Life Connections - FULL ACCESS for all tiers */}
            <SectionCard
              title="4. Potential Life Connections"
              icon={<LinkIcon className="w-5 h-5 text-purple-600" />}
            >
              <div className="max-h-96 overflow-y-auto pr-2">
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap text-base md:text-sm">
                  {sections.lifeConnections || 'Life connections analysis...'}
                </p>
              </div>
            </SectionCard>

            {/* 5. Guidance - FULL ACCESS with integrations based on tier - Static display (no animations) */}
            <div ref={guidanceSectionRef} className="relative">
              <Card className="relative border-2 border-blue-300/50 bg-gradient-to-br from-blue-50/50 via-white to-purple-50/30 shadow-lg">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-4">
                    <h3 className="text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">5. Guidance</h3>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="max-h-96 overflow-y-auto pr-2">
                      <p className="text-gray-700 leading-relaxed whitespace-pre-wrap text-base md:text-sm">
                        {sections.guidance || 'Personalized guidance and reflection...'}
                      </p>
                    </div>
                    
                    {/* Reflect AI Button - Show for all tiers */}
                    <div className="pt-2 space-y-3">
                      <Button
                        onClick={handleReflectAIClick}
                        className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg hover:shadow-xl transition-all h-10 font-semibold"
                      >
                        Reflect AI - Start Journaling
                      </Button>
                      
                      {/* SymbolicaAI Integration for Premium+ */}
                      {showSymbolicaAI && (
                        <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <Sparkles className="w-4 h-4 text-purple-600" />
                            <p className="text-sm font-semibold text-purple-900">SymbolicaAI Integration</p>
                          </div>
                          <p className="text-xs text-purple-700">
                            Enhanced symbol analysis and deep pattern recognition available in your reflection journal.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        </CardContent>
      </Card>

      {/* Reflect AI Toast removed - user requested single Reflect AI button only (in Section 5 above) */}

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex gap-3 flex-col sm:flex-row"
      >
        <DreamShareButton
          dreamTitle={title}
          dreamDescription={description}
          interpretation={interpretation}
          dreamId={dreamId}
          variant="default"
          size="lg"
        />
        <Button
          onClick={handleSaveToLibrary}
          disabled={isSavingLibrary}
          className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg hover:shadow-xl transition-all"
          size="lg"
        >
          {isSavingLibrary ? (
            <>
              <motion.span 
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity }}
                className="inline-block mr-2"
              >
                →
              </motion.span>
              Loading...
            </>
          ) : (
            <>
              <img src="/logo_new.png" alt="Dreams" className="w-4 h-4 mr-2 opacity-70" />
              View in Library
            </>
          )}
        </Button>
        <Button
          onClick={() => window.location.reload()}
          variant="outline"
          size="lg"
        >
          Interpret Another Dream
        </Button>
      </motion.div>

      {/* VIP Voice Settings Toast */}
      {showVoiceSettingsToast && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          className="fixed bottom-4 right-4 z-50 max-w-sm"
        >
          <div className="bg-gradient-to-br from-purple-600 to-violet-700 rounded-lg shadow-2xl p-5 text-white border border-white/20">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <Volume2 className="w-5 h-5" />
                <h4 className="font-semibold">Voice Settings</h4>
              </div>
              <button
                onClick={() => setShowVoiceSettingsToast(false)}
                className="text-white/70 hover:text-white transition-colors"
              >
                ×
              </button>
            </div>
            <p className="text-sm text-white/90 mb-4">
              You can change the Voice under your settings.
            </p>
            <div className="flex items-center gap-2 mb-3">
              <input
                type="checkbox"
                id="voice-dont-show"
                className="w-4 h-4 rounded"
                onChange={(e) => {
                  if (e.target.checked) {
                    localStorage.setItem('vip-voice-settings-toast-dismissed', 'true')
                  }
                }}
              />
              <label htmlFor="voice-dont-show" className="text-xs text-white/80 cursor-pointer">
                Do not display this message again
              </label>
            </div>
            <Button
              onClick={() => {
                setShowVoiceSettingsToast(false)
                navigate('/profile')
              }}
              size="sm"
              className="w-full bg-white/20 hover:bg-white/30 text-white border-white/30"
            >
              Go to Settings
            </Button>
          </div>
        </motion.div>
      )}

      {/* TTS Confirmation Dialog */}
      <TTSConfirmationDialog
        open={showTTSConfirmation}
        onOpenChange={setShowTTSConfirmation}
        onConfirm={handleGenerateTTS}
        subscriptionTier={subscriptionTier}
        currentSpend={ttsUsageData?.costThisMonth || 0}
        estimatedCost={calculateTTSCost(`${title}. ${interpretation}`.length)}
        monthlyLimit={subscriptionTier === 'vip' ? 0.94 : 0.00}
        characterCount={`${title}. ${interpretation}`.length}
        estimatedDuration={estimateTTSDuration(`${title}. ${interpretation}`.length)}
        voiceName={userPreferredVoice}
      />

      {/* First Dream Celebration Modal */}
      <FirstDreamCelebration
        open={showFirstDreamCelebration}
        onOpenChange={handleCelebrationClose}
        dreamsRemaining={dreamsRemaining}
        onUpgrade={handleUpgradeClick}
      />
      
      {/* Reflect AI Marketing Modal for Free/Pro users */}
      <ReflectAIMarketingModal
        open={showReflectAIMarketingModal}
        onOpenChange={setShowReflectAIMarketingModal}
        subscriptionTier={subscriptionTier}
      />

      {/* Privacy Consent Modal - Soft gate before interpretation displays */}
      <PatternPrivacyConsentModal
        open={showPrivacyConsentModal}
        onOpenChange={setShowPrivacyConsentModal}
        userId={blink.auth.user?.id || ''}
        onConsentGranted={() => {
          console.log('✓ User consented to privacy settings')
          setShowPrivacyConsentModal(false)
        }}
        onConsentDenied={() => {
          console.log('✗ User denied privacy consent')
          setShowPrivacyConsentModal(false)
        }}
        tier={subscriptionTier as 'free' | 'pro' | 'premium' | 'vip'}
      />
    </motion.div>
  )
}