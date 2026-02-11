/**
 * Community Service - Handles community dream operations
 */

import { blink } from '../blink/client'
import { supabaseService } from '../lib/supabaseService'
import type { 
  CommunityDream, 
  DreamTerritory, 
  TerritoryStats,
  DREAM_TERRITORIES 
} from '../types/community'

// Auto-detect territory based on dream content
export function detectTerritory(title: string, description: string, interpretation?: string): DreamTerritory {
  const content = `${title} ${description} ${interpretation || ''}`.toLowerCase()
  
  const territoryKeywords: Record<DreamTerritory, string[]> = {
    water: ['water', 'ocean', 'sea', 'river', 'lake', 'rain', 'swim', 'drown', 'flood', 'wave', 'beach'],
    flying: ['fly', 'flying', 'fall', 'falling', 'float', 'hover', 'height', 'sky', 'cloud', 'soar', 'wing'],
    chase: ['chase', 'run', 'running', 'pursue', 'escape', 'flee', 'hunt', 'follow', 'catch'],
    familiar: ['home', 'house', 'childhood', 'school', 'parent', 'family', 'bedroom', 'kitchen', 'yard'],
    death: ['death', 'die', 'dying', 'dead', 'funeral', 'grave', 'end', 'loss', 'grief'],
    nature: ['animal', 'dog', 'cat', 'bird', 'tree', 'forest', 'flower', 'garden', 'nature', 'wild'],
    relationships: ['love', 'friend', 'family', 'partner', 'husband', 'wife', 'child', 'mother', 'father', 'relationship'],
    work: ['work', 'job', 'office', 'boss', 'career', 'school', 'exam', 'test', 'deadline', 'meeting'],
    transformation: ['change', 'transform', 'grow', 'become', 'morph', 'evolve', 'metamorphosis'],
    mystical: ['magic', 'ghost', 'spirit', 'supernatural', 'divine', 'angel', 'demon', 'prophecy', 'vision'],
    general: []
  }

  // Score each territory
  const scores: Record<DreamTerritory, number> = {} as any
  
  for (const [territory, keywords] of Object.entries(territoryKeywords)) {
    scores[territory as DreamTerritory] = keywords.reduce((score, keyword) => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi')
      const matches = content.match(regex)
      return score + (matches ? matches.length : 0)
    }, 0)
  }

  // Find territory with highest score
  let maxScore = 0
  let detectedTerritory: DreamTerritory = 'general'
  
  for (const [territory, score] of Object.entries(scores)) {
    if (score > maxScore && territory !== 'general') {
      maxScore = score
      detectedTerritory = territory as DreamTerritory
    }
  }

  return detectedTerritory
}

