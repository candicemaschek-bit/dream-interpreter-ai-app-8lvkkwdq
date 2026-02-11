/**
 * ReflectAI Offline Storage
 * Enables offline journaling and syncing when back online
 * 
 * Phase 6 Implementation
 */

const DB_NAME = 'dreamcatcher-reflect-offline'
const DB_VERSION = 1
const SESSIONS_STORE = 'offline-sessions'
const MESSAGES_STORE = 'offline-messages'
const DRAFTS_STORE = 'offline-drafts'

export interface OfflineReflectionSession {
  id: string
  userId: string
  sessionType: string
  dreamId?: string
  dreamTitle?: string
  createdAt: string
  updatedAt: string
  synced: boolean
}

export interface OfflineReflectionMessage {
  id: string
  sessionId: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  synced: boolean
  pendingAIResponse?: boolean
}

export interface OfflineDraft {
  id: string
  sessionId?: string
  content: string
  timestamp: string
}

/**
 * Open IndexedDB connection for ReflectAI offline storage
 */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result

      // Create sessions store
      if (!db.objectStoreNames.contains(SESSIONS_STORE)) {
        const sessionsStore = db.createObjectStore(SESSIONS_STORE, { keyPath: 'id' })
        sessionsStore.createIndex('userId', 'userId', { unique: false })
        sessionsStore.createIndex('synced', 'synced', { unique: false })
      }

      // Create messages store
      if (!db.objectStoreNames.contains(MESSAGES_STORE)) {
        const messagesStore = db.createObjectStore(MESSAGES_STORE, { keyPath: 'id' })
        messagesStore.createIndex('sessionId', 'sessionId', { unique: false })
        messagesStore.createIndex('synced', 'synced', { unique: false })
      }

      // Create drafts store
      if (!db.objectStoreNames.contains(DRAFTS_STORE)) {
        const draftsStore = db.createObjectStore(DRAFTS_STORE, { keyPath: 'id' })
        draftsStore.createIndex('sessionId', 'sessionId', { unique: false })
      }
    }
  })
}

/**
 * Save session offline
 */
export async function saveOfflineSession(session: OfflineReflectionSession): Promise<void> {
  try {
    const db = await openDB()
    const transaction = db.transaction([SESSIONS_STORE], 'readwrite')
    const store = transaction.objectStore(SESSIONS_STORE)

    await new Promise((resolve, reject) => {
      const request = store.put(session)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })

    console.log('[ReflectAI Offline] Session saved:', session.id)
  } catch (error) {
    console.error('[ReflectAI Offline] Failed to save session:', error)
  }
}

/**
 * Save message offline
 */
export async function saveOfflineMessage(message: OfflineReflectionMessage): Promise<void> {
  try {
    const db = await openDB()
    const transaction = db.transaction([MESSAGES_STORE], 'readwrite')
    const store = transaction.objectStore(MESSAGES_STORE)

    await new Promise((resolve, reject) => {
      const request = store.put(message)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })

    console.log('[ReflectAI Offline] Message saved:', message.id)
  } catch (error) {
    console.error('[ReflectAI Offline] Failed to save message:', error)
  }
}

/**
 * Save draft for later
 */
export async function saveOfflineDraft(draft: OfflineDraft): Promise<void> {
  try {
    const db = await openDB()
    const transaction = db.transaction([DRAFTS_STORE], 'readwrite')
    const store = transaction.objectStore(DRAFTS_STORE)

    await new Promise((resolve, reject) => {
      const request = store.put(draft)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })

    console.log('[ReflectAI Offline] Draft saved')
  } catch (error) {
    console.error('[ReflectAI Offline] Failed to save draft:', error)
  }
}

/**
 * Get offline sessions for user
 */
export async function getOfflineSessions(userId: string): Promise<OfflineReflectionSession[]> {
  try {
    const db = await openDB()
    const transaction = db.transaction([SESSIONS_STORE], 'readonly')
    const store = transaction.objectStore(SESSIONS_STORE)
    const index = store.index('userId')

    return new Promise((resolve, reject) => {
      const request = index.getAll(userId)
      request.onsuccess = () => resolve(request.result || [])
      request.onerror = () => reject(request.error)
    })
  } catch (error) {
    console.error('[ReflectAI Offline] Failed to get sessions:', error)
    return []
  }
}

/**
 * Get offline messages for session
 */
export async function getOfflineMessages(sessionId: string): Promise<OfflineReflectionMessage[]> {
  try {
    const db = await openDB()
    const transaction = db.transaction([MESSAGES_STORE], 'readonly')
    const store = transaction.objectStore(MESSAGES_STORE)
    const index = store.index('sessionId')

    return new Promise((resolve, reject) => {
      const request = index.getAll(sessionId)
      request.onsuccess = () => {
        const messages = request.result || []
        // Sort by timestamp
        messages.sort((a: OfflineReflectionMessage, b: OfflineReflectionMessage) => 
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        )
        resolve(messages)
      }
      request.onerror = () => reject(request.error)
    })
  } catch (error) {
    console.error('[ReflectAI Offline] Failed to get messages:', error)
    return []
  }
}

/**
 * Get draft by session ID
 */
