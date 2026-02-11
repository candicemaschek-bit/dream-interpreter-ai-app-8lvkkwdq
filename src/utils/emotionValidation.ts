/**
 * Emotion Validation Utility
 * Validates dreams contain emotional content for all subscription tiers
 */

// Comprehensive emotion keywords categorized by type
const EMOTION_KEYWORDS = {
  positive: [
    'happy', 'joy', 'excited', 'love', 'peaceful', 'calm', 'content', 'grateful',
    'proud', 'confident', 'hopeful', 'amazed', 'delighted', 'elated', 'euphoric',
    'cheerful', 'optimistic', 'satisfied', 'relieved', 'comfortable', 'serene',
    'blissful', 'ecstatic', 'enthusiastic', 'inspired', 'motivated'
  ],
  negative: [
    'sad', 'angry', 'fear', 'afraid', 'scared', 'anxious', 'worried', 'stressed',
    'frustrated', 'upset', 'disappointed', 'lonely', 'depressed', 'nervous',
    'terrified', 'horrified', 'panicked', 'distressed', 'miserable', 'desperate',
    'helpless', 'hopeless', 'ashamed', 'guilty', 'embarrassed', 'jealous',
    'envious', 'resentful', 'bitter', 'disgusted', 'irritated', 'annoyed'
  ],
  neutral: [
    'confused', 'surprised', 'curious', 'uncertain', 'indifferent', 'numb',
    'detached', 'overwhelmed', 'conflicted', 'ambivalent', 'nostalgic',
    'contemplative', 'pensive', 'melancholic', 'wistful'
  ],
  complex: [
    'vulnerable', 'intense', 'powerful', 'weak', 'strong', 'trapped', 'free',
    'lost', 'found', 'empty', 'full', 'heavy', 'light', 'dark', 'bright',
    'safe', 'unsafe', 'comfortable', 'uncomfortable', 'familiar', 'strange'
  ]
}

// Flatten all emotion keywords into one searchable array
const ALL_EMOTION_KEYWORDS = [
  ...EMOTION_KEYWORDS.positive,
  ...EMOTION_KEYWORDS.negative,
  ...EMOTION_KEYWORDS.neutral,
  ...EMOTION_KEYWORDS.complex
]

// Emotional context phrases that indicate emotional content
const EMOTIONAL_CONTEXT_PHRASES = [
  'i felt', 'i was feeling', 'it felt', 'feeling of', 'sense of',
  'made me feel', 'i felt like', 'felt so', 'felt very', 'felt extremely',
  'i experienced', 'the feeling', 'emotions of', 'emotional', 'emotionally'
]

/**
 * Validate if text contains emotional content
 * Returns true if emotions are detected, false otherwise
 */
export function validateEmotionalContent(text: string): {
  isValid: boolean
  detectedEmotions: string[]
  emotionCount: number
  suggestionMessage?: string
} {
  if (!text || text.trim().length === 0) {
    return {
      isValid: false,
      detectedEmotions: [],
      emotionCount: 0,
      suggestionMessage: 'Please provide dream details'
    }
  }

  const lowerText = text.toLowerCase()
  const detectedEmotions: string[] = []

  // Check for explicit emotion keywords
  for (const emotion of ALL_EMOTION_KEYWORDS) {
    // Use word boundaries to avoid partial matches (e.g., "fear" in "fearless")
    const regex = new RegExp(`\\b${emotion}\\b`, 'i')
    if (regex.test(lowerText)) {
      detectedEmotions.push(emotion)
    }
  }

  // Check for emotional context phrases
  const hasEmotionalContext = EMOTIONAL_CONTEXT_PHRASES.some(phrase => 
    lowerText.includes(phrase)
  )

  // Validation logic:
  // - At least 1 emotion keyword OR emotional context phrase
  // - Text should be reasonably long (at least 20 characters)
  const hasMinLength = text.trim().length >= 20
  const hasEmotionalContent = detectedEmotions.length > 0 || hasEmotionalContext

  if (!hasMinLength) {
    return {
      isValid: false,
      detectedEmotions,
      emotionCount: detectedEmotions.length,
      suggestionMessage: 'Please provide more details about your dream (at least 20 characters)'
    }
  }

  if (!hasEmotionalContent) {
    return {
      isValid: false,
      detectedEmotions,
      emotionCount: detectedEmotions.length,
      suggestionMessage: 'Please describe how you felt during the dream. Include emotions like joy, fear, confusion, excitement, sadness, etc.'
    }
  }

  return {
    isValid: true,
    detectedEmotions,
    emotionCount: detectedEmotions.length
  }
}

/**
 * Get emotion categories from detected emotions
 */
export function categorizeEmotions(emotions: string[]): {
  positive: string[]
  negative: string[]
  neutral: string[]
  complex: string[]
} {
  const categorized = {
    positive: [] as string[],
    negative: [] as string[],
    neutral: [] as string[],
    complex: [] as string[]
  }

  emotions.forEach(emotion => {
    if (EMOTION_KEYWORDS.positive.includes(emotion)) {
      categorized.positive.push(emotion)
    } else if (EMOTION_KEYWORDS.negative.includes(emotion)) {
      categorized.negative.push(emotion)
    } else if (EMOTION_KEYWORDS.neutral.includes(emotion)) {
      categorized.neutral.push(emotion)
    } else if (EMOTION_KEYWORDS.complex.includes(emotion)) {
      categorized.complex.push(emotion)
    }
  })

  return categorized
}

/**
 * Generate helpful suggestions for adding emotional content
 */
export function getEmotionSuggestions(text: string): string[] {
  const suggestions = [
    'How did you feel during this dream?',
    'What emotions did you experience?',
    'Were you scared, happy, confused, or something else?',
    'Describe the mood or atmosphere of the dream',
    'Did any particular moment make you feel a certain way?'
  ]

  // Provide context-specific suggestions based on text content
  if (text.toLowerCase().includes('chase') || text.toLowerCase().includes('run')) {
    suggestions.unshift('Were you afraid or anxious while being chased?')
  }
  if (text.toLowerCase().includes('fall') || text.toLowerCase().includes('falling')) {
    suggestions.unshift('Did you feel scared or helpless while falling?')
  }
  if (text.toLowerCase().includes('fly') || text.toLowerCase().includes('flying')) {
    suggestions.unshift('Did you feel free, joyful, or powerful while flying?')
  }

  return suggestions.slice(0, 3) // Return top 3 most relevant suggestions
}
