import { supabase, isSupabaseConfigured } from './supabase'
import type { Database } from '../types/database'
import { castDream, castUserProfile } from '../utils/databaseCast'

export type Dream = Database['public']['Tables']['dreams']['Row']
export type UserProfile = Database['public']['Tables']['user_profiles']['Row']

// Helper to check if Supabase is available - returns null instead of throwing
function getSupabaseClient() {
  if (!supabase || !isSupabaseConfigured) {
    console.warn('Supabase is not configured - using fallback behavior')
    return null
  }
  return supabase
}

// Legacy helper for backwards compatibility (throws error)
function requireSupabase() {
  const client = getSupabaseClient()
  if (!client) {
    throw new Error('Supabase is not configured. Please check your environment variables.')
  }
  return client
}

export const supabaseService = {
  // Check if service is available
  isAvailable: () => isSupabaseConfigured && supabase !== null,
  
  // Get the raw Supabase client (use with caution - prefer service methods)
  // Returns null if not configured instead of throwing
  get supabase() {
    return getSupabaseClient()
  },

  // Dreams
  async getDreams(userId: string) {
    const client = getSupabaseClient()
    if (!client) {
      // Return empty array when Supabase is not configured
      return []
    }
    const { data, error } = await client
      .from('dreams')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return (data || []).map(castDream) as any
  },

  async getDreamById(id: string) {
    const client = requireSupabase()
    const { data, error } = await client
      .from('dreams')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return castDream(data) as any
  },

  async createDream(dream: Database['public']['Tables']['dreams']['Insert']) {
    const client = requireSupabase()
    const { data, error } = await client
      .from('dreams')
      .insert(dream)
      .select()
      .single()
    
    if (error) throw error
    return castDream(data) as any
  },

  async updateDream(id: string, updates: Database['public']['Tables']['dreams']['Update']) {
    const client = requireSupabase()
    const { data, error } = await client
      .from('dreams')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return castDream(data) as any
  },

  async deleteDream(id: string) {
    const client = requireSupabase()
    const { error } = await client
      .from('dreams')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  },

  // Profiles
  async getProfile(userId: string) {
    const client = getSupabaseClient()
    if (!client) {
      // Return null when Supabase is not configured - caller should handle gracefully
      return null
    }
    const { data, error } = await client
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single()
    
    if (error && error.code !== 'PGRST116') throw error // PGRST116 is code for 'no rows found'
    return data ? (castUserProfile(data) as any) : null
  },

  async upsertProfile(profile: Database['public']['Tables']['user_profiles']['Insert']) {
    const client = requireSupabase()
    const { data, error } = await client
      .from('user_profiles')
      .upsert(profile)
      .select()
      .single()
    
    if (error) throw error
    return castUserProfile(data) as any
  }
}