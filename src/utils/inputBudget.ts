/**
 * Shared input budget utilities
 *
 * Goal: enforce a single, consistent maximum input size across all ingestion boundaries
 * (typing/paste, transcription, and pre-AI prompt building).
 */

// Display limit shown to user - enforced at input level
export const GLOBAL_DREAM_INPUT_CAP = 3_000

// Hard limit for individual dream entries - prevents abuse
export const DREAM_INPUT_HARD_LIMIT = 2_000

export interface BudgetEnforcementResult {
  text: string
  wasTruncated: boolean
  originalLength: number
  cap: number
}

export function enforceDreamInputCap(
  text: string,
  cap: number = GLOBAL_DREAM_INPUT_CAP
): BudgetEnforcementResult {
  const safeText = typeof text === 'string' ? text : ''
  const originalLength = safeText.length

  if (originalLength <= cap) {
    return { text: safeText, wasTruncated: false, originalLength, cap }
  }

  return {
    text: safeText.slice(0, cap),
    wasTruncated: true,
    originalLength,
    cap
  }
}
