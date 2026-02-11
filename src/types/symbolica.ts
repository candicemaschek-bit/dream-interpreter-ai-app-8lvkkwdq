/**
 * Symbolica AI Types
 * Types for the Symbol Orchard - a garden where dream symbols grow through nurturing phases
 */

import type { SubscriptionTier } from './subscription'

/**
 * Growth phases for symbols in the Symbol Orchard
 * Each phase represents a stage of understanding and connection
 */
export type SymbolGrowthPhase = 
  | 'seed'      // Just discovered, minimal meaning assigned
  | 'sprout'    // Starting to grow, basic interpretation available
  | 'bloom'     // Actively growing, personal meaning developing
  | 'flourish'  // Mature symbol, deep personal connection established
  | 'harvest'   // Fully understood, ready for integration into life wisdom

/**
 * Archetype categories for Jungian symbol classification
 */
export type ArchetypeCategory =
  | 'the_self'         // Mirrors, circles, mandalas
  | 'the_shadow'       // Dark figures, monsters, pursuers
  | 'anima_animus'     // Opposite-gender figures
  | 'wise_elder'       // Guides, teachers
  | 'the_trickster'    // Jesters, shapeshifters
  | 'the_hero'         // Protagonists, warriors
  | 'mother_father'    // Nurturing/authority figures
  | 'the_child'        // Innocence, new beginnings
  | 'unknown'          // Unclassified

/**
 * Elemental categories for symbol organization
 */
export type ElementalCategory =
  | 'water'     // Emotions, unconscious
  | 'fire'      // Transformation, passion
  | 'earth'     // Stability, material
  | 'air'       // Intellect, communication
  | 'animals'   // Instincts, nature aspects
  | 'numbers'   // Patterns, synchronicity
  | 'colors'    // Emotional states
  | 'locations' // States of mind
  | 'objects'   // Tools, possessions
  | 'people'    // Relationships, aspects of self
  | 'actions'   // Processes, transitions

/**
 * Symbol in the Symbol Orchard database type
 */
export interface DreamSymbolRow {
  id: string
  userId: string
  symbol: string
  archetypeCategory: string | null
  jungianMeaning: string | null
  personalMeaning: string | null
  occurrenceCount: number
  contexts: string | null // JSON array of context strings
  emotionalValence: number | null // -1 to 1, negative to positive
  firstSeen: string
  lastSeen: string
  createdAt: string
  updatedAt: string
}

/**
 * Symbol in the Symbol Orchard application type
 */
export interface DreamSymbol {
  id: string
  userId: string
  symbol: string
  archetypeCategory: ArchetypeCategory
  elementalCategory?: ElementalCategory
  jungianMeaning: string
  personalMeaning: string
  occurrenceCount: number
  contexts: string[]
  emotionalValence: number // -1 to 1
  firstSeen: string
  lastSeen: string
  createdAt: string
  updatedAt: string
  // Computed fields
  growthPhase: SymbolGrowthPhase
  growthProgress: number // 0-100 percentage
  waterLevel: number // 0-100, how recently nurtured
  needsWatering: boolean
}

/**
 * Calculate growth phase based on symbol data
 */
export function calculateGrowthPhase(symbol: {
  occurrenceCount: number
  personalMeaning: string | null
  contexts: string[]
  emotionalValence: number | null
}): SymbolGrowthPhase {
  const hasPersonalMeaning = Boolean(symbol.personalMeaning && symbol.personalMeaning.length > 10)
  const contextCount = symbol.contexts?.length || 0
  const occurrences = symbol.occurrenceCount || 1
  const hasEmotionalContext = symbol.emotionalValence !== null && symbol.emotionalValence !== 0

  // Harvest: Deep personal connection + many occurrences + multiple contexts
  if (hasPersonalMeaning && occurrences >= 10 && contextCount >= 5 && hasEmotionalContext) {
    return 'harvest'
  }
  
  // Flourish: Good personal meaning + several occurrences
  if (hasPersonalMeaning && occurrences >= 5 && contextCount >= 3) {
    return 'flourish'
  }
  
  // Bloom: Has personal meaning or good engagement
  if (hasPersonalMeaning || (occurrences >= 3 && contextCount >= 2)) {
    return 'bloom'
  }
  
  // Sprout: Some engagement beginning
  if (occurrences >= 2 || contextCount >= 1) {
    return 'sprout'
  }
  
  // Seed: Just discovered
  return 'seed'
}

/**
 * Calculate growth progress percentage
 */
