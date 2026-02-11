export interface DreamDescription {
  scene?: string
  feelings?: string
  familiarPeople?: string
  fullText?: string
}

export interface Dream {
  id: string
  userId: string
  title: string
  description: string
  inputType: 'text' | 'symbols' | 'image'
  imageUrl?: string
  symbolsData?: string
  interpretation?: string
  videoUrl?: string
  tags?: string[]
  createdAt: string
  updatedAt: string
}

export interface DreamInput {
  title: string
  description: string
  inputType: 'text' | 'symbols' | 'image'
  imageUrl?: string
  symbolsData?: string
}

export interface Dreamworlds {
  id: string
  userId: string
  title: string
  description?: string
  dreamIds: string[]
  videoUrl?: string
  thumbnailUrl?: string
  durationSeconds?: number
  generatedAt: string
  createdAt: string
  updatedAt: string
}

// Checkpoint types for validation pipeline
export type CheckpointStage = 'input' | 'subscription' | 'title' | 'image' | 'integrity' | 'complete'

export interface CheckpointContext {
  userId: string
  dreamId: string
  subscriptionTier: string
  hasLaunchOffer: boolean
  dreamsUsedThisMonth: number
  dreamLimit: number
  inputContent: string
  inputType: 'text' | 'symbols' | 'image'
}

export interface TitleGenerationResult {
  title: string
  usedFallback: boolean
  fallbackReason?: string
  tokensUsed?: number
  costUsd?: number
}

export interface ImageGenerationResult {
  imageUrl: string
  success: boolean
  retryCount: number
  fallbackUsed: boolean
  errorMessage?: string
  tokensUsed?: number
  costUsd?: number
}

export interface DreamRecordIntegrity {
  isValid: boolean
  missingFields: string[]
  invalidFields: Record<string, string>
  canSave: boolean
  recommendations: string[]
}

// Interpretation parsing types
export interface InterpretationSection {
  type: 'section'
  sectionNumber: string
  title: string
  content: string
}

export interface ParsedInterpretation {
  sections: InterpretationSection[]
  guidanceContent: string
  reflectionPrompts: string[]
  overallMeaning?: string
}