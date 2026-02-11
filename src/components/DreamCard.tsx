import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog'
import { Type, Sparkles, Image as ImageIcon, Loader2, Calendar, Video, Lock, ArrowRight, Trash2, Brain, Volume2, VolumeX, AlertCircle } from 'lucide-react'
import { ReflectAIToast } from './ReflectAIToast'
import { parseInterpretation, generateDreamSummary } from '../utils/interpretationParser'
import type { Dream } from '../types/dream'
import type { SubscriptionTier } from '../types/subscription'
import type { DreamRow, UserProfileRow } from '../types/blink'
import type { 
  VideoGenerationRequest, 
  VideoGenerationResponse, 
  VideoGenerationError
} from '../types/video'
import { 
  isVideoGenerationResponse,
  isVideoGenerationError 
} from '../types/video'
import { blink } from '../blink/client'
import { supabaseService } from '../lib/supabaseService'
import { getQueueStatus } from '../utils/videoQueueManager'
import toast from 'react-hot-toast'
import { canGenerateVideo, canAccessReflectAI, shouldResetMonthlyUsage } from '../utils/subscriptionHelpers'
import { DreamShareButton } from './DreamShareButton'
import { DreamCardQuickShare } from './DreamCardQuickShare'
import { ShareToCommunityToggle } from './ShareToCommunityToggle'
import { generateDreamOpenGraphData, updateOpenGraphTags, resetOpenGraphTags } from '../utils/openGraph'
import { AI_PROMPTS } from '../config/aiPrompts'
import { logTokenFailure } from '../utils/authTelemetry'
import { logApiUsage, calculateTTSCost, estimateTTSDuration } from '../utils/costTracking'
import { checkPrivacyConsentNeeded } from '../utils/privacyConsentCheckpoint'
import { PatternPrivacyConsentModal } from './PatternPrivacyConsentModal'
import { TTSConfirmationDialog } from './TTSConfirmationDialog'
import '../types/blink'

interface DreamCardProps {
  dream: Dream
  onUpdate: () => void
  subscriptionTier?: SubscriptionTier
  isOpen?: boolean // Controlled open state from parent
  onOpenChange?: (isOpen: boolean) => void // Callback for open state changes
}

