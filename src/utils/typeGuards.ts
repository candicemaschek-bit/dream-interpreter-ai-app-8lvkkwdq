/**
 * Type Guards for Runtime Validation
 * Prevents "Type validation failed" errors by checking types at runtime
 * Provides coercion and fallback values for type mismatches
 */

export interface ValidationContext {
  valid: boolean
  value: any
  error?: string
  details?: Record<string, any>
}

/**
 * Guard: Validate boolean type
 * Coerces truthy/falsy values if validation fails
 */
export function guardBoolean(value: unknown): ValidationContext {
  if (typeof value === 'boolean') {
    return { valid: true, value }
  }
  // Coerce null/undefined to false
  if (value === undefined || value === null) {
    return { valid: true, value: false, error: 'Coerced null to false' }
  }
  // Coerce numbers to boolean (truthy/falsy)
  if (typeof value === 'number') {
    return {
      valid: true,
      value: value > 0,
      error: `Coerced number ${value} to boolean`,
    }
  }
  // Coerce strings to boolean (empty=false, non-empty=true)
  if (typeof value === 'string') {
    return {
      valid: true,
      value: value.length > 0,
      error: `Coerced string to boolean`,
    }
  }
  return {
    valid: false,
    value: false,
    error: `Cannot coerce ${typeof value} to boolean`,
  }
}

/**
 * Guard: Validate number type
 * Coerces compatible types to number, falls back to default
 */
export function guardNumber(
  value: unknown,
  defaultValue: number = 0
): ValidationContext {
  if (typeof value === 'number' && !isNaN(value)) {
    return { valid: true, value }
  }
  // Coerce string numbers to number
  if (typeof value === 'string' && !isNaN(Number(value))) {
    const num = Number(value)
    return {
      valid: true,
      value: num,
      error: `Coerced string "${value}" to number ${num}`,
    }
  }
  // Coerce booleans to number
  if (typeof value === 'boolean') {
    return {
      valid: true,
      value: value ? 1 : 0,
      error: `Coerced boolean to number`,
    }
  }
  return {
    valid: false,
    value: defaultValue,
    error: `Cannot coerce ${typeof value} to number, using default ${defaultValue}`,
  }
}

/**
 * Guard: Validate string type
 * Coerces compatible types to string
 */
export function guardString(
  value: unknown,
  defaultValue: string = ''
): ValidationContext {
  if (typeof value === 'string') {
    return { valid: true, value }
  }
  if (value === null || value === undefined) {
    return {
      valid: true,
      value: defaultValue,
      error: `Coerced null to default string`,
    }
  }
  // Coerce other types to string representation
  try {
    const str = String(value)
    return {
      valid: true,
      value: str,
      error: `Coerced ${typeof value} to string`,
    }
  } catch {
    return {
      valid: false,
      value: defaultValue,
      error: `Cannot coerce ${typeof value} to string`,
    }
  }
}

/**
 * Guard: Validate array type
 * Ensures value is an array, returns empty array on failure
 */
export function guardArray<T>(
  value: unknown,
  defaultValue: T[] = []
): ValidationContext {
  if (Array.isArray(value)) {
    return { valid: true, value }
  }
  return {
    valid: false,
    value: defaultValue,
    error: `Expected array, got ${typeof value}`,
  }
}

/**
 * Guard: Validate object type
 * Ensures value is an object, returns empty object on failure
 */
export function guardObject(value: unknown): ValidationContext {
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    return { valid: true, value }
  }
  return {
    valid: false,
    value: {},
    error: `Expected object, got ${typeof value}`,
  }
}

/**
 * Guard: Validate usage limit reached safely
 * Handles type mismatches in dreams used / limit comparison
 */
export function guardUsageLimitReached(
  dreamsUsed: unknown,
  dreamLimit: unknown
): ValidationContext {
  const usedGuard = guardNumber(dreamsUsed, 0)
  const limitGuard = guardNumber(dreamLimit, Infinity)

  if (!usedGuard.valid || !limitGuard.valid) {
    return {
      valid: false,
      value: false,
      error: `Invalid types for usage check: used=${typeof dreamsUsed}, limit=${typeof dreamLimit}`,
    }
  }

  const isLimitReached: boolean =
    usedGuard.value >= limitGuard.value && limitGuard.value !== Infinity
  return {
    valid: true,
    value: isLimitReached,
    details: {
      dreamsUsed: usedGuard.value,
      dreamLimit: limitGuard.value,
    },
  }
}

/**
 * Guard: Validate progress percentage
 * Ensures percentage is 0-100
 */
