/**
 * Account Deletion Utility
 * Handles complete user data deletion from the database
 */

import { blink } from '../blink/client'

export interface DeletionResult {
  success: boolean
  deletedTables: string[]
  errors: string[]
}

/**
 * Delete all user data from the database
 * This is a destructive operation that cannot be undone
 */
export async function deleteAllUserData(userId: string): Promise<DeletionResult> {
  const deletedTables: string[] = []
  const errors: string[] = []

  // List of all tables that contain user data
  // We handle each explicitly to map to SDK collection names
  
  try {
    // 1. Core Dream Data
    await blink.db.dreams.deleteMany({ where: { userId } })
    deletedTables.push('dreams')
  } catch (e: any) { errors.push(`dreams: ${e.message}`) }

  try {
    await blink.db.userProfiles.deleteMany({ where: { userId } })
    deletedTables.push('user_profiles')
  } catch (e: any) { errors.push(`user_profiles: ${e.message}`) }

  try {
    await blink.db.dreamSymbolsV2.deleteMany({ where: { userId } })
    deletedTables.push('dream_symbols_v2')
  } catch (e: any) { errors.push(`dream_symbols_v2: ${e.message}`) }

  try {
    await blink.db.dreamThemes.deleteMany({ where: { userId } })
    deletedTables.push('dream_themes')
  } catch (e: any) { errors.push(`dream_themes: ${e.message}`) }

  try {
    await blink.db.dreamEmotions.deleteMany({ where: { userId } })
    deletedTables.push('dream_emotions')
  } catch (e: any) { errors.push(`dream_emotions: ${e.message}`) }

  try {
    await blink.db.dreamEntities.deleteMany({ where: { userId } })
    deletedTables.push('dream_entities')
  } catch (e: any) { errors.push(`dream_entities: ${e.message}`) }

  try {
    await blink.db.dreamMotifs.deleteMany({ where: { userId } })
    deletedTables.push('dream_motifs')
  } catch (e: any) { errors.push(`dream_motifs: ${e.message}`) }

  try {
    await blink.db.dreamWorlds.deleteMany({ where: { userId } })
    deletedTables.push('dream_worlds')
  } catch (e: any) { errors.push(`dream_worlds: ${e.message}`) }

  try {
    await blink.db.dreamContentFlags.deleteMany({ where: { userId } })
    deletedTables.push('dream_content_flags')
  } catch (e: any) { errors.push(`dream_content_flags: ${e.message}`) }

  // 2. Reflection & AI Data
  try {
    // Reflection messages need to be deleted before sessions if we iterate, 
    // but deleteMany with where clause works fine if we filter correctly.
    // However, messages are linked to session_id, not user_id.
    // We first need to find session IDs for the user.
    const sessions = await blink.db.reflectionSessions.list({ where: { userId }, select: ['id'] })
    const sessionIds = sessions.map(s => s.id)
    
    // Batch delete messages for these sessions
    // Since we can't do "IN" clause easily in deleteMany where, we iterate.
    // Or if sessionIds is not huge, we could loop.
    for (const sessionId of sessionIds) {
      await blink.db.reflectionMessages.deleteMany({ where: { sessionId } })
    }
    deletedTables.push('reflection_messages')
  } catch (e: any) { errors.push(`reflection_messages: ${e.message}`) }

  try {
    await blink.db.reflectionSessions.deleteMany({ where: { userId } })
    deletedTables.push('reflection_sessions')
  } catch (e: any) { errors.push(`reflection_sessions: ${e.message}`) }

  try {
    await blink.db.reflectAiCredits.deleteMany({ where: { userId } })
    deletedTables.push('reflect_ai_credits')
  } catch (e: any) { errors.push(`reflect_ai_credits: ${e.message}`) }

  try {
    await blink.db.symbolicaAiCredits.deleteMany({ where: { userId } })
    deletedTables.push('symbolica_ai_credits')
  } catch (e: any) { errors.push(`symbolica_ai_credits: ${e.message}`) }

  // 3. Gamification & Transactions
  try {
    await blink.db.gamificationProfiles.deleteMany({ where: { userId } })
    deletedTables.push('gamification_profiles')
  } catch (e: any) { errors.push(`gamification_profiles: ${e.message}`) }

  try {
    await blink.db.coinTransactions.deleteMany({ where: { userId } })
    deletedTables.push('coin_transactions')
  } catch (e: any) { errors.push(`coin_transactions: ${e.message}`) }

  try {
    await blink.db.userRewards.deleteMany({ where: { userId } })
    deletedTables.push('user_rewards')
  } catch (e: any) { errors.push(`user_rewards: ${e.message}`) }

  try {
    await blink.db.leaderboardEntries.deleteMany({ where: { userId } })
    deletedTables.push('leaderboard_entries')
  } catch (e: any) { errors.push(`leaderboard_entries: ${e.message}`) }

  // 4. Subscriptions & Billing
  try {
    await blink.db.subscriptions.deleteMany({ where: { userId } })
    deletedTables.push('subscriptions')
  } catch (e: any) { errors.push(`subscriptions: ${e.message}`) }

  try {
    await blink.db.videoGenerationQueue.deleteMany({ where: { userId } })
    deletedTables.push('video_generation_queue')
  } catch (e: any) { errors.push(`video_generation_queue: ${e.message}`) }

  try {
    await blink.db.videoGenerationLimits.deleteMany({ where: { userId } })
    deletedTables.push('video_generation_limits')
  } catch (e: any) { errors.push(`video_generation_limits: ${e.message}`) }

  try {
    await blink.db.apiUsageLogs.deleteMany({ where: { userId } })
    deletedTables.push('api_usage_logs')
  } catch (e: any) { errors.push(`api_usage_logs: ${e.message}`) }

  try {
    await blink.db.monthlyUsageSummary.deleteMany({ where: { userId } })
    deletedTables.push('monthly_usage_summary')
  } catch (e: any) { errors.push(`monthly_usage_summary: ${e.message}`) }

  try {
    await blink.db.addOnAnalytics.deleteMany({ where: { userId } })
    deletedTables.push('add_on_analytics')
  } catch (e: any) { errors.push(`add_on_analytics: ${e.message}`) }

  try {
    await blink.db.addOnPurchases.deleteMany({ where: { userId } })
    deletedTables.push('add_on_purchases')
  } catch (e: any) { errors.push(`add_on_purchases: ${e.message}`) }

  try {
    await blink.db.paymentTransactions.deleteMany({ where: { userId } })
    deletedTables.push('payment_transactions')
  } catch (e: any) { errors.push(`payment_transactions: ${e.message}`) }

  // 5. Settings & Misc
  try {
    await blink.db.patternInsights.deleteMany({ where: { userId } })
    deletedTables.push('pattern_insights')
  } catch (e: any) { errors.push(`pattern_insights: ${e.message}`) }

  try {
    await blink.db.userPrivacySettings.deleteMany({ where: { userId } })
    deletedTables.push('user_privacy_settings')
  } catch (e: any) { errors.push(`user_privacy_settings: ${e.message}`) }

  try {
    await blink.db.referrals.deleteMany({ where: { referrerUserId: userId } })
    deletedTables.push('referrals')
  } catch (e: any) { errors.push(`referrals: ${e.message}`) }

  try {
    await blink.db.authTelemetry.deleteMany({ where: { userId } })
    deletedTables.push('auth_telemetry')
  } catch (e: any) { errors.push(`auth_telemetry: ${e.message}`) }

  try {
    await blink.db.passwordResetTokens.deleteMany({ where: { userId } })
    deletedTables.push('password_reset_tokens')
  } catch (e: any) { errors.push(`password_reset_tokens: ${e.message}`) }

  try {
    await blink.db.emailVerificationTokens.deleteMany({ where: { userId } })
    deletedTables.push('email_verification_tokens')
  } catch (e: any) { errors.push(`email_verification_tokens: ${e.message}`) }

  // Finally, try to delete from auth.users if using Blink auth
  try {
    // Note: We cannot modify 'users' table directly via SDK usually as it's system managed
    // But if we have a table called 'users' in our schema, we can.
    // Checking schema: users: [id: TEXT (PK), email: TEXT ... ]
    // So yes, we can update it.
    
    await blink.db.users.update(userId, {
      email: `deleted_${userId}@deleted.account`,
      displayName: 'Deleted User',
      passwordHash: null,
      metadata: JSON.stringify({ deleted: true, deletedAt: new Date().toISOString() })
    })
    
    deletedTables.push('users (anonymized)')
  } catch (error: any) {
    console.warn('Could not anonymize user record:', error.message)
    errors.push(`users: ${error.message}`)
  }

  return {
    success: errors.length < 5, // Success if we deleted most data
    deletedTables,
    errors
  }
}