export function DreamCard({ dream, onUpdate, subscriptionTier = 'free', isOpen: controlledOpen, onOpenChange }: DreamCardProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  
  // Use controlled state if provided, otherwise use internal state
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen
  const setIsOpen = (newOpen: boolean) => {
    if (onOpenChange) {
      onOpenChange(newOpen)
    } else {
      setInternalOpen(newOpen)
    }
  }
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false)
  const [videoFailed, setVideoFailed] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [videoProgress, setVideoProgress] = useState<{
    status: 'pending' | 'processing' | 'completed' | 'failed'
    framesGenerated?: number
  } | null>(null)
  
  // Reflect AI state
  const [showReflectToast, setShowReflectToast] = useState(false)
  const [hasScrolledToGuidance, setHasScrolledToGuidance] = useState(false)
  const guidanceSectionRef = useRef<HTMLDivElement>(null)
  const [userId, setUserId] = useState<string | null>(null)
  
  // TTS and Privacy state
  const [isGeneratingTTS, setIsGeneratingTTS] = useState(false)
  const [ttsAudioUrl, setTtsAudioUrl] = useState<string | null>(null)
  const [isPlayingTTS, setIsPlayingTTS] = useState(false)
  const [showTTSConfirmation, setShowTTSConfirmation] = useState(false)
  const [showPrivacyConsent, setShowPrivacyConsent] = useState(false)
  const [userProfile, setUserProfile] = useState<UserProfileRow | null>(null)
  const ttsAudioRef = useRef<HTMLAudioElement | null>(null)

  // Get user ID and profile on mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const user = await blink.auth.me()
        setUserId(user.id)
        
        const profile = await supabaseService.getProfile(user.id)
        if (profile) {
          setUserProfile(profile as any)
        }
      } catch (error) {
        console.error('Error fetching user data:', error)
      }
    }
    fetchUserData()
  }, [])

  // Update Open Graph tags when dialog opens
  useEffect(() => {
    if (isOpen && dream.interpretation) {
      const ogData = generateDreamOpenGraphData(
        dream.title,
        dream.description,
        dream.interpretation,
        dream.id,
        dream.imageUrl
      )
      updateOpenGraphTags(ogData)
    } else if (!isOpen) {
      // Reset to default when dialog closes
      resetOpenGraphTags()
    }
  }, [isOpen, dream])

  // Scroll detection for Reflect AI toast
  useEffect(() => {
    if (!isOpen) {
      setShowReflectToast(false)
      setHasScrolledToGuidance(false)
      return
    }

    const handleScroll = () => {
      if (hasScrolledToGuidance || !guidanceSectionRef.current) return

      const element = guidanceSectionRef.current
      const rect = element.getBoundingClientRect()
      const isInView = rect.top <= window.innerHeight && rect.bottom >= 0

      if (isInView && !hasScrolledToGuidance) {
        setHasScrolledToGuidance(true)
        
        // Check if user has dismissed the toast permanently
        const dismissed = localStorage.getItem('reflect-ai-toast-dismissed')
        if (dismissed !== 'true') {
          setShowReflectToast(true)
        }
      }
    }

    const dialogContent = document.querySelector('.max-w-4xl.max-h-\\[90vh\\].overflow-y-auto')
    if (dialogContent) {
      dialogContent.addEventListener('scroll', handleScroll)
      // Initial check
      handleScroll()
    }

    return () => {
      if (dialogContent) {
        dialogContent.removeEventListener('scroll', handleScroll)
      }
    }
  }, [isOpen, hasScrolledToGuidance])

  // Poll for video generation status (throttled + cached via getQueueStatus)
  useEffect(() => {
    if (!isGeneratingVideo || dream.videoUrl) return

    let intervalId: ReturnType<typeof setInterval>

    const pollVideoStatus = async () => {
      try {
        const user = await blink.auth.me()
        const status = await getQueueStatus(user.id)

        const job = status.jobs.find((j: any) => j.dreamId === dream.id)
        if (!job) return

        const jobStatus = job.status as 'pending' | 'processing' | 'completed' | 'failed'

        setVideoProgress({
          status: jobStatus,
          framesGenerated: Number(job.framesGenerated) || 0,
        })

        if (jobStatus === 'completed' && job.videoUrl) {
          setIsGeneratingVideo(false)
          onUpdate()
          toast.success('Video completed!')
        } else if (jobStatus === 'failed') {
          setIsGeneratingVideo(false)
          setVideoFailed(true)
          toast.error('Video generation failed')
        }
      } catch (error) {
        console.error('Error polling video status:', error)
      }
    }

    // Poll every 15 seconds (DB endpoints are rate limited)
    intervalId = setInterval(pollVideoStatus, 15000)

    // Initial poll
    pollVideoStatus()

    return () => {
      if (intervalId) clearInterval(intervalId)
    }
  }, [isGeneratingVideo, dream.id, dream.videoUrl, onUpdate])

  const getInputIcon = () => {
    switch (dream.inputType) {
      case 'text':
        return <Type className="w-4 h-4" />
      case 'symbols':
        return <Sparkles className="w-4 h-4" />
      case 'image':
        return <ImageIcon className="w-4 h-4" />
    }
  }

  // Parse tags if they're a string
  const parsedTags = Array.isArray(dream.tags) 
    ? dream.tags 
    : (dream.tags ? JSON.parse(dream.tags) : [])

  // Check if user can generate videos and access Reflect AI
  const canGenerate = canGenerateVideo({ subscriptionTier: subscriptionTier || 'free' })
  const canUseReflectAI = canAccessReflectAI({ subscriptionTier: subscriptionTier || 'free' })

  const handleGenerateVideo = async (): Promise<void> => {
    if (!canGenerate) {
      toast.error('Video generation is not available for your subscription tier')
      return
    }
    setIsGeneratingVideo(true)
    try {
      let baseImageUrl: string | undefined = dream.imageUrl

      // Step 1: Generate base image if needed (for text-only dreams)
      if (!baseImageUrl) {
        toast.loading('Creating visual representation...', { id: 'base-image' })

        const imagePrompt = AI_PROMPTS.generateDreamImage(dream.title, dream.description)

        try {
          const { data: generatedImages } = await blink.ai.generateImage({
            prompt: imagePrompt,
            n: 1
          })

          if (generatedImages && generatedImages.length > 0 && generatedImages[0]) {
            baseImageUrl = generatedImages[0].url

            // Save the generated image to the dream record for future use
            await supabaseService.updateDream(dream.id, {
              image_url: baseImageUrl
            })

            toast.success('Visual created!', { id: 'base-image' })
            onUpdate()
          } else {
            throw new Error('No image generated')
          }
        } catch (error) {
          console.error('Error generating base image:', error)
          const errorMsg = error instanceof Error ? error.message : 'Failed to create visual representation'
          toast.error(errorMsg, { id: 'base-image' })
          return
        }
      }

      if (!baseImageUrl) {
        throw new Error('No image URL available for video generation')
      }

      // Step 2: Call edge function to generate enhanced visualization
      toast.loading('Generating cinematic visualization...', { id: 'video' })

      // SOLUTION 1: Use enhanced token manager with FRESH token (force refresh for API calls)
      const { getValidAuthToken } = await import('../utils/authTokenManager')
      // Always force refresh for video generation to ensure fresh token
      const tokenResult = await getValidAuthToken(true)

      if (!tokenResult.success || !tokenResult.token) {
        // Log token failure telemetry
        await logTokenFailure({
          errorType: 'token_refresh_failed',
          errorMessage: tokenResult.error || 'Token refresh failed',
          context: 'DreamCard:handleGenerateVideo'
        })
        throw new Error(tokenResult.error || 'Authentication required. Please sign in again.')
      }
      
      const token = tokenResult.token
      
      // Log token expiration info and VALIDATE it's sufficient
      if (tokenResult.expiresIn) {
        const secondsRemaining = Math.round(tokenResult.expiresIn / 1000)
        const minutesRemaining = Math.round(secondsRemaining / 60)
        console.log(`🔐 Fresh token obtained, valid for ${secondsRemaining} seconds (${minutesRemaining} minutes)`)
        
        // CRITICAL: Check if token lifetime is sufficient for video generation (need at least 45 seconds)
        if (secondsRemaining < 45) {
          console.error(`❌ Token expires too soon! Only ${secondsRemaining} seconds remaining.`)
          console.error('⚠️ This indicates a session/auth issue. Token should be valid for longer.')
          toast.error('Your session is about to expire. Please refresh the page and sign in again.', { id: 'video', duration: 6000 })
          throw new Error('Token expires too soon for video generation. Please refresh and sign in again.')
        }
      }

      // Get the deployed function URL
      const functionUrl = 'https://8lvkkwdq--generate-video.functions.blink.new'
      
      const user = await blink.auth.me()

      // Type-safe video generation request
      const videoRequest: VideoGenerationRequest = {
        imageUrl: baseImageUrl,
        prompt: `Cinematic dream visualization: ${dream.title}`,
        userId: user.id,
        subscriptionTier: subscriptionTier,
        durationSeconds: 6
      }

      console.log('🔐 Sending video generation request with authentication...')
      
      // SOLUTION 2: Client-side retry logic with exponential backoff
      let response: Response | null = null
      let retryCount = 0
      const maxRetries = 2 // Total of 3 attempts (initial + 2 retries)
      let currentToken = token // Track current token for retries
      
      while (retryCount <= maxRetries) {
        try {
          response = await fetch(functionUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${currentToken}`,
            },
            body: JSON.stringify(videoRequest),
          })

          console.log(`📡 Response status: ${response.status} ${response.statusText} (attempt ${retryCount + 1}/${maxRetries + 1})`)

          // If response is OK, break out of retry loop
          if (response.ok) {
            break
          }
          
          // Check if error is retryable
          const errorText = await response.text()
          let isRetryable = false
          let retryAfterSeconds = 5
          
          try {
            const errorData = JSON.parse(errorText) as VideoGenerationError & { retryable?: boolean }
            isRetryable = errorData.retryable === true
            
            // Check for Retry-After header
            const retryAfterHeader = response.headers.get('Retry-After')
            if (retryAfterHeader) {
              retryAfterSeconds = parseInt(retryAfterHeader, 10)
            }
          } catch {
            // Assume retryable for network errors and auth errors (401)
            // Auth errors should be retried with a fresh token
            isRetryable = response.status >= 500 || response.status === 401
          }
          
          // If not retryable or exhausted retries, throw error
          if (!isRetryable || retryCount >= maxRetries) {
            console.error('❌ Video generation request failed (not retryable or max retries reached):', errorText)
            
            let errorMessage = 'Video generation failed'
            let errorCode = 'UNKNOWN'
            
            try {
              const errorData = JSON.parse(errorText) as VideoGenerationError
              if (isVideoGenerationError(errorData)) {
                errorMessage = errorData.error
                errorCode = errorData.code || 'UNKNOWN'
                
                // Provide user-friendly messages for specific error codes
                if (errorCode === 'TOKEN_INVALID' || errorCode === 'AUTH_FAILED') {
                  errorMessage = 'Your session has expired. Please refresh the page and sign in again.'
                } else if (errorCode === 'UNAUTHORIZED') {
                  errorMessage = 'You do not have permission to generate videos. Please check your subscription tier.'
                } else if (errorCode === 'LIMIT_REACHED') {
                  errorMessage = errorData.error // Use the detailed message from server
                }
              }
            } catch {
              console.error('Unable to parse error response:', errorText)
            }
            
            throw new Error(errorMessage)
          }
          
          // Retry with exponential backoff
          retryCount++
          const retryDelayMs = retryAfterSeconds * 1000
          console.log(`⏳ Retrying video generation in ${retryDelayMs}ms (attempt ${retryCount + 1}/${maxRetries + 1})...`)
          toast.loading(`Retrying video generation (attempt ${retryCount + 1})...`, { id: 'video' })
          
          await new Promise(resolve => setTimeout(resolve, retryDelayMs))
          
          // Get completely fresh token for retry (critical for auth errors)
          console.log('🔄 Getting fresh authentication token for retry...')
          const retryTokenResult = await getValidAuthToken(true) // Force refresh
          if (!retryTokenResult.success || !retryTokenResult.token) {
            console.error('❌ Failed to get fresh token for retry')
            // Log token failure telemetry
            await logTokenFailure({
              errorType: 'token_refresh_failed',
              errorMessage: retryTokenResult.error || 'Token refresh failed during retry',
              context: 'DreamCard:handleGenerateVideo:retry',
              attemptedRetries: retryCount
            })
            throw new Error('Unable to refresh authentication. Please sign in again.')
          }
          
          // Update token for next iteration and log it
          currentToken = retryTokenResult.token // UPDATE the token used in fetch
          console.log('✅ Fresh token obtained for retry')
          if (retryTokenResult.expiresIn) {
            const mins = Math.round(retryTokenResult.expiresIn / 1000 / 60)
            console.log(`⏰ New token valid for ${mins} minutes`)
          }
          
          // Ensure userId is still valid for next attempt
          videoRequest.userId = user.id
          
        } catch (fetchError) {
          console.error(`❌ Fetch error (attempt ${retryCount + 1}):`, fetchError)
          
          if (retryCount >= maxRetries) {
            throw fetchError
          }
          
          retryCount++
          const retryDelayMs = 2000 * Math.pow(2, retryCount - 1)
          console.log(`⏳ Retrying after network error in ${retryDelayMs}ms...`)
          await new Promise(resolve => setTimeout(resolve, retryDelayMs))
        }
      }
      
      if (!response || !response.ok) {
        throw new Error('Video generation failed after all retry attempts')
      }

      const result = await response.json() as VideoGenerationResponse
      
      if (!isVideoGenerationResponse(result)) {
        throw new Error('Invalid response format from video generation service')
      }

      if (!result.videoUrl) {
        throw new Error('No video URL returned from generation')
      }

      const { videoUrl } = result

      // Type-safe database update using Supabase
      await supabaseService.updateDream(dream.id, {
        video_url: videoUrl
      })

      toast.success('Cinematic visualization ready!', { id: 'video' })
      onUpdate()
    } catch (error) {
      console.error('Error generating video:', error)
      
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Failed to generate video. Please try again.'
      
      toast.error(errorMessage, { id: 'video', duration: 5000 })
    } finally {
      setIsGeneratingVideo(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const handleReflectAI = async () => {
    // Close the toast
    setShowReflectToast(false)
    
    if (!canUseReflectAI) {
      // Show upgrade toast for non-premium tiers and redirect to pricing
      toast('Upgrade to Premium+ to access Reflect AI - Your personal Reflection Journal', {
        icon: '🔒',
        duration: 5000
      })
      // Redirect to pricing page after a short delay
      setTimeout(() => {
        window.location.href = '/pricing'
      }, 1500)
      return
    }
    
    // Open Reflect AI with dream summary
    try {
      const user = await blink.auth.me()
      
      // Create or get reflection session for this dream
      const existingSessions = await blink.db.reflectionSessions.list({
        where: { 
          userId: user.id,
          dreamId: dream.id,
          sessionType: 'dream_reflection'
        },
        orderBy: { createdAt: 'desc' },
        limit: 1
      })

      let sessionId: string
      
      if (existingSessions.length > 0) {
        sessionId = existingSessions[0].id
      } else {
        // Create new session
        sessionId = `session_${Date.now()}_${user.id}`
        await blink.db.reflectionSessions.create({
          id: sessionId,
          userId: user.id,
          dreamId: dream.id,
          sessionType: 'dream_reflection',
          creditsConsumed: 0,
          messageCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
      }

      // Generate dream summary for Reflect AI greeting
      const dreamSummary = generateDreamSummary(dream.title, dream.description)

      // Navigate to Reflect AI with dream context
      window.location.href = `/reflect/${sessionId}?dreamId=${dream.id}&title=${encodeURIComponent(dream.title)}&dreamSummary=${encodeURIComponent(dreamSummary)}`
    } catch (error) {
      console.error('Error opening Reflect AI:', error)
      toast.error('Failed to open Reflect AI. Please try again.')
    }
  }

  const handleDeleteDream = async () => {
    setIsDeleting(true)
    try {
      await supabaseService.deleteDream(dream.id)
      
      toast.success('Dream deleted from your library')
      setIsOpen(false)
      onUpdate()
    } catch (error) {
      console.error('Error deleting dream:', error)
      toast.error('Failed to delete dream')
    } finally {
      setIsDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  // Helper to determine gradient based on dream type/input
  const getCardGradient = () => {
    switch (dream.inputType) {
      case 'voice':
        return 'from-purple-500/5 to-blue-500/5 hover:from-purple-500/10 hover:to-blue-500/10'
      case 'image':
        return 'from-pink-500/5 to-purple-500/5 hover:from-pink-500/10 hover:to-purple-500/10'
      default:
        return 'from-slate-500/5 to-purple-500/5 hover:from-slate-500/10 hover:to-purple-500/10'
    }
  }

  const handleGenerateTTS = async () => {
    if (!dream.interpretation) return
    setIsGeneratingTTS(true)
    try {
      const textToSpeak = `${dream.title}. ${dream.interpretation}`
      
      // Use Blink AI SDK for speech generation
      const { url } = await blink.ai.generateSpeech({
        text: textToSpeak,
        voice: (userProfile as any)?.preferredTtsVoice || 'nova'
      })
      
      setTtsAudioUrl(url)
      
      // Track TTS usage
      const cost = calculateTTSCost(textToSpeak.length)
      if (userId) {
        await logApiUsage({
          userId,
          operationType: 'text_generation',
          modelUsed: 'tts-1',
          tokensUsed: textToSpeak.length,
          estimatedCostUsd: cost,
          metadata: { operation: 'tts_generation', dreamId: dream.id }
        })
        
        // Update user profile with TTS usage
        if (userProfile) {
          const newCost = (Number(userProfile.ttsCostThisMonthUsd) || 0) + cost
          const newGens = (Number(userProfile.ttsGenerationsThisMonth) || 0) + 1
          await blink.db.userProfiles.update(userProfile.id, {
            ttsCostThisMonthUsd: newCost,
            ttsGenerationsThisMonth: newGens,
            updatedAt: new Date().toISOString()
          })
        }
      }
      
      toast.success('Audio narration generated!')
    } catch (error) {
      console.error('Error generating TTS:', error)
      toast.error('Failed to generate audio')
    } finally {
      setIsGeneratingTTS(false)
    }
  }

  const handlePlayPauseTTS = () => {
    if (!ttsAudioRef.current) {
      if (ttsAudioUrl) {
        ttsAudioRef.current = new Audio(ttsAudioUrl)
        ttsAudioRef.current.onended = () => setIsPlayingTTS(false)
      } else {
        return
      }
    }

    if (isPlayingTTS) {
      ttsAudioRef.current.pause()
      setIsPlayingTTS(false)
    } else {
      ttsAudioRef.current.play()
      setIsPlayingTTS(true)
    }
  }

  const handleTTSClick = async () => {
    if (subscriptionTier !== 'vip') {
      toast.error('Audio narration is a VIP feature')
      return
    }
    
    // Check privacy consent first
    if (userId) {
      const { checkPrivacyConsentNeeded } = await import('../utils/privacyConsentCheckpoint')
      const privacyCheck = await checkPrivacyConsentNeeded(userId)
      if (privacyCheck.needsConsent) {
        setShowPrivacyConsent(true)
        return
      }
    }
    
    if (ttsAudioUrl) {
      handlePlayPauseTTS()
    } else {
      setShowTTSConfirmation(true)
    }
  }

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (ttsAudioRef.current) {
        ttsAudioRef.current.pause()
        ttsAudioRef.current = null
      }
    }
  }, [])

  const toggleShareToCommunity = async (isPublic: boolean) => {
    try {
      const user = await blink.auth.me()
      
      const client = supabaseService.supabase
      if (!client) {
        toast.error('Community sharing requires Supabase configuration')
        return
      }

      if (isPublic) {
        // Create community dream using Supabase
        const { error } = await client
          .from('community_dreams')
          .insert({
            id: `cd_${Date.now()}`,
            dream_id: dream.id,
            user_id: user.id,
            title: dream.title,
            description: dream.description,
            interpretation: dream.interpretation,
            image_url: dream.imageUrl,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
        
        if (error) throw error
        toast.success('Dream shared with community!')
      } else {
        // Remove from community dreams using Supabase
        const { error } = await client
          .from('community_dreams')
          .delete()
          .eq('dream_id', dream.id)
          .eq('user_id', user.id)
          
        if (error) throw error
        toast.success('Dream removed from community')
      }
    } catch (error) {
      console.error('Error toggling community share:', error)
      toast.error('Failed to update share settings')
    }
  }

  return (
    <>
      <Card
        className={`group relative cursor-pointer overflow-hidden border-border/50 bg-gradient-to-br ${getCardGradient()} transition-all duration-300 hover:shadow-lg hover:border-primary/20 hover:-translate-y-1`}
        onClick={() => setIsOpen(true)}
      >
        {dream.imageUrl && (
          <div className="relative aspect-video w-full overflow-hidden">
            <img
              src={dream.imageUrl}
              alt={dream.title}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent opacity-60" />
            
            {/* Quick Share Overlay - Visible on hover/touch */}
            <div className="absolute top-2 right-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
               <DreamCardQuickShare
                dreamId={dream.id}
                dreamTitle={dream.title}
                subscriptionTier={subscriptionTier}
                onShare={(e) => {
                  e.stopPropagation() // Prevent card click
                  setIsOpen(true)
                }}
              />
            </div>
            
            {/* Type Badge on Image */}
            <div className="absolute top-2 left-2">
              <Badge variant="secondary" className="backdrop-blur-md bg-background/50 hover:bg-background/80 transition-colors shadow-sm">
                {getInputIcon()}
                <span className="ml-1 capitalize text-xs font-medium">{dream.inputType}</span>
              </Badge>
            </div>
          </div>
        )}

        <CardHeader className={`${dream.imageUrl ? 'pt-4' : 'pt-6'} pb-2 px-5`}>
          {!dream.imageUrl && (
             <div className="flex justify-between items-start mb-2">
               <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                {getInputIcon()}
                <span className="ml-1 capitalize">{dream.inputType}</span>
              </Badge>
              <span className="text-xs text-muted-foreground flex items-center">
                <Calendar className="w-3 h-3 mr-1" />
                {formatDate(dream.createdAt)}
              </span>
             </div>
          )}
          <div className="space-y-1">
            <CardTitle className="text-lg font-serif font-bold leading-tight tracking-tight text-foreground group-hover:text-primary transition-colors">
              {dream.title}
            </CardTitle>
            {dream.imageUrl && (
              <p className="text-xs text-muted-foreground flex items-center mt-1">
                <Calendar className="w-3 h-3 mr-1" />
                {formatDate(dream.createdAt)}
              </p>
            )}
          </div>
        </CardHeader>

        <CardContent className="px-5 pb-5">
          <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
            {dream.description}
          </p>
          
          {parsedTags && parsedTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-4">
              {parsedTags.slice(0, 3).map((tag, index) => (
                <Badge 
                  key={index} 
                  variant="secondary" 
                  className="text-[10px] px-2 py-0.5 bg-secondary/50 hover:bg-secondary text-secondary-foreground/80"
                >
                  #{tag}
                </Badge>
              ))}
              {parsedTags.length > 3 && (
                <span className="text-[10px] text-muted-foreground flex items-center px-1">
                  +{parsedTags.length - 3} more
                </span>
              )}
            </div>
          )}
          
          {/* Card Footer Actions (for non-image cards mostly) */}
          {!dream.imageUrl && (
            <div className="flex justify-between items-center mt-4 pt-3 border-t border-border/30">
              <span className="text-xs font-medium text-primary opacity-0 -translate-x-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0 flex items-center">
                View Details <ArrowRight className="w-3 h-3 ml-1" />
              </span>
              <div className="flex gap-2">
                <DreamCardQuickShare
                  dreamId={dream.id}
                  dreamTitle={dream.title}
                  subscriptionTier={subscriptionTier}
                  onShare={(e) => {
                    e.stopPropagation()
                    setIsOpen(true)
                  }}
                  className="relative opacity-0 group-hover:opacity-100 transition-opacity"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 dark:scrollbar-thumb-gray-600 dark:scrollbar-track-gray-800">
          <DialogHeader>
            <div className="flex items-start justify-between">
              <DialogTitle className="text-3xl font-serif">{dream.title}</DialogTitle>
              {/* TTS Button */}
              {dream.interpretation && subscriptionTier === 'vip' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleTTSClick}
                  className="gap-2 text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                  disabled={isGeneratingTTS}
                >
                  {isGeneratingTTS ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : isPlayingTTS ? (
                    <VolumeX className="w-4 h-4" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                  {ttsAudioUrl ? (isPlayingTTS ? 'Pause Audio' : 'Play Audio') : 'Generate Audio'}
                </Button>
              )}
            </div>
            <DialogDescription className="sr-only">
              View full details of your dream including description, interpretation, symbols, and multimedia content
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-4">Dream Description</h3>
              {dream.description.includes('Scene:') || dream.description.includes('Feelings/Emotions:') || dream.description.includes('Familiar People:') ? (
                <div className="space-y-4">
                  {dream.description.split('\n\n').map((section, index) => {
                    const [label, ...contentParts] = section.split(': ')
                    const content = contentParts.join(': ')
                    return (
                      <div key={index} className="space-y-1">
                        <h4 className="text-sm font-semibold text-primary">{label}</h4>
                        <p className="text-foreground pl-4 border-l-2 border-accent/30">{content}</p>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-foreground whitespace-pre-wrap">{dream.description}</p>
              )}
            </div>

            {dream.imageUrl && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Visual</h3>
                <div className="relative">
                  <img
                    src={dream.imageUrl}
                    alt={dream.title}
                    className="w-full rounded-lg border-2 border-border"
                  />
                </div>
              </div>
            )}

            {parsedTags && parsedTags.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">
                  Identified Symbols ({parsedTags.length})
                </h3>
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 dark:scrollbar-thumb-gray-600 dark:scrollbar-track-gray-800">
                  {parsedTags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="text-sm">
                      {tag}
                    </Badge>
                  ))}
                </div>
                {parsedTags.length > 8 && (
                  <p className="text-xs text-muted-foreground mt-2 italic">
                    Scroll to view all symbols
                  </p>
                )}
              </div>
            )}

            {dream.interpretation && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-4">AI Interpretation</h3>
                <div className="space-y-6">
                  {(() => {
                    const parsed = parseInterpretation(dream.interpretation);
                    
                    // Fallback: If no sections parsed, display raw interpretation
                    if (!parsed.sections || parsed.sections.length === 0) {
                      console.log('⚠️ DreamCard: No sections parsed, displaying raw interpretation')
                      return (
                        <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                          {dream.interpretation}
                        </div>
                      )
                    }
                    
                    return (
                      <>
                        {/* Render sections 1-4 */}
                        {parsed.sections
                          .filter((section) => {
                            const title = section.title?.toLowerCase?.() || ''
                            return section.sectionNumber !== '5' && !title.includes('guidance')
                          })
                          .map((section, index) => (
                          <div key={index} className="space-y-3">
                            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                              <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-medium">
                                {section.sectionNumber || index + 1}
                              </span>
                              {section.title}
                            </h3>
                            <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                              {section.content}
                            </div>
                          </div>
                        ))}
                        
                        {/* Enhanced Guidance Section (Section 5) */}
                        <div
                          ref={guidanceSectionRef}
                          className="space-y-3 rounded-lg border border-border bg-muted/30 p-4"
                        >
                          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-medium">
                              5
                            </span>
                            Guidance
                          </h3>
                          <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                            {parsed.guidanceContent}
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* Video Generation Section */}
            {!dream.videoUrl && canGenerate && (
              <div className="space-y-3 p-4 rounded-lg border border-accent/20 bg-accent/5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-accent">
                    <Video className="w-4 h-4" />
                    <h3 className="text-sm font-semibold">Cinematic Visualization</h3>
                  </div>
                  <Badge variant="outline" className="text-[10px] border-accent/30 text-accent bg-accent/10">
                    6s Video
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Transform your dream into a 6-second cinematic visualization with AI-enhanced motion and atmosphere.
                </p>
                <Button
                  onClick={handleGenerateVideo}
                  disabled={isGeneratingVideo}
                  className="w-full bg-accent hover:bg-accent/90 text-white shadow-md transition-all hover:scale-[1.02]"
                  size="sm"
                >
                  {isGeneratingVideo ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating Visualization...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate Dream Video
                    </>
                  )}
                </Button>
                {videoProgress && videoProgress.status !== 'completed' && (
                  <div className="space-y-1 mt-2">
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                      <span>Status: {videoProgress.status}</span>
                      {videoProgress.framesGenerated !== undefined && (
                        <span>Frames: {videoProgress.framesGenerated}</span>
                      )}
                    </div>
                    <Progress value={videoProgress.status === 'processing' ? 50 : 10} className="h-1" />
                  </div>
                )}
              </div>
            )}

            {/* Locked Video Section for non-eligible tiers */}
            {!dream.videoUrl && !canGenerate && (
              <div className="space-y-3 p-4 rounded-lg border border-muted bg-muted/5 opacity-80">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Video className="w-4 h-4" />
                    <h3 className="text-sm font-semibold">Cinematic Visualization</h3>
                  </div>
                  <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                </div>
                <p className="text-xs text-muted-foreground">
                  Cinematic visualizations are available for Architect (Premium) and Star (VIP) members.
                </p>
                <Button
                  variant="outline"
                  className="w-full border-muted-foreground/20 text-muted-foreground"
                  size="sm"
                  onClick={() => window.location.href = '/pricing'}
                >
                  Upgrade to Unlock
                </Button>
              </div>
            )}

            {dream.videoUrl && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Cinematic Dream Visualization
                </h3>
                <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-black border-2 border-accent/20">
                  {videoFailed ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 gap-4">
                      <div className="text-center">
                        <p className="text-white mb-2 font-semibold">Video failed to load</p>
                        <p className="text-gray-400 text-sm">The video file may be corrupted or unavailable.</p>
                      </div>
                      <Button
                        onClick={handleGenerateVideo}
                        disabled={isGeneratingVideo}
                        className="bg-accent hover:bg-accent/90"
                        size="sm"
                      >
                        {isGeneratingVideo ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Regenerating...
                          </>
                        ) : (
                          <>
                            <Video className="w-4 h-4 mr-2" />
                            Regenerate Video
                          </>
                        )}
                      </Button>
                    </div>
                  ) : (
                    <video
                      ref={ttsAudioRef} // Attach ref for TTS playback control
                      src={dream.videoUrl}
                      controls
                      crossOrigin="anonymous"
                      className="w-full h-full object-cover"
                      poster={dream.imageUrl}
                      onError={() => {
                        console.error('❌ Video failed to load:', dream.videoUrl)
                        console.error('Video URL does not have .mp4 extension or file format is unsupported')
                        setVideoFailed(true)
                      }}
                      onLoadedMetadata={() => {
                        console.log('✅ Video loaded successfully:', dream.videoUrl)
                        setVideoFailed(false)
                      }}
                    >
                      Your browser does not support the video tag.
                    </video>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-2 italic">
                  AI-enhanced cinematic dream visualization with ethereal effects
                </p>
              </div>
            )}

            {/* Reflect AI Button - Added after guidance section */}
            {dream.interpretation && (
              <div className="mt-8 mb-6">
                <Button
                  onClick={handleReflectAI}
                  className={`w-full font-semibold py-4 shadow-lg transform transition-all duration-300 ${
                    canUseReflectAI 
                      ? 'bg-blue-600 hover:bg-blue-700 text-white hover:scale-105 hover:shadow-blue-200/25' 
                      : 'bg-gray-400 hover:bg-gray-400 text-white/70 cursor-not-allowed'
                  }`}
                  size="lg"
                >
                  <Brain className="w-5 h-5 mr-3" />
                  {canUseReflectAI ? 'Reflect AI - Deep Dive Analysis' : 'Reflect AI - Premium+ Feature'}
                  {!canUseReflectAI && <Lock className="w-4 h-4 ml-2" />}
                </Button>
                <p className={`text-center text-sm mt-2 ${
                  canUseReflectAI ? 'text-muted-foreground' : 'text-muted-foreground/70 italic'
                }`}>
                  {canUseReflectAI 
                    ? 'Continue your journey with AI-guided reflection and journaling'
                    : 'Upgrade to Premium+ tier to unlock AI-guided reflection and journaling'
                  }
                </p>
              </div>
            )}

            {/* Share to Community Toggle */}
            {dream.interpretation && userId && (
              <ShareToCommunityToggle
                dreamId={dream.id}
                title={dream.title}
                description={dream.description}
                interpretation={dream.interpretation}
                imageUrl={dream.imageUrl}
                userId={userId}
                subscriptionTier={subscriptionTier}
                onToggleShare={toggleShareToCommunity}
              />
            )}

            {/* Share and Delete Buttons - Enhanced visibility */}
            <div className="flex gap-2 pt-6 border-t mt-6">
              <DreamShareButton
                dreamTitle={dream.title}
                dreamDescription={dream.description}
                interpretation={dream.interpretation}
                dreamId={dream.id}
                imageUrl={dream.imageUrl}
                variant="default"
                size="default"
              />
              <Button
                variant="outline"
                size="default"
                onClick={() => setShowDeleteConfirm(true)}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Dream</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{dream.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end gap-3">
            <AlertDialogCancel disabled={isDeleting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteDream}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </>
              )}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reflect AI Toast */}
      <ReflectAIToast
        isVisible={showReflectToast}
        onClose={() => setShowReflectToast(false)}
        onReflectNow={handleReflectAI}
        subscriptionTier={subscriptionTier}
      />

      {/* TTS Confirmation Dialog */}
      <TTSConfirmationDialog
        open={showTTSConfirmation}
        onOpenChange={setShowTTSConfirmation}
        onConfirm={handleGenerateTTS}
        subscriptionTier={subscriptionTier}
        currentSpend={Number(userProfile?.ttsCostThisMonthUsd) || 0}
        estimatedCost={calculateTTSCost((dream.title.length + (dream.interpretation?.length || 0)))}
        monthlyLimit={0.94}
        characterCount={(dream.title.length + (dream.interpretation?.length || 0))}
        estimatedDuration={estimateTTSDuration((dream.title.length + (dream.interpretation?.length || 0)))}
        voiceName={(userProfile as any)?.preferredTtsVoice || 'nova'}
      />

      {/* Privacy Consent Modal */}
      <PatternPrivacyConsentModal
        open={showPrivacyConsent}
        onOpenChange={setShowPrivacyConsent}
        userId={userId || ''}
        onConsentGranted={() => {
          setShowPrivacyConsent(false)
          setShowTTSConfirmation(true)
        }}
        onConsentDenied={() => setShowPrivacyConsent(false)}
        tier={subscriptionTier as any}
      />
    </>
  )
}
