import { blink } from '../blink/client'

// Edge Function URL for system operations (bypasses RLS)
const SYSTEM_OPERATIONS_URL = 'https://8lvkkwdq--system-operations.functions.blink.new'

/**
 * Helper function to call the system operations Edge Function
 */
async function callSystemFunction(
  operation: string,
  data: Record<string, any> = {}
): Promise<any> {
  try {
    // Get auth token if available
    let authHeader: string | undefined
    try {
      const token = await blink.auth.getValidToken()
      if (token) {
        authHeader = `Bearer ${token}`
      }
    } catch {
      // No auth token available - that's ok for some operations
    }

    const response = await fetch(SYSTEM_OPERATIONS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
      body: JSON.stringify({ operation, ...data }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || `HTTP ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error(`System operation '${operation}' failed:`, error)
    throw error
  }
}

/**
 * Global Settings Operations
 */
export async function getGlobalSetting(key: string): Promise<string | null> {
  try {
    const result = await callSystemFunction('getGlobalSetting', { key })
    return result.success ? result.value : null
  } catch (error) {
    console.error('Error getting global setting:', error)
    return null
  }
}

export async function setGlobalSetting(key: string, value: string): Promise<boolean> {
  try {
    const result = await callSystemFunction('setGlobalSetting', { key, value })
    return result.success
  } catch (error) {
    console.error('Error setting global setting:', error)
    return false
  }
}

/**
 * Leaderboard Operations
 */
export async function getLeaderboard(limit: number = 100): Promise<any[]> {
  try {
    const result = await callSystemFunction('getLeaderboard', { limit })
    return result.success ? result.entries : []
  } catch (error) {
    console.error('Error getting leaderboard:', error)
    return []
  }
}

export async function updateLeaderboardEntry(
  score: number,
  displayName: string
): Promise<boolean> {
  try {
    const result = await callSystemFunction('updateLeaderboardEntry', {
      score,
      displayName,
    })
    return result.success
  } catch (error) {
    console.error('Error updating leaderboard:', error)
    return false
  }
}

/**
 * Early Access Operations
 */
export async function checkEarlyAccess(email: string): Promise<{
  hasAccess: boolean
  entry: any | null
}> {
  try {
    const result = await callSystemFunction('checkEarlyAccess', { email })
    return {
      hasAccess: result.hasAccess,
      entry: result.entry,
    }
  } catch (error) {
    console.error('Error checking early access:', error)
    return {
      hasAccess: false,
      entry: null,
    }
  }
}

export async function listEarlyAccess(limit: number = 1000): Promise<any[]> {
  try {
    const result = await callSystemFunction('listEarlyAccess', { limit })
    return result.success ? result.entries : []
  } catch (error) {
    console.error('Error listing early access:', error)
    return []
  }
}

export async function createEarlyAccess(
  name: string,
  email: string,
  tier: string,
  userId?: string | null
): Promise<boolean> {
  try {
    const result = await callSystemFunction('createEarlyAccess', {
      name,
      email,
      tier,
      userId,
    })
    return result.success
  } catch (error) {
    console.error('Error creating early access:', error)
    return false
  }
}
