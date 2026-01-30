import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../types/database'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Track if Supabase is properly configured
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

if (!isSupabaseConfigured) {
  console.warn('Supabase credentials missing. Database operations will use Blink SDK fallback.')
}

// Only create the Supabase client if credentials are available
// Otherwise, create a null client that will be checked before use
export const supabase: SupabaseClient<Database> | null = isSupabaseConfigured
  ? createClient<Database>(
      supabaseUrl!,
      supabaseAnonKey!,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        }
      }
    )
  : null
