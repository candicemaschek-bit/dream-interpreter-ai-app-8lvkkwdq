/**
 * Sensitive Content Classifier
 * 
 * ON-DEVICE classification of dream content before cloud upload.
 * This runs entirely in the browser - no data sent to servers until user consents.
 * 
 * Categories:
 * - Trauma: Abuse, accidents, death, loss, PTSD triggers
 * - Sexuality: Sexual content, intimacy, body-related
 * - Violence: Aggression, fighting, harm, blood
 * - Fears: Phobias, anxiety triggers, nightmares
 */

export interface SensitiveContentFlags {
  hasTrauma: boolean
  hasSexuality: boolean
  hasViolence: boolean
  hasFears: boolean
  severityScore: number // 0-1 scale
  detectedKeywords: {
    trauma: string[]
    sexuality: string[]
    violence: string[]
    fears: string[]
  }
  requiresConsent: boolean
}

export interface RedactionOptions {
  redactTrauma: boolean
  redactSexuality: boolean
  redactViolence: boolean
  redactFears: boolean
}

// Keyword patterns for ON-DEVICE classification (no AI/cloud needed)
const SENSITIVE_PATTERNS = {
  trauma: {
    keywords: [
      'abuse', 'abused', 'assault', 'attacked', 'accident', 'crash',
      'death', 'died', 'dying', 'dead', 'funeral', 'grave', 'coffin',
      'loss', 'lost', 'grief', 'mourning', 'crying', 'sobbing',
      'trauma', 'ptsd', 'flashback', 'nightmare', 'terror',
      'abandon', 'abandoned', 'neglect', 'neglected', 'alone',
      'hospital', 'surgery', 'illness', 'cancer', 'disease',
      'divorce', 'breakup', 'betrayal', 'cheated', 'cheating',
      'war', 'soldier', 'combat', 'explosion', 'bomb',
      'suicide', 'self-harm', 'hurt myself', 'cutting',
      'childhood', 'parent', 'mother', 'father' // Context-dependent
    ],
    patterns: [
      /\b(hurt|harm|injur)(ed|ing)?\b/i,
      /\b(scream|screaming|screamed)\b/i,
      /\b(panic|panicking|panicked)\b/i,
      /\b(can'?t breathe|couldn'?t breathe)\b/i,
      /\b(help me|save me|please stop)\b/i
    ],
    weight: 0.9
  },
  sexuality: {
    keywords: [
      'naked', 'nude', 'undressed', 'unclothed',
      'sex', 'sexual', 'intimate', 'intimacy',
      'kiss', 'kissing', 'kissed', 'making out',
      'bed', 'bedroom', // Context-dependent
      'body', 'bodies', 'flesh',
      'pregnant', 'pregnancy', 'baby',
      'breast', 'genitals', 'private parts',
      'aroused', 'arousal', 'desire', 'lustful',
      'affair', 'lover', 'ex-boyfriend', 'ex-girlfriend',
      'cheating', 'infidelity' // Overlap with trauma
    ],
    patterns: [
      /\b(touch|touching|touched)\s+(me|my|their|his|her)\b/i,
      /\b(with\s+)?(no|without)\s+clothes\b/i,
      /\bmaking\s+love\b/i,
      /\bin\s+bed\s+with\b/i
    ],
    weight: 0.7
  },
  violence: {
    keywords: [
      'kill', 'killed', 'killing', 'murder', 'murdered',
      'blood', 'bleeding', 'bloody', 'gore',
      'fight', 'fighting', 'fought', 'punch', 'punched',
      'stab', 'stabbed', 'stabbing', 'knife', 'gun', 'weapon',
      'shoot', 'shot', 'shooting', 'bullet',
      'hit', 'hitting', 'beat', 'beating', 'beaten',
      'strangle', 'strangled', 'choke', 'choking',
      'torture', 'tortured', 'pain', 'painful',
      'war', 'battle', 'soldier', 'army',
      'attack', 'attacked', 'attacking', 'assault',
      'destroy', 'destroyed', 'destruction',
      'explode', 'explosion', 'bomb'
    ],
    patterns: [
      /\b(try|trying|tried)\s+to\s+kill\b/i,
      /\b(wanted|want)\s+to\s+(hurt|harm|kill)\b/i,
      /\bfighting\s+for\s+(my|their|his|her)\s+life\b/i,
      /\b(covered|soaked)\s+in\s+blood\b/i
    ],
    weight: 0.85
  },
  fears: {
    keywords: [
      'afraid', 'fear', 'feared', 'fearing', 'fearful',
      'scared', 'scary', 'terrified', 'terrifying', 'terror',
      'nightmare', 'nightmarish',
      'chase', 'chased', 'chasing', 'running', 'escape',
      'fall', 'falling', 'fell', 'cliff', 'height',
      'drown', 'drowning', 'drowned', 'water', 'ocean', 'flood',
      'trapped', 'stuck', 'can\'t move', 'paralyzed',
      'dark', 'darkness', 'shadow', 'monster',
      'spider', 'snake', 'insect', 'bugs',
      'teeth', 'falling out', 'lost teeth',
      'late', 'missed', 'exam', 'test', 'unprepared',
      'naked', 'public', 'embarrassed', 'humiliated',
      'lost', 'can\'t find', 'missing',
      'alone', 'abandoned', 'isolated',
      'suffocate', 'suffocating', 'can\'t breathe'
    ],
    patterns: [
      /\b(couldn'?t|can'?t)\s+(move|run|scream|breathe)\b/i,
      /\b(something|someone)\s+(chasing|following|watching)\b/i,
      /\bwoke\s+up\s+(scared|terrified|sweating)\b/i,
      /\bheart\s+(pounding|racing|beating)\b/i,
      /\bteeth\s+(falling|crumbling|breaking)\b/i
    ],
    weight: 0.6
  }
}

