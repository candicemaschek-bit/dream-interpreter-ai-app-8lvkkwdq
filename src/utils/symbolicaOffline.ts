/**
 * Symbolica AI Offline Storage
 * Enables offline symbol viewing and syncing when back online
 * 
 * Similar to ReflectAI offline but for Symbol Orchard
 */

const DB_NAME = 'dreamcatcher-symbolica-offline'
const DB_VERSION = 1
const SYMBOLS_STORE = 'offline-symbols'
const CARE_ACTIONS_STORE = 'offline-care-actions'

export interface OfflineSymbol {
  id: string
  userId: string
  symbol: string
  archetypeCategory: string
  jungianMeaning: string
  personalMeaning: string
  occurrenceCount: number
  contexts: string[]
  emotionalValence: number
  firstSeen: string
  lastSeen: string
  growthPhase: string
  growthProgress: number
  waterLevel: number
  needsWatering: boolean
  synced: boolean
  updatedAt: string
}

export interface OfflineCareAction {
  id: string
  symbolId: string
  action: 'water' | 'fertilize' | 'prune' | 'plant' | 'delete'
  data: Record<string, any>
  timestamp: string
  synced: boolean
}

/**
 * Open IndexedDB connection for Symbolica offline storage
 */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result

      // Create symbols store
      if (!db.objectStoreNames.contains(SYMBOLS_STORE)) {
        const symbolsStore = db.createObjectStore(SYMBOLS_STORE, { keyPath: 'id' })
        symbolsStore.createIndex('userId', 'userId', { unique: false })
        // Use 0/1 for synced status to avoid boolean key issues in some browsers
        symbolsStore.createIndex('synced', 'synced', { unique: false })
      }

      // Create care actions store
      if (!db.objectStoreNames.contains(CARE_ACTIONS_STORE)) {
        const actionsStore = db.createObjectStore(CARE_ACTIONS_STORE, { keyPath: 'id' })
        actionsStore.createIndex('symbolId', 'symbolId', { unique: false })
        // Use 0/1 for synced status to avoid boolean key issues in some browsers
        actionsStore.createIndex('synced', 'synced', { unique: false })
      }
    }
  })
}

/**
 * Save symbol offline (for caching)
 */
export async function saveOfflineSymbol(symbol: OfflineSymbol): Promise<void> {
  try {
    const db = await openDB()
    const transaction = db.transaction([SYMBOLS_STORE], 'readwrite')
    const store = transaction.objectStore(SYMBOLS_STORE)

    // Convert boolean synced to number (0/1) for IDB index compatibility
    const storageItem = {
      ...symbol,
      synced: symbol.synced ? 1 : 0
    }

    await new Promise((resolve, reject) => {
      const request = store.put(storageItem)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })

    console.log('[Symbolica Offline] Symbol saved:', symbol.id)
  } catch (error) {
    console.error('[Symbolica Offline] Failed to save symbol:', error)
  }
}

/**
 * Save multiple symbols offline
 */
export async function saveOfflineSymbols(symbols: OfflineSymbol[]): Promise<void> {
  try {
    const db = await openDB()
    const transaction = db.transaction([SYMBOLS_STORE], 'readwrite')
    const store = transaction.objectStore(SYMBOLS_STORE)

    for (const symbol of symbols) {
      // Convert boolean synced to number (0/1)
      const storageItem = {
        ...symbol,
        synced: symbol.synced ? 1 : 0
      }
      
      await new Promise((resolve, reject) => {
        const request = store.put(storageItem)
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
      })
    }

    console.log('[Symbolica Offline] Saved', symbols.length, 'symbols')
  } catch (error) {
    console.error('[Symbolica Offline] Failed to save symbols:', error)
  }
}

/**
 * Get offline symbols for user
 */
export async function getOfflineSymbols(userId: string): Promise<OfflineSymbol[]> {
  try {
    const db = await openDB()
    const transaction = db.transaction([SYMBOLS_STORE], 'readonly')
    const store = transaction.objectStore(SYMBOLS_STORE)
    const index = store.index('userId')

    const items = await new Promise<any[]>((resolve, reject) => {
      const request = index.getAll(userId)
      request.onsuccess = () => resolve(request.result || [])
      request.onerror = () => reject(request.error)
    })

    // Convert back to boolean for application use
    return items.map(item => ({
      ...item,
      synced: item.synced === 1
    }))
  } catch (error) {
    console.error('[Symbolica Offline] Failed to get symbols:', error)
    return []
  }
}

