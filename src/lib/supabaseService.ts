import { supabase, isSupabaseConfigured } from './supabase'
import type { Database } from '../types/database'
import { castDream, castUserProfile, castDreamSymbol, castGamificationProfile } from '../utils/databaseCast'
import { lazyMigrationService } from '../utils/lazyMigration'

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

// Legacy helper for backwards compatibility - returns null instead of throwing
function requireSupabase() {
  return getSupabaseClient()
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
    
    // Lazy migration check: if no dreams in Supabase, check legacy Blink DB
    if (!data || data.length === 0) {
      const migrated = await lazyMigrationService.migrateDreams(userId)
      if (migrated) {
        // Fetch again from Supabase after migration
        const { data: migratedData, error: migratedError } = await client
          .from('dreams')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          
        if (migratedError) throw migratedError
        return (migratedData || []).map(castDream) as any
      }
    }
    
    return (data || []).map(castDream) as any
  },

  async getDreamById(id: string) {
    const client = getSupabaseClient()
    if (!client) return null
    const { data, error } = await client
      .from('dreams')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return castDream(data) as any
  },

  async createDream(dream: Database['public']['Tables']['dreams']['Insert']) {
    const client = getSupabaseClient()
    if (!client) return null
    const { data, error } = await client
      .from('dreams')
      .insert(dream)
      .select()
      .single()
    
    if (error) throw error
    return castDream(data) as any
  },

  async updateDream(id: string, updates: Database['public']['Tables']['dreams']['Update']) {
    const client = getSupabaseClient()
    if (!client) return null
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
    const client = getSupabaseClient()
    if (!client) return
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
      console.warn('Supabase not configured - cannot fetch profile')
      // Return null when Supabase is not configured - caller should handle gracefully
      return null
    }
    
    try {
      const { data, error } = await client
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single()
      
      if (error) {
        // PGRST116 is code for 'no rows found' - this is expected for new users
        if (error.code === 'PGRST116') {
          console.log(`ℹ️ No profile found for user ${userId} in Supabase - checking for legacy migration...`)
          
          // Lazy migration check
          const migrated = await lazyMigrationService.migrateProfile(userId)
          if (migrated) {
            // Fetch again from Supabase after migration
            const { data: migratedData, error: migratedError } = await client
              .from('user_profiles')
              .select('*')
              .eq('user_id', userId)
              .single()
              
            if (!migratedError && migratedData) {
              return castUserProfile(migratedData) as any
            }
          }
          
          console.log(`ℹ️ No legacy profile found - user ${userId} needs onboarding`)
          return null
        }
        // For other errors, log but don't throw to prevent infinite loops
        console.error('Error fetching profile:', error.message, error.code)
        // If it's a permission/RLS error, the profile might exist but we can't access it
        // In this case, we should NOT return null (which triggers onboarding)
        if (error.code === 'PGRST301' || error.message?.includes('permission') || error.message?.includes('RLS')) {
          console.warn('Permission error accessing profile - assuming profile exists')
          // Return a minimal profile to prevent onboarding loop
          return {
            id: `profile_${userId}`,
            userId: userId,
            user_id: userId,
            name: 'User',
            age: 0,
            gender: 'none',
            onboardingCompleted: true, // Assume completed to break the loop
            onboarding_completed: true,
            subscriptionTier: 'free',
            subscription_tier: 'free',
            createdAt: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          } as any
        }
        throw error
      }
      
      return data ? (castUserProfile(data) as any) : null
    } catch (err: any) {
      console.error('Exception in getProfile:', err)
      // Don't throw - return null and let caller handle gracefully
      return null
    }
  },

  async upsertProfile(profile: Database['public']['Tables']['user_profiles']['Insert']) {
    const client = getSupabaseClient()
    if (!client) return null
    const { data, error } = await client
      .from('user_profiles')
      .upsert(profile)
      .select()
      .single()
    
    if (error) throw error
    return castUserProfile(data) as any
  },

  // Gamification
  async getGamificationProfile(userId: string) {
    const client = getSupabaseClient()
    if (!client) return null
    const { data, error } = await client
      .from('gamification_profiles')
      .select('*')
      .eq('user_id', userId)
      .single()
    
    if (error && error.code === 'PGRST116') {
      // Lazy migration check
      const migrated = await lazyMigrationService.migrateGamification(userId)
      if (migrated) {
        const { data: migratedData } = await client
          .from('gamification_profiles')
          .select('*')
          .eq('user_id', userId)
          .single()
        if (migratedData) return castGamificationProfile(migratedData)
      }
      return null
    }
    
    if (error) throw error
    return data ? castGamificationProfile(data) : null
  },

  async upsertGamificationProfile(profile: Database['public']['Tables']['gamification_profiles']['Insert']) {
    const client = getSupabaseClient()
    if (!client) return null
    const { data, error } = await client
      .from('gamification_profiles')
      .upsert(profile)
      .select()
      .single()
    
    if (error) throw error
    return castGamificationProfile(data)
  },

  // Symbols
  async getUserSymbols(userId: string) {
    const client = getSupabaseClient()
    if (!client) return []
    const { data, error } = await client
      .from('dream_symbols_v2')
      .select('*')
      .eq('user_id', userId)
      .order('occurrence_count', { ascending: false })
    
    if (error) throw error
    
    // Lazy migration check
    if (!data || data.length === 0) {
      const migrated = await lazyMigrationService.migrateSymbols(userId)
      if (migrated) {
        const { data: migratedData, error: migratedError } = await client
          .from('dream_symbols_v2')
          .select('*')
          .eq('user_id', userId)
          .order('occurrence_count', { ascending: false })
        
        if (!migratedError && migratedData) {
          return migratedData.map(castDreamSymbol)
        }
      }
    }
    
    return (data || []).map(castDreamSymbol)
  },

  async upsertSymbol(symbol: Database['public']['Tables']['dream_symbols_v2']['Insert']) {
    const client = getSupabaseClient()
    if (!client) return null
    const { data, error } = await client
      .from('dream_symbols_v2')
      .upsert(symbol)
      .select()
      .single()
    
    if (error) throw error
    return castDreamSymbol(data)
  },

  // Generic helper for migration of other tables
  async migrateTableData(tableName: string, records: any[]) {
    const client = getSupabaseClient()
    if (!client || records.length === 0) return { success: true, count: 0 }
    
    // Batch upsert for efficiency
    const { data, error } = await client
      .from(tableName as any)
      .upsert(records)
      .select()
    
    if (error) {
      console.error(`Error migrating ${tableName}:`, error)
      throw error
    }
    
    return { success: true, count: data?.length || 0 }
  },

  // Connection check
  async checkConnection() {
    const client = getSupabaseClient()
    if (!client) {
      return { 
        success: false, 
        message: 'Supabase client is not initialized. Check your environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY).' 
      }
    }

    try {
      // Perform a simple health check by querying a system table or a known table
      // Querying 'dreams' table with a limit of 0 is a safe way to check connectivity and schema
      const { error } = await client.from('dreams').select('id').limit(0)
      
      if (error) {
        return { 
          success: false, 
          message: `Database connection failed: ${error.message}`,
          error 
        }
      }

      return { 
        success: true, 
        message: 'Successfully connected to Supabase database.' 
      }
    } catch (err: any) {
      return { 
        success: false, 
        message: `An unexpected error occurred: ${err.message}`,
        error: err 
      }
    }
  }
}
