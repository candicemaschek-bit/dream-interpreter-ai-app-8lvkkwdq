/**
 * Reflection Messages API Client
 * Handles all reflection message operations through Edge Function
 * Bypasses 403 errors by using server-side endpoint
 */

import { blink } from '../blink/client'

interface ReflectionMessage {
  id: string
  sessionId: string
  role: 'user' | 'assistant'
  content: string
  tokenCount?: number
  emotionalTags?: string
  referencedDreams?: string
  createdAt: string
}

// Edge Function URL - deployed separately to handle reflection_messages operations
// This bypasses the 403 Forbidden error by using server-side authentication
const EDGE_FUNCTION_URL = 'https://8lvkkwdq--reflection-messages.functions.blink.new'

/**
 * Get user's access token for authenticated requests
 */
async function getAccessToken(): Promise<string> {
  const token = await blink.auth.getValidToken()
  if (!token) {
    throw new Error('Not authenticated')
  }
  return token
}

/**
 * List messages for a session
 */
export async function listReflectionMessages(
  sessionId: string,
  limit: number = 50
): Promise<ReflectionMessage[]> {
  try {
    const token = await getAccessToken()
    
    const response = await fetch(
      `${EDGE_FUNCTION_URL}?operation=list&sessionId=${sessionId}&limit=${limit}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    )

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }))
      throw new Error(error.error || `HTTP ${response.status}`)
    }

    const data = await response.json()
    return data.messages || []
  } catch (error: any) {
    console.error('Error listing reflection messages:', error)
    throw error
  }
}

/**
 * Create a new reflection message
 */
export async function createReflectionMessage(data: {
  sessionId: string
  role: 'user' | 'assistant'
  content: string
  tokenCount?: number
  emotionalTags?: string
  referencedDreams?: string
}): Promise<ReflectionMessage> {
  try {
    const token = await getAccessToken()
    
    const response = await fetch(
      `${EDGE_FUNCTION_URL}?operation=create`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      }
    )

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }))
      throw new Error(error.error || `HTTP ${response.status}`)
    }

    const result = await response.json()
    return result.message
  } catch (error: any) {
    console.error('Error creating reflection message:', error)
    throw error
  }
}

/**
 * Delete all messages for a session
 */
export async function deleteReflectionMessagesBySession(
  sessionId: string
): Promise<void> {
  try {
    const token = await getAccessToken()
    
    const response = await fetch(
      `${EDGE_FUNCTION_URL}?operation=deleteBySession&sessionId=${sessionId}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    )

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }))
      throw new Error(error.error || `HTTP ${response.status}`)
    }
  } catch (error: any) {
    console.error('Error deleting reflection messages:', error)
    throw error
  }
}

/**
 * Count messages for a session
 */
export async function countReflectionMessages(
  sessionId: string
): Promise<number> {
  try {
    const token = await getAccessToken()
    
    const response = await fetch(
      `${EDGE_FUNCTION_URL}?operation=count&sessionId=${sessionId}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    )

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }))
      throw new Error(error.error || `HTTP ${response.status}`)
    }

    const data = await response.json()
    return data.count || 0
  } catch (error: any) {
    console.error('Error counting reflection messages:', error)
    throw error
  }
}