export function guardProgressPercentage(
  dreamsUsed: unknown,
  dreamLimit: unknown
): ValidationContext {
  const limitGuard = guardNumber(dreamLimit, Infinity)

  if (limitGuard.value === Infinity) {
    return { valid: true, value: 0 }
  }

  const usedGuard = guardNumber(dreamsUsed, 0)

  if (!usedGuard.valid) {
    return {
      valid: false,
      value: 0,
      error: `Invalid dreams used type: ${typeof dreamsUsed}`,
    }
  }

  const percentage = Math.min(
    100,
    Math.max(0, (usedGuard.value / limitGuard.value) * 100)
  )

  return { valid: true, value: percentage }
}

/**
 * Guard: Validate subscription tier
 * Ensures tier is one of: 'free' | 'pro' | 'premium' | 'vip'
 */
export function guardSubscriptionTier(
  tier: unknown
): ValidationContext {
  const validTiers = ['free', 'pro', 'premium', 'vip']
  const tierStr = guardString(tier, 'free')

  if (validTiers.includes(tierStr.value)) {
    return { valid: true, value: tierStr.value }
  }

  return {
    valid: false,
    value: 'free',
    error: `Invalid subscription tier "${tierStr.value}", defaulting to free`,
  }
}

/**
 * Guard: Validate input type for dreams
 * Ensures inputType is one of: 'text' | 'symbols' | 'image'
 */
export function guardDreamInputType(value: unknown): ValidationContext {
  const validTypes = ['text', 'symbols', 'image']
  const typeStr = guardString(value, 'text')

  if (validTypes.includes(typeStr.value)) {
    return { valid: true, value: typeStr.value as 'text' | 'symbols' | 'image' }
  }

  return {
    valid: false,
    value: 'text',
    error: `Invalid dream input type "${typeStr.value}", defaulting to text`,
  }
}

/**
 * Guard: Validate Dream object from database row
 * Coerces DreamRow to Dream with proper type conversions
 */
export function guardDream(row: any): ValidationContext {
  if (!row || typeof row !== 'object') {
    return {
      valid: false,
      value: null,
      error: 'Invalid dream row: not an object',
    }
  }

  const id = guardString(row.id, '')
  const userId = guardString(row.userId, '')
  const title = guardString(row.title, 'Untitled Dream')
  const description = guardString(row.description, '')
  const inputType = guardDreamInputType(row.inputType)
  const imageUrl = row.imageUrl ? guardString(row.imageUrl).value : undefined
  const symbolsData = row.symbolsData ? guardString(row.symbolsData).value : undefined
  const interpretation = row.interpretation ? guardString(row.interpretation).value : undefined
  const videoUrl = row.videoUrl ? guardString(row.videoUrl).value : undefined
  const createdAt = guardString(row.createdAt, new Date().toISOString())
  const updatedAt = guardString(row.updatedAt, new Date().toISOString())

  // Parse tags from JSON string
  let tags: string[] | undefined
  if (row.tags) {
    try {
      const parsed = JSON.parse(row.tags)
      if (Array.isArray(parsed)) {
        tags = parsed.filter(t => typeof t === 'string')
      }
    } catch {
      tags = undefined
    }
  }

  const dream = {
    id: id.value,
    userId: userId.value,
    title: title.value,
    description: description.value,
    inputType: inputType.value as 'text' | 'symbols' | 'image',
    imageUrl,
    symbolsData,
    interpretation,
    videoUrl,
    tags,
    createdAt: createdAt.value,
    updatedAt: updatedAt.value,
  }

  return {
    valid: id.valid && userId.valid && inputType.valid,
    value: dream,
    error: !id.valid || !userId.valid ? 'Missing required fields' : undefined,
  }
}

/**
 * Guard: Validate DreamWorld object from database row
 * Coerces DreamWorldRow to DreamWorld with proper type conversions
 */
export function guardDreamWorld(row: any): ValidationContext {
  if (!row || typeof row !== 'object') {
    return {
      valid: false,
      value: null,
      error: 'Invalid dream world row: not an object',
    }
  }

  const id = guardString(row.id, '')
  const userId = guardString(row.userId, '')
  const title = guardString(row.title, 'Untitled Dream World')
  const description = row.description ? guardString(row.description).value : undefined
  const videoUrl = row.videoUrl ? guardString(row.videoUrl).value : undefined
  const thumbnailUrl = row.thumbnailUrl ? guardString(row.thumbnailUrl).value : undefined
  const durationSeconds = row.durationSeconds ? guardNumber(row.durationSeconds).value : undefined
  const generatedAt = guardString(row.generatedAt, new Date().toISOString())
  const createdAt = guardString(row.createdAt, new Date().toISOString())
  const updatedAt = guardString(row.updatedAt, new Date().toISOString())

  // Parse dreamIds from JSON string
  let dreamIds: string[] = []
  if (row.dreamIds) {
    try {
      const parsed = JSON.parse(row.dreamIds)
      if (Array.isArray(parsed)) {
        dreamIds = parsed.filter(id => typeof id === 'string')
      }
    } catch {
      dreamIds = []
    }
  }

  const dreamWorld = {
    id: id.value,
    userId: userId.value,
    title: title.value,
    description,
    dreamIds,
    videoUrl,
    thumbnailUrl,
    durationSeconds,
    generatedAt: generatedAt.value,
    createdAt: createdAt.value,
    updatedAt: updatedAt.value,
  }

  return {
    valid: id.valid && userId.valid && dreamIds.length > 0,
    value: dreamWorld,
    error: !id.valid || !userId.valid
      ? 'Missing required fields'
      : dreamIds.length === 0
      ? 'Dream world must contain at least one dream'
      : undefined,
  }
}

