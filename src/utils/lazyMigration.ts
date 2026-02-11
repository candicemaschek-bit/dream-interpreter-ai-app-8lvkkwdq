import { blink } from '../blink/client'
import { supabaseService } from '../lib/supabaseService'
import { 
  toDreamRow, 
  toUserProfileRow, 
  castGamificationProfile, 
  castDreamSymbol 
} from './databaseCast'

/**
 * Lazy Migration Service
 * Handles on-demand migration of user data from Blink DB to Supabase
 */

export const lazyMigrationService = {
  /**
   * Generic migration for any user-specific table
   */
  async migrateTable(tableName: string, userId: string, transformFn?: (row: any) => any): Promise<boolean> {
    try {
      const tableNameCamelCase = tableName.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
      const blinkTable = (blink.db as any)[tableNameCamelCase]
      
      if (!blinkTable || typeof blinkTable.list !== 'function') {
        console.warn(`Table ${tableName} not found in Blink SDK`)
        return false
      }

      const records = await blinkTable.list({ where: { userId } })
      
      if (!records || records.length === 0) return false

      console.log(`📦 Lazy migrating ${records.length} records from ${tableName}...`)

      const supabaseRecords = records.map(r => {
        let transformed = this.toSnakeCase(r)
        if (transformFn) {
          transformed = transformFn(transformed)
        }
        return transformed
      })

      const result = await supabaseService.migrateTableData(tableName, supabaseRecords)
      return result.success
    } catch (error) {
      console.error(`❌ Error during lazy migration for ${tableName}:`, error)
      return false
    }
  },

  /**
   * Migrate user dreams if needed
   */
  async migrateDreams(userId: string): Promise<boolean> {
    return this.migrateTable('dreams', userId)
  },

  /**
   * Migrate user profile if needed
   */
  async migrateProfile(userId: string): Promise<boolean> {
    return this.migrateTable('user_profiles', userId, (row) => {
      // Profiles have booleans stored as "0"/"1" in Blink, but Supabase wants real booleans
      if (typeof row.nightmare_prone === 'string') {
        row.nightmare_prone = row.nightmare_prone === '1'
      }
      if (typeof row.recurring_dreams === 'string') {
        row.recurring_dreams = row.recurring_dreams === '1'
      }
      if (typeof row.onboarding_completed === 'string') {
        row.onboarding_completed = row.onboarding_completed === '1'
      }
      return row
    })
  },

  /**
   * Migrate gamification profile if needed
   */
  async migrateGamification(userId: string): Promise<boolean> {
    return this.migrateTable('gamification_profiles', userId)
  },

  /**
   * Migrate symbols if needed
   */
  async migrateSymbols(userId: string): Promise<boolean> {
    return this.migrateTable('dream_symbols_v2', userId)
  },

  /**
   * Migrate dream worlds if needed
   */
  async migrateDreamWorlds(userId: string): Promise<boolean> {
    return this.migrateTable('dream_worlds', userId)
  },

  /**
   * Helper to convert camelCase object keys to snake_case
   */
  toSnakeCase(obj: any): any {
    if (Array.isArray(obj)) {
      return obj.map(v => this.toSnakeCase(v))
    } else if (obj !== null && obj.constructor === Object) {
      return Object.keys(obj).reduce((result, key) => {
        const snakeKey = key.replace(/([A-Z])/g, "_$1").toLowerCase()
        result[snakeKey] = this.toSnakeCase(obj[key])
        return result
      }, {} as any)
    }
    return obj
  }
}