export function calculateGrowthProgress(symbol: {
  occurrenceCount: number
  personalMeaning: string | null
  contexts: string[]
  emotionalValence: number | null
}): number {
  let progress = 0
  
  // Occurrences contribute up to 30%
  progress += Math.min(30, (symbol.occurrenceCount || 1) * 3)
  
  // Personal meaning contributes up to 30%
  if (symbol.personalMeaning) {
    const meaningLength = symbol.personalMeaning.length
    progress += Math.min(30, meaningLength > 100 ? 30 : meaningLength / 3.33)
  }
  
  // Contexts contribute up to 25%
  const contextCount = symbol.contexts?.length || 0
  progress += Math.min(25, contextCount * 5)
  
  // Emotional understanding contributes up to 15%
  if (symbol.emotionalValence !== null && symbol.emotionalValence !== 0) {
    progress += 15
  }
  
  return Math.min(100, Math.round(progress))
}

/**
 * Calculate water level (how recently nurtured)
 */
export function calculateWaterLevel(lastSeen: string): number {
  const lastSeenDate = new Date(lastSeen)
  const now = new Date()
  const daysSinceLastSeen = Math.floor((now.getTime() - lastSeenDate.getTime()) / (1000 * 60 * 60 * 24))
  
  // Full water if seen within 3 days
  if (daysSinceLastSeen <= 3) return 100
  
  // Gradually decrease over 30 days
  if (daysSinceLastSeen <= 30) {
    return Math.max(20, 100 - (daysSinceLastSeen - 3) * 3)
  }
  
  // Minimum water level
  return 20
}

/**
 * Check if symbol needs watering (attention)
 */
export function needsWatering(lastSeen: string): boolean {
  const waterLevel = calculateWaterLevel(lastSeen)
  return waterLevel < 60
}

/**
 * Convert database row to application symbol
 */
export function castDreamSymbol(row: DreamSymbolRow): DreamSymbol {
  const contexts = row.contexts ? JSON.parse(row.contexts) : []
  const emotionalValence = row.emotionalValence ?? 0
  
  const symbolData = {
    occurrenceCount: row.occurrenceCount,
    personalMeaning: row.personalMeaning,
    contexts,
    emotionalValence
  }
  
  return {
    id: row.id,
    userId: row.userId,
    symbol: row.symbol,
    archetypeCategory: (row.archetypeCategory as ArchetypeCategory) || 'unknown',
    jungianMeaning: row.jungianMeaning || '',
    personalMeaning: row.personalMeaning || '',
    occurrenceCount: row.occurrenceCount,
    contexts,
    emotionalValence,
    firstSeen: row.firstSeen,
    lastSeen: row.lastSeen,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    growthPhase: calculateGrowthPhase(symbolData),
    growthProgress: calculateGrowthProgress(symbolData),
    waterLevel: calculateWaterLevel(row.lastSeen),
    needsWatering: needsWatering(row.lastSeen)
  }
}

/**
 * Symbolica AI Credits database type
 */
export interface SymbolicaAICreditsRow {
  id: string
  userId: string
  subscriptionTier: 'premium' | 'vip'
  creditsTotal: number
  creditsUsed: number
  creditsRemaining: number
  resetDate: string
  createdAt: string
  updatedAt: string
}

/**
 * Symbolica AI Credits application type
 */
export interface SymbolicaAICredits {
  userId: string
  tier: 'premium' | 'vip'
  creditsTotal: number
  creditsUsed: number
  creditsRemaining: number
  resetDate: string
}

/**
 * Care action types for the Symbolic Guide
 */
export type CareAction =
  | 'water'           // Engage with symbol, add context
  | 'fertilize'       // Add personal meaning
  | 'prune'           // Refine/edit meaning
  | 'harvest'         // Mark as fully understood
  | 'plant'           // Add new symbol manually
  | 'transplant'      // Change category
  | 'cross_pollinate' // Connect related symbols

/**
 * Care log entry
 */
export interface CareLogEntry {
  id: string
  userId: string
  symbolId: string
  action: CareAction
  notes: string
  beforeState: SymbolGrowthPhase
  afterState: SymbolGrowthPhase
  createdAt: string
}

/**
 * Symbol Orchard filter options
 */
export interface SymbolOrchardFilters {
  searchQuery?: string
  archetype?: ArchetypeCategory
  element?: ElementalCategory
  growthPhase?: SymbolGrowthPhase
  needsWatering?: boolean
  sortBy: 'recent' | 'oldest' | 'most_seen' | 'growth' | 'name'
  sortOrder: 'asc' | 'desc'
}

/**
 * Symbol insight generated by Symbolica AI
 */
export interface SymbolInsight {
  id: string
  symbolId: string
  insightType: 'pattern' | 'connection' | 'growth_tip' | 'archetype_insight'
  title: string
  content: string
  confidence: number
  generatedAt: string
}

/**
 * Garden stats for the Symbol Orchard dashboard
 */
export interface GardenStats {
  totalSymbols: number
  seedCount: number
  sproutCount: number
  bloomCount: number
  flourishCount: number
  harvestCount: number
  needsWateringCount: number
  mostActiveArchetype: ArchetypeCategory | null
  recentlyDiscovered: string[]
  gardenHealth: number // 0-100
}
