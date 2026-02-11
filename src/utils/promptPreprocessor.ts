/**
 * Prompt Preprocessing Utility
 * Enhances and optimizes AI prompts for better image generation quality
 * Ensures consistent, high-quality dream visualizations
 */

/**
 * Dream-specific style enhancements for image generation
 */
const DREAM_STYLE_ENHANCEMENTS = {
  visual: [
    'surreal and dreamlike',
    'ethereal atmosphere',
    'soft cinematic lighting',
    'mystical and enchanting',
    'ethereal glow',
    'dreamscape aesthetic',
    'soft focus blurred background'
  ],
  mood: [
    'ethereal and mysterious',
    'atmospheric and immersive',
    'otherworldly beauty',
    'serene yet surreal',
    'haunting elegance'
  ],
  composition: [
    'dynamic composition',
    'deep depth of field',
    'artistic perspective',
    'flowing transitions',
    'layered elements'
  ]
}

/**
 * Quality enhancement directives for AI image generation
 */
const QUALITY_DIRECTIVES = [
  'high quality professional artwork',
  '8k resolution',
  'cinematic quality',
  'intricate details',
  'polished and refined'
]

/**
 * Preprocess dream interpretation prompt for optimal image generation
 * Enhances the raw prompt with dream-specific styling and quality directives
 */
export function preprocessDreamImagePrompt(rawPrompt: string): string {
  if (!rawPrompt || typeof rawPrompt !== 'string') {
    return getDefaultDreamPrompt()
  }

  const cleanPrompt = rawPrompt.trim()

  // Add surreal/dreamlike quality enhancements
  const visualEnhancement = DREAM_STYLE_ENHANCEMENTS.visual[
    Math.floor(Math.random() * DREAM_STYLE_ENHANCEMENTS.visual.length)
  ]

  const moodEnhancement = DREAM_STYLE_ENHANCEMENTS.mood[
    Math.floor(Math.random() * DREAM_STYLE_ENHANCEMENTS.mood.length)
  ]

  const compositionEnhancement = DREAM_STYLE_ENHANCEMENTS.composition[
    Math.floor(Math.random() * DREAM_STYLE_ENHANCEMENTS.composition.length)
  ]

  // Build enhanced prompt
  const enhancedPrompt = `
${cleanPrompt}

Visual Style: ${visualEnhancement}
Mood: ${moodEnhancement}
Composition: ${compositionEnhancement}

Quality: ${QUALITY_DIRECTIVES.join(', ')}

Artistic Direction: Create a visually stunning dream visualization with artistic depth and emotional resonance.
  `.trim()

  return enhancedPrompt
}

/**
 * Preprocess video frame prompt for optimal video generation
 * Frames require more detailed cinematic descriptions
 */
export function preprocessVideoFramePrompt(rawPrompt: string, frameNumber: number = 1, totalFrames: number = 2): string {
  if (!rawPrompt || typeof rawPrompt !== 'string') {
    return getDefaultDreamPrompt()
  }

  const cleanPrompt = rawPrompt.trim()

  // Different enhancements for opening vs closing frames
  const isOpeningFrame = frameNumber === 1
  const moodDirection = isOpeningFrame
    ? 'introduction, building atmosphere, setting the dream\'s tone'
    : 'resolution, flowing transitions, peaceful conclusion'

  const frameCinematic = isOpeningFrame
    ? 'slow tracking shot, revealing composition'
    : 'smooth camera movement, fade transitions'

  const enhancedPrompt = `
${cleanPrompt}

Frame ${frameNumber}/${totalFrames}: ${moodDirection}

Visual Style: Cinematic dream sequence with ${frameCinematic}
Lighting: Soft, ethereal light with atmospheric depth
Color Palette: Rich, dream-inspired colors with smooth gradients
Mood: ${DREAM_STYLE_ENHANCEMENTS.mood[Math.floor(Math.random() * DREAM_STYLE_ENHANCEMENTS.mood.length)]}

Technical: ${QUALITY_DIRECTIVES.join(', ')}

Artistic Vision: Create a cinematic frame that captures the essence and emotion of this dream moment.
  `.trim()

  return enhancedPrompt
}

