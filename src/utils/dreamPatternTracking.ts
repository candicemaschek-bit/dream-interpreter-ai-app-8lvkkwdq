/**
 * Dream Pattern Tracking System
 * Intelligently tracks nightmare patterns and recurring dream cycles
 * Advanced features for Architect and VIP tiers
 * 
 * ⚠️ IMPORTANT: Uses centralized tier capabilities config for advanced feature checks
 */

import { blink } from '../blink/client'
import { supabaseService } from '../lib/supabaseService'
import type { SubscriptionTier } from '../config/tierCapabilities'
import { hasAdvancedPatternDetection, hasPsychologicalInsights } from '../config/tierCapabilities'

export interface DreamPattern {
  type: 'nightmare' | 'recurring' | 'normal'
  themes: string[]
  emotions: string[]
  symbols: string[]
  confidence: number // 0-1 confidence score
}

export interface NightmarePattern {
  frequency: number // dreams per month
  commonThemes: Array<{ theme: string; count: number }>
  emotionalIntensity: 'low' | 'moderate' | 'high' | 'severe'
  triggerPatterns?: string[] // Advanced feature for premium tiers
  copingRecommendations: string[]
}

export interface RecurringCycle {
  cycleId: string
  firstOccurrence: string
  lastOccurrence: string
  occurrenceCount: number
  averageInterval: number // days between occurrences
  commonElements: string[]
  evolutionPattern?: string // Advanced feature for premium tiers
  psychologicalInsight?: string // Advanced feature for premium tiers
}

/**
 * Analyze a dream description and detect patterns
 */
