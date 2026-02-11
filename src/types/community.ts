/**
 * Community Types for Dream Sharing and Engagement
 */

export type DreamTerritory = 
  | 'water'        // Ocean, rivers, rain, drowning
  | 'flying'       // Flying, falling, heights
  | 'chase'        // Being chased, pursuit, running
  | 'familiar'     // Home, childhood, familiar places
  | 'death'        // Death, loss, grief
  | 'nature'       // Animals, plants, weather
  | 'relationships'// Family, friends, love, conflict
  | 'work'         // Career, school, responsibility
  | 'transformation'// Metamorphosis, change, growth
  | 'mystical'     // Supernatural, magic, spiritual
  | 'general'      // Uncategorized dreams

export interface DreamTerritoryInfo {
  id: DreamTerritory
  name: string
  description: string
  icon: string
  color: string
  gradient: string
}

export const DREAM_TERRITORIES: Record<DreamTerritory, DreamTerritoryInfo> = {
  water: {
    id: 'water',
    name: 'Ocean & Water',
    description: 'Dreams of oceans, rivers, rain, and water symbolism',
    icon: '🌊',
    color: 'blue',
    gradient: 'from-blue-500 to-cyan-500'
  },
  flying: {
    id: 'flying',
    name: 'Flying & Heights',
    description: 'Dreams of flight, falling, and aerial experiences',
    icon: '🦅',
    color: 'sky',
    gradient: 'from-sky-400 to-indigo-500'
  },
  chase: {
    id: 'chase',
    name: 'Chasing & Pursuit',
    description: 'Dreams of being chased, pursued, or running',
    icon: '🏃',
    color: 'red',
    gradient: 'from-red-500 to-orange-500'
  },
  familiar: {
    id: 'familiar',
    name: 'Familiar Places',
    description: 'Dreams of home, childhood, and known locations',
    icon: '🏠',
    color: 'amber',
    gradient: 'from-amber-400 to-yellow-500'
  },
  death: {
    id: 'death',
    name: 'Death & Transformation',
    description: 'Dreams involving death, endings, and rebirth',
    icon: '🦋',
    color: 'purple',
    gradient: 'from-purple-500 to-violet-600'
  },
  nature: {
    id: 'nature',
    name: 'Nature & Animals',
    description: 'Dreams featuring animals, plants, and natural elements',
    icon: '🌿',
    color: 'green',
    gradient: 'from-green-500 to-emerald-500'
  },
  relationships: {
    id: 'relationships',
    name: 'Relationships',
    description: 'Dreams about family, friends, love, and conflict',
    icon: '💝',
    color: 'pink',
    gradient: 'from-pink-500 to-rose-500'
  },
  work: {
    id: 'work',
    name: 'Work & Responsibility',
    description: 'Dreams about career, school, and responsibilities',
    icon: '💼',
    color: 'slate',
    gradient: 'from-slate-500 to-gray-600'
  },
  transformation: {
    id: 'transformation',
    name: 'Transformation',
    description: 'Dreams of change, growth, and metamorphosis',
    icon: '✨',
    color: 'yellow',
    gradient: 'from-yellow-400 to-orange-500'
  },
  mystical: {
    id: 'mystical',
    name: 'Mystical & Spiritual',
    description: 'Dreams with supernatural or spiritual elements',
    icon: '🔮',
    color: 'violet',
    gradient: 'from-violet-500 to-purple-600'
  },
  general: {
    id: 'general',
    name: 'General Dreams',
    description: 'Uncategorized dream experiences',
    icon: '💭',
    color: 'gray',
    gradient: 'from-gray-400 to-slate-500'
  }
}

export interface CommunityDream {
  id: string
  dreamId: string
  userId: string
  title: string
  description: string
  interpretation?: string
  imageUrl?: string
  territory: DreamTerritory
  likeCount: number
  shareCount: number
  viewCount: number
  isFeatured: boolean
  isAnonymous: boolean
  createdAt: string
  updatedAt: string
  // Computed fields
  hasLiked?: boolean
  authorDisplayName?: string
}

export interface DreamLike {
  id: string
  userId: string
  dreamId: string
  createdAt: string
}

export interface DreamShare {
  id: string
  userId: string
  dreamId: string
  platform: string
  createdAt: string
}

export interface TerritoryStats {
  territory: DreamTerritory
  dreamCount: number
  topEmotions: string[]
  trending: boolean
}

// Community tier gating
export interface CommunityAccess {
  canViewCommunity: boolean
  canLikeDreams: boolean
  canShareToCommunity: boolean
  canSeeTrending: boolean
  dailyLikeLimit: number
  hasBadge: boolean
  badgeType?: 'visionary' | 'architect' | 'star'
}

export const COMMUNITY_ACCESS_BY_TIER: Record<string, CommunityAccess> = {
  free: {
    canViewCommunity: true,
    canLikeDreams: false,
    canShareToCommunity: false,
    canSeeTrending: false,
    dailyLikeLimit: 0,
    hasBadge: false
  },
  pro: {
    canViewCommunity: true,
    canLikeDreams: true,
    canShareToCommunity: false,
    canSeeTrending: true,
    dailyLikeLimit: 5,
    hasBadge: true,
    badgeType: 'visionary'
  },
  premium: {
    canViewCommunity: true,
    canLikeDreams: true,
    canShareToCommunity: true,
    canSeeTrending: true,
    dailyLikeLimit: 20,
    hasBadge: true,
    badgeType: 'architect'
  },
  vip: {
    canViewCommunity: true,
    canLikeDreams: true,
    canShareToCommunity: true,
    canSeeTrending: true,
    dailyLikeLimit: 999,
    hasBadge: true,
    badgeType: 'star'
  }
}

export function getCommunityAccess(tier: string): CommunityAccess {
  return COMMUNITY_ACCESS_BY_TIER[tier] || COMMUNITY_ACCESS_BY_TIER.free
}
