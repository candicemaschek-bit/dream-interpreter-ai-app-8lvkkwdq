/**
 * TIER COSTS - SINGLE SOURCE OF TRUTH
 * All USD cost calculations for Dreamcatcher AI
 * 
 * ⚠️ IMPORTANT: This is the ONLY file that should define cost constants.
 * All other modules should import from here.
 * 
 * Last Updated: 2025-12-08
 */

// ===== IMAGE GENERATION COSTS =====
export const IMAGE_COSTS = {
  /** HD Image (1024x1024) - Standard dream visualization */
  HD_IMAGE: 0.004,
  /** SD Image (512x512) - Lower resolution for previews */
  SD_IMAGE: 0.002,
  /** Watermarked SD Image - Used for free tier previews */
  WATERMARKED_SD_IMAGE: 0.002,
  /** Tokens estimate per image generation */
  TOKENS_ESTIMATE: 7500,
} as const;

// ===== TRANSCRIPTION COSTS (Whisper API) =====
export const TRANSCRIPTION_COSTS = {
  /** Cost per minute of audio transcription */
  PER_MINUTE: 0.006,
  /** Minimum charge per transcription call */
  MIN_CHARGE: 0.001,
} as const;

// ===== REFLECT AI (Text Generation) COSTS =====
export const REFLECT_AI_COSTS = {
  /** Average cost per message (GPT-4.1-mini) */
  COST_PER_MESSAGE: 0.0009,
  /** Input cost per 1K tokens */
  INPUT_PER_1K_TOKENS: 0.00015,
  /** Output cost per 1K tokens */
  OUTPUT_PER_1K_TOKENS: 0.0006,
  /** Average input tokens per message */
  AVG_INPUT_TOKENS: 500,
  /** Average output tokens per message */
  AVG_OUTPUT_TOKENS: 800,
} as const;

// ===== SYMBOLICA AI (Symbol Analysis) COSTS =====
export const SYMBOLICA_AI_COSTS = {
  /** Average cost per symbol analysis */
  COST_PER_ANALYSIS: 0.0012,
  /** Input cost per 1K tokens */
  INPUT_PER_1K_TOKENS: 0.00015,
  /** Output cost per 1K tokens */
  OUTPUT_PER_1K_TOKENS: 0.0006,
  /** Average input tokens per analysis */
  AVG_INPUT_TOKENS: 600,
  /** Average output tokens per analysis */
  AVG_OUTPUT_TOKENS: 1000,
} as const;

// ===== COMMUNITY (Sharing) COSTS =====
export const COMMUNITY_COSTS = {
  /** Cost per share action (DB write) */
  SHARE_COST: 0.0001,
  /** Cost per like action */
  LIKE_COST: 0.00005,
  /** Cost per view increment */
  VIEW_TRACKING: 0.00001,
} as const;

// ===== VIDEO GENERATION COSTS =====
export const VIDEO_COSTS = {
  /**
   * Dreamcatcher AI (6-second) - Cost-optimized model
   * Breakdown:
   * - Base processing: $0.10
   * - Mood detection: $0.0003
   * - Frame generation: 2 × $0.004 = $0.008
   * - Storage: $0.004
   * Total: ~$0.1123
   */
  DREAMCATCHER_6S: 0.1123,
  
  /**
   * Dreamworlds (45-second) - Standard cinematic
   * Breakdown:
   * - Base processing: $1.50
   * - Frame generation: 15 × $0.004 = $0.06
   * - Mood detection: $0.0003
   * - Storage: $0.01
   * Total: ~$1.57
   */
  DREAMWORLDS_45S: 1.57,
  
  /**
   * Dreamworlds VIP - Extended cinematic
   * Breakdown:
   * - Base processing: $3.00
   * - Frame generation: 15 × $0.004 = $0.06
   * - Mood detection: $0.0003
   * - Storage: $0.012
   * Total: ~$3.07
   */
  DREAMWORLDS_VIP: 3.07,
  
  /** Cost per generated frame */
  PER_FRAME: 0.004,
  /** Base processing cost */
  BASE_PROCESSING: 0.10,
  /** Mood detection AI call */
  MOOD_DETECTION: 0.0003,
  /** Storage cost for video */
  STORAGE_COST: 0.004,
} as const;