export async function analyzeDreamPattern(
  dreamDescription: string,
  dreamId: string,
  userId: string,
  tier: SubscriptionTier
): Promise<DreamPattern> {
  try {
    // Use AI to analyze the dream for patterns
    const prompt = `Analyze this dream description and identify:
1. Type: Is this a nightmare (scary/distressing), recurring theme, or normal dream?
2. Main themes (max 5)
3. Dominant emotions (max 5)
4. Key symbols (max 5)

Dream: ${dreamDescription}

Respond in JSON format: { "type": "nightmare|recurring|normal", "themes": [], "emotions": [], "symbols": [], "confidence": 0.0-1.0 }`

    const response = await blink.ai.generateText({
      prompt,
      model: 'gpt-4.1-mini',
      maxTokens: 500
    })
    
    // Enhanced debugging for AI response structure
    console.log('🔍 Dream Pattern Analysis - AI Response Debug:', {
      responseExists: !!response,
      responseType: typeof response,
      hasTextProperty: response ? 'text' in response : false,
      hasStepsProperty: response ? 'steps' in response : false,
      textValue: response?.text,
      stepsValue: (response as any)?.steps,
      fullResponseKeys: response ? Object.keys(response) : []
    })
    
    // Extract text from response with proper validation
    // The AI response can have two formats:
    // 1. { text: string, finishReason?: string, usage?: object }
    // 2. { steps: Array<{text: string}>, finishReason?: string, usage?: object }
    let responseText = ''
    
    if (response?.text) {
      // Format 1: Direct text property
      responseText = String(response.text).trim()
      console.log('📊 Extracted text from direct text property:', {
        textLength: responseText.length
      })
    } else if ((response as any)?.steps && Array.isArray((response as any).steps)) {
      // Format 2: Steps array (reasoning models)
      const steps = (response as any).steps
      
      // Check if steps array is not empty
      if (steps.length === 0) {
        console.warn('⚠️ Steps array is empty - no reasoning steps generated')
      } else {
        // Get the last step's text which contains the final answer
        const lastStep = steps[steps.length - 1]
        if (lastStep && lastStep.text && String(lastStep.text).trim()) {
          responseText = String(lastStep.text).trim()
          console.log('📊 Extracted text from steps array:', {
            stepsCount: steps.length,
            textLength: responseText.length,
            lastStepPreview: responseText.substring(0, 100)
          })
        } else {
          console.warn('⚠️ Last step has no text content', {
            stepsCount: steps.length,
            lastStep: lastStep
          })
        }
      }
    } else {
      console.warn('⚠️ Response format unrecognized:', {
        hasText: !!response?.text,
        hasSteps: !!(response as any)?.steps,
        responseKeys: response ? Object.keys(response) : []
      })
    }
    
    // If response text is empty or invalid, return default pattern
    // This is not an error - AI can return empty results
    if (!responseText) {
      console.log('ℹ️ Pattern analysis using default values (empty AI response)', {
        reason: !response ? 'No response object' : 'Empty text/steps',
        responseStructure: response ? Object.keys(response).join(', ') : 'null',
        promptPreview: prompt.substring(0, 100) + '...'
      })
      return {
        type: 'normal',
        themes: [],
        emotions: [],
        symbols: [],
        confidence: 0
      }
    }
    
    console.log('✅ Pattern analysis proceeding with response text:', {
      textLength: responseText.length,
      textPreview: responseText.substring(0, 150) + '...'
    })

    let pattern
    try {
      // Clean the response text (remove markdown code blocks if present)
      let cleanText = responseText.trim()
      cleanText = cleanText.replace(/```json\n?/g, '').replace(/```\n?/g, '')
      pattern = JSON.parse(cleanText)
    } catch (parseError) {
      console.warn('⚠️ Failed to parse AI response as JSON, using default pattern', {
        error: parseError instanceof Error ? parseError.message : String(parseError),
        responsePreview: responseText.substring(0, 100)
      })
      return {
        type: 'normal',
        themes: [],
        emotions: [],
        symbols: [],
        confidence: 0
      }
    }

    // Validate parsed pattern structure
    if (!pattern || typeof pattern !== 'object') {
      console.warn('Invalid parsed pattern structure:', pattern)
      return {
        type: 'normal',
        themes: [],
        emotions: [],
        symbols: [],
        confidence: 0
      }
    }

    // Store detected themes in database for pattern tracking
    if (pattern.themes && pattern.themes.length > 0) {
      for (const theme of pattern.themes) {
        await trackDreamTheme(userId, theme)
      }
    }

    // If nightmare detected and user flagged nightmares, track it
    if (pattern.type === 'nightmare') {
      await trackNightmareOccurrence(userId, dreamId, pattern, tier)
    }

    // If recurring elements detected, track the cycle
    if (pattern.type === 'recurring' || pattern.confidence > 0.7) {
      await trackRecurringCycle(userId, dreamId, pattern, tier)
    }

    return pattern
  } catch (error) {
    console.error('Error analyzing dream pattern:', error)
    // Return default pattern if analysis fails
    return {
      type: 'normal',
      themes: [],
      emotions: [],
      symbols: [],
      confidence: 0
    }
  }
}

/**
 * Track a dream theme in the database
 * Uses upsert pattern for reliable operation with catch-and-retry fallback
 */