/**
 * Preprocess symbolica prompt for symbol image generation
 * Optimized for symbolic, archetypal representations
 */
export function preprocessSymbolicaPrompt(symbol: string, context?: string): string {
  const basePrompt = `Create a visually striking symbolic representation of "${symbol}"`

  const contextSection = context ? ` in the context of: ${context}` : ''

  const enhancedPrompt = `
${basePrompt}${contextSection}

Symbolic Style: Archetypal, iconic, universal symbolic imagery
Visual Approach: Clear, recognizable symbolism with artistic depth
Color: Symbolic and emotionally evocative color palette
Composition: Centered, balanced, impactful design

Quality: High-resolution, professional artwork, intricate symbolic details
Mood: Meaningful, profound, resonant with psychological depth

Artistic Direction: Create a powerful symbolic image that represents this concept with universal appeal and psychological relevance.
  `.trim()

  return enhancedPrompt
}

/**
 * Preprocess watermark context - enhance prompts for watermarked images
 * Ensures watermarks won't obscure important content
 */
export function preprocessWatermarkedImagePrompt(rawPrompt: string): string {
  const basePrompt = preprocessDreamImagePrompt(rawPrompt)

  // Add layout guidance to avoid watermark placement (typically bottom-right)
  const watermarkAwarePrompt = `
${basePrompt}

Layout Note: Ensure the main focal point is in the center to upper portions of the image.
Avoid heavy detail in the bottom-right corner to accommodate watermark placement.
  `.trim()

  return watermarkAwarePrompt
}

/**
 * Batch preprocess multiple prompts
 */
export function preprocessPromptBatch(prompts: string[], type: 'image' | 'video' | 'symbolica' = 'image'): string[] {
  return prompts.map((prompt, index) => {
    switch (type) {
      case 'video':
        return preprocessVideoFramePrompt(prompt, index + 1, prompts.length)
      case 'symbolica':
        return preprocessSymbolicaPrompt(prompt)
      default:
        return preprocessDreamImagePrompt(prompt)
    }
  })
}

/**
 * Get default dream prompt if input is invalid
 */
function getDefaultDreamPrompt(): string {
  return `
A beautiful, ethereal dreamscape with surreal imagery.
Create a visually stunning visualization with artistic depth, soft ethereal lighting, and dreamlike atmosphere.
Quality: High-resolution, cinematic, professional artwork.
  `.trim()
}

/**
 * Optimize prompt length while maintaining quality
 * Trims excessive details while preserving core meaning
 */
export function optimizePromptLength(prompt: string, maxLength: number = 1000): string {
  if (prompt.length <= maxLength) {
    return prompt
  }

  // Keep first maxLength characters and add ellipsis
  const truncated = prompt.substring(0, maxLength).trim()

  // Find last sentence boundary
  const lastPeriodIndex = truncated.lastIndexOf('.')
  const lastCommaIndex = truncated.lastIndexOf(',')

  if (lastPeriodIndex > maxLength * 0.7) {
    return truncated.substring(0, lastPeriodIndex + 1)
  } else if (lastCommaIndex > maxLength * 0.7) {
    return truncated.substring(0, lastCommaIndex) + '.'
  }

  return truncated + '...'
}

/**
 * Validate prompt meets minimum quality standards
 */
export function validatePromptQuality(prompt: string): { isValid: boolean; issues: string[] } {
  const issues: string[] = []

  // Check length
  if (!prompt || prompt.length < 20) {
    issues.push('Prompt is too short (minimum 20 characters)')
  }

  if (prompt.length > 5000) {
    issues.push('Prompt is too long (maximum 5000 characters)')
  }

  // Check for problematic content
  const forbiddenPatterns = [
    /hate|slur|explicit/i,
    /\d{3,}/g, // Long number sequences
    /([a-z])\1{4,}/i, // Repeated characters
  ]

  forbiddenPatterns.forEach((pattern) => {
    if (pattern.test(prompt)) {
      issues.push('Prompt contains problematic content patterns')
    }
  })

  return {
    isValid: issues.length === 0,
    issues,
  }
}
