import { blink } from '../blink/client'
import { DATABASE_SCHEMA, getAllTableNames } from './databaseSchema'
import '../types/blink'

/**
 * Runtime Migration Guard
 * Detects missing database tables and creates them automatically
 */

/**
 * Tables that should be skipped during client-side migration checks.
 * These are tables that:
 * 1. Don't have user_id columns (they use email/lookup_hash/session_id)
 * 2. Are accessed before authentication is complete
 * 3. Are managed by the Blink auth system
 * 4. Require special server-side access (not client SDK access)
 * 5. Are protected through relationship with other tables (e.g., reflection_messages via reflection_sessions)
 */
const AUTH_SYSTEM_TABLES = [
  'magic_link_tokens',
  'email_verification_tokens',
  'password_reset_tokens',
  'users', // The users table is also managed by auth system
  'reflection_messages' // No user_id column - uses session_id, protected via reflection_sessions
]

interface MigrationResult {
  success: boolean
  tablesCreated: string[]
  tablesChecked: string[]
  errors: Array<{ table: string; error: string }>
  missingTables: string[]
  skippedTables: string[]
}

export type MigrationStep = 'scanning' | 'creating' | 'finalizing' | 'ready'

type MigrationListener = (step: MigrationStep, details?: string) => void
const listeners = new Set<MigrationListener>()

let currentStep: MigrationStep = 'scanning'
let currentDetails: string = 'Scanning the dreamscape...'

function notifyListeners(step: MigrationStep, details?: string) {
  currentStep = step
  if (details) currentDetails = details
  listeners.forEach(l => l(step, details))
}

/**
 * Check if a table exists by attempting to query it
 * 
 * IMPORTANT: This function is called during initialization, so we need to be
 * careful not to block on auth - the migration should complete even if the
 * user is not yet authenticated.
 */
async function tableExists(tableName: string): Promise<boolean> {
  try {
    // Attempt to query the table with a limit of 0 (no data fetched)
    // Using camelCase for Blink SDK (auto-converts to snake_case)
    const tableNameCamelCase = tableName.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())

    const table = (blink.db as any)[tableNameCamelCase]
    if (!table || typeof table.list !== 'function') {
      console.warn(`Table accessor ${tableNameCamelCase} not found in SDK for table ${tableName}`)
      return true // Assume it exists if we can't check it this way
    }

    // Don't wait for auth - just try the query
    // If auth is required and missing, the query will fail with an auth error,
    // which we should treat as "table exists but not accessible yet"
    try {
      await table.list({ limit: 0 })
      return true
    } catch (queryError: any) {
      const errorMessage = queryError?.message?.toLowerCase() || ''
      
      // Check for auth-related errors - treat as "table exists"
      if (errorMessage.includes('unauthorized') ||
          errorMessage.includes('authentication') ||
          errorMessage.includes('auth') ||
          errorMessage.includes('403') ||
          errorMessage.includes('401') ||
          errorMessage.includes('jwt') ||
          errorMessage.includes('token')) {
        console.log(`🔐 Table ${tableName} exists but requires auth`)
        return true
      }
      
      // Check for "table doesn't exist" errors
      if (errorMessage.includes('no such table') ||
          errorMessage.includes('does not exist') ||
          (errorMessage.includes('table') && errorMessage.includes('not found'))) {
        return false
      }
      
      // For other errors, assume table exists
      console.warn(`Warning checking table ${tableName}:`, queryError)
      return true
    }
  } catch (error: any) {
    // For any outer errors, assume table exists but there's a different issue
    console.warn(`Warning checking table ${tableName}:`, error)
    return true
  }
}

/**
 * Automatically create missing tables using Blink SQL tool
 */
async function createMissingTables(tableNames: string[]): Promise<{ created: string[], errors: Array<{ table: string; error: string }> }> {
  const result = { created: [] as string[], errors: [] as Array<{ table: string; error: string }> }

  if (tableNames.length === 0) return result

  console.log(`🔧 Auto-creating ${tableNames.length} missing table(s)...`)

  for (const tableName of tableNames) {
    const sql = DATABASE_SCHEMA[tableName as keyof typeof DATABASE_SCHEMA]
    if (sql) {
      try {
        console.log(`📝 Creating table: ${tableName}...`)
        await (blink as any).db.raw({ query: sql.trim() })
        result.created.push(tableName)
        console.log(`✅ Table created: ${tableName}`)
      } catch (error: any) {
        const errorMessage = error?.message || 'Unknown error'
        console.error(`❌ Failed to create table ${tableName}:`, errorMessage)
        result.errors.push({ table: tableName, error: errorMessage })
      }
    }
  }

  return result
}

/**
 * Run database migrations - check and create missing tables
 */