async function trackDreamTheme(userId: string, theme: string): Promise<void> {
  const themeId = `theme_${userId}_${theme.toLowerCase().replace(/\s+/g, '_').substring(0, 50)}`
  const now = new Date().toISOString()
  
  try {
    const client = supabaseService.supabase
    if (!client) return

    // First, try to get existing theme to calculate new count from Supabase
    const { data: existing, error: fetchError } = await client
      .from('dream_themes')
      .select('*')
      .eq('user_id', userId)
      .eq('theme', theme)
      .limit(1)

    if (existing && existing.length > 0) {
      // Theme exists - update count
      const existingTheme = existing[0]
      const currentCount = parseInt(String(existingTheme.count) || '0', 10)
      await client
        .from('dream_themes')
        .update({
          count: currentCount + 1,
          last_occurred: now
        })
        .eq('id', existingTheme.id)
      console.log(`✅ Dream theme "${theme}" updated - count: ${currentCount + 1}`)
    } else {
      // Theme doesn't exist - use upsert to safely create
      await client
        .from('dream_themes')
        .upsert({
          id: themeId,
          user_id: userId,
          theme,
          count: 1,
          last_occurred: now
        })
      console.log(`✅ Dream theme "${theme}" created for user`)
    }
  } catch (error: unknown) {
    // Catch-and-retry fallback for edge cases
    const errorMessage = error instanceof Error ? error.message : String(error)
    
    // Check if it's a duplicate key error (race condition - theme was created between list and create)
    if (errorMessage.toLowerCase().includes('unique') || 
        errorMessage.toLowerCase().includes('duplicate') ||
        errorMessage.toLowerCase().includes('constraint')) {
      console.log(`ℹ️ Dream theme "${theme}" race condition detected, retrying with update...`)
      
      try {
        const client = supabaseService.supabase
        if (!client) return

        // Retry: theme was just created, try to update instead
        const { data: retryExisting, error: retryFetchError } = await client
          .from('dream_themes')
          .select('*')
          .eq('user_id', userId)
          .eq('theme', theme)
          .limit(1)
        
        if (retryExisting && retryExisting.length > 0) {
          const existingTheme = retryExisting[0]
          const currentCount = parseInt(String(existingTheme.count) || '0', 10)
          await client
            .from('dream_themes')
            .update({
              count: currentCount + 1,
              last_occurred: now
            })
            .eq('id', existingTheme.id)
          console.log(`✅ Dream theme "${theme}" updated after retry - count: ${currentCount + 1}`)
        }
      } catch (retryError) {
        console.error('Error in dream theme retry:', retryError)
      }
    } else {
      console.error('Error tracking dream theme:', error)
    }
  }
}

/**
 * Track nightmare occurrence and update patterns
 */
async function trackNightmareOccurrence(
  userId: string,
  dreamId: string,
  pattern: DreamPattern,
  tier: SubscriptionTier
): Promise<void> {
  try {
    // Get user profile from Supabase
    const profile = await supabaseService.getProfile(userId)

    if (!profile) return
    const nightmareProne = profile.nightmare_prone

    if (!nightmareProne) return

    // Get existing nightmare details
    let nightmareData
    try {
      nightmareData = profile.nightmare_details 
        ? JSON.parse(profile.nightmare_details as string)
        : { occurrences: [], themes: {}, emotions: {} }
    } catch (parseError) {
      console.warn('Invalid nightmare_details JSON, using defaults:', parseError)
      nightmareData = { occurrences: [], themes: {}, emotions: {} }
    }

    // Add this occurrence
    nightmareData.occurrences = nightmareData.occurrences || []
    nightmareData.occurrences.push({
      dreamId,
      date: new Date().toISOString(),
      themes: pattern.themes,
      emotions: pattern.emotions
    })

    // Update theme counts
    nightmareData.themes = nightmareData.themes || {}
    pattern.themes.forEach((theme: string) => {
      nightmareData.themes[theme] = (nightmareData.themes[theme] || 0) + 1
    })

    // Update emotion counts
    nightmareData.emotions = nightmareData.emotions || {}
    pattern.emotions.forEach((emotion: string) => {
      nightmareData.emotions[emotion] = (nightmareData.emotions[emotion] || 0) + 1
    })

    // Advanced cycle detection for premium/vip tiers
    if (tier === 'premium' || tier === 'vip') {
      nightmareData.cycleAnalysis = await detectNightmareCycles(
        nightmareData.occurrences,
        tier
      )
    }

    // Update profile with new data using Supabase
    await supabaseService.upsertProfile({
      ...profile,
      nightmare_details: JSON.stringify(nightmareData),
      updated_at: new Date().toISOString()
    } as any)
  } catch (error) {
    console.error('Error tracking nightmare occurrence:', error)
  }
}

/**
 * Track recurring dream cycle
 */