/**
 * Classify dream content ON-DEVICE (no network required)
 * This MUST run before any cloud upload for privacy
 */
export function classifySensitiveContent(dreamText: string): SensitiveContentFlags {
  const normalizedText = dreamText.toLowerCase()
  
  const detectedKeywords: SensitiveContentFlags['detectedKeywords'] = {
    trauma: [],
    sexuality: [],
    violence: [],
    fears: []
  }
  
  let totalScore = 0
  let categoryCount = 0
  
  // Check each category
  for (const [category, config] of Object.entries(SENSITIVE_PATTERNS)) {
    const categoryKey = category as keyof typeof SENSITIVE_PATTERNS
    let categoryScore = 0
    
    // Check keywords
    for (const keyword of config.keywords) {
      if (normalizedText.includes(keyword)) {
        detectedKeywords[categoryKey].push(keyword)
        categoryScore += 0.1 // Each keyword adds 0.1
      }
    }
    
    // Check regex patterns (higher weight)
    for (const pattern of config.patterns) {
      if (pattern.test(normalizedText)) {
        const match = normalizedText.match(pattern)
        if (match) {
          detectedKeywords[categoryKey].push(match[0])
          categoryScore += 0.25 // Pattern match adds 0.25
        }
      }
    }
    
    // Cap category score at 1
    categoryScore = Math.min(categoryScore * config.weight, 1)
    
    if (categoryScore > 0) {
      totalScore += categoryScore
      categoryCount++
    }
  }
  
  // Calculate severity (average of detected categories)
  const severityScore = categoryCount > 0 
    ? Math.min(totalScore / categoryCount, 1) 
    : 0
  
  const flags: SensitiveContentFlags = {
    hasTrauma: detectedKeywords.trauma.length >= 2,
    hasSexuality: detectedKeywords.sexuality.length >= 2,
    hasViolence: detectedKeywords.violence.length >= 2,
    hasFears: detectedKeywords.fears.length >= 2,
    severityScore,
    detectedKeywords,
    requiresConsent: severityScore > 0.3 || 
      detectedKeywords.trauma.length >= 3 ||
      detectedKeywords.violence.length >= 3
  }
  
  return flags
}

/**
 * Redact sensitive content from dream text
 * Returns sanitized version for cloud upload
 */
export function redactSensitiveContent(
  dreamText: string,
  options: RedactionOptions
): { redactedText: string; redactionLog: string[] } {
  let redactedText = dreamText
  const redactionLog: string[] = []
  
  const categoriesToRedact: (keyof typeof SENSITIVE_PATTERNS)[] = []
  
  if (options.redactTrauma) categoriesToRedact.push('trauma')
  if (options.redactSexuality) categoriesToRedact.push('sexuality')
  if (options.redactViolence) categoriesToRedact.push('violence')
  if (options.redactFears) categoriesToRedact.push('fears')
  
  for (const category of categoriesToRedact) {
    const config = SENSITIVE_PATTERNS[category]
    
    // Redact keywords
    for (const keyword of config.keywords) {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi')
      if (regex.test(redactedText)) {
        redactedText = redactedText.replace(regex, `[${category.toUpperCase()}_REDACTED]`)
        redactionLog.push(`Redacted "${keyword}" (${category})`)
      }
    }
    
    // Redact pattern matches
    for (const pattern of config.patterns) {
      const globalPattern = new RegExp(pattern.source, 'gi')
      const matches = redactedText.match(globalPattern)
      if (matches) {
        for (const match of matches) {
          redactedText = redactedText.replace(match, `[${category.toUpperCase()}_REDACTED]`)
          redactionLog.push(`Redacted pattern "${match}" (${category})`)
        }
      }
    }
  }
  
  return { redactedText, redactionLog }
}

