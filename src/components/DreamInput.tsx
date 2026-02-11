import React, { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { Label } from './ui/label'
import { Progress } from './ui/progress'
import { DreamCanvas } from './DreamCanvas'
const DreamInterpreting = React.lazy(() => import('./DreamInterpreting').then(m => ({ default: m.DreamInterpreting })))
import { VoiceRecorder } from './VoiceRecorder'
import { Type, Sparkles, Loader2, Upload, AlertCircle, Mic, X } from 'lucide-react'
import { blink } from '../blink/client'
import { supabaseService } from '../lib/supabaseService'
import { withDbRateLimitGuard } from '../utils/rateLimitGuard'
import toast from 'react-hot-toast'
import type { DreamInput as DreamInputType } from '../types/dream'
import type { UserProfile } from '../types/profile'
import type { UserProfileRow, DreamRow } from '../types/blink'
import { canCreateDreamAnalysis, canTranscribeAudio, shouldResetMonthlyUsage, resetMonthlyUsageCounters } from '../utils/subscriptionHelpers'
import { generateDeviceFingerprint, normalizeEmail, checkAbuseSignals, applyAbuseRestrictions } from '../utils/abuseDetection'
import { validateAndApplyReferral } from '../utils/referralSystem'
import { logApiUsage, calculateImageGenerationCost, calculateTextGenerationCost } from '../utils/costTracking'
import { validateEmotionalContent, getEmotionSuggestions } from '../utils/emotionValidation'
import { parseImageGenerationError, shouldRetryImageGeneration, formatImageErrorForUser, logImageGenerationError } from '../utils/imageGenerationErrors'
import { executeSession1Checkpoints, type ValidationCheckpointResult } from '../utils/inputValidationCheckpoint'
import { validateDreamContent, getGuardrailErrorMessage } from '../utils/contentGuardrails'
import { RecommendationApprovalModal } from './RecommendationApprovalModal'
import { PersonalizationPrompt } from './PersonalizationPrompt'
import { ReferralDialog } from './ReferralDialog'
import { LimitReachedDialog } from './LimitReachedDialog'
import { AI_PROMPTS, buildPersonalizedImagePromptSuffix, buildPersonalInterpretationContext } from '../config/aiPrompts'
import { 
  validateSubscriptionLimits, 
  generateDreamTitle, 
  generateDreamImage,
  validateDreamIntegrity
} from '../utils/dreamInputCheckpoints'
import { guardNumber, guardBoolean, guardUsageLimitReached, guardProgressPercentage } from '../utils/typeGuards'
import { preprocessDreamImagePrompt, optimizePromptLength, validatePromptQuality } from '../utils/promptPreprocessor'
import type { CheckpointContext, TitleGenerationResult, ImageGenerationResult } from '../types/dream'
import { analyzeDreamPattern } from '../utils/dreamPatternTracking'
import { waterSymbolsFromDream } from '../utils/symbolExtractor'
import { enforceDreamInputCap, GLOBAL_DREAM_INPUT_CAP } from '../utils/inputBudget'
import { getLaunchOfferStatus, shouldApplyWatermarkForLaunchOffer, getLaunchOfferWatermarkConfig, trackLaunchOfferImageGeneration, checkAndGrantLaunchOffer } from '../utils/launchOfferManager'
import { addWatermarkToImage } from '../utils/imageWatermarking'

interface SubscriptionStatus {
  isPaid: boolean
  plan?: string
}

interface DreamInputProps {
  onDreamCreated: (dreamId?: string) => void // Now accepts optional dreamId
  userProfile: UserProfile | null
  initialTab?: 'voice' | 'text' | 'symbols' | 'image' // Allow parent to control initial tab
  onTabChange?: (tab: 'voice' | 'text' | 'symbols' | 'image') => void // Notify parent of tab changes
}

interface UserUsageData {
  dreamsAnalyzedThisMonth: number
  dreamsAnalyzedLifetime: number
  referralBonusDreams: number
  lastResetDate: string | null
  subscriptionTier: string
  hasLaunchOffer: boolean
}

export function DreamInput({ onDreamCreated, userProfile, initialTab = 'voice', onTabChange }: DreamInputProps) {
  const [userUsage, setUserUsage] = useState<UserUsageData | null>(null)
  const [usageLoading, setUsageLoading] = useState(true)

  // Get usage info for display - MUST BE BEFORE conditional returns
  const isFreeTier = userUsage?.subscriptionTier === 'free'
  const voiceEnabled = !!userUsage && canTranscribeAudio({ 
    subscriptionTier: userUsage.subscriptionTier as any,
    hasLaunchOffer: userUsage.hasLaunchOffer
  })

  // Voice recording is now available alongside text input
  const [activeTab, setActiveTab] = useState<'voice'|'text'|'symbols'|'image'>(initialTab)
  
  // Notify parent when tab changes
  const handleTabChange = (tab: 'voice'|'text'|'symbols'|'image') => {
    setActiveTab(tab)
    onTabChange?.(tab)
  }
  const [description, setDescription] = useState('')
  const [dreamText, setDreamText] = useState('') // Single smart field for text/voice input
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>('')
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>('')
  const [isUploading, setIsUploading] = useState(false)
  const [symbolsDataUrl, setSymbolsDataUrl] = useState<string>('')
  const [uploadedSymbolsUrl, setUploadedSymbolsUrl] = useState<string>('')
  const [voiceTranscription, setVoiceTranscription] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [loadingStage, setLoadingStage] = useState<'analyzing' | 'interpreting' | 'generating' | 'complete'>('analyzing')
  const [emotionValidationError, setEmotionValidationError] = useState<string | null>(null)
  const [contentGuardrailError, setContentGuardrailError] = useState<string | null>(null)
  const [contentSuggestion, setContentSuggestion] = useState<string | null>(null)
  const [userId, setUserId] = useState<string>('')
  const [validationResult, setValidationResult] = useState<ValidationCheckpointResult | null>(null)
  const [showValidationModal, setShowValidationModal] = useState(false)
  const [pendingSubmission, setPendingSubmission] = useState(false)
  const [showPersonalizationPrompt, setShowPersonalizationPrompt] = useState(false)
  const [isFirstDream, setIsFirstDream] = useState(false)
  const [showLimitReachedDialog, setShowLimitReachedDialog] = useState(false)
  const [showReferralDialog, setShowReferralDialog] = useState(false)

  // If voice isn't available yet or at all, and we are on voice tab, 
  // we should still show something or wait for usage to load.
  const isVoiceTabActiveAndDisabled = activeTab === 'voice' && !voiceEnabled && !usageLoading;

  // Sync active tab when initialTab prop changes
  useEffect(() => {
    setActiveTab(initialTab)
  }, [initialTab])

  // Load user usage data on mount
  useEffect(() => {
    const loadUserUsage = async () => {
      try {
        const user = await blink.auth.me()
        setUserId(user.id)
        
        // Load profile from Supabase
        const profile = await supabaseService.getProfile(user.id)
        
        if (profile) {
          // Check if this is the first dream (has completed onboarding but no dreams yet)
          // Use camelCase properties from castUserProfile
          const isFirstDreamFlag = Number(profile.dreamsAnalyzedLifetime) === 0 && !!profile.onboardingCompleted
          
          // Only show personalization prompt if:
          // 1. This is the first dream
          // 2. User skipped onboarding (minimal profile with default values)
          // 3. Profile is incomplete (missing name or date of birth)
          const hasMinimalProfile = profile.name === 'Dream Enthusiast' || !profile.dateOfBirth
          
          setIsFirstDream(isFirstDreamFlag && hasMinimalProfile)
          
          // Reset monthly counter if needed (for Pro/Premium)
          let dreamsAnalyzedThisMonth = Number(profile.dreamsAnalyzedThisMonth) || 0
          let lastResetDate = profile.lastResetDate
          const subscriptionTier = profile.subscriptionTier || 'free'
          
          // Only reset monthly counter for Pro/Premium tiers
          if (subscriptionTier !== 'free' && shouldResetMonthlyUsage(lastResetDate || undefined)) {
            await resetMonthlyUsageCounters(blink, user.id)
            dreamsAnalyzedThisMonth = 0
            lastResetDate = new Date().toISOString()
          }
          
          let hasLaunchOffer = false
          try {
            // Ensure launch offer is granted (idempotent check)
            // This fixes issues where users might miss the grant during onboarding
            await checkAndGrantLaunchOffer(user.id)
            
            const launchOfferStatus = await getLaunchOfferStatus(user.id)
            hasLaunchOffer = !!launchOfferStatus.hasLaunchOffer
          } catch (e) {
            console.warn('Error checking/granting launch offer status (non-blocking):', e)
          }

          setUserUsage({
            dreamsAnalyzedThisMonth,
            dreamsAnalyzedLifetime: Number(profile.dreamsAnalyzedLifetime) || 0,
            referralBonusDreams: Number(profile.referralBonusDreams) || 0,
            lastResetDate,
            subscriptionTier,
            hasLaunchOffer,
          })
        }
      } catch (error) {
        console.error('Error loading user usage:', error)
      } finally {
        setUsageLoading(false)
      }
    }
    
    loadUserUsage()
  }, [])

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImageFile(file)
    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)

    // Standalone upload to public storage as requested
    try {
      setIsUploading(true)
      const user = await blink.auth.me()
      const extension = file.name.split('.').pop()
      const uploadResult = await blink.storage.upload(
        file,
        `dreams/${user.id}/${Date.now()}.${extension}`,
        { upsert: true }
      )
      setUploadedImageUrl(uploadResult.publicUrl)
      toast.success('Image uploaded to public storage')
    } catch (error) {
      console.error('Upload failed:', error)
      toast.error('Failed to upload image')
    } finally {
      setIsUploading(false)
    }
  }

  const handleSymbolsComplete = async (dataUrl: string) => {
    setSymbolsDataUrl(dataUrl)
    
    // Standalone upload for symbols as well
    try {
      setIsUploading(true)
      const user = await blink.auth.me()
      const blob = await fetch(dataUrl).then(r => r.blob())
      const file = new File([blob], 'symbols.png', { type: 'image/png' })
      const uploadResult = await blink.storage.upload(
        file,
        `dreams/${user.id}/${Date.now()}-symbols.png`,
        { upsert: true }
      )
      setUploadedSymbolsUrl(uploadResult.publicUrl)
      toast.success('Drawing saved and uploaded!')
    } catch (error) {
      console.error('Symbol upload failed:', error)
      toast.error('Failed to save drawing')
    } finally {
      setIsUploading(false)
    }
  }

  const handleVoiceTranscription = (transcription: string) => {
    const { text, wasTruncated } = enforceDreamInputCap(transcription)

    setVoiceTranscription(text)
    // Auto-populate the smart text field with the transcription
    setDreamText(text)
    // Switch to text tab to show the transcription
    setActiveTab('text')

    if (wasTruncated) {
      toast('Transcription was trimmed to fit the 3,000 character limit.', {
        icon: '✂️',
        duration: 4500
      })
    }
  }

  const handleSubmit = async () => {
    // Build full text for validation (enforce global cap at the pre-AI boundary)
    const rawText = (activeTab === 'text' || activeTab === 'voice')
      ? dreamText.trim()
      : description.trim()

    const { text: fullText, wasTruncated } = enforceDreamInputCap(rawText)

    if (wasTruncated) {
      // Keep UX friendly: don't block, just enforce.
      toast('Your dream was trimmed to fit the 3,000 character limit.', {
        icon: '✂️',
        duration: 4500
      })

      if (activeTab === 'text' || activeTab === 'voice') {
        setDreamText(fullText)
      } else {
        setDescription(fullText)
      }
    }
    
    // Clear previous errors
    setContentGuardrailError(null)
    setContentSuggestion(null)
    
    // Basic check for content
    if (!fullText) {
      toast.error('Please describe your dream')
      return
    }

    // 🚨 CONTENT GUARDRAILS CHECK - Block explicit/prohibited content FIRST
    const { result: guardrailResult, isSpam } = validateDreamContent(fullText)
    
    if (!guardrailResult.isAllowed) {
      // Set error state for UI display
      setContentGuardrailError(getGuardrailErrorMessage(guardrailResult))
      setContentSuggestion(guardrailResult.suggestion || null)
      
      // Show toast with error
      toast.error(getGuardrailErrorMessage(guardrailResult), {
        duration: 6000,
        icon: guardrailResult.violationType === 'explicit' ? '🔒' : '⚠️'
      })
      
      console.warn('Content blocked by guardrails:', {
        type: guardrailResult.violationType,
        isSpam
      })
      return
    }

    // Execute Session 1 Validation Checkpoints (1-2)
    try {
      const checkpointResult = await executeSession1Checkpoints(
        fullText,
        activeTab === 'voice' ? 'text' : activeTab,
        { useAIFallback: true }
      )
      
      setValidationResult(checkpointResult)
      
      // If validation failed or has warnings, show modal
      if (!checkpointResult.isValid || checkpointResult.recommendations.length > 0) {
        setShowValidationModal(true)
        return
      }
      
      // Validation passed with no warnings, proceed directly
      setPendingSubmission(true)
      await processDream()
      
    } catch (error) {
      console.error('Validation checkpoint error:', error)
      toast.error('Validation failed. Please try again.')
    }
  }

  async function handleValidationProceed() {
    setShowValidationModal(false)
    setPendingSubmission(true)
    await processDream()
  }

  function handleValidationCancel() {
    setShowValidationModal(false)
    setValidationResult(null)
  }

  async function processDream() {
    // Build full text (enforce global cap at the pre-AI boundary)
    const rawText = (activeTab === 'text' || activeTab === 'voice')
      ? dreamText.trim()
      : description.trim()

    const { text: fullText, wasTruncated } = enforceDreamInputCap(rawText)

    if (wasTruncated) {
      if (activeTab === 'text' || activeTab === 'voice') {
        setDreamText(fullText)
      } else {
        setDescription(fullText)
      }
    }

    // Generate dream ID at the start to use throughout the function
    const dreamId = `dream_${Date.now()}`

    setIsProcessing(true)
    setLoadingStage('analyzing')
    
    try {
      const user = await blink.auth.me()
      
      // Build checkpoint context
      const checkpointContext: CheckpointContext = {
        userId: user.id,
        dreamId,
        subscriptionTier: userUsage?.subscriptionTier || 'free',
        hasLaunchOffer: userUsage?.hasLaunchOffer || false,
        dreamsUsedThisMonth: userUsage?.dreamsAnalyzedThisMonth || 0,
        dreamLimit: userUsage?.subscriptionTier === 'free' 
          ? (2 + (userUsage?.referralBonusDreams || 0))
          : (userUsage?.subscriptionTier === 'pro' ? 10 : userUsage?.subscriptionTier === 'premium' ? 20 : userUsage?.subscriptionTier === 'vip' ? 25 : Infinity),
        inputContent: fullText,
        inputType: (activeTab === 'voice' ? 'text' : activeTab) as 'text' | 'symbols' | 'image'
      }

      // Checkpoint 3: Subscription tier validation
      const subscriptionCheck = await validateSubscriptionLimits(checkpointContext)
      
      if (!subscriptionCheck.canProceed) {
        toast.error(subscriptionCheck.message)
        setIsProcessing(false)
        return
      }
      
      // Checkpoint 4: AI title generation with smart fallback
      setLoadingStage('analyzing')
      const titleResult: TitleGenerationResult = await generateDreamTitle(
        checkpointContext,
        userProfile ? {
          ...userProfile,
          id: userProfile.id || '',
          userId: user.id,
          dreamsAnalyzedThisMonth: userUsage?.dreamsAnalyzedThisMonth || 0,
          dreamsAnalyzedLifetime: userUsage?.dreamsAnalyzedLifetime || 0, // Corrected from lifetimeDreamsCount
          subscriptionTier: (userUsage?.subscriptionTier || 'free') as any
        } : null
      )

      const title = titleResult.title
      if (titleResult.usedFallback) {
        console.warn('⚠️ Title generation used fallback:', titleResult.fallbackReason)
      }

      // Handle image/symbol uploads if not already uploaded
      let currentImageUrl = ''
      
      if (activeTab === 'image') {
        if (uploadedImageUrl) {
          currentImageUrl = uploadedImageUrl
        } else if (imageFile) {
          setIsUploading(true)
          const extension = imageFile.name.split('.').pop()
          const uploadResult = await blink.storage.upload(
            imageFile,
            `dreams/${user.id}/${Date.now()}.${extension}`,
            { upsert: true }
          )
          currentImageUrl = uploadResult.publicUrl
          setUploadedImageUrl(currentImageUrl)
          setIsUploading(false)
        }
      } else if (activeTab === 'symbols') {
        if (uploadedSymbolsUrl) {
          currentImageUrl = uploadedSymbolsUrl
        } else if (symbolsDataUrl) {
          setIsUploading(true)
          const blob = await fetch(symbolsDataUrl).then(r => r.blob())
          const file = new File([blob], 'symbols.png', { type: 'image/png' })
          const uploadResult = await blink.storage.upload(
            file,
            `dreams/${user.id}/${Date.now()}-symbols.png`,
            { upsert: true }
          )
          currentImageUrl = uploadResult.publicUrl
          setUploadedSymbolsUrl(currentImageUrl)
          setIsUploading(false)
        }
      }

      // Extract tags using AI
      const tagPrompt = AI_PROMPTS.extractDreamTags(title, fullText)

      const tagsGeneration = await blink.ai.generateText({
        prompt: tagPrompt
      })
      
      // Extract text from response (handles both text and steps formats)
      let tagsResponse = ''
      if (tagsGeneration?.text) {
        tagsResponse = tagsGeneration.text
      } else if ((tagsGeneration as any)?.steps && Array.isArray((tagsGeneration as any).steps)) {
        const steps = (tagsGeneration as any).steps
        const lastStep = steps[steps.length - 1]
        tagsResponse = lastStep?.text || ''
      }

      // Track tags generation cost
      await logApiUsage({
        userId: user.id,
        operationType: 'text_generation',
        modelUsed: 'gpt-4.1-mini',
        tokensUsed: tagPrompt.length + tagsResponse.length,
        estimatedCostUsd: calculateTextGenerationCost('gpt-4.1-mini', tagPrompt.length, tagsResponse.length),
        inputSize: tagPrompt.length,
        outputSize: tagsResponse.length,
        metadata: { operation: 'tags_extraction', dreamId }
      })

      let tags: string[] = []
      try {
        if (tagsResponse && tagsResponse.trim()) {
          const cleanResponse = tagsResponse.trim().replace(/```json\n?/g, '').replace(/```\n?/g, '')
          tags = JSON.parse(cleanResponse)
          if (!Array.isArray(tags)) tags = []
        }
      } catch (e) {
        console.warn('Failed to parse tags, using defaults', e)
        tags = []
      }

      // Generate interpretation
      setLoadingStage('interpreting')
      
      // Build personalized context from user profile
      const personalContext = buildPersonalInterpretationContext(userProfile ? {
        name: userProfile.name,
        age: Number(userProfile.age),
        gender: userProfile.gender,
        nightmareProne: Number(userProfile.nightmareProne || 0),
        recurringDreams: Number(userProfile.recurringDreams || 0)
      } : undefined)
      
      const interpretationPrompt = AI_PROMPTS.generateDreamInterpretation(title, fullText, tags, personalContext)

      console.log('🤖 Generating AI interpretation...')
      console.log('📋 Prompt length:', interpretationPrompt.length, 'chars')
      
      let interpretation = ''
      
      // Strategy 1: Use generateObject with schema for reliable structured output
      try {
        const { object: interpretResult } = await blink.ai.generateObject({
          prompt: interpretationPrompt,
          model: 'gpt-4.1-mini',
          schema: {
            type: 'object',
            properties: {
              interpretation: { type: 'string' }
            },
            required: ['interpretation']
          }
        })
        interpretation = (interpretResult as { interpretation: string }).interpretation || ''
        console.log('✅ generateObject returned interpretation:', interpretation.length, 'chars')
      } catch (objectError) {
        console.warn('⚠️ generateObject failed, trying generateText with retry:', objectError)
        
        // Fallback: generateText with retry logic (Strategy 2)
        const maxRetries = 3
        for (let retry = 0; retry < maxRetries; retry++) {
          try {
            const interpretationGeneration = await blink.ai.generateText({
              prompt: interpretationPrompt,
              model: 'gpt-4.1-mini'
            })
            
            console.log(`📦 AI Response (attempt ${retry + 1}):`, interpretationGeneration)
            
            // Extract text from response (handles both text and steps formats)
            let extractedText = ''
            if (interpretationGeneration?.text) {
              extractedText = interpretationGeneration.text
            } else if ((interpretationGeneration as any)?.steps && Array.isArray((interpretationGeneration as any).steps)) {
              const steps = (interpretationGeneration as any).steps
              const lastStep = steps[steps.length - 1]
              extractedText = lastStep?.text || ''
            }
            
            if (extractedText?.trim()) {
              interpretation = extractedText
              console.log(`✅ generateText succeeded on attempt ${retry + 1}:`, interpretation.length, 'chars')
              break
            }
            
            console.warn(`⚠️ Empty response on attempt ${retry + 1}, retrying...`)
            await new Promise(r => setTimeout(r, Math.pow(2, retry) * 1000)) // 1s, 2s, 4s backoff
          } catch (retryError) {
            console.warn(`Interpretation retry ${retry + 1} failed:`, retryError)
            await new Promise(r => setTimeout(r, Math.pow(2, retry) * 1000))
          }
        }
      }
      
      // Validate interpretation was generated
      if (!interpretation || interpretation.trim().length === 0) {
        console.error('❌ AI failed to generate interpretation after all attempts')
        throw new Error('Failed to generate dream interpretation - AI returned empty response after multiple attempts. Please try again.')
      }
      
      console.log('✅ AI interpretation generated:', interpretation.length, 'chars')

      // Track interpretation generation cost
      await logApiUsage({
        userId: user.id,
        operationType: 'ai_interpretation',
        modelUsed: 'gpt-4.1-mini',
        tokensUsed: interpretationPrompt.length + interpretation.length,
        estimatedCostUsd: calculateTextGenerationCost('gpt-4.1-mini', interpretationPrompt.length, interpretation.length),
        inputSize: interpretationPrompt.length,
        outputSize: interpretation.length,
        metadata: { operation: 'dream_interpretation', dreamId }
      })

      // Define subscriptionTier locally for use in subsequent operations
      const subscriptionTier = userUsage?.subscriptionTier || 'free'

      // 🌱 Symbol Orchard: Auto-plant symbols from dream tags (Premium+ only)
      // This populates the Symbol Orchard garden in the background
      try {
        await waterSymbolsFromDream(
          user.id,
          subscriptionTier as 'free' | 'pro' | 'premium' | 'vip',
          title,
          tags
        )
        console.log('✅ Symbols planted/watered in Symbol Orchard')
      } catch (symbolError) {
        // Non-blocking - continue even if symbol extraction fails
        console.warn('⚠️ Symbol extraction failed (non-critical):', symbolError)
      }

      // Increment dreams analyzed counter (both monthly and lifetime)
      if (userProfile?.id) {
        const currentMonthCount = userUsage?.dreamsAnalyzedThisMonth || 0
        const currentLifetimeCount = userUsage?.dreamsAnalyzedLifetime || 0
        
        const profile = await supabaseService.getProfile(user.id)
        if (profile) {
          await supabaseService.upsertProfile({
            ...profile,
            dreams_analyzed_this_month: currentMonthCount + 1,
            dreams_analyzed_lifetime: currentLifetimeCount + 1,
            updated_at: new Date().toISOString()
          } as any)
        }
        
        // Update local state
        setUserUsage(prev => prev ? {
          ...prev,
          dreamsAnalyzedThisMonth: prev.dreamsAnalyzedThisMonth + 1,
          dreamsAnalyzedLifetime: prev.dreamsAnalyzedLifetime + 1
        } : null)
      }


      
      // Ensure tags is an array for display
      const displayTags = Array.isArray(tags) ? tags : []
      
      // Checkpoint 5: Image generation with validation
      let finalImageUrl = currentImageUrl
      const isPaidUserFlag = subscriptionTier === 'pro' || subscriptionTier === 'premium' || subscriptionTier === 'vip'
      // Use the fresh status we fetched above instead of potentially stale state
      let freshHasLaunchOffer = userUsage?.hasLaunchOffer ?? false
      try {
        // Double check grant here too just in case
        await checkAndGrantLaunchOffer(user.id)
        
        const launchOfferStatus = await getLaunchOfferStatus(user.id)
        freshHasLaunchOffer = !!launchOfferStatus.hasLaunchOffer
        console.log('🚀 Fresh launch offer status:', freshHasLaunchOffer)
        
        // IMPORTANT: Update component state so subsequent checks use fresh value
        if (userUsage) {
          setUserUsage(prev => prev ? { ...prev, hasLaunchOffer: freshHasLaunchOffer } : null)
        }
      } catch (e) {
        console.warn('Error checking fresh launch offer status:', e)
      }
      const hasLaunchOffer = freshHasLaunchOffer
      const canGenerateImageForUser = isPaidUserFlag || (subscriptionTier === 'free' && hasLaunchOffer)
      
      // Only generate image if no image was uploaded and user has permission
      if ((activeTab === 'text' || activeTab === 'voice') && !uploadedImageUrl && canGenerateImageForUser) {
        setLoadingStage('generating')
        
        // Generate personalized image prompt suffix based on user profile
        const imagePromptSuffix = buildPersonalizedImagePromptSuffix(userProfile ? {
          gender: userProfile.gender,
          age: Number(userProfile.age)
        } : undefined)

        // Use optimized checkpoint-based image generation
        const imageResult: ImageGenerationResult = await generateDreamImage(
          checkpointContext,
          AI_PROMPTS.generateDreamImage(title, fullText, imagePromptSuffix),
          subscriptionTier as any
        )

        if (imageResult.success && imageResult.imageUrl) {
          let generatedImageUrl = imageResult.imageUrl

          // Apply watermark for launch offer users (free tier promo)
          try {
            if (shouldApplyWatermarkForLaunchOffer(hasLaunchOffer)) {
              console.log('🎨 Launch offer user - applying watermark...')
              const watermarkConfig = getLaunchOfferWatermarkConfig()
              generatedImageUrl = await addWatermarkToImage(generatedImageUrl, watermarkConfig, user.id)
              trackLaunchOfferImageGeneration(user.id).catch(() => undefined)
              console.log('✅ Watermark applied to launch offer image')
            }
          } catch (watermarkError) {
            console.warn('⚠️ Watermark processing error (non-blocking):', watermarkError)
          }

          finalImageUrl = generatedImageUrl
          toast.success('✨ Dream image generated!')
        } else {
          console.warn('⚠️ Image generation skipped or failed:', imageResult.errorMessage)
          if (imageResult.errorMessage && !imageResult.errorMessage.includes('Insufficient permissions')) {
            toast.error(imageResult.errorMessage)
          }
        }
      }
      
      // Checkpoint 6: Dream record integrity check
      const finalDreamRecord = {
        id: dreamId,
        user_id: user.id,
        title,
        description: fullText,
        input_type: (activeTab === 'voice' ? 'text' : activeTab) as 'text' | 'symbols' | 'image',
        image_url: finalImageUrl, // Use the potentially generated or uploaded image URL
        symbols_data: activeTab === 'symbols' ? symbolsDataUrl : undefined,
        interpretation,
        tags: JSON.stringify(tags),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const integrityCheck = validateDreamIntegrity(finalDreamRecord)
      if (!integrityCheck.canSave) {
        console.error('❌ Dream record integrity check failed:', integrityCheck.recommendations)
        toast.error('Dream record failed final validation. Please try again.')
        setIsProcessing(false)
        return
      }

      // Create dream record - SINGLE ATOMIC WRITE at the end using Supabase
      await supabaseService.createDream(finalDreamRecord as any)

      // 🧠 Intelligent Pattern Tracking: Analyze dream for nightmares & recurring patterns
      // This automatically tracks patterns without requiring users to fill forms
      try {
        await analyzeDreamPattern(
          fullText,
          dreamId,
          user.id,
          subscriptionTier as 'free' | 'pro' | 'premium' | 'vip'
        )
        console.log('✅ Dream pattern analysis completed')
      } catch (patternError) {
        // Non-blocking - continue even if pattern analysis fails
        console.warn('⚠️ Pattern analysis failed (non-critical):', patternError)
      }

      console.log('📊 Final image URL before results:', finalImageUrl)
      
      // Show completion stage
      setLoadingStage('complete')
      
      // Small delay to show complete stage
      await new Promise(resolve => setTimeout(resolve, 800))
      
      // Store image URL globally for video generation
      if (finalImageUrl) {
        (window as any).__dreamImageUrl = finalImageUrl
      }
      
      // Validate interpretation
      if (!interpretation || typeof interpretation !== 'string' || interpretation.trim().length === 0) {
        console.error('❌ Invalid interpretation data', {
          interpretation: interpretation ? `${interpretation.substring(0, 50)}...` : 'null',
          type: typeof interpretation,
          length: interpretation?.length
        })
        throw new Error('Failed to generate dream interpretation - no valid data returned from AI')
      }
      
      console.log('✅ Interpretation validation successful')
      
      // Reset processing state
      setIsProcessing(false)
      
      // 🚀 IMMEDIATE NAVIGATION to Library
      // This fulfills the requirement: "show Dream card in library instead of record screen"
      console.log('📚 Navigating to library immediately after dream creation...')
      onDreamCreated(dreamId)
      
      // Show success toast notification after navigation
      setTimeout(() => {
        toast.success('✨ Dream interpreted and saved to your library!', {
          duration: 5000,
          icon: '📚',
          position: 'top-center'
        })
      }, 500)
      
      // Show personalization prompt only if this is the first dream and they have minimal profile
      // This ensures it only shows once appropriately
      if (isFirstDream) {
        console.log('🎯 Showing personalization prompt for first dream')
        setTimeout(() => {
          setShowPersonalizationPrompt(true)
        }, 1500) // Increased delay to ensure library is loaded first
      } else {
        console.log('ℹ️ Not showing personalization prompt - not first dream or profile complete')
      }
      
      // Check if user just hit their limit with this dream (for free tier)
      const newDreamCount = (userUsage?.dreamsAnalyzedLifetime || 0) + 1
      const isFreeTier = userUsage?.subscriptionTier === 'free'
      const bonusDreams = userUsage?.referralBonusDreams || 0
      const dreamLimit = isFreeTier 
        ? (2 + bonusDreams) // Lifetime limit with bonuses
        : (userUsage?.subscriptionTier === 'pro' ? 10 : userUsage?.subscriptionTier === 'premium' ? 20 : userUsage?.subscriptionTier === 'vip' ? 25 : Infinity)
      const userLimitAfterThisDream = dreamLimit
      const justHitLimit = newDreamCount >= userLimitAfterThisDream && userLimitAfterThisDream !== Infinity
      
      // Show referral dialog if they just hit their limit
      if (justHitLimit && isFreeTier) {
        console.log('🎁 User hit limit - showing referral dialog')
        setTimeout(() => {
          setShowReferralDialog(true)
        }, 2000) // Delay to let success toast show first
      }

      // 🎯 Engagement Trigger: Dream Logged
      // Emit custom event so App.tsx can show engagement toast for 2nd dream
      const engagementEvent = new CustomEvent('dreamLogged', {
        detail: { dreamId, hasImage: !!finalImageUrl }
      })
      window.dispatchEvent(engagementEvent)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.error('❌ Error processing dream:', {
        message: errorMessage,
        details: error
      })
      
      // Provide specific error guidance based on error type
      let userMessage = 'Failed to process dream'
      
      if (errorMessage.includes('AUTH') || errorMessage.includes('unauthorized')) {
        userMessage = 'Session expired. Please sign in again and try your dream.'
      } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        userMessage = 'Network connection issue. Please check your internet and try again.'
      } else if (errorMessage.includes('timeout')) {
        userMessage = 'Processing took too long. Try describing your dream more briefly.'
      } else if (errorMessage.includes('rate limit')) {
        userMessage = 'Too many requests. Please wait a moment and try again.'
      } else if (errorMessage.includes('quota') || errorMessage.includes('limit')) {
        userMessage = 'You have reached your monthly limit. Upgrade your plan for more interpretations.'
      }
      
      toast.error(userMessage)
      
      // Track the error for debugging
      if (userId) {
        await logApiUsage({
          userId,
          operationType: 'text_generation',
          modelUsed: 'combined',
          tokensUsed: 0,
          estimatedCostUsd: 0,
          success: false,
          errorMessage,
          metadata: { operation: 'dream_processing_error' }
        }).catch(logError => console.warn('Failed to log error:', logError))
      }
      
      setIsProcessing(false)
    }
  }

  const resetForm = () => {
    // Reset form fields
    setDescription('')
    setDreamText('')
    setImageFile(null)
    setImagePreview('')
    setSymbolsDataUrl('')
    setUploadedImageUrl('') // Reset uploaded URL
    setUploadedSymbolsUrl('') // Reset uploaded URL
    setVoiceTranscription('')
  }

  // If voice isn't available for this tier, force the text tab
  useEffect(() => {
    if (!usageLoading && userUsage && !voiceEnabled && activeTab === 'voice') {
      setActiveTab('text')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usageLoading, userUsage, voiceEnabled])
  
  // FREE tier: Lifetime limit (2 + referral bonuses)
  // PRO/PREMIUM: Monthly limit
  const dreamsUsed = isFreeTier 
    ? (userUsage?.dreamsAnalyzedLifetime || 0)
    : (userUsage?.dreamsAnalyzedThisMonth || 0)
  
  const bonusDreams = userUsage?.referralBonusDreams || 0
  const dreamLimit = isFreeTier 
    ? (2 + bonusDreams) // Lifetime limit with bonuses
    : (userUsage?.subscriptionTier === 'pro' ? 10 : userUsage?.subscriptionTier === 'premium' ? 20 : userUsage?.subscriptionTier === 'vip' ? 25 : Infinity)
  
  // Show loading screen while processing
  if (isProcessing) {
    return <React.Suspense fallback={<div className="fixed inset-0 z-50 flex items-center justify-center bg-indigo-950"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div></div>}><DreamInterpreting stage={loadingStage} /></React.Suspense>
  }

  const progressGuard = guardProgressPercentage(dreamsUsed, dreamLimit)
  const progressPercentage: number = progressGuard.value
  
  const limitGuard = guardUsageLimitReached(dreamsUsed, dreamLimit)
  if (!limitGuard.valid && limitGuard.error) {
    console.warn(`⚠️ Type guard warning for usage limit: ${limitGuard.error}`)
  }
  const usageLimitReached: boolean = limitGuard.value
  
  // Note: Dream title is now auto-generated from dream content

  return (
    <>
      {/* Validation Checkpoint Modal */}
      {validationResult && (
        <RecommendationApprovalModal
          open={showValidationModal}
          onOpenChange={setShowValidationModal}
          checkpoints={validationResult.checkpoints}
          recommendations={validationResult.recommendations}
          onProceed={handleValidationProceed}
          onCancel={handleValidationCancel}
          title="A Little Guidance..."
          description="Let me help you share your dream in a way that unlocks its deeper meaning."
        />
      )}
      
      {/* Personalization Prompt - After First Dream */}
      <PersonalizationPrompt
        open={showPersonalizationPrompt}
        onDismiss={() => setShowPersonalizationPrompt(false)}
        onComplete={() => {
          setShowPersonalizationPrompt(false)
          // Navigate to settings to complete profile
          window.location.hash = '#settings'
          window.location.reload()
        }}
      />
      
      <Card className="w-full max-w-3xl mx-auto shadow-lg">
      <CardHeader className="px-4 py-4 sm:p-6">
        <CardTitle className="text-2xl sm:text-3xl font-serif">Record Your Dream</CardTitle>
        <CardDescription>
          Choose how you'd like to record your dream
        </CardDescription>
      </CardHeader>
      <CardContent className="px-4 pb-4 sm:p-6 sm:pt-0">
        <div className="space-y-6">
          {/* Usage Indicator removed as per request */}

          {usageLimitReached && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-center">
              <p className="text-sm font-medium text-red-900 mb-3">Free Limit reached - Upgrade your Plan</p>
              <Button 
                className="w-full" 
                variant="default"
                onClick={() => setShowLimitReachedDialog(true)}
              >
                See Options
              </Button>
            </div>
          )}
          
          {/* Limit Reached Dialog */}
          <LimitReachedDialog
            open={showLimitReachedDialog}
            onOpenChange={setShowLimitReachedDialog}
          />
          
          {/* Referral Dialog - Shows after dream is saved at limit */}
          <ReferralDialog
            open={showReferralDialog}
            onOpenChange={setShowReferralDialog}
          />
          


          {/* Content Guardrail Error - Explicit/Prohibited Content */}
          {contentGuardrailError && (
            <div className="p-4 bg-red-50 border border-red-300 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-red-900 mb-2">{contentGuardrailError}</p>
                  {contentSuggestion && (
                    <p className="text-xs text-red-700 bg-red-100/50 p-2 rounded">
                      💡 <strong>Tip:</strong> {contentSuggestion}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {emotionValidationError && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-amber-900 mb-2">{emotionValidationError}</p>
                  <p className="text-xs text-amber-700">
                    For example: &quot;I felt scared&quot;, &quot;I was happy&quot;, &quot;it made me anxious&quot;, etc.
                  </p>
                </div>
              </div>
            </div>
          )}

          <Tabs value={activeTab} onValueChange={(v) => handleTabChange(v as 'voice'|'text'|'symbols'|'image')}>
            <TabsList className={`w-full h-auto grid ${voiceEnabled ? 'grid-cols-4' : 'grid-cols-3'} p-1 gap-1`}>
              {voiceEnabled && (
                <TabsTrigger value="voice" className="px-1 py-2 text-[10px] xs:text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">
                  <Mic className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  <span className="truncate">Voice</span>
                </TabsTrigger>
              )}
              <TabsTrigger value="text" className="px-1 py-2 text-[10px] xs:text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">
                <Type className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="truncate">Text</span>
              </TabsTrigger>
              <TabsTrigger value="symbols" className="px-1 py-2 text-[10px] xs:text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">
                <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="truncate">Symbols</span>
              </TabsTrigger>
              <TabsTrigger value="image" className="px-1 py-2 text-[10px] xs:text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">
                <Upload className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="truncate">Image</span>
              </TabsTrigger>
            </TabsList>

            {voiceEnabled && (
              <TabsContent value="voice" className="space-y-4 pt-4">
                <VoiceRecorder 
                  onTranscriptionComplete={handleVoiceTranscription}
                  disabled={usageLimitReached}
                />
                {voiceTranscription && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-900 mb-2 font-medium">✓ Your dream has been transcribed</p>
                    <p className="text-xs text-green-700">
                      You can now review and edit it in the Text tab, or click "Interpret Dream" below to analyze it.
                    </p>
                  </div>
                )}
              </TabsContent>
            )}
            
            {/* Render text tab if voice is disabled or if it's the active tab */}
            {(activeTab === 'text' || !isVoiceTabActiveAndDisabled) && (
              <TabsContent value="text" className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="dreamText" className="text-base font-medium">
                    Describe your dream
                  </Label>
                  <Textarea
                    id="dreamText"
                    name="dreamText"
                    placeholder="Describe your dream naturally... What happened? How did you feel? Who was there?"
                    value={dreamText}
                    onChange={(e) => {
                      const nextValue = e.target.value
                      const { text: capped, wasTruncated } = enforceDreamInputCap(nextValue)

                      if (wasTruncated && dreamText.length <= GLOBAL_DREAM_INPUT_CAP) {
                        toast('Maximum length is 3,000 characters. Extra text was trimmed.', {
                          icon: '✂️',
                          duration: 3500
                        })
                      }

                      setDreamText(capped)

                      // Clear guardrail error when user starts editing
                      if (contentGuardrailError) {
                        setContentGuardrailError(null)
                        setContentSuggestion(null)
                      }
                    }}
                    rows={12}
                    className={`resize-none transition-all border-2 text-base md:text-sm ${contentGuardrailError ? 'border-red-300 focus:border-red-400' : 'focus:border-primary'}`}
                  />
                  <p className="text-xs text-muted-foreground">
                    {dreamText.length.toLocaleString()} / {GLOBAL_DREAM_INPUT_CAP.toLocaleString()} characters • The more detail you provide, the better your interpretation will be
                  </p>
                </div>
              </TabsContent>
            )}

            <TabsContent value="symbols" className="space-y-4 pt-4">
              {/* Form Completion Progress */}
              <div className="p-4 bg-gradient-to-r from-primary/5 to-accent/5 border border-primary/20 rounded-lg">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-foreground">Form Completion</p>
                    <span className="text-xs font-medium text-primary">
                      {[description.trim() ? 1 : 0, symbolsDataUrl ? 1 : 0].reduce((a, b) => a + b, 0)}/2
                    </span>
                  </div>
                  <Progress 
                    value={([description.trim() ? 1 : 0, symbolsDataUrl ? 1 : 0].reduce((a, b) => a + b, 0) / 2) * 100}
                    className="h-2" 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="symbols-desc" className="flex items-center gap-2">
                    Dream Context
                    {description.trim() && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">✓ Complete</span>
                    )}
                  </Label>
                </div>
                <Textarea
                  id="symbols-desc"
                  name="symbolsDescription"
                  placeholder="Briefly describe the context of your dream..."
                  value={description}
                  onChange={(e) => {
                    const nextValue = e.target.value
                    const { text: capped, wasTruncated } = enforceDreamInputCap(nextValue)

                    if (wasTruncated && description.length <= GLOBAL_DREAM_INPUT_CAP) {
                      toast('Maximum length is 3,000 characters. Extra text was trimmed.', {
                        icon: '✂️',
                        duration: 3500
                      })
                    }

                    setDescription(capped)
                    if (contentGuardrailError) {
                      setContentGuardrailError(null)
                      setContentSuggestion(null)
                    }
                  }}
                  rows={3}
                  className={`resize-none transition-all border-2 text-base md:text-sm ${
                    contentGuardrailError
                      ? 'border-red-300 focus:border-red-400'
                      : description.trim() 
                        ? 'border-green-300 bg-green-50/30' 
                        : 'border-gray-200'
                  }`}
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    Draw Your Dream Symbols
                    {symbolsDataUrl && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">✓ Complete</span>
                    )}
                  </Label>
                </div>
                <DreamCanvas onSymbolsComplete={handleSymbolsComplete} />
              </div>
            </TabsContent>

            <TabsContent value="image" className="space-y-4 pt-4">
              {/* Form Completion Progress */}
              <div className="p-4 bg-gradient-to-r from-primary/5 to-accent/5 border border-primary/20 rounded-lg">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-foreground">Form Completion</p>
                    <span className="text-xs font-medium text-primary">
                      {[description.trim() ? 1 : 0, imageFile ? 1 : 0].reduce((a, b) => a + b, 0)}/2
                    </span>
                  </div>
                  <Progress 
                    value={([description.trim() ? 1 : 0, imageFile ? 1 : 0].reduce((a, b) => a + b, 0) / 2) * 100}
                    className="h-2" 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="image-desc" className="flex items-center gap-2">
                    Dream Context
                    {description.trim() && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">✓ Complete</span>
                    )}
                  </Label>
                </div>
                <Textarea
                  id="image-desc"
                  name="imageDescription"
                  placeholder="Describe what this image represents in your dream..."
                  value={description}
                  onChange={(e) => {
                    const nextValue = e.target.value
                    const { text: capped, wasTruncated } = enforceDreamInputCap(nextValue)

                    if (wasTruncated && description.length <= GLOBAL_DREAM_INPUT_CAP) {
                      toast('Maximum length is 3,000 characters. Extra text was trimmed.', {
                        icon: '✂️',
                        duration: 3500
                      })
                    }

                    setDescription(capped)
                    if (contentGuardrailError) {
                      setContentGuardrailError(null)
                      setContentSuggestion(null)
                    }
                  }}
                  rows={3}
                  className={`resize-none transition-all border-2 ${
                    contentGuardrailError
                      ? 'border-red-300 focus:border-red-400'
                      : description.trim() 
                        ? 'border-green-300 bg-green-50/30' 
                        : 'border-gray-200'
                  }`}
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="image-upload" className="flex items-center gap-2">
                    Upload Dream Image
                    {imageFile && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">✓ Complete</span>
                    )}
                  </Label>
                </div>
                
                {/* Enhanced File Upload UI */}
                <div 
                  className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
                    imageFile 
                      ? 'border-green-400 bg-green-50/30 hover:bg-green-50/50' 
                      : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-primary/5'
                  }`}
                  onClick={() => document.getElementById('image-upload')?.click()}
                >
                  <input
                    id="image-upload"
                    name="imageUpload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  
                  {imageFile ? (
                    <div className="space-y-2">
                      <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                        {isUploading ? (
                          <Loader2 className="w-6 h-6 text-green-600 animate-spin" />
                        ) : (
                          <Sparkles className="w-6 h-6 text-green-600" />
                        )}
                      </div>
                      <div className="font-medium text-green-900">
                        {isUploading ? 'Uploading to Public Storage...' : 'Image Selected'}
                      </div>
                      <p className="text-sm text-green-700">{imageFile.name}</p>
                      <Button variant="ghost" size="sm" className="text-green-700 hover:text-green-800 hover:bg-green-100" disabled={isUploading}>
                        Change Image
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Upload className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">Click to upload an image</p>
                        <p className="text-sm text-muted-foreground mt-1">JPG, PNG, GIF up to 10MB</p>
                      </div>
                      <Button variant="outline" size="sm" className="mt-2">
                        Browse Files
                      </Button>
                    </div>
                  )}
                </div>

                {imagePreview && (
                  <div className="mt-4 relative rounded-xl overflow-hidden border-2 border-green-200 shadow-sm animate-in fade-in zoom-in-95 duration-300">
                    <img
                      src={imagePreview}
                      alt="Dream preview"
                      className="w-full max-h-80 object-contain bg-black/5"
                    />
                    <div className="absolute top-2 right-2">
                      <Button 
                        size="icon" 
                        variant="destructive" 
                        className="h-8 w-8 rounded-full shadow-md"
                        onClick={(e) => {
                          e.stopPropagation();
                          setImageFile(null);
                          setImagePreview('');
                          setUploadedImageUrl(''); // Clear uploaded URL
                          // Reset file input
                          const input = document.getElementById('image-upload') as HTMLInputElement;
                          if (input) input.value = '';
                        }}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          <Button
            onClick={handleSubmit}
            disabled={isProcessing || isUploading || ((activeTab === 'text' || activeTab === 'voice') ? !dreamText.trim() : !description.trim())}
            className="w-full"
            size="lg"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing Dream...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Interpret Dream
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
    </>
  )
}
