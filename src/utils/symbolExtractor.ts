/**
 * Symbol Extractor Utility
 * Automatically extracts and plants symbols from dream interpretations
 * Works in the background after dream interpretation to populate Symbol Orchard
 */

import { SymbolicGuide } from './symbolicGuide'
import { canAccessSymbolicaAI, type SubscriptionTier } from '../config/tierCapabilities'

/**
 * Extract and plant symbols from a dream interpretation
 * Called automatically after dream is interpreted (for Premium+ users)
 */
export async function extractAndPlantSymbolsFromDream(
  userId: string,
  tier: SubscriptionTier,
  dreamTitle: string,
  dreamDescription: string,
  tags?: string[]
): Promise<void> {
  try {
    // Only extract for Premium+ users who have Symbol Orchard access
    if (!canAccessSymbolicaAI(tier)) {
      console.log('[SymbolExtractor] User tier does not have Symbol Orchard access:', tier)
      return
    }

    console.log('[SymbolExtractor] Extracting symbols from dream:', dreamTitle)

    // Use the Symbolic Guide to extract and plant symbols
    const plantedSymbols = await SymbolicGuide.extractAndPlantFromDream(
      userId,
      dreamTitle,
      dreamDescription
    )

    console.log(`[SymbolExtractor] Planted ${plantedSymbols.length} symbols from dream`)

    // If tags were provided but not extracted by AI, plant them as simple symbols
    if (tags && tags.length > 0) {
      for (const tag of tags) {
        // Skip very short or generic tags
        if (tag.length < 2) continue
        
        // Check if this tag was already planted
        const existing = plantedSymbols.find(
          s => s.symbol.toLowerCase() === tag.toLowerCase()
        )
        
        if (!existing) {
          // Plant tag as a simple symbol without AI interpretation
          await SymbolicGuide.plantSymbol(
            userId,
            tag,
            `Appeared in dream: "${dreamTitle}"`
          )
        }
      }
    }

    console.log('[SymbolExtractor] Symbol extraction complete')
  } catch (error) {
    // Log but don't throw - symbol extraction is a background process
    console.error('[SymbolExtractor] Error extracting symbols:', error)
  }
}

/**
 * Simplified symbol extraction that just uses existing tags
 * Doesn't require AI call - faster for basic symbol tracking
 */
export async function plantTagsAsSymbols(
  userId: string,
  tier: SubscriptionTier,
  dreamTitle: string,
  tags: string[]
): Promise<void> {
  try {
    if (!canAccessSymbolicaAI(tier)) {
      return
    }

    if (!tags || tags.length === 0) {
      return
    }

    console.log('[SymbolExtractor] Planting tags as symbols:', tags)

    for (const tag of tags) {
      if (tag.length < 2) continue
      
      try {
        await SymbolicGuide.plantSymbol(
          userId,
          tag,
          `From dream: "${dreamTitle}"`
        )
      } catch (error) {
        console.warn(`[SymbolExtractor] Failed to plant tag "${tag}":`, error)
      }
    }
  } catch (error) {
    console.error('[SymbolExtractor] Error planting tags:', error)
  }
}

/**
 * Water existing symbols when they appear in a new dream
 * Call this when a dream is interpreted to update existing symbols
 */
export async function waterSymbolsFromDream(
  userId: string,
  tier: SubscriptionTier,
  dreamTitle: string,
  tags: string[]
): Promise<void> {
  try {
    if (!canAccessSymbolicaAI(tier)) {
      return
    }

    if (!tags || tags.length === 0) {
      return
    }

    for (const tag of tags) {
      if (tag.length < 2) continue
      
      try {
        // Find existing symbol
        const existingSymbol = await SymbolicGuide.findSymbol(userId, tag)
        
        if (existingSymbol) {
          // Water existing symbol
          await SymbolicGuide.waterSymbol(
            userId,
            existingSymbol.id,
            `Appeared again in: "${dreamTitle}"`
          )
          console.log(`[SymbolExtractor] Watered existing symbol: ${tag}`)
        } else {
          // Plant new symbol
          await SymbolicGuide.plantSymbol(
            userId,
            tag,
            `From dream: "${dreamTitle}"`
          )
          console.log(`[SymbolExtractor] Planted new symbol: ${tag}`)
        }
      } catch (error) {
        console.warn(`[SymbolExtractor] Failed to process tag "${tag}":`, error)
      }
    }
  } catch (error) {
    console.error('[SymbolExtractor] Error watering symbols:', error)
  }
}

export default {
  extractAndPlantSymbolsFromDream,
  plantTagsAsSymbols,
  waterSymbolsFromDream
}