/**
 * Check if user has consented to pattern tracking
 */
export async function hasPatternTrackingConsent(
  userId: string,
  blink: any
): Promise<boolean> {
  try {
    const settings = await blink.db.userPrivacySettings.list({
      where: { userId }
    })
    
    if (settings.length === 0) return false
    
    return settings[0].patternTrackingConsent === '1' || 
           settings[0].patternTrackingConsent === 1 ||
           settings[0].patternTrackingConsent === true
  } catch (error) {
    console.error('Error checking pattern tracking consent:', error)
    return false
  }
}

/**
 * Get user's redaction preferences
 */
export async function getRedactionPreferences(
  userId: string,
  blink: any
): Promise<RedactionOptions> {
  try {
    const settings = await blink.db.userPrivacySettings.list({
      where: { userId }
    })
    
    if (settings.length === 0) {
      // Default: redact everything for safety
      return {
        redactTrauma: true,
        redactSexuality: true,
        redactViolence: true,
        redactFears: false // Fears are common in dreams
      }
    }
    
    const s = settings[0]
    return {
      redactTrauma: s.redactTrauma === '1' || s.redactTrauma === 1,
      redactSexuality: s.redactSexuality === '1' || s.redactSexuality === 1,
      redactViolence: s.redactViolence === '1' || s.redactViolence === 1,
      redactFears: s.redactFears === '1' || s.redactFears === 1
    }
  } catch (error) {
    console.error('Error getting redaction preferences:', error)
    return {
      redactTrauma: true,
      redactSexuality: true,
      redactViolence: true,
      redactFears: false
    }
  }
}

/**
 * Save content flags to database (after user consent)
 */
export async function saveDreamContentFlags(
  userId: string,
  dreamId: string,
  flags: SensitiveContentFlags,
  userApproved: boolean,
  redactionApplied: string[],
  blink: any
): Promise<void> {
  try {
    await blink.db.dreamContentFlags.create({
      id: `dcf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      dreamId,
      hasTrauma: flags.hasTrauma ? '1' : '0',
      hasSexuality: flags.hasSexuality ? '1' : '0',
      hasViolence: flags.hasViolence ? '1' : '0',
      hasFears: flags.hasFears ? '1' : '0',
      severityScore: flags.severityScore.toString(),
      classifiedLocally: '1',
      userApprovedAnalysis: userApproved ? '1' : '0',
      redactionApplied: JSON.stringify(redactionApplied),
      createdAt: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error saving dream content flags:', error)
  }
}

/**
 * Get severity label for UI display
 */
export function getSeverityLabel(score: number): {
  label: string
  color: string
  description: string
} {
  if (score < 0.2) {
    return {
      label: 'Low',
      color: 'text-green-600',
      description: 'Standard dream content'
    }
  } else if (score < 0.4) {
    return {
      label: 'Mild',
      color: 'text-yellow-600',
      description: 'Some emotional themes detected'
    }
  } else if (score < 0.6) {
    return {
      label: 'Moderate',
      color: 'text-orange-600',
      description: 'Sensitive themes present'
    }
  } else if (score < 0.8) {
    return {
      label: 'High',
      color: 'text-red-500',
      description: 'Multiple sensitive themes'
    }
  } else {
    return {
      label: 'Very High',
      color: 'text-red-700',
      description: 'Heavy emotional content'
    }
  }
}

/**
 * Get category icons for UI
 */
export function getCategoryIcon(category: string): string {
  switch (category) {
    case 'trauma': return '💔'
    case 'sexuality': return '💋'
    case 'violence': return '⚔️'
    case 'fears': return '😰'
    default: return '⚠️'
  }
}

/**
 * Format detected keywords for display
 */
export function formatDetectedKeywords(
  keywords: SensitiveContentFlags['detectedKeywords']
): string[] {
  const formatted: string[] = []
  
  if (keywords.trauma.length > 0) {
    formatted.push(`💔 Trauma: ${keywords.trauma.slice(0, 3).join(', ')}${keywords.trauma.length > 3 ? '...' : ''}`)
  }
  if (keywords.sexuality.length > 0) {
    formatted.push(`💋 Intimacy: ${keywords.sexuality.slice(0, 3).join(', ')}${keywords.sexuality.length > 3 ? '...' : ''}`)
  }
  if (keywords.violence.length > 0) {
    formatted.push(`⚔️ Violence: ${keywords.violence.slice(0, 3).join(', ')}${keywords.violence.length > 3 ? '...' : ''}`)
  }
  if (keywords.fears.length > 0) {
    formatted.push(`😰 Fears: ${keywords.fears.slice(0, 3).join(', ')}${keywords.fears.length > 3 ? '...' : ''}`)
  }
  
  return formatted
}
