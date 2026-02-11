/**
 * Symbolic Guide Service - The Care Taker of the Symbol Orchard
 * Manages all symbol growth, nurturing, and pattern recognition
 */

import { blink } from '../blink/client'
import { supabaseService } from '../lib/supabaseService'
import type {
  DreamSymbol,
  DreamSymbolRow,
  SymbolGrowthPhase,
  ArchetypeCategory,
  ElementalCategory,
  GardenStats,
  CareAction,
  castDreamSymbol
} from '../types/symbolica'
import {
  calculateGrowthPhase,
  calculateGrowthProgress,
  calculateWaterLevel,
  needsWatering
} from '../types/symbolica'
import {
  SYMBOLICA_SYSTEM_PROMPT,
  buildSymbolInterpretationPrompt,
  buildSymbolExtractionPrompt,
  buildPatternAnalysisPrompt,
  buildPersonalMeaningPrompt,
  buildWateringPrompt,
  buildCrossPollinationPrompt,
  buildHarvestPrompt
} from '../config/symbolicaPrompts'

/**
 * The Symbolic Guide - Care Taker of the Symbol Orchard
 */
export const SymbolicGuide = {
  /**
   * PLANTING: Add a new symbol to the Orchard
   */
  async plantSymbol(
    userId: string,
    symbol: string,
    context: string,
    options?: {
      archetype?: ArchetypeCategory
      element?: ElementalCategory
      jungianMeaning?: string
      emotionalValence?: number
    }
  ): Promise<DreamSymbol | null> {
    try {
      const client = supabaseService.supabase
      if (!client) return null

      const now = new Date().toISOString()
      const id = `sym_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      // Check if symbol already exists for this user
      const existing = await this.findSymbol(userId, symbol)
      
      if (existing) {
        // Water existing symbol instead
        return await this.waterSymbol(userId, existing.id, context)
      }
      
      // Get AI interpretation for new symbol if no jungian meaning provided
      let jungianMeaning = options?.jungianMeaning || ''
      let archetype = options?.archetype || 'unknown'
      
      if (!jungianMeaning) {
        const interpretation = await this.getSymbolInterpretation(symbol, 1, [context])
        if (interpretation) {
          jungianMeaning = interpretation.universalMeaning || ''
          archetype = interpretation.archetype || 'unknown'
        }
      }
      
      const contexts = JSON.stringify([context])
      
      const { error } = await client
        .from('dream_symbols_v2')
        .insert({
          id,
          user_id: userId,
          symbol: symbol.toLowerCase().trim(),
          archetype_category: archetype,
          jungian_meaning: jungianMeaning,
          personal_meaning: '',
          occurrence_count: 1,
          contexts,
          emotional_valence: options?.emotionalValence ?? 0,
          first_seen: now,
          last_seen: now,
          created_at: now,
          updated_at: now
        })
      
      if (error) throw error
      
      // Return the newly planted symbol
      return await this.getSymbolById(userId, id)
    } catch (error) {
      console.error('Error planting symbol:', error)
      return null
    }
  },
  
  /**
   * WATERING: Engage with symbol, update context and refresh vitality
   */
  async waterSymbol(
    userId: string,
    symbolId: string,
    newContext?: string
  ): Promise<DreamSymbol | null> {
    try {
      const client = supabaseService.supabase
      if (!client) return null

      const symbol = await this.getSymbolById(userId, symbolId)
      if (!symbol) return null
      
      const now = new Date().toISOString()
      const contexts = [...symbol.contexts]
      
      if (newContext && !contexts.includes(newContext)) {
        contexts.push(newContext)
        // Keep only last 20 contexts
        if (contexts.length > 20) {
          contexts.shift()
        }
      }
      
      await client
        .from('dream_symbols_v2')
        .update({
          occurrence_count: symbol.occurrenceCount + 1,
          contexts: JSON.stringify(contexts),
          last_seen: now,
          updated_at: now
        })
        .eq('id', symbolId)
      
      return await this.getSymbolById(userId, symbolId)
    } catch (error) {
      console.error('Error watering symbol:', error)
      return null
    }
  },
  
  /**
   * FERTILIZING: Add or update personal meaning
   */
  async fertilizeSymbol(
    userId: string,
    symbolId: string,
    personalMeaning: string
  ): Promise<DreamSymbol | null> {
    try {
      const client = supabaseService.supabase
      if (!client) return null

      const now = new Date().toISOString()
      
      await client
        .from('dream_symbols_v2')
        .update({
          personal_meaning: personalMeaning,
          last_seen: now,
          updated_at: now
        })
        .eq('id', symbolId)
      
      return await this.getSymbolById(userId, symbolId)
    } catch (error) {
      console.error('Error fertilizing symbol:', error)
      return null
    }
  },
  
  /**
   * PRUNING: Refine/edit the jungian or personal meaning
   */
  async pruneSymbol(
    userId: string,
    symbolId: string,
    updates: {
      jungianMeaning?: string
      personalMeaning?: string
      archetypeCategory?: ArchetypeCategory
      emotionalValence?: number
    }
  ): Promise<DreamSymbol | null> {
    try {
      const client = supabaseService.supabase
      if (!client) return null

      const now = new Date().toISOString()
      const updateData: any = { updated_at: now }
      
      if (updates.jungianMeaning !== undefined) {
        updateData.jungian_meaning = updates.jungianMeaning
      }
      if (updates.personalMeaning !== undefined) {
        updateData.personal_meaning = updates.personalMeaning
      }
      if (updates.archetypeCategory !== undefined) {
        updateData.archetype_category = updates.archetypeCategory
      }
      if (updates.emotionalValence !== undefined) {
        updateData.emotional_valence = updates.emotionalValence
      }
      
      await client
        .from('dream_symbols_v2')
        .update(updateData)
        .eq('id', symbolId)
      
      return await this.getSymbolById(userId, symbolId)
    } catch (error) {
      console.error('Error pruning symbol:', error)
      return null
    }
  },
  
  /**
   * Get a single symbol by ID
   */
  async getSymbolById(userId: string, symbolId: string): Promise<DreamSymbol | null> {
    try {
      const client = supabaseService.supabase
      if (!client) return null

      const { data: symbol, error } = await client
        .from('dream_symbols_v2')
        .select('*')
        .eq('id', symbolId)
        .single()
      
      if (error || !symbol || symbol.user_id !== userId) return null
      
      return castSymbolRow(symbol)
    } catch (error) {
      console.error('Error getting symbol:', error)
      return null
    }
  },
  
  /**
   * Find symbol by name for a user
   */
  async findSymbol(userId: string, symbolName: string): Promise<DreamSymbol | null> {
    try {
      const client = supabaseService.supabase
      if (!client) return null

      const normalizedName = symbolName.toLowerCase().trim()
      
      const { data: result, error } = await client
        .from('dream_symbols_v2')
        .select('*')
        .eq('user_id', userId)
        .eq('symbol', normalizedName)
        .limit(1)
      
      if (error || !result || result.length === 0) return null
      
      return castSymbolRow(result[0])
    } catch (error) {
      console.error('Error finding symbol:', error)
      return null
    }
  },
  
  /**
   * Get all symbols in the user's Orchard
   */
  async getAllSymbols(
    userId: string,
    options?: {
      archetype?: ArchetypeCategory
      growthPhase?: SymbolGrowthPhase
      needsWatering?: boolean
      sortBy?: 'recent' | 'oldest' | 'most_seen' | 'growth' | 'name'
      limit?: number
    }
  ): Promise<DreamSymbol[]> {
    try {
      const client = supabaseService.supabase
      if (!client) return []

      let query = client
        .from('dream_symbols_v2')
        .select('*')
        .eq('user_id', userId)
      
      if (options?.sortBy === 'oldest') query = query.order('first_seen', { ascending: true })
      else if (options?.sortBy === 'most_seen') query = query.order('occurrence_count', { ascending: false })
      else if (options?.sortBy === 'name') query = query.order('symbol', { ascending: true })
      else query = query.order('last_seen', { ascending: false })
      
      if (options?.limit) query = query.limit(options.limit)
      else query = query.limit(100)
      
      if (options?.archetype) {
        query = query.eq('archetype_category', options.archetype)
      }
      
      const { data: rows, error } = await query
      
      if (error || !rows) return []
      
      let symbols = rows.map(castSymbolRow)
      
      // Filter by growth phase in memory (computed field)
      if (options?.growthPhase) {
        symbols = symbols.filter(s => s.growthPhase === options.growthPhase)
      }
      
      // Filter by needs watering in memory (computed field)
      if (options?.needsWatering) {
        symbols = symbols.filter(s => s.needsWatering)
      }
      
      // Sort by growth if needed (computed field)
      if (options?.sortBy === 'growth') {
        symbols.sort((a, b) => b.growthProgress - a.growthProgress)
      }
      
      return symbols
    } catch (error) {
      console.error('Error getting all symbols:', error)
      return []
    }
  },
  
  /**
   * Get garden statistics
   */
  async getGardenStats(userId: string): Promise<GardenStats> {
    try {
      const client = supabaseService.supabase
      if (!client) return {
        totalSymbols: 0,
        seedCount: 0,
        sproutCount: 0,
        bloomCount: 0,
        flourishCount: 0,
        harvestCount: 0,
        needsWateringCount: 0,
        mostActiveArchetype: null,
        recentlyDiscovered: [],
        gardenHealth: 0
      }

      const symbols = await this.getAllSymbols(userId, { limit: 500 })
      
      const stats: GardenStats = {
        totalSymbols: symbols.length,
        seedCount: symbols.filter(s => s.growthPhase === 'seed').length,
        sproutCount: symbols.filter(s => s.growthPhase === 'sprout').length,
        bloomCount: symbols.filter(s => s.growthPhase === 'bloom').length,
        flourishCount: symbols.filter(s => s.growthPhase === 'flourish').length,
        harvestCount: symbols.filter(s => s.growthPhase === 'harvest').length,
        needsWateringCount: symbols.filter(s => s.needsWatering).length,
        mostActiveArchetype: null,
        recentlyDiscovered: [],
        gardenHealth: 0
      }
      
      // Find most active archetype
      const archetypeCounts: Record<string, number> = {}
      symbols.forEach(s => {
        archetypeCounts[s.archetypeCategory] = (archetypeCounts[s.archetypeCategory] || 0) + s.occurrenceCount
      })
      const maxArchetype = Object.entries(archetypeCounts)
        .filter(([key]) => key !== 'unknown')
        .sort((a, b) => b[1] - a[1])[0]
      stats.mostActiveArchetype = maxArchetype ? maxArchetype[0] as ArchetypeCategory : null
      
      // Get recently discovered (last 7 days)
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      stats.recentlyDiscovered = symbols
        .filter(s => new Date(s.firstSeen) > weekAgo)
        .map(s => s.symbol)
        .slice(0, 5)
      
      // Calculate garden health (0-100)
      if (symbols.length === 0) {
        stats.gardenHealth = 0
      } else {
        const avgWaterLevel = symbols.reduce((sum, s) => sum + s.waterLevel, 0) / symbols.length
        const avgGrowth = symbols.reduce((sum, s) => sum + s.growthProgress, 0) / symbols.length
        const wellTendedRatio = symbols.filter(s => !s.needsWatering).length / symbols.length
        stats.gardenHealth = Math.round((avgWaterLevel * 0.3 + avgGrowth * 0.3 + wellTendedRatio * 100 * 0.4))
      }
      
      return stats
    } catch (error) {
      console.error('Error getting garden stats:', error)
      return {
        totalSymbols: 0,
        seedCount: 0,
        sproutCount: 0,
        bloomCount: 0,
        flourishCount: 0,
        harvestCount: 0,
        needsWateringCount: 0,
        mostActiveArchetype: null,
        recentlyDiscovered: [],
        gardenHealth: 0
      }
    }
  },
  
  /**
   * Extract symbols from dream content and plant them
   */
  async extractAndPlantFromDream(
    userId: string,
    dreamTitle: string,
    dreamDescription: string
  ): Promise<DreamSymbol[]> {
    try {
      const prompt = buildSymbolExtractionPrompt(dreamTitle, dreamDescription)
      
      const { text } = await blink.ai.generateText({
        messages: [
          { role: 'system', content: SYMBOLICA_SYSTEM_PROMPT },
          { role: 'user', content: prompt }
        ],
        maxTokens: 1500,
        temperature: 0.7
      })
      
      // Parse JSON response
      const jsonMatch = text.match(/\[[\s\S]*\]/)
      if (!jsonMatch) {
        console.warn('No JSON array found in symbol extraction response')
        return []
      }
      
      const extractedSymbols = JSON.parse(jsonMatch[0]) as Array<{
        symbol: string
        archetype: ArchetypeCategory
        element: ElementalCategory
        jungianMeaning: string
        context: string
        emotionalValence: number
      }>
      
      const plantedSymbols: DreamSymbol[] = []
      
      for (const extracted of extractedSymbols) {
        const planted = await this.plantSymbol(
          userId,
          extracted.symbol,
          extracted.context,
          {
            archetype: extracted.archetype,
            element: extracted.element,
            jungianMeaning: extracted.jungianMeaning,
            emotionalValence: extracted.emotionalValence
          }
        )
        if (planted) {
          plantedSymbols.push(planted)
        }
      }
      
      return plantedSymbols
    } catch (error) {
      console.error('Error extracting symbols from dream:', error)
      return []
    }
  },
  
  /**
   * Get AI interpretation for a symbol
   */
  async getSymbolInterpretation(
    symbol: string,
    occurrenceCount: number,
    contexts: string[],
    personalMeaning?: string
  ): Promise<{
    universalMeaning: string
    archetype: ArchetypeCategory
    personalQuestions: string[]
    relatedSymbols: string[]
    careSuggestion: string
  } | null> {
    try {
      const prompt = buildSymbolInterpretationPrompt(
        symbol,
        occurrenceCount,
        contexts,
        personalMeaning
      )
      
      const { text } = await blink.ai.generateText({
        messages: [
          { role: 'system', content: SYMBOLICA_SYSTEM_PROMPT },
          { role: 'user', content: prompt }
        ],
        maxTokens: 1000,
        temperature: 0.7
      })
      
      // Parse response - extract key sections
      const universalMatch = text.match(/Universal Meaning[:\s]*([^\n]+(?:\n(?![*#\d]).*)*)/i)
      const archetypeMatch = text.match(/(?:Jungian|Archetype)[:\s]*([^\n]+)/i)
      const questionsMatch = text.match(/Personal Growth Questions[:\s]*([\s\S]*?)(?=\n\*\*|$)/i)
      const companionsMatch = text.match(/Garden Companions[:\s]*([\s\S]*?)(?=\n\*\*|$)/i)
      const careMatch = text.match(/Care Suggestion[:\s]*([^\n]+(?:\n(?![*#\d]).*)*)/i)
      
      // Extract archetype category
      let archetype: ArchetypeCategory = 'unknown'
      if (archetypeMatch) {
        const archetypeText = archetypeMatch[1].toLowerCase()
        if (archetypeText.includes('self')) archetype = 'the_self'
        else if (archetypeText.includes('shadow')) archetype = 'the_shadow'
        else if (archetypeText.includes('anim')) archetype = 'anima_animus'
        else if (archetypeText.includes('wise') || archetypeText.includes('elder')) archetype = 'wise_elder'
        else if (archetypeText.includes('trick')) archetype = 'the_trickster'
        else if (archetypeText.includes('hero')) archetype = 'the_hero'
        else if (archetypeText.includes('mother') || archetypeText.includes('father')) archetype = 'mother_father'
        else if (archetypeText.includes('child')) archetype = 'the_child'
      }
      
      // Extract questions
      const personalQuestions: string[] = []
      if (questionsMatch) {
        const qText = questionsMatch[1]
        const matches = qText.match(/\d+\.\s*([^\n]+)/g) || qText.match(/[-•]\s*([^\n]+)/g)
        if (matches) {
          personalQuestions.push(...matches.map(m => m.replace(/^[\d\.\-•\s]+/, '').trim()).slice(0, 3))
        }
      }
      
      // Extract related symbols
      const relatedSymbols: string[] = []
      if (companionsMatch) {
        const cText = companionsMatch[1]
        const matches = cText.match(/\d+\.\s*([^\n-]+)/g) || cText.match(/[-•]\s*([^\n]+)/g)
        if (matches) {
          relatedSymbols.push(...matches.map(m => m.replace(/^[\d\.\-•\s]+/, '').trim().split(/[,\-]/)[0].trim()).slice(0, 3))
        }
      }
      
      return {
        universalMeaning: universalMatch ? universalMatch[1].trim() : '',
        archetype,
        personalQuestions,
        relatedSymbols,
        careSuggestion: careMatch ? careMatch[1].trim() : ''
      }
    } catch (error) {
      console.error('Error getting symbol interpretation:', error)
      return null
    }
  },
  
  /**
   * Get watering guidance for a symbol that needs attention
   */
  async getWateringGuidance(symbol: DreamSymbol): Promise<string> {
    try {
      const client = supabaseService.supabase
      if (!client) return 'This symbol could use some attention. Take a moment to reflect on what it means to you.'

      const daysSinceLastSeen = Math.floor(
        (new Date().getTime() - new Date(symbol.lastSeen).getTime()) / (1000 * 60 * 60 * 24)
      )
      
      const prompt = buildWateringPrompt(
        symbol.symbol,
        daysSinceLastSeen,
        symbol.growthPhase,
        symbol.personalMeaning
      )
      
      const { text } = await blink.ai.generateText({
        messages: [
          { role: 'system', content: SYMBOLICA_SYSTEM_PROMPT },
          { role: 'user', content: prompt }
        ],
        maxTokens: 500,
        temperature: 0.8
      })
      
      return text
    } catch (error) {
      console.error('Error getting watering guidance:', error)
      return 'This symbol could use some attention. Take a moment to reflect on what it means to you.'
    }
  },
  
  /**
   * Get pattern analysis for the entire garden
   */
  async getGardenPatternAnalysis(userId: string): Promise<string> {
    try {
      const client = supabaseService.supabase
      if (!client) return 'Unable to analyze garden patterns at this time.'

      const symbols = await this.getAllSymbols(userId, { sortBy: 'most_seen', limit: 20 })
      
      if (symbols.length < 3) {
        return 'Your garden is just beginning to grow. Keep logging dreams to discover patterns!'
      }
      
      const prompt = buildPatternAnalysisPrompt(
        symbols.map(s => ({
          symbol: s.symbol,
          occurrenceCount: s.occurrenceCount,
          archetype: s.archetypeCategory,
          lastSeen: s.lastSeen
        }))
      )
      
      const { text } = await blink.ai.generateText({
        messages: [
          { role: 'system', content: SYMBOLICA_SYSTEM_PROMPT },
          { role: 'user', content: prompt }
        ],
        maxTokens: 800,
        temperature: 0.7
      })
      
      return text
    } catch (error) {
      console.error('Error getting garden pattern analysis:', error)
      return 'Unable to analyze garden patterns at this time.'
    }
  },
  
  /**
   * Get harvest celebration message for a mature symbol
   */
  async celebrateHarvest(symbol: DreamSymbol): Promise<string> {
    try {
      const client = supabaseService.supabase
      if (!client) return `🍎 Congratulations! Your understanding of "${symbol.symbol}" has reached full maturity. This symbol's wisdom is now ready to guide you in waking life.`

      const prompt = buildHarvestPrompt(
        symbol.symbol,
        symbol.personalMeaning,
        symbol.jungianMeaning,
        symbol.occurrenceCount,
        symbol.firstSeen
      )
      
      const { text } = await blink.ai.generateText({
        messages: [
          { role: 'system', content: SYMBOLICA_SYSTEM_PROMPT },
          { role: 'user', content: prompt }
        ],
        maxTokens: 600,
        temperature: 0.8
      })
      
      return text
    } catch (error) {
      console.error('Error celebrating harvest:', error)
      return `🍎 Congratulations! Your understanding of "${symbol.symbol}" has reached full maturity. This symbol's wisdom is now ready to guide you in waking life.`
    }
  },
  
  /**
   * Delete a symbol from the Orchard
   */
  async removeSymbol(userId: string, symbolId: string): Promise<boolean> {
    try {
      const client = supabaseService.supabase
      if (!client) return false
      
      await client.from('dream_symbols_v2').delete().eq('id', symbolId)
      return true
    } catch (error) {
      console.error('Error removing symbol:', error)
      return false
    }
  }
}

/**
 * Helper to cast database row to application type
 */
function castSymbolRow(row: any): DreamSymbol {
  return {
    id: row.id,
    userId: row.user_id,
    symbol: row.symbol,
    archetypeCategory: row.archetype_category as ArchetypeCategory,
    jungianMeaning: row.jungian_meaning,
    personalMeaning: row.personal_meaning,
    occurrenceCount: Number(row.occurrence_count),
    contexts: typeof row.contexts === 'string' ? JSON.parse(row.contexts) : row.contexts,
    emotionalValence: Number(row.emotional_valence),
    firstSeen: row.first_seen,
    lastSeen: row.last_seen,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    growthPhase: calculateGrowthPhase(Number(row.occurrence_count), row.last_seen),
    growthProgress: calculateGrowthProgress(Number(row.occurrence_count)),
    waterLevel: calculateWaterLevel(row.last_seen),
    needsWatering: needsWatering(row.last_seen)
  }
}

export default SymbolicGuide