/**
 * Guard: Validate array of dreams from database rows
 * Converts array of DreamRow to array of Dream objects
 */
export function guardDreams(rows: any[]): ValidationContext {
  if (!Array.isArray(rows)) {
    return {
      valid: false,
      value: [],
      error: 'Invalid dreams data: not an array',
    }
  }

  const dreams = rows
    .map(row => guardDream(row))
    .filter(context => context.valid)
    .map(context => context.value)

  return {
    valid: true,
    value: dreams,
  }
}

/**
 * Guard: Validate array of dream worlds from database rows
 * Converts array of DreamWorldRow to array of DreamWorld objects
 */
export function guardDreamWorlds(rows: any[]): ValidationContext {
  if (!Array.isArray(rows)) {
    return {
      valid: false,
      value: [],
      error: 'Invalid dream worlds data: not an array',
    }
  }

  const dreamWorlds = rows
    .map(row => guardDreamWorld(row))
    .filter(context => context.valid)
    .map(context => context.value)

  return {
    valid: true,
    value: dreamWorlds,
  }
}

/**
 * Comprehensive validation runner
 * Validates multiple fields and returns detailed report
 */
export function validateContext(validators: Record<string, ValidationContext>): {
  allValid: boolean
  details: Record<string, any>
  warnings: string[]
} {
  const warnings: string[] = []
  const details: Record<string, any> = {}
  let allValid = true

  for (const [key, context] of Object.entries(validators)) {
    details[key] = context.value

    if (!context.valid) {
      allValid = false
      if (context.error) {
        warnings.push(`${key}: ${context.error}`)
      }
    } else if (context.error) {
      // Valid but with coercion
      warnings.push(`${key}: ${context.error}`)
    }
  }

  return { allValid, details, warnings }
}

/**
 * Guard: Validate subscription tier limits
 * Checks if user has reached their usage limit
 */
export function guardSubscriptionUsageLimit(
  dreamsUsed: unknown,
  dreamLimit: unknown,
  subscriptionTier: unknown
): ValidationContext {
  const tierGuard = guardSubscriptionTier(subscriptionTier)
  const usedGuard = guardNumber(dreamsUsed, 0)
  const limitGuard = guardNumber(dreamLimit, Infinity)

  // For free tier, use lifetime count
  // For paid tiers, use monthly count
  const isFreeTier = tierGuard.value === 'free'
  const hasReachedLimit = isFreeTier
    ? usedGuard.value >= limitGuard.value
    : usedGuard.value >= limitGuard.value

  if (!usedGuard.valid || !limitGuard.valid || !tierGuard.valid) {
    return {
      valid: false,
      value: {
        canCreate: false,
        reason: 'Invalid subscription data',
      },
      error: 'Failed to validate subscription limits',
    }
  }

  if (hasReachedLimit && limitGuard.value !== Infinity) {
    return {
      valid: true,
      value: {
        canCreate: false,
        reason: isFreeTier
          ? `You've used all ${limitGuard.value} lifetime dream analyses. Upgrade to continue.`
          : `Monthly limit of ${limitGuard.value} analyses reached. Upgrade for more.`,
        dreamsUsed: usedGuard.value,
        dreamLimit: limitGuard.value,
        subscriptionTier: tierGuard.value,
      },
    }
  }

  return {
    valid: true,
    value: {
      canCreate: true,
      dreamsRemaining: limitGuard.value - usedGuard.value,
      dreamsUsed: usedGuard.value,
      dreamLimit: limitGuard.value,
      subscriptionTier: tierGuard.value,
    },
  }
}

/**
 * Guard: Validate dream title format
 * Ensures title meets length and quality requirements
 */
