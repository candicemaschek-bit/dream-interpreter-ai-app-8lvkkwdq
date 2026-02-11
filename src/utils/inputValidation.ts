/**
 * Client-side input validation for dream processing
 * Prevents edge cases and provides user-friendly error messages
 */

import { GLOBAL_DREAM_INPUT_CAP } from './inputBudget'

export interface ValidationResult {
  isValid: boolean
  error?: string
  fieldErrors: Record<string, string>
}

/**
 * Validate dream input before processing
 */
export function validateDreamInput(
  description: string,
  inputType: 'text' | 'symbols' | 'image'
): ValidationResult {
  const fieldErrors: Record<string, string> = {}

  // Check for null/undefined
  if (!description || typeof description !== 'string') {
    return {
      isValid: false,
      error: 'Dream description is required',
      fieldErrors: { description: 'Invalid input type' }
    }
  }

  // Trim and check length
  const trimmed = description.trim()

  if (trimmed.length === 0) {
    fieldErrors.description = 'Dream description cannot be empty'
  } else if (trimmed.length < 10) {
    fieldErrors.description = 'Please provide more detail (at least 10 characters)'
  } else if (trimmed.length > GLOBAL_DREAM_INPUT_CAP) {
    fieldErrors.description = `Dream description is too long (maximum ${GLOBAL_DREAM_INPUT_CAP.toLocaleString()} characters)`
  }

  // Check for mostly whitespace or special characters
  if (/^[\s\W_]*$/.test(trimmed)) {
    fieldErrors.description = 'Please describe your dream with actual words'
  }

  return {
    isValid: Object.keys(fieldErrors).length === 0,
    error: Object.keys(fieldErrors).length > 0 ? Object.values(fieldErrors)[0] : undefined,
    fieldErrors
  }
}

/**
 * Validate AI prompt before sending
 */
export function validateAIPrompt(prompt: string): ValidationResult {
  const fieldErrors: Record<string, string> = {}

  if (!prompt || typeof prompt !== 'string') {
    return {
      isValid: false,
      error: 'Prompt is required',
      fieldErrors: { prompt: 'Invalid prompt' }
    }
  }

  const trimmed = prompt.trim()

  if (trimmed.length === 0) {
    fieldErrors.prompt = 'Prompt cannot be empty'
  } else if (trimmed.length > 50000) {
    fieldErrors.prompt = 'Prompt exceeds maximum length'
  }

  // Check for potential injection attacks (basic)
  if (trimmed.includes('{{') || trimmed.includes('}}')) {
    fieldErrors.prompt = 'Invalid characters in prompt'
  }

  return {
    isValid: Object.keys(fieldErrors).length === 0,
    error: Object.keys(fieldErrors).length > 0 ? Object.values(fieldErrors)[0] : undefined,
    fieldErrors
  }
}

/**
 * Validate file before upload
 */
export function validateFileUpload(
  file: File,
  options?: {
    maxSize?: number // bytes
    allowedTypes?: string[]
  }
): ValidationResult {
  const fieldErrors: Record<string, string> = {}
  const defaultMaxSize = 10 * 1024 * 1024 // 10MB
  const maxSize = options?.maxSize || defaultMaxSize
  const allowedTypes = options?.allowedTypes || ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

  if (!file) {
    return {
      isValid: false,
      error: 'File is required',
      fieldErrors: { file: 'No file provided' }
    }
  }

  if (file.size > maxSize) {
    fieldErrors.fileSize = `File too large (max ${formatBytes(maxSize)})`
  }

  if (!allowedTypes.includes(file.type)) {
    fieldErrors.fileType = `File type not allowed. Allowed types: ${allowedTypes.join(', ')}`
  }

  if (!file.name || file.name.length === 0) {
    fieldErrors.fileName = 'File name is required'
  }

  return {
    isValid: Object.keys(fieldErrors).length === 0,
    error: Object.keys(fieldErrors).length > 0 ? Object.values(fieldErrors)[0] : undefined,
    fieldErrors
  }
}

/**
 * Sanitize dream description for display
 */
export function sanitizeDreamDescription(text: string): string {
  if (!text || typeof text !== 'string') {
    return ''
  }

  // Remove leading/trailing whitespace
  let sanitized = text.trim()

  // Limit consecutive whitespace
  sanitized = sanitized.replace(/\s+/g, ' ')

  // Remove potentially harmful characters but keep normal punctuation
  sanitized = sanitized.replace(/[<>]/g, '')

  return sanitized
}

/**
 * Validate text fields for symbols/emotions
 */
export function validateTextField(text: string, fieldName: string): ValidationResult {
  const fieldErrors: Record<string, string> = {}

  if (!text) {
    return {
      isValid: true, // Optional fields
      error: undefined,
      fieldErrors: {}
    }
  }

  if (typeof text !== 'string') {
    fieldErrors[fieldName] = 'Invalid input type'
  } else if (text.length > 5000) {
    fieldErrors[fieldName] = `${fieldName} is too long (maximum 5,000 characters)`
  }

  return {
    isValid: Object.keys(fieldErrors).length === 0,
    error: Object.keys(fieldErrors).length > 0 ? Object.values(fieldErrors)[0] : undefined,
    fieldErrors
  }
}

/**
 * Check if input appears to be spam/gibberish
 */
export function isLikelySpam(text: string): boolean {
  if (!text || typeof text !== 'string') {
    return false
  }

  const trimmed = text.trim()

  // Too many special characters
  if ((trimmed.match(/[^a-zA-Z0-9\s.,!?'-]/g) || []).length / trimmed.length > 0.3) {
    return true
  }

  // Repeated characters (indicates spam)
  if (/(.)\1{9,}/.test(trimmed)) {
    return true
  }

  // All uppercase (but allow some)
  const upperCount = (trimmed.match(/[A-Z]/g) || []).length
  if (upperCount / trimmed.length > 0.8 && trimmed.length > 20) {
    return true
  }

  return false
}

/**
 * Format bytes for display
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

/**
 * Validate dream title
 */
export function validateDreamTitle(title: string): ValidationResult {
  const fieldErrors: Record<string, string> = {}

  if (!title || typeof title !== 'string') {
    return {
      isValid: false,
      error: 'Title is required',
      fieldErrors: { title: 'Invalid title' }
    }
  }

  const trimmed = title.trim()

  if (trimmed.length === 0) {
    fieldErrors.title = 'Title cannot be empty'
  } else if (trimmed.length < 3) {
    fieldErrors.title = 'Title too short (minimum 3 characters)'
  } else if (trimmed.length > 100) {
    fieldErrors.title = 'Title too long (maximum 100 characters)'
  }

  return {
    isValid: Object.keys(fieldErrors).length === 0,
    error: Object.keys(fieldErrors).length > 0 ? Object.values(fieldErrors)[0] : undefined,
    fieldErrors
  }
}
