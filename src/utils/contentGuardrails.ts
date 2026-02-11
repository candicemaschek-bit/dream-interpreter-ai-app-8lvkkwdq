/**
 * Content Guardrails - Block Explicit/Prohibited Content
 * 
 * Prevents users from submitting content that violates platform guidelines.
 * This runs BEFORE any AI processing to avoid API content policy errors.
 */

export interface GuardrailResult {
  isAllowed: boolean
  blockedReason?: string
  violationType?: 'explicit' | 'harmful' | 'prohibited' | 'spam'
  suggestion?: string
}

// Explicit/adult content that MUST be blocked
const EXPLICIT_PATTERNS = [
  // Explicit sexual terms (common variations)
  /\b(f+u+c+k+|f+u+c+k+i+n+g+|f+u+c+k+e+d+)\b/gi,
  /\b(s+h+i+t+|s+h+i+t+t+i+n+g+|s+h+i+t+t+y+)\b/gi,
  /\b(c+u+n+t+|c+o+c+k+|d+i+c+k+|p+u+s+s+y+)\b/gi,
  /\b(a+s+s+h+o+l+e+|a+s+s+h+a+t+)\b/gi,
  /\b(b+i+t+c+h+|w+h+o+r+e+|s+l+u+t+)\b/gi,
  /\b(n+i+g+g+[ae]+r*|f+a+g+g*o*t*)\b/gi,
  /\b(masturbat|orgasm|ejaculat|erection|porn|hentai|xxx)\w*/gi,
  /\b(blowjob|handjob|cumshot|gangbang|threesome)\b/gi,
  /\b(anal\s*sex|oral\s*sex|intercourse)\b/gi,
  /\bsex(?:ual)?\s*(?:act|content|scene|position)/gi,
]

// Harmful content patterns
const HARMFUL_PATTERNS = [
  // Self-harm/suicide instructions (not just mentions)
  /\bhow\s+to\s+(?:kill|hurt|harm)\s+(?:myself|yourself|oneself)\b/gi,
  /\bways?\s+to\s+(?:commit|do)\s+suicide\b/gi,
  /\bsuicide\s+(?:method|instruction|guide)\b/gi,
  // Violence instructions
  /\bhow\s+to\s+(?:make|build)\s+(?:a\s+)?(?:bomb|explosive|weapon)\b/gi,
  /\bhow\s+to\s+(?:kill|murder|poison)\s+(?:someone|people)\b/gi,
  // Drug instructions
  /\bhow\s+to\s+(?:make|cook|produce)\s+(?:meth|cocaine|heroin|drugs)\b/gi,
]

// Prohibited content (platform policy violations)
const PROHIBITED_PATTERNS = [
  // Child safety
  /\b(?:child|minor|kid|underage)\s*(?:porn|sex|nude|naked)\b/gi,
  /\b(?:cp|csam|pedo|pedophil)\b/gi,
  // Illegal activities
  /\bterroris[tm]/gi,
  /\bhuman\s*trafficking\b/gi,
]

// Simple profanity list for softer warnings (these don't block, just flag)
const PROFANITY_WORDS = [
  'damn', 'hell', 'crap', 'ass', 'bastard', 'piss'
]

/**
 * Check if content violates guardrails
 * Returns immediately if prohibited content found
 */
export function checkContentGuardrails(text: string): GuardrailResult {
  if (!text || typeof text !== 'string') {
    return { isAllowed: true }
  }

  const normalizedText = text.toLowerCase().trim()
  
  // Check prohibited content first (most severe)
  for (const pattern of PROHIBITED_PATTERNS) {
    if (pattern.test(normalizedText)) {
      return {
        isAllowed: false,
        blockedReason: 'This content violates our platform safety guidelines and cannot be processed.',
        violationType: 'prohibited',
        suggestion: 'Please describe your dream without including this type of content.'
      }
    }
    // Reset regex state
    pattern.lastIndex = 0
  }

  // Check harmful content patterns
  for (const pattern of HARMFUL_PATTERNS) {
    if (pattern.test(normalizedText)) {
      return {
        isAllowed: false,
        blockedReason: 'This content contains potentially harmful instructions and cannot be processed.',
        violationType: 'harmful',
        suggestion: 'If you are experiencing difficult thoughts, please reach out to a mental health professional or crisis helpline.'
      }
    }
    pattern.lastIndex = 0
  }

  // Check explicit content patterns
  for (const pattern of EXPLICIT_PATTERNS) {
    if (pattern.test(normalizedText)) {
      return {
        isAllowed: false,
        blockedReason: 'Please describe your dream without using explicit language. Our AI works best with descriptive, family-friendly text.',
        violationType: 'explicit',
        suggestion: 'Try rephrasing using terms like "intimate moment", "physical closeness", or "strong emotions" instead.'
      }
    }
    pattern.lastIndex = 0
  }

  return { isAllowed: true }
}

