/**
 * AI Prompt Templates Configuration
 * Centralized location for all AI prompt templates used throughout the app
 * Optimized for tone, clarity, and conciseness
 */

export const AI_PROMPTS = {
  /**
   * Dream title generation - Creates a compelling, poetic title from dream description
   */
  generateDreamTitle: (dreamDescription: string): string => `Generate a compelling dream title (max 5 words). Be poetic yet clear.

Dream: ${dreamDescription}

Return ONLY the title, no quotes or extra formatting.`,

  /**
   * Dream tag extraction - Identifies symbolic elements and tags from dream
   */
  extractDreamTags: (title: string, dreamDescription: string): string => `Extract 3-8 symbolic tags from this dream as a JSON array (lowercase, single words).

Dream: ${title}
${dreamDescription}

Examples: ["water", "flight", "falling", "transformation", "lost", "fire"]

Return ONLY the JSON array.`,

  /**
   * Dream interpretation - Provides detailed psychological and symbolic interpretation
   */
  generateDreamInterpretation: (
    title: string,
    dreamDescription: string,
    tags: string[],
    personalContext?: string
  ): string => `You are a compassionate dream interpreter. Analyze this dream and provide meaningful insights.

Dream: ${title}
Description: ${dreamDescription}
Symbols: ${tags.join(', ')}${personalContext || ''}

Structure your interpretation:
1. Core Meaning
2. Symbol Interpretations
3. Emotional Insights
4. Life Connections
5. Reflection Prompts

Be empathetic and considerate of the dreamer's context.`,

  /**
   * Dream image generation - Creates visual representation of dream
   */
  generateDreamImage: (title: string, dreamDescription: string, imagePromptSuffix: string = ''): string => `Create a vivid, dreamlike visualization of this dream.

Title: ${title}
Description: ${dreamDescription}

Style: Surreal, ethereal, mystical. Soft lighting, ethereal atmosphere. Capture the dream's essence with cinematic quality.${imagePromptSuffix}`,

  /**
   * Emotion detection - Analyzes emotional content in dream description
   */
  detectEmotionalContent: (dreamDescription: string): string => `Analyze the emotional content in this dream.

Dream: ${dreamDescription}

Respond with ONLY this JSON format:
{
  "hasEmotionalContent": true/false,
  "detectedEmotions": ["emotion1", "emotion2"],
  "confidence": 0.0-1.0,
  "suggestion": "Brief note if no emotions"
}

Emotion examples: fear, joy, anxiety, sadness, excitement, confusion, anger, peace.`,

  /**
   * Video frame generation - Creates cinematic frames for dream video (Cost-Optimized: 2 frames)
   * OPTION 2: Reduced to 2 frames for 78% cost reduction while maintaining dream-like effect
   */
  generateVideoFrames: (prompt: string, mood?: string): string[] => {
    // Apply mood-based styling to frames
    const moodStyle = mood ? getMoodStyling(mood) : 'ethereal, mystical atmosphere';
    
    return [
      `Opening frame: ${prompt}. ${moodStyle} with soft focus and dreamlike lighting.`,
      `Closing frame: ${prompt}. ${moodStyle} conclusion with flowing transitions and peaceful resolution.`
    ];
  },

  /**
   * Detect mood from dream description for frame styling
   */
  detectDreamMood: (dreamDescription: string): string => `Analyze the emotional mood of this dream in ONE word.

Dream: ${dreamDescription}

Respond with ONLY ONE of these moods: peaceful, anxious, joyful, mysterious, dark, bright, calm, intense, hopeful, fearful

Return ONLY the single mood word, nothing else.`
}

/**
 * Helper function to generate dream image prompt with personalization
 */
export function buildPersonalizedImagePromptSuffix(userProfile?: {
  gender?: string
  age?: number
}): string {
  let suffix = ''

  if (!userProfile) {
    return suffix
  }

  // Add gender-based personalization
  if (userProfile.gender === 'male') {
    suffix += ' Feature male protagonist.'
  } else if (userProfile.gender === 'female') {
    suffix += ' Feature female protagonist.'
  } else if (userProfile.gender === 'both') {
    suffix += ' Include multiple gender perspectives.'
  }

  // Add age-based personalization
  const age = userProfile.age || 30
  if (age < 18) {
    suffix += ' Youthful, age-appropriate imagery.'
  } else if (age >= 18 && age < 40) {
    suffix += ' Young adult perspective.'
  } else if (age >= 40 && age < 65) {
    suffix += ' Mature perspective.'
  } else {
    suffix += ' Wise, reflective perspective.'
  }

  return suffix
}

/**
 * Helper function to build personalized interpretation context
 */
export function buildPersonalInterpretationContext(userProfile?: {
  name?: string
  age?: number
  gender?: string
  nightmareProne?: number
  recurringDreams?: number
}): string {
  if (!userProfile) {
    return ''
  }

  let context = `

Dreamer Context:
- Name: ${userProfile.name || 'Anonymous'}
- Age: ${userProfile.age || '?'}
- Gender: ${userProfile.gender || 'Unspecified'}
- Nightmare-prone: ${Number(userProfile.nightmareProne || 0) > 0 ? 'Yes' : 'No'}
- Recurring dreams: ${Number(userProfile.recurringDreams || 0) > 0 ? 'Yes' : 'No'}

Consider their age and life stage in your interpretation.`

  // Add notes for nightmare-prone dreamers
  if (Number(userProfile.nightmareProne || 0) > 0) {
    context += '\n\nNote: This dreamer experiences nightmares. Provide supportive, calming guidance.'
  }

  // Add notes for recurring dream patterns
  if (Number(userProfile.recurringDreams || 0) > 0) {
    context += '\n\nNote: Highlight any recurring patterns if present.'
  }

  return context
}

/**
 * Helper function to get mood-based styling for video frames
 */
function getMoodStyling(mood: string): string {
  const moodStyles: Record<string, string> = {
    peaceful: 'Serene, calming atmosphere with gentle lighting',
    anxious: 'Tense, unsettling atmosphere with dramatic shadows',
    joyful: 'Vibrant, uplifting atmosphere with warm golden light',
    mysterious: 'Enigmatic, intriguing atmosphere with misty ambiance',
    dark: 'Somber, brooding atmosphere with deep shadows',
    bright: 'Luminous, radiant atmosphere with glowing highlights',
    calm: 'Tranquil, soothing atmosphere with soft pastels',
    intense: 'Powerful, dramatic atmosphere with bold contrasts',
    hopeful: 'Optimistic, inspiring atmosphere with dawn-like glow',
    fearful: 'Ominous, threatening atmosphere with stark lighting'
  };

  return moodStyles[mood.toLowerCase()] || 'Ethereal, mystical atmosphere';
}