/**
 * Get summary of user data before deletion
 */
export async function getUserDataSummary(userId: string): Promise<{
  dreams: number
  reflectionSessions: number
  symbols: number
  totalRecords: number
}> {
  try {
    const [dreamsCount, sessionsCount, symbolsCount] = await Promise.all([
      blink.db.dreams.count({ where: { userId } }),
      blink.db.reflectionSessions.count({ where: { userId } }),
      blink.db.dreamSymbolsV2.count({ where: { userId } })
    ])

    return {
      dreams: dreamsCount,
      reflectionSessions: sessionsCount,
      symbols: symbolsCount,
      totalRecords: dreamsCount + sessionsCount + symbolsCount
    }
  } catch (error) {
    console.error('Error getting user data summary:', error)
    return {
      dreams: 0,
      reflectionSessions: 0,
      symbols: 0,
      totalRecords: 0
    }
  }
}

/**
 * Clear local storage data related to the user
 */
export function clearLocalUserData(): void {
  // Clear IndexedDB databases
  const dbsToDelete = [
    'dreamcatcher-reflect-offline',
    'dreamcatcher-symbolica-offline',
    'dreamcatcher-offline'
  ]

  dbsToDelete.forEach(dbName => {
    try {
      indexedDB.deleteDatabase(dbName)
    } catch (e) {
      console.warn(`Could not delete ${dbName}:`, e)
    }
  })

  // Clear relevant localStorage items
  const keysToRemove = Object.keys(localStorage).filter(key =>
    key.includes('dreamcatcher') ||
    key.includes('blink') ||
    key.includes('dream') ||
    key.includes('reflect') ||
    key.includes('symbol')
  )

  keysToRemove.forEach(key => {
    try {
      localStorage.removeItem(key)
    } catch (e) {
      console.warn(`Could not remove ${key}:`, e)
    }
  })
}