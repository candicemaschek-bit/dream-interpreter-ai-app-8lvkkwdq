/**
 * Role-Based Access Control Utilities
 * Provides functions to check user roles and manage admin access
 */

import { blink } from '../blink/client'
import { withDbRateLimitGuard } from './rateLimitGuard'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

/**
 * Check if user has admin role
 * Case-insensitive comparison to handle 'admin' or 'Admin'
 * 
 * Note: This function checks multiple sources for admin status:
 * 1. Blink auth user metadata
 * 2. Supabase user_profiles table (if Supabase is configured)
 * 3. Blink DB users table (fallback)
 */
export async function isAdmin(userId: string): Promise<boolean> {
  try {
    // First, try to get the user from Blink auth
    const authUser = await blink.auth.me()
    
    // If the authenticated user's ID matches and they have a role in metadata
    if (authUser && authUser.id === userId) {
      const role = (authUser as any).role || ''
      if (String(role).toLowerCase() === 'admin') {
        console.log('✅ Admin check: Found admin role in Blink auth metadata')
        return true
      }
    }
    
    // Check Supabase user_profiles table for admin role (primary source when Supabase is configured)
    if (isSupabaseConfigured && supabase) {
      try {
        // Check user_profiles for subscription_tier = 'admin' or a specific admin field
        const { data: profile, error } = await supabase
          .from('user_profiles')
          .select('subscription_tier, user_id')
          .eq('user_id', userId)
          .single()
        
        if (!error && profile) {
          const tier = String(profile.subscription_tier || '').toLowerCase()
          if (tier === 'admin') {
            console.log('✅ Admin check: Found admin tier in Supabase user_profiles')
            return true
          }
        }
        
        // Also check the users table in Supabase for role field
        const { data: supabaseUser, error: userError } = await supabase
          .from('users')
          .select('role, id')
          .eq('user_id', userId)
          .single()
        
        if (!userError && supabaseUser) {
          const role = String(supabaseUser.role || '').toLowerCase()
          if (role === 'admin') {
            console.log('✅ Admin check: Found admin role in Supabase users table')
            return true
          }
        }
      } catch (supabaseError) {
        console.warn('Supabase admin check failed, falling back to Blink DB:', supabaseError)
      }
    }
    
    // Fall back to querying the Blink users table with user_id field
    // (for cases where role was set via Blink database)
    try {
      const users = await withDbRateLimitGuard(`role:isAdmin:${userId}`, () =>
        blink.db.users.list({
          where: { userId: userId },
          limit: 1,
          select: ['id', 'role', 'userId'],
        })
      )

      if (users.length > 0) {
        const user = users[0] as any
        if (String(user.role || '').toLowerCase() === 'admin') {
          console.log('✅ Admin check: Found admin role in Blink DB (userId query)')
          return true
        }
      }
    } catch (dbError) {
      // If querying by user_id fails, try by id directly
      // This handles both schema variants
      console.warn('Fallback to id-based lookup for admin check')
    }
    
    // Try alternative lookup by id
    try {
      const users = await withDbRateLimitGuard(`role:isAdmin:byId:${userId}`, () =>
        blink.db.users.list({
          where: { id: userId },
          limit: 1,
          select: ['id', 'role'],
        })
      )

      if (users.length > 0) {
        const user = users[0] as any
        if (String(user.role || '').toLowerCase() === 'admin') {
          console.log('✅ Admin check: Found admin role in Blink DB (id query)')
          return true
        }
      }
    } catch (idError) {
      console.warn('Admin check by id also failed:', idError)
    }

    console.log('ℹ️ Admin check: No admin role found for user', userId)
    return false
  } catch (error) {
    console.error('Error checking admin status:', error)
    return false
  }
}

/**
 * Check if user has specific role
 * Case-insensitive comparison to handle various capitalizations
 */
export async function hasRole(userId: string, role: string): Promise<boolean> {
  try {
    const users = await withDbRateLimitGuard(`role:hasRole:${userId}`, () =>
      blink.db.users.list({
        where: { id: userId },
        limit: 1,
        select: ['id', 'role'],
      })
    )

    if (users.length === 0) return false

    const user = users[0] as any
    return String(user.role || '').toLowerCase() === role.toLowerCase()
  } catch (error) {
    console.error('Error checking role:', error)
    return false
  }
}

/**
 * Get user role from database
 */
export async function getUserRole(userId: string): Promise<string | null> {
  try {
    const users = await withDbRateLimitGuard(`role:getUserRole:${userId}`, () =>
      blink.db.users.list({
        where: { id: userId },
        limit: 1,
        select: ['id', 'role'],
      })
    )

    if (users.length === 0) return null

    return (users[0] as any).role || null
  } catch (error) {
    console.error('Error getting user role:', error)
    return null
  }
}

/**
 * Update user role (admin only)
 */
export async function updateUserRole(userId: string, role: string): Promise<void> {
  try {
    await blink.db.users.update(userId, { role })
  } catch (error) {
    console.error('Error updating user role:', error)
    throw error
  }
}

/**
 * Get current user's role
 */
export async function getCurrentUserRole(): Promise<string | null> {
  try {
    const user = await blink.auth.me()
    if (!user) {
      return null
    }
    
    return await getUserRole(user.id)
  } catch (error) {
    console.error('Error getting current user role:', error)
    return null
  }
}

/**
 * Check if current user is admin
 */
export async function isCurrentUserAdmin(): Promise<boolean> {
  try {
    const user = await blink.auth.me()
    if (!user) {
      return false
    }
    
    return await isAdmin(user.id)
  } catch (error) {
    console.error('Error checking current user admin status:', error)
    return false
  }
}