// ===== TTS (Text-to-Speech) COSTS =====
export const TTS_COSTS = {
  /** Cost per character ($15 per 1M characters) */
  PER_CHARACTER: 0.000015,
  /** Average cost per dream narration (~2800 chars) */
  AVG_DREAM_NARRATION: 0.042,
  /** Average words per minute (speaking rate) */
  AVERAGE_WORDS_PER_MINUTE: 150,
  /** Average characters per word */
  CHARACTERS_PER_WORD: 5,
} as const;

// ===== DREAM ANALYSIS COSTS =====
export const DREAM_ANALYSIS_COSTS = {
  /** Title generation cost */
  TITLE_GENERATION: 0.0001,
  /** Tags extraction cost */
  TAGS_EXTRACTION: 0.0002,
  /** AI interpretation cost */
  INTERPRETATION: 0.0008,
  /** Image generation (dream visualization) */
  IMAGE_GENERATION: 0.004,
  /** Total cost per complete dream analysis */
  TOTAL_PER_DREAM: 0.0051,
} as const;

// ===== TEXT GENERATION MODEL COSTS =====
export const TEXT_MODEL_COSTS = {
  'gpt-4.1-mini': {
    INPUT: 0.00015 / 1000,  // $0.15 per 1M input tokens
    OUTPUT: 0.0006 / 1000,  // $0.60 per 1M output tokens
  },
  'gpt-4.1': {
    INPUT: 0.0025 / 1000,   // $2.50 per 1M input tokens
    OUTPUT: 0.01 / 1000,    // $10.00 per 1M output tokens
  },
  'gemini-2.5-flash': {
    INPUT: 0.0001 / 1000,   // $0.10 per 1M input tokens
    OUTPUT: 0.0004 / 1000,  // $0.40 per 1M output tokens
  },
} as const;

// ===== STORAGE COSTS =====
export const STORAGE_COSTS = {
  /** Cost per MB per month */
  PER_MB_MONTH: 0.000023,  // $0.023 per GB-month
} as const;

// ===== DERIVED CALCULATIONS =====

/**
 * Cost for 2 watermarked SD images (free tier preview)
 */
export const TWO_WATERMARKED_SD_IMAGES_COST = IMAGE_COSTS.WATERMARKED_SD_IMAGE * 2; // $0.004

/**
 * Calculate ReflectAI message cost
 */
export function calculateReflectAICost(
  inputTokens: number = REFLECT_AI_COSTS.AVG_INPUT_TOKENS,
  outputTokens: number = REFLECT_AI_COSTS.AVG_OUTPUT_TOKENS
): number {
  return (
    (inputTokens * REFLECT_AI_COSTS.INPUT_PER_1K_TOKENS / 1000) +
    (outputTokens * REFLECT_AI_COSTS.OUTPUT_PER_1K_TOKENS / 1000)
  );
}

/**
 * Calculate Symbolica AI analysis cost
 */
export function calculateSymbolicaAICost(
  inputTokens: number = SYMBOLICA_AI_COSTS.AVG_INPUT_TOKENS,
  outputTokens: number = SYMBOLICA_AI_COSTS.AVG_OUTPUT_TOKENS
): number {
  return (
    (inputTokens * SYMBOLICA_AI_COSTS.INPUT_PER_1K_TOKENS / 1000) +
    (outputTokens * SYMBOLICA_AI_COSTS.OUTPUT_PER_1K_TOKENS / 1000)
  );
}

/**
 * Calculate TTS cost for given text
 */
export function calculateTTSCost(characterCount: number): number {
  return characterCount * TTS_COSTS.PER_CHARACTER;
}

/**
 * Calculate video generation cost by type
 */
export function calculateVideoCost(
  videoType: 'dreamcatcher' | 'dreamworlds' | 'dreamworlds-vip'
): number {
  switch (videoType) {
    case 'dreamcatcher':
      return VIDEO_COSTS.DREAMCATCHER_6S;
    case 'dreamworlds':
      return VIDEO_COSTS.DREAMWORLDS_45S;
    case 'dreamworlds-vip':
      return VIDEO_COSTS.DREAMWORLDS_VIP;
    default:
      return VIDEO_COSTS.DREAMCATCHER_6S;
  }
}

/**
 * Calculate image generation cost
 */