export async function runDatabaseMigrations(
  onStepChange?: MigrationListener
): Promise<MigrationResult> {
  const result: MigrationResult = {
    success: true,
    tablesCreated: [],
    tablesChecked: [],
    missingTables: [],
    skippedTables: [],
    errors: []
  }

  if (onStepChange) {
    listeners.add(onStepChange)
    // Immediately report current state
    onStepChange(currentStep, currentDetails)
  }

  notifyListeners('scanning', 'Scanning the dreamscape...')
  console.log('🔍 Checking database schema...')

  const tableNames = getAllTableNames()

  // First pass: Check which tables exist
  for (const tableName of tableNames) {
    // Skip auth-related system tables - these require special server-side access
    // and are protected by RLS policies that don't allow client SDK access
    if (AUTH_SYSTEM_TABLES.includes(tableName)) {
      console.log(`⏭️  Skipping auth system table: ${tableName} (requires server-side access)`)
      result.skippedTables.push(tableName)
      continue
    }

    result.tablesChecked.push(tableName)

    try {
      const exists = await tableExists(tableName)

      if (!exists) {
        console.log(`⚠️  Missing table detected: ${tableName}`)
        result.missingTables.push(tableName)
      } else {
        console.log(`✓ Table exists: ${tableName}`)
      }
    } catch (error: any) {
      console.error(`❌ Error checking table ${tableName}:`, error)
      result.errors.push({
        table: tableName,
        error: error?.message || 'Unknown error'
      })
    }
  }

  // Second pass: Auto-create missing tables
  if (result.missingTables.length > 0) {
    notifyListeners('creating', `Manifesting ${result.missingTables.length} new dream dimensions...`)
    const creationResult = await createMissingTables(result.missingTables)

    result.tablesCreated = creationResult.created
    result.errors.push(...creationResult.errors)

    if (creationResult.created.length > 0) {
      console.log(`✅ Successfully created ${creationResult.created.length} table(s)`)
    }

    if (creationResult.errors.length > 0) {
      console.error(`❌ Failed to create ${creationResult.errors.length} table(s)`)
      result.success = false
    } else {
      result.success = true
    }
  }

  notifyListeners('finalizing', 'Awakening your subconscious storage...')

  if (result.skippedTables.length > 0) {
    console.log(`ℹ️  Skipped ${result.skippedTables.length} auth system table(s): ${result.skippedTables.join(', ')}`)
  }

  if (result.missingTables.length === 0) {
    console.log('✅ All tables exist - no migration needed')
  } else if (result.tablesCreated.length === result.missingTables.length) {
    console.log(`✅ All ${result.tablesCreated.length} missing table(s) were created successfully`)
  } else {
    console.warn(`⚠️  ${result.missingTables.length - result.tablesCreated.length} table(s) failed to create`)
  }

  if (result.errors.length > 0) {
    console.error(`⚠️  Migration completed with ${result.errors.length} error(s)`)
  }

  return result
}

let migrationPromise: Promise<void> | null = null;
let migrationComplete = false;

// Timeout for migration - if it takes longer than this, assume tables exist
const MIGRATION_TIMEOUT_MS = 10000; // 10 seconds

/**
 * Initialize database with automatic migration guard
 * Call this on app startup
 * 
 * IMPORTANT: This now includes a timeout to prevent infinite loops
 * when auth or other dependencies are not yet available.
 */
export async function initializeDatabase(
  onStepChange?: MigrationListener
): Promise<void> {
  if (onStepChange) {
    listeners.add(onStepChange)
    // Immediately report current state
    onStepChange(currentStep, currentDetails)
  }

  if (migrationPromise) return migrationPromise;

  migrationPromise = (async () => {
    try {
      console.log('🚀 Initializing database...')
      
      // Create a timeout promise to prevent infinite waiting
      const timeoutPromise = new Promise<MigrationResult>((_, reject) => {
        setTimeout(() => {
          reject(new Error('Migration timed out - proceeding without full check'))
        }, MIGRATION_TIMEOUT_MS)
      })
      
      // Race the migration against the timeout
      let migrationResult: MigrationResult
      try {
        migrationResult = await Promise.race([
          runDatabaseMigrations(onStepChange),
          timeoutPromise
        ])
      } catch (timeoutError) {
        console.warn('⏱️ Migration check timed out, assuming tables exist')
        migrationResult = {
          success: true,
          tablesCreated: [],
          tablesChecked: [],
          errors: [],
          missingTables: [],
          skippedTables: []
        }
      }

      if (!migrationResult.success) {
        console.warn('Database migration completed with errors:', migrationResult.errors)
      }

      migrationComplete = true;
      notifyListeners('ready', 'Manifesting your journal...')
      console.log('✅ Database ready')
    } catch (error) {
      console.error('❌ Failed to initialize database:', error)
      // Don't throw - allow app to continue even if migration fails
      // Individual operations will handle missing tables gracefully
      migrationComplete = true;
      notifyListeners('ready', 'Ready (with warnings)')
    }
  })();

  return migrationPromise;
}

/**
 * Check if migration is complete
 */
export function isMigrationComplete(): boolean {
  return migrationComplete;
}

/**
 * Remove a migration listener
 */
export function removeMigrationListener(listener: MigrationListener): void {
  listeners.delete(listener);
}