/**
 * Check for profanity (soft warning, doesn't block)
 * Returns list of detected words for optional user notification
 */
export function detectProfanity(text: string): string[] {
  if (!text) return []
  
  const normalizedText = text.toLowerCase()
  const detected: string[] = []
  
  for (const word of PROFANITY_WORDS) {
    const regex = new RegExp(`\\b${word}\\b`, 'gi')
    if (regex.test(normalizedText)) {
      detected.push(word)
    }
  }
  
  return detected
}

/**
 * Get user-friendly error message based on violation type
 */
export function getGuardrailErrorMessage(result: GuardrailResult): string {
  if (result.isAllowed) return ''
  
  switch (result.violationType) {
    case 'prohibited':
      return '🚫 Content Blocked: This content cannot be processed due to safety guidelines.'
    case 'harmful':
      return '⚠️ Content Blocked: This content contains potentially harmful material.'
    case 'explicit':
      return '🔒 Explicit Content Detected: Please rephrase your dream description without explicit language.'
    case 'spam':
      return '🤖 Spam Detected: Please provide a genuine dream description.'
    default:
      return '❌ This content cannot be processed. Please revise and try again.'
  }
}

/**
 * Sanitize text by replacing explicit words with asterisks
 * Use for logging/display purposes only
 */
export function sanitizeForLogging(text: string): string {
  if (!text) return ''
  
  let sanitized = text
  
  for (const pattern of EXPLICIT_PATTERNS) {
    sanitized = sanitized.replace(pattern, (match) => {
      return match[0] + '*'.repeat(match.length - 2) + match[match.length - 1]
    })
    pattern.lastIndex = 0
  }
  
  return sanitized
}

/**
 * Check if content is likely AI-generated spam/garbage
 */
export function isLikelySpamContent(text: string): boolean {
  if (!text || text.length < 10) return false
  
  // Check for excessive repetition
  const words = text.toLowerCase().split(/\s+/)
  const wordCounts = new Map<string, number>()
  
  for (const word of words) {
    wordCounts.set(word, (wordCounts.get(word) || 0) + 1)
  }
  
  // If any word appears more than 50% of the time, likely spam
  for (const [, count] of wordCounts) {
    if (count / words.length > 0.5 && words.length > 5) {
      return true
    }
  }
  
  // Check for keyboard smashing (repeated consonants)
  if (/([bcdfghjklmnpqrstvwxyz])\1{4,}/i.test(text)) {
    return true
  }
  
  // Check for excessive special characters
  const specialCharRatio = (text.match(/[^a-zA-Z0-9\s.,!?'"-]/g) || []).length / text.length
  if (specialCharRatio > 0.3) {
    return true
  }
  
  return false
}

/**
 * Combined validation - run all checks
 */
export function validateDreamContent(text: string): {
  result: GuardrailResult
  profanityWarnings: string[]
  isSpam: boolean
} {
  const result = checkContentGuardrails(text)
  const profanityWarnings = detectProfanity(text)
  const isSpam = isLikelySpamContent(text)
  
  // If spam, return as blocked
  if (isSpam && result.isAllowed) {
    return {
      result: {
        isAllowed: false,
        blockedReason: 'This content appears to be spam or invalid. Please provide a genuine dream description.',
        violationType: 'spam',
        suggestion: 'Describe what happened in your dream, including any emotions, people, or places you remember.'
      },
      profanityWarnings,
      isSpam: true
    }
  }
  
  return { result, profanityWarnings, isSpam }
}