export function calculateImageCost(
  imageCount: number = 1,
  isHD: boolean = true
): number {
  const perImageCost = isHD ? IMAGE_COSTS.HD_IMAGE : IMAGE_COSTS.SD_IMAGE;
  return perImageCost * imageCount;
}

/**
 * Calculate text generation cost by model
 */
export function calculateTextGenerationCost(
  model: keyof typeof TEXT_MODEL_COSTS,
  inputTokens: number,
  outputTokens: number
): number {
  const pricing = TEXT_MODEL_COSTS[model];
  if (!pricing) return 0;
  
  return (inputTokens * pricing.INPUT) + (outputTokens * pricing.OUTPUT);
}

/**
 * Calculate transcription cost
 */
export function calculateTranscriptionCost(durationMinutes: number): number {
  const cost = durationMinutes * TRANSCRIPTION_COSTS.PER_MINUTE;
  return Math.max(cost, TRANSCRIPTION_COSTS.MIN_CHARGE);
}

// ===== MONTHLY COST ESTIMATES BY TIER =====
export const MONTHLY_COST_ESTIMATES = {
  /**
   * Dreamer (Free): 2 dreams lifetime
   * - Dreams: $0.0102 (2 × $0.0051)
   * - Community: ~$0.001
   * Total: ~$0.01
   */
  dreamer: {
    dreams: 0.0102,
    reflectAI: 0,
    symbolica: 0,
    tts: 0,
    video: 0,
    community: 0.001,
    total: 0.01,
  },
  
  /**
   * Visionary (Pro): 10 dreams/month
   * - Dreams: $0.051 (10 × $0.0051)
   * - TTS: ~$0.42 (10 narrations)
   * - Community: ~$0.005
   * Total: ~$0.48
   */
  visionary: {
    dreams: 0.051,
    reflectAI: 0,
    symbolica: 0,
    tts: 0.42,
    video: 0,
    community: 0.005,
    total: 0.48,
  },
  
  /**
   * Architect (Premium): 20 dreams/month
   * - Dreams: $0.102 (20 × $0.0051)
   * - ReflectAI: ~$0.045 (50 messages)
   * - Symbolica: ~$0.06 (50 analyses)
   * - TTS: ~$0.84 (20 narrations)
   * - Video: ~$0.56 (5 × $0.1123)
   * - Community: ~$0.01
   * Total: ~$1.62
   */
  architect: {
    dreams: 0.102,
    reflectAI: 0.045,
    symbolica: 0.06,
    tts: 0.84,
    video: 0.56,
    community: 0.01,
    total: 1.62,
  },
  
  /**
   * Star (VIP): 25 dreams/month
   * - Dreams: $0.1275 (25 × $0.0051)
   * - ReflectAI: ~$0.11 (unlimited, estimated 120 msgs)
   * - Symbolica: ~$0.15 (unlimited, estimated 125 analyses)
   * - TTS: ~$1.05 (25 narrations)
   * - Video: ~$4.70 (1 Dreamworlds + 5 purchases)
   * - Community: ~$0.02
   * Total: ~$6.08
   */
  star: {
    dreams: 0.1275,
    reflectAI: 0.11,
    symbolica: 0.15,
    tts: 1.05,
    video: 4.70,
    community: 0.02,
    total: 6.08,
  },
} as const;

// ===== LEGACY PRICING EXPORT (for backward compatibility) =====
/**
 * @deprecated Use individual cost constants instead
 */
export const PRICING = {
  IMAGE_GENERATION: {
    PER_IMAGE: IMAGE_COSTS.HD_IMAGE,
    TOKENS_ESTIMATE: IMAGE_COSTS.TOKENS_ESTIMATE,
  },
  TEXT_GENERATION: TEXT_MODEL_COSTS,
  VIDEO_GENERATION: {
    PER_SECOND: 0.05,
    BASE_COST: VIDEO_COSTS.BASE_PROCESSING,
  },
  STORAGE: {
    PER_MB_MONTH: STORAGE_COSTS.PER_MB_MONTH,
  },
  TTS: {
    PER_CHARACTER: TTS_COSTS.PER_CHARACTER,
    AVERAGE_WORDS_PER_MINUTE: TTS_COSTS.AVERAGE_WORDS_PER_MINUTE,
    CHARACTERS_PER_WORD: TTS_COSTS.CHARACTERS_PER_WORD,
  },
} as const;

export type TextModelKey = keyof typeof TEXT_MODEL_COSTS;