export function guardDreamTitle(title: unknown): ValidationContext {
  const titleStr = guardString(title, '')

  if (!titleStr.value || titleStr.value.trim().length === 0) {
    return {
      valid: false,
      value: '',
      error: 'Dream title cannot be empty',
    }
  }

  const trimmed = titleStr.value.trim()

  // Title should be between 3-50 characters
  if (trimmed.length < 3) {
    return {
      valid: false,
      value: trimmed,
      error: 'Dream title must be at least 3 characters',
    }
  }

  if (trimmed.length > 50) {
    return {
      valid: false,
      value: trimmed.substring(0, 50),
      error: 'Dream title truncated to 50 characters',
    }
  }

  // Title should not be all uppercase
  const isAllUppercase = trimmed === trimmed.toUpperCase() && /[A-Z]/.test(trimmed)
  if (isAllUppercase) {
    return {
      valid: true,
      value: trimmed.charAt(0) + trimmed.slice(1).toLowerCase(),
      error: 'Title converted from all caps',
    }
  }

  return {
    valid: true,
    value: trimmed,
  }
}

/**
 * Guard: Validate image URL format
 * Ensures image URL is valid and accessible
 */
export function guardImageUrl(url: unknown): ValidationContext {
  if (!url) {
    return {
      valid: true,
      value: undefined,
      error: 'No image URL provided',
    }
  }

  const urlStr = guardString(url, '')

  if (!urlStr.value) {
    return {
      valid: true,
      value: undefined,
      error: 'Image URL is empty',
    }
  }

  // Check if URL is valid format
  try {
    const urlObj = new URL(urlStr.value)
    const validProtocols = ['http:', 'https:']

    if (!validProtocols.includes(urlObj.protocol)) {
      return {
        valid: false,
        value: undefined,
        error: 'Image URL must use HTTP or HTTPS protocol',
      }
    }

    // Check if URL ends with common image extension
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg']
    const hasImageExtension = imageExtensions.some((ext) =>
      urlObj.pathname.toLowerCase().endsWith(ext)
    )

    if (!hasImageExtension) {
      return {
        valid: true,
        value: urlStr.value,
        error: 'URL does not appear to be an image file',
      }
    }

    return {
      valid: true,
      value: urlStr.value,
    }
  } catch {
    return {
      valid: false,
      value: undefined,
      error: 'Invalid image URL format',
    }
  }
}

/**
 * Guard: Validate dream record before database write
 * Ensures all required fields are present and valid
 */
export function guardDreamRecord(record: any): ValidationContext {
  if (!record || typeof record !== 'object') {
    return {
      valid: false,
      value: null,
      error: 'Dream record is not an object',
    }
  }

  const missingFields: string[] = []
  const invalidFields: Record<string, string> = {}

  // Required fields
  const requiredFields = ['id', 'userId', 'title', 'description', 'inputType']

  for (const field of requiredFields) {
    if (!record[field]) {
      missingFields.push(field)
    }
  }

  // Validate field types
  const idGuard = guardString(record.id)
  if (!idGuard.valid || !idGuard.value) {
    invalidFields.id = 'ID must be a non-empty string'
  }

  const userIdGuard = guardString(record.userId)
  if (!userIdGuard.valid || !userIdGuard.value) {
    invalidFields.userId = 'User ID must be a non-empty string'
  }

  const titleGuard = guardDreamTitle(record.title)
  if (!titleGuard.valid) {
    invalidFields.title = titleGuard.error || 'Invalid title'
  }

  const descGuard = guardString(record.description)
  if (!descGuard.valid || !descGuard.value) {
    invalidFields.description = 'Description must be a non-empty string'
  }

  const inputTypeGuard = guardDreamInputType(record.inputType)
  if (!inputTypeGuard.valid) {
    invalidFields.inputType = inputTypeGuard.error || 'Invalid input type'
  }

  // Validate optional fields if present
  if (record.imageUrl) {
    const imageGuard = guardImageUrl(record.imageUrl)
    if (!imageGuard.valid) {
      invalidFields.imageUrl = imageGuard.error || 'Invalid image URL'
    }
  }

  if (record.tags) {
    if (typeof record.tags === 'string') {
      try {
        const parsed = JSON.parse(record.tags)
        if (!Array.isArray(parsed)) {
          invalidFields.tags = 'Tags string must be a valid JSON array'
        }
      } catch {
        invalidFields.tags = 'Tags string must be valid JSON'
      }
    } else if (!Array.isArray(record.tags)) {
      invalidFields.tags = 'Tags must be an array or a JSON stringified array'
    }
  }

  // Determine if record can be saved
  const canSave = missingFields.length === 0 && Object.keys(invalidFields).length === 0

  return {
    valid: canSave,
    value: {
      canSave,
      missingFields,
      invalidFields,
      record: canSave ? record : null,
    },
    error: canSave
      ? undefined
      : `Cannot save dream record: ${missingFields.length} missing fields, ${
          Object.keys(invalidFields).length
        } invalid fields`,
  }
}