// Share dream to community
export async function shareToCommunity(
  dreamId: string,
  userId: string,
  title: string,
  description: string,
  interpretation?: string,
  imageUrl?: string,
  isAnonymous: boolean = false
): Promise<{ success: boolean; communityDreamId?: string; error?: string; warning?: string }> {
  try {
    const client = supabaseService.supabase
    if (!client) {
      return { success: false, error: 'Community sharing requires Supabase configuration' }
    }

    // Check if already shared from Supabase
    const { data: existing } = await client
      .from('community_dreams')
      .select('*')
      .eq('dream_id', dreamId)
      .eq('user_id', userId)

    if (existing && existing.length > 0) {
      return { success: false, error: 'Dream already shared to community' }
    }

    // Pre-upload content check (auto-moderation)
    const { preUploadContentCheck } = await import('./autoModerationService')
    const content = `${title} ${description} ${interpretation || ''}`
    
    const preCheck = await preUploadContentCheck(content, userId)
    
    if (!preCheck.allowed) {
      return { success: false, error: preCheck.reason }
    }

    // Auto-detect territory
    const territory = detectTerritory(title, description, interpretation)

    // Create community dream entry in Supabase
    const communityDreamId = `cd_${Date.now()}_${userId.slice(0, 8)}`
    
    const { error } = await client
      .from('community_dreams')
      .insert({
        id: communityDreamId,
        dream_id: dreamId,
        user_id: userId,
        title,
        description,
        interpretation: interpretation || null,
        image_url: imageUrl || null,
        territory,
        like_count: 0,
        share_count: 0,
        view_count: 0,
        is_featured: 0,
        is_anonymous: isAnonymous ? 1 : 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

    if (error) throw error

    return { 
      success: true, 
      communityDreamId,
      warning: preCheck.reason // Include warning if content flagged but allowed
    }
  } catch (error) {
    console.error('Error sharing to community:', error)
    return { success: false, error: 'Failed to share dream to community' }
  }
}

// Like a community dream
export async function likeDream(
  communityDreamId: string,
  userId: string
): Promise<{ success: boolean; newLikeCount?: number; error?: string }> {
  try {
    const client = supabaseService.supabase
    if (!client) {
      return { success: false, error: 'Social features require Supabase configuration' }
    }

    // Check if already liked from Supabase
    const { data: existing } = await client
      .from('dream_likes')
      .select('*')
      .eq('dream_id', communityDreamId)
      .eq('user_id', userId)

    if (existing && existing.length > 0) {
      return { success: false, error: 'Already liked this dream' }
    }

    // Create like in Supabase
    const likeId = `like_${Date.now()}_${userId.slice(0, 8)}`
    const { error: likeError } = await client
      .from('dream_likes')
      .insert({
        id: likeId,
        user_id: userId,
        dream_id: communityDreamId,
        created_at: new Date().toISOString()
      })

    if (likeError) throw likeError

    // Increment like count on community dream in Supabase
    const { data: dreams } = await client
      .from('community_dreams')
      .select('*')
      .eq('id', communityDreamId)

    if (dreams && dreams.length > 0) {
      const currentCount = Number(dreams[0].like_count) || 0
      await client
        .from('community_dreams')
        .update({
          like_count: currentCount + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', communityDreamId)
      return { success: true, newLikeCount: currentCount + 1 }
    }

    return { success: true, newLikeCount: 1 }
  } catch (error) {
    console.error('Error liking dream:', error)
    return { success: false, error: 'Failed to like dream' }
  }
}

// Unlike a community dream
export async function unlikeDream(
  communityDreamId: string,
  userId: string
): Promise<{ success: boolean; newLikeCount?: number; error?: string }> {
  try {
    const client = supabaseService.supabase
    if (!client) {
      return { success: false, error: 'Social features require Supabase configuration' }
    }

    // Find existing like in Supabase
    const { data: existing } = await client
      .from('dream_likes')
      .select('*')
      .eq('dream_id', communityDreamId)
      .eq('user_id', userId)

    if (!existing || existing.length === 0) {
      return { success: false, error: 'Not liked' }
    }

    // Delete like from Supabase
    const { error: deleteError } = await client
      .from('dream_likes')
      .delete()
      .eq('id', existing[0].id)

    if (deleteError) throw deleteError

    // Decrement like count in Supabase
    const { data: dreams } = await client
      .from('community_dreams')
      .select('*')
      .eq('id', communityDreamId)

    if (dreams && dreams.length > 0) {
      const currentCount = Math.max(0, (Number(dreams[0].like_count) || 0) - 1)
      await client
        .from('community_dreams')
        .update({
          like_count: currentCount,
          updated_at: new Date().toISOString()
        })
        .eq('id', communityDreamId)
      return { success: true, newLikeCount: currentCount }
    }

    return { success: true, newLikeCount: 0 }
  } catch (error) {
    console.error('Error unliking dream:', error)
    return { success: false, error: 'Failed to unlike dream' }
  }
}

// Track view action
export async function trackView(
  communityDreamId: string
): Promise<void> {
  try {
    const client = supabaseService.supabase
    if (!client) return

    // Increment view count directly on community dream in Supabase
    const { data: dreams } = await client
      .from('community_dreams')
      .select('*')
      .eq('id', communityDreamId)

    if (dreams && dreams.length > 0) {
      const currentCount = Number(dreams[0].view_count) || 0
      await client
        .from('community_dreams')
        .update({
          view_count: currentCount + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', communityDreamId)
    }
  } catch (error) {
    console.error('Error tracking view:', error)
  }
}

// Track share action
export async function trackShare(
  communityDreamId: string,
  userId: string,
  platform: string
): Promise<void> {
  try {
    const client = supabaseService.supabase
    if (!client) return

    const shareId = `share_${Date.now()}_${userId.slice(0, 8)}`
    const { error: shareError } = await client
      .from('dream_shares')
      .insert({
        id: shareId,
        user_id: userId,
        dream_id: communityDreamId,
        platform,
        created_at: new Date().toISOString()
      })

    if (shareError) throw shareError

    // Increment share count in Supabase
    const { data: dreams } = await client
      .from('community_dreams')
      .select('*')
      .eq('id', communityDreamId)

    if (dreams && dreams.length > 0) {
      const currentCount = Number(dreams[0].share_count) || 0
      await client
        .from('community_dreams')
        .update({
          share_count: currentCount + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', communityDreamId)
    }
  } catch (error) {
    console.error('Error tracking share:', error)
  }
}

// Get community dreams by territory
export async function getCommunityDreamsByTerritory(
  territory: DreamTerritory,
  userId?: string,
  limit: number = 20
): Promise<CommunityDream[]> {
  try {
    const client = supabaseService.supabase
    if (!client) return []

    let query = client
      .from('community_dreams')
      .select('*')
      .eq('status', 'active')
      .order('like_count', { ascending: false })
      .limit(limit)

    if (territory !== 'general') {
      query = query.eq('territory', territory)
    }

    const { data: dreams, error } = await query

    if (error) throw error

    // Get user's likes to mark hasLiked from Supabase
    let userLikes: string[] = []
    if (userId) {
      const { data: likes } = await client
        .from('dream_likes')
        .select('dream_id')
        .eq('user_id', userId)
      userLikes = (likes || []).map((l: any) => l.dream_id)
    }

    return (dreams || []).map(d => ({
      id: d.id,
      dreamId: d.dream_id,
      userId: d.user_id,
      title: d.title,
      description: d.description,
      interpretation: d.interpretation,
      imageUrl: d.image_url,
      territory: d.territory as DreamTerritory,
      likeCount: Number(d.like_count) || 0,
      shareCount: Number(d.share_count) || 0,
      viewCount: Number(d.view_count) || 0,
      isFeatured: Number(d.is_featured) > 0,
      isAnonymous: Number(d.is_anonymous) > 0,
      createdAt: d.created_at,
      updatedAt: d.updated_at,
      hasLiked: userLikes.includes(d.id)
    }))
  } catch (error) {
    console.error('Error fetching community dreams:', error)
    return []
  }
}

// Get trending dreams
export async function getTrendingDreams(
  userId?: string,
  limit: number = 10
): Promise<CommunityDream[]> {
  try {
    const client = supabaseService.supabase
    if (!client) return []

    const { data: dreams, error } = await client
      .from('community_dreams')
      .select('*')
      .eq('status', 'active')
      .order('like_count', { ascending: false })
      .limit(limit)

    if (error) throw error

    // Get user's likes from Supabase
    let userLikes: string[] = []
    if (userId) {
      const { data: likes } = await client
        .from('dream_likes')
        .select('dream_id')
        .eq('user_id', userId)
      userLikes = (likes || []).map((l: any) => l.dream_id)
    }

    return (dreams || []).map(d => ({
      id: d.id,
      dreamId: d.dream_id,
      userId: d.user_id,
      title: d.title,
      description: d.description,
      interpretation: d.interpretation,
      imageUrl: d.image_url,
      territory: d.territory as DreamTerritory,
      likeCount: Number(d.like_count) || 0,
      shareCount: Number(d.share_count) || 0,
      viewCount: Number(d.view_count) || 0,
      isFeatured: Number(d.is_featured) > 0,
      isAnonymous: Number(d.is_anonymous) > 0,
      createdAt: d.created_at,
      updatedAt: d.updated_at,
      hasLiked: userLikes.includes(d.id)
    }))
  } catch (error) {
    console.error('Error fetching trending dreams:', error)
    return []
  }
}

// Get territory statistics
export async function getTerritoryStats(): Promise<TerritoryStats[]> {
  try {
    const client = supabaseService.supabase
    if (!client) return []

    const { data: allDreams, error } = await client
      .from('community_dreams')
      .select('territory, like_count')
      .limit(1000)

    if (error) throw error

    const statsByTerritory: Record<string, { count: number; likes: number }> = {}

    allDreams.forEach(dream => {
      const territory = dream.territory || 'general'
      if (!statsByTerritory[territory]) {
        statsByTerritory[territory] = { count: 0, likes: 0 }
      }
      statsByTerritory[territory].count++
      statsByTerritory[territory].likes += Number(dream.like_count) || 0
    })

    // Sort by count and mark top 3 as trending
    const sortedTerritories = Object.entries(statsByTerritory)
      .sort((a, b) => b[1].likes - a[1].likes)

    const trendingTerritories = new Set(sortedTerritories.slice(0, 3).map(([t]) => t))

    return sortedTerritories.map(([territory, stats]) => ({
      territory: territory as DreamTerritory,
      dreamCount: stats.count,
      topEmotions: [], // Would need additional query
      trending: trendingTerritories.has(territory)
    }))
  } catch (error) {
    console.error('Error fetching territory stats:', error)
    return []
  }
}

// Check if dream is already shared
export async function isDreamShared(dreamId: string, userId: string): Promise<boolean> {
  try {
    const client = supabaseService.supabase
    if (!client) return false

    const { data, error } = await client
      .from('community_dreams')
      .select('*')
      .eq('dream_id', dreamId)
      .eq('user_id', userId)
    return data && data.length > 0 ? true : false
  } catch {
    return false
  }
}