async function trackRecurringCycle(
  userId: string,
  dreamId: string,
  pattern: DreamPattern,
  tier: SubscriptionTier
): Promise<void> {
  try {
    // Get user profile from Supabase
    const profile = await supabaseService.getProfile(userId)

    if (!profile) return
    const hasRecurringDreams = profile.recurring_dreams

    if (!hasRecurringDreams) return

    // Get existing recurring dream details
    let recurringData
    try {
      recurringData = profile.recurring_dream_details
        ? JSON.parse(profile.recurring_dream_details as string)
        : { cycles: [] }
    } catch (parseError) {
      console.warn('Invalid recurring_dream_details JSON, using defaults:', parseError)
      recurringData = { cycles: [] }
    }

    // Find matching cycle based on theme similarity
    const matchingCycle = findMatchingCycle(recurringData.cycles, pattern)

    if (matchingCycle) {
      // Update existing cycle
      matchingCycle.occurrences.push({
        dreamId,
        date: new Date().toISOString(),
        themes: pattern.themes,
        symbols: pattern.symbols
      })

      // Advanced evolution tracking for premium/vip tiers
      if (tier === 'premium' || tier === 'vip') {
        matchingCycle.evolution = await analyzeRecurringEvolution(
          matchingCycle.occurrences,
          tier
        )
      }
    } else {
      // Create new cycle
      const newCycle: any = {
        cycleId: `cycle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        firstOccurrence: new Date().toISOString(),
        commonElements: pattern.themes.concat(pattern.symbols),
        occurrences: [{
          dreamId,
          date: new Date().toISOString(),
          themes: pattern.themes,
          symbols: pattern.symbols
        }]
      }

      recurringData.cycles = recurringData.cycles || []
      recurringData.cycles.push(newCycle)
    }

    // Update profile with new data using Supabase
    await supabaseService.upsertProfile({
      ...profile,
      recurring_dream_details: JSON.stringify(recurringData),
      updated_at: new Date().toISOString()
    } as any)
  } catch (error) {
    console.error('Error tracking recurring cycle:', error)
  }
}

/**
 * Find a matching recurring cycle based on theme similarity
 */
function findMatchingCycle(cycles: any[], pattern: DreamPattern): any | null {
  if (!cycles || cycles.length === 0) return null

  const patternElements = [...pattern.themes, ...pattern.symbols]
  
  for (const cycle of cycles) {
    const commonElements = cycle.commonElements || []
    
    // Calculate similarity (how many elements match)
    const matches = patternElements.filter(element => 
      commonElements.includes(element)
    ).length

    // If 50% or more elements match, consider it the same cycle
    const similarity = matches / Math.max(patternElements.length, commonElements.length)
    if (similarity >= 0.5) {
      return cycle
    }
  }

  return null
}

/**
 * Detect nightmare cycles (Advanced feature for Premium/VIP)
 */
async function detectNightmareCycles(
  occurrences: any[],
  tier: SubscriptionTier
): Promise<any> {
  if (occurrences.length < 3) {
    return { cyclesDetected: false, message: 'Not enough data for cycle detection' }
  }

  try {
    // Calculate intervals between nightmares
    const intervals = []
    for (let i = 1; i < occurrences.length; i++) {
      const prev = new Date(occurrences[i - 1].date)
      const curr = new Date(occurrences[i].date)
      const daysDiff = Math.floor((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24))
      intervals.push(daysDiff)
    }

    // Calculate average interval
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length

    // Detect if there's a pattern (intervals are relatively consistent)
    const variance = intervals.reduce((sum, interval) => {
      return sum + Math.pow(interval - avgInterval, 2)
    }, 0) / intervals.length
    const stdDev = Math.sqrt(variance)

    const isConsistent = stdDev < avgInterval * 0.5 // Pattern is consistent if std dev < 50% of average

    // Use AI for deeper insights (VIP only)
    let aiInsight = null
    if (tier === 'vip' && occurrences.length >= 5) {
      const prompt = `Analyze this nightmare pattern and provide POSSIBLE insights - remember that dream patterns are deeply personal and your observations are suggestions, not diagnoses.

- Total occurrences: ${occurrences.length}
- Average interval: ${avgInterval.toFixed(1)} days  
- Pattern consistency: ${isConsistent ? 'High' : 'Low'}
- Recent themes: ${occurrences.slice(-5).map((o: any) => o.themes.join(', ')).join('; ')}

Provide POSSIBLE psychological insights on POTENTIAL triggers and coping strategies (2-3 sentences). Use tentative language like "This could suggest...", "You might consider...", "Some people find...". Do NOT claim definitive meaning or diagnose conditions.`

      const response = await blink.ai.generateText({
        prompt,
        model: 'gpt-4.1',
        maxTokens: 200
      })

      // Handle both response formats (text or steps)
      if (response?.text) {
        aiInsight = String(response.text).trim() || null
      } else if ((response as any)?.steps && Array.isArray((response as any).steps)) {
        const steps = (response as any).steps
        if (steps.length > 0) {
          const lastStep = steps[steps.length - 1]
          aiInsight = (lastStep?.text && String(lastStep.text).trim()) || null
        }
      }
      
      if (!aiInsight) {
        console.log('ℹ️ Nightmare cycle AI insight unavailable - continuing with basic analysis')
      }
    }

    return {
      cyclesDetected: isConsistent,
      averageInterval: avgInterval,
      consistency: isConsistent ? 'high' : 'moderate',
      totalOccurrences: occurrences.length,
      aiInsight: aiInsight,
      recommendation: isConsistent 
        ? `Nightmares appear to follow a ${avgInterval.toFixed(0)}-day cycle. Consider tracking potential triggers during this timeframe.`
        : 'No clear cycle detected yet. Continue tracking to identify patterns.'
    }
  } catch (error) {
    console.error('Error detecting nightmare cycles:', error)
    return { cyclesDetected: false, error: 'Analysis failed' }
  }
}

/**
 * Analyze recurring dream evolution (Advanced feature for Premium/VIP)
 */
async function analyzeRecurringEvolution(
  occurrences: any[],
  tier: SubscriptionTier
): Promise<any> {
  if (occurrences.length < 3) {
    return { evolutionDetected: false, message: 'Not enough occurrences to analyze evolution' }
  }

  try {
    // Track how themes and symbols change over time
    const firstThemes = occurrences[0].themes || []
    const recentThemes = occurrences[occurrences.length - 1].themes || []

    const newThemes = recentThemes.filter((t: string) => !firstThemes.includes(t))
    const droppedThemes = firstThemes.filter((t: string) => !recentThemes.includes(t))

    // Use AI for deeper analysis (VIP only)
    let aiInsight = null
    if (tier === 'vip' && occurrences.length >= 4) {
      const prompt = `Analyze this recurring dream evolution and provide POSSIBLE interpretations - remember that dream meaning is deeply personal and subjective.

- First occurrence: ${occurrences[0].themes?.join(', ') || 'unknown'}
- Recent occurrence: ${recentThemes.join(', ') || 'unknown'}
- New elements: ${newThemes.join(', ') || 'none'}
- Dropped elements: ${droppedThemes.join(', ') || 'none'}
- Total recurrences: ${occurrences.length}

What MIGHT this evolution suggest about the dreamer's psychological state? (2-3 sentences). Use tentative language like "This could suggest...", "One possibility is...", "The dreamer might consider...". Do NOT claim definitive meaning - invite self-reflection instead.`

      const response = await blink.ai.generateText({
        prompt,
        model: 'gpt-4.1',
        maxTokens: 200
      })

      // Handle both response formats (text or steps)
      if (response?.text) {
        aiInsight = String(response.text).trim() || null
      } else if ((response as any)?.steps && Array.isArray((response as any).steps)) {
        const steps = (response as any).steps
        if (steps.length > 0) {
          const lastStep = steps[steps.length - 1]
          aiInsight = (lastStep?.text && String(lastStep.text).trim()) || null
        }
      }
      
      if (!aiInsight) {
        console.log('ℹ️ Recurring evolution AI insight unavailable - continuing with basic analysis')
      }
    }

    return {
      evolutionDetected: newThemes.length > 0 || droppedThemes.length > 0,
      newElements: newThemes,
      droppedElements: droppedThemes,
      stability: newThemes.length === 0 && droppedThemes.length === 0 ? 'stable' : 'evolving',
      aiInsight: aiInsight
    }
  } catch (error) {
    console.error('Error analyzing recurring evolution:', error)
    return { evolutionDetected: false, error: 'Analysis failed' }
  }
}

/**
 * Get nightmare pattern summary for user
 */
export async function getNightmarePatternSummary(
  userId: string,
  tier: SubscriptionTier
): Promise<NightmarePattern | null> {
  try {
    const profiles = await supabaseService.getProfile(userId)

    if (!profiles || !profiles.nightmare_details) return null

    let nightmareData
    try {
      nightmareData = JSON.parse(profiles.nightmare_details as string)
    } catch (parseError) {
      console.warn('Invalid nightmare_details JSON in summary:', parseError)
      return null
    }
    const occurrences = nightmareData.occurrences || []

    if (occurrences.length === 0) return null

    // Calculate frequency (nightmares per month)
    const firstDate = new Date(occurrences[0].date)
    const lastDate = new Date(occurrences[occurrences.length - 1].date)
    const monthsDiff = Math.max(1, (lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24 * 30))
    const frequency = occurrences.length / monthsDiff

    // Get top themes
    const themes = nightmareData.themes || {}
    const commonThemes = Object.entries(themes)
      .map(([theme, count]) => ({ theme, count: count as number }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    // Determine emotional intensity based on frequency
    let emotionalIntensity: 'low' | 'moderate' | 'high' | 'severe'
    if (frequency < 1) emotionalIntensity = 'low'
    else if (frequency < 2) emotionalIntensity = 'moderate'
    else if (frequency < 4) emotionalIntensity = 'high'
    else emotionalIntensity = 'severe'

    // Generate coping recommendations
    const copingRecommendations = [
      'Practice relaxation techniques before bed',
      'Maintain a consistent sleep schedule',
      'Keep a dream journal to identify triggers',
      'Consider speaking with a therapist if nightmares are distressing'
    ]

    const pattern: NightmarePattern = {
      frequency,
      commonThemes,
      emotionalIntensity,
      copingRecommendations
    }

    // Add advanced features for premium/vip
    if ((tier === 'premium' || tier === 'vip') && nightmareData.cycleAnalysis) {
      pattern.triggerPatterns = nightmareData.cycleAnalysis.recommendation
        ? [nightmareData.cycleAnalysis.recommendation]
        : undefined
    }

    return pattern
  } catch (error) {
    console.error('Error getting nightmare pattern summary:', error)
    return null
  }
}

/**
 * Get recurring dream cycles for user
 */
export async function getRecurringCycles(
  userId: string,
  tier: SubscriptionTier
): Promise<RecurringCycle[]> {
  try {
    const profiles = await supabaseService.getProfile(userId)

    if (!profiles || !profiles.recurring_dream_details) return []

    let recurringData
    try {
      recurringData = JSON.parse(profiles.recurring_dream_details as string)
    } catch (parseError) {
      console.warn('Invalid recurring_dream_details JSON in cycles:', parseError)
      return []
    }
    const cycles = recurringData.cycles || []

    return cycles.map((cycle: any) => {
      const occurrences = cycle.occurrences || []
      const firstDate = new Date(occurrences[0]?.date || new Date())
      const lastDate = new Date(occurrences[occurrences.length - 1]?.date || new Date())
      
      // Calculate average interval
      let avgInterval = 0
      if (occurrences.length > 1) {
        const intervals = []
        for (let i = 1; i < occurrences.length; i++) {
          const prev = new Date(occurrences[i - 1].date)
          const curr = new Date(occurrences[i].date)
          intervals.push(Math.floor((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24)))
        }
        avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length
      }

      const recurringCycle: RecurringCycle = {
        cycleId: cycle.cycleId,
        firstOccurrence: firstDate.toISOString(),
        lastOccurrence: lastDate.toISOString(),
        occurrenceCount: occurrences.length,
        averageInterval: avgInterval,
        commonElements: cycle.commonElements || []
      }

      // Add advanced features for premium/vip
      if ((tier === 'premium' || tier === 'vip') && cycle.evolution) {
        recurringCycle.evolutionPattern = cycle.evolution.stability
        recurringCycle.psychologicalInsight = cycle.evolution.aiInsight
      }

      return recurringCycle
    })
  } catch (error) {
    console.error('Error getting recurring cycles:', error)
    return []
  }
}