export async function getOfflineDraft(sessionId?: string): Promise<OfflineDraft | null> {
  try {
    const db = await openDB()
    const transaction = db.transaction([DRAFTS_STORE], 'readonly')
    const store = transaction.objectStore(DRAFTS_STORE)

    if (sessionId) {
      const index = store.index('sessionId')
      return new Promise((resolve, reject) => {
        const request = index.get(sessionId)
        request.onsuccess = () => resolve(request.result || null)
        request.onerror = () => reject(request.error)
      })
    }

    // Get latest draft
    return new Promise((resolve, reject) => {
      const request = store.getAll()
      request.onsuccess = () => {
        const drafts = request.result || []
        if (drafts.length === 0) return resolve(null)
        // Return most recent
        drafts.sort((a: OfflineDraft, b: OfflineDraft) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        )
        resolve(drafts[0])
      }
      request.onerror = () => reject(request.error)
    })
  } catch (error) {
    console.error('[ReflectAI Offline] Failed to get draft:', error)
    return null
  }
}

/**
 * Delete draft
 */
export async function deleteOfflineDraft(id: string): Promise<void> {
  try {
    const db = await openDB()
    const transaction = db.transaction([DRAFTS_STORE], 'readwrite')
    const store = transaction.objectStore(DRAFTS_STORE)

    await new Promise((resolve, reject) => {
      const request = store.delete(id)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })

    console.log('[ReflectAI Offline] Draft deleted')
  } catch (error) {
    console.error('[ReflectAI Offline] Failed to delete draft:', error)
  }
}

/**
 * Get unsynced items count
 */
export async function getUnsyncedCount(): Promise<{ sessions: number; messages: number }> {
  try {
    const db = await openDB()
    const transaction = db.transaction([SESSIONS_STORE, MESSAGES_STORE], 'readonly')
    
    const sessionsStore = transaction.objectStore(SESSIONS_STORE)
    const messagesStore = transaction.objectStore(MESSAGES_STORE)
    
    const sessionsIndex = sessionsStore.index('synced')
    const messagesIndex = messagesStore.index('synced')

    const [sessions, messages] = await Promise.all([
      new Promise<number>((resolve, reject) => {
        const request = sessionsIndex.count(IDBKeyRange.only(false))
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
      }),
      new Promise<number>((resolve, reject) => {
        const request = messagesIndex.count(IDBKeyRange.only(false))
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
      })
    ])

    return { sessions, messages }
  } catch (error) {
    console.error('[ReflectAI Offline] Failed to get unsynced count:', error)
    return { sessions: 0, messages: 0 }
  }
}

/**
 * Mark session as synced
 */
export async function markSessionSynced(sessionId: string): Promise<void> {
  try {
    const db = await openDB()
    const transaction = db.transaction([SESSIONS_STORE], 'readwrite')
    const store = transaction.objectStore(SESSIONS_STORE)

    const session = await new Promise<OfflineReflectionSession>((resolve, reject) => {
      const request = store.get(sessionId)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })

    if (session) {
      session.synced = true
      await new Promise((resolve, reject) => {
        const request = store.put(session)
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
      })
    }
  } catch (error) {
    console.error('[ReflectAI Offline] Failed to mark session synced:', error)
  }
}

/**
 * Mark message as synced
 */
export async function markMessageSynced(messageId: string): Promise<void> {
  try {
    const db = await openDB()
    const transaction = db.transaction([MESSAGES_STORE], 'readwrite')
    const store = transaction.objectStore(MESSAGES_STORE)

    const message = await new Promise<OfflineReflectionMessage>((resolve, reject) => {
      const request = store.get(messageId)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })

    if (message) {
      message.synced = true
      await new Promise((resolve, reject) => {
        const request = store.put(message)
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
      })
    }
  } catch (error) {
    console.error('[ReflectAI Offline] Failed to mark message synced:', error)
  }
}

/**
 * Clear all synced data (cleanup)
 */
export async function clearSyncedData(): Promise<void> {
  try {
    const db = await openDB()
    const transaction = db.transaction([SESSIONS_STORE, MESSAGES_STORE], 'readwrite')

    const sessionsStore = transaction.objectStore(SESSIONS_STORE)
    const messagesStore = transaction.objectStore(MESSAGES_STORE)

    // Get all synced sessions
    const sessionsIndex = sessionsStore.index('synced')
    const syncedSessions = await new Promise<OfflineReflectionSession[]>((resolve, reject) => {
      const request = sessionsIndex.getAll(IDBKeyRange.only(true))
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })

    // Delete synced sessions
    for (const session of syncedSessions) {
      await new Promise((resolve, reject) => {
        const request = sessionsStore.delete(session.id)
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
      })
    }

    // Get all synced messages
    const messagesIndex = messagesStore.index('synced')
    const syncedMessages = await new Promise<OfflineReflectionMessage[]>((resolve, reject) => {
      const request = messagesIndex.getAll(IDBKeyRange.only(true))
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })

    // Delete synced messages
    for (const message of syncedMessages) {
      await new Promise((resolve, reject) => {
        const request = messagesStore.delete(message.id)
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
      })
    }

    console.log('[ReflectAI Offline] Cleared synced data')
  } catch (error) {
    console.error('[ReflectAI Offline] Failed to clear synced data:', error)
  }
}

/**
 * Check if we're currently offline
 */
export function isOffline(): boolean {
  return !navigator.onLine
}

/**
 * Setup online/offline event listeners
 */
export function setupOfflineListeners(
  onOnline: () => void,
  onOffline: () => void
): () => void {
  window.addEventListener('online', onOnline)
  window.addEventListener('offline', onOffline)

  return () => {
    window.removeEventListener('online', onOnline)
    window.removeEventListener('offline', onOffline)
  }
}

/**
 * Generate offline-compatible ID
 */
export function generateOfflineId(prefix: string = 'offline'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}