/**
 * Save care action for offline sync
 */
export async function saveOfflineCareAction(action: OfflineCareAction): Promise<void> {
  try {
    const db = await openDB()
    const transaction = db.transaction([CARE_ACTIONS_STORE], 'readwrite')
    const store = transaction.objectStore(CARE_ACTIONS_STORE)

    // Convert boolean synced to number (0/1)
    const storageItem = {
      ...action,
      synced: action.synced ? 1 : 0
    }

    await new Promise((resolve, reject) => {
      const request = store.put(storageItem)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })

    console.log('[Symbolica Offline] Care action saved:', action.action)
  } catch (error) {
    console.error('[Symbolica Offline] Failed to save care action:', error)
  }
}

/**
 * Get pending care actions
 */
export async function getPendingCareActions(): Promise<OfflineCareAction[]> {
  try {
    const db = await openDB()
    const transaction = db.transaction([CARE_ACTIONS_STORE], 'readonly')
    const store = transaction.objectStore(CARE_ACTIONS_STORE)
    const index = store.index('synced')

    const items = await new Promise<any[]>((resolve, reject) => {
      // Use 0 (false) for unsynced
      const request = index.getAll(IDBKeyRange.only(0))
      request.onsuccess = () => resolve(request.result || [])
      request.onerror = () => reject(request.error)
    })

    // Convert back to boolean
    return items.map(item => ({
      ...item,
      synced: item.synced === 1
    }))
  } catch (error) {
    console.error('[Symbolica Offline] Failed to get pending actions:', error)
    return []
  }
}

/**
 * Mark care action as synced
 */
export async function markCareActionSynced(actionId: string): Promise<void> {
  try {
    const db = await openDB()
    const transaction = db.transaction([CARE_ACTIONS_STORE], 'readwrite')
    const store = transaction.objectStore(CARE_ACTIONS_STORE)

    const action = await new Promise<any>((resolve, reject) => {
      const request = store.get(actionId)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })

    if (action) {
      action.synced = 1 // True
      await new Promise((resolve, reject) => {
        const request = store.put(action)
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
      })
    }
  } catch (error) {
    console.error('[Symbolica Offline] Failed to mark action synced:', error)
  }
}

/**
 * Get unsynced items count
 */
export async function getUnsyncedCount(): Promise<{ symbols: number; actions: number }> {
  try {
    const db = await openDB()
    const transaction = db.transaction([SYMBOLS_STORE, CARE_ACTIONS_STORE], 'readonly')
    
    const symbolsStore = transaction.objectStore(SYMBOLS_STORE)
    const actionsStore = transaction.objectStore(CARE_ACTIONS_STORE)
    
    const symbolsIndex = symbolsStore.index('synced')
    const actionsIndex = actionsStore.index('synced')

    const [symbols, actions] = await Promise.all([
      new Promise<number>((resolve, reject) => {
        // Use 0 (false) for unsynced
        const request = symbolsIndex.count(IDBKeyRange.only(0))
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
      }),
      new Promise<number>((resolve, reject) => {
        // Use 0 (false) for unsynced
        const request = actionsIndex.count(IDBKeyRange.only(0))
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
      })
    ])

    return { symbols, actions }
  } catch (error) {
    console.error('[Symbolica Offline] Failed to get unsynced count:', error)
    return { symbols: 0, actions: 0 }
  }
}

/**
 * Clear synced data
 */
export async function clearSyncedData(): Promise<void> {
  try {
    const db = await openDB()
    const transaction = db.transaction([CARE_ACTIONS_STORE], 'readwrite')
    const store = transaction.objectStore(CARE_ACTIONS_STORE)
    const index = store.index('synced')

    const syncedActions = await new Promise<any[]>((resolve, reject) => {
      // Use 1 (true) for synced
      const request = index.getAll(IDBKeyRange.only(1))
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })

    for (const action of syncedActions) {
      await new Promise((resolve, reject) => {
        const request = store.delete(action.id)
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
      })
    }

    console.log('[Symbolica Offline] Cleared synced data')
  } catch (error) {
    console.error('[Symbolica Offline] Failed to clear synced data:', error)
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
