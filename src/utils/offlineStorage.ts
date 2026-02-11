// Offline data storage using IndexedDB

const DB_NAME = 'dreamcatcher-offline';
const DB_VERSION = 1;
const STORE_NAME = 'dreams';
const QUEUE_STORE = 'sync-queue';

interface OfflineDream {
  id: string;
  title: string;
  description: string;
  inputType: string;
  imageUrl?: string;
  symbolsData?: string;
  interpretation?: string;
  videoUrl?: string;
  createdAt: string;
  updatedAt: string;
  synced: boolean;
}

interface SyncQueueItem {
  id: string;
  action: 'create' | 'update' | 'delete';
  data: any;
  timestamp: number;
  retries: number;
}

// Open IndexedDB connection
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create dreams store
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const dreamStore = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        dreamStore.createIndex('synced', 'synced', { unique: false });
        dreamStore.createIndex('createdAt', 'createdAt', { unique: false });
      }

      // Create sync queue store
      if (!db.objectStoreNames.contains(QUEUE_STORE)) {
        const queueStore = db.createObjectStore(QUEUE_STORE, { keyPath: 'id' });
        queueStore.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
  });
}

// Save dream offline
export async function saveDreamOffline(dream: Omit<OfflineDream, 'synced'>): Promise<void> {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    const dreamData: OfflineDream = {
      ...dream,
      synced: false
    };

    await new Promise((resolve, reject) => {
      const request = store.put(dreamData);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    console.log('[Offline] Dream saved:', dream.id);
  } catch (error) {
    console.error('[Offline] Failed to save dream:', error);
    throw error;
  }
}

// Get all offline dreams
export async function getOfflineDreams(): Promise<OfflineDream[]> {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('[Offline] Failed to get dreams:', error);
    return [];
  }
}

// Get single dream by ID
export async function getOfflineDream(id: string): Promise<OfflineDream | null> {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('[Offline] Failed to get dream:', error);
    return null;
  }
}

// Delete offline dream
export async function deleteOfflineDream(id: string): Promise<void> {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    await new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    console.log('[Offline] Dream deleted:', id);
  } catch (error) {
    console.error('[Offline] Failed to delete dream:', error);
  }
}

// Add to sync queue
export async function addToSyncQueue(action: 'create' | 'update' | 'delete', data: any): Promise<void> {
  try {
    const db = await openDB();
    const transaction = db.transaction([QUEUE_STORE], 'readwrite');
    const store = transaction.objectStore(QUEUE_STORE);

    const queueItem: SyncQueueItem = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      action,
      data,
      timestamp: Date.now(),
      retries: 0
    };

    await new Promise((resolve, reject) => {
      const request = store.put(queueItem);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    console.log('[Offline] Added to sync queue:', action);
  } catch (error) {
    console.error('[Offline] Failed to add to sync queue:', error);
  }
}

// Get sync queue
export async function getSyncQueue(): Promise<SyncQueueItem[]> {
  try {
    const db = await openDB();
    const transaction = db.transaction([QUEUE_STORE], 'readonly');
    const store = transaction.objectStore(QUEUE_STORE);

    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('[Offline] Failed to get sync queue:', error);
    return [];
  }
}

// Remove from sync queue
export async function removeFromSyncQueue(id: string): Promise<void> {
  try {
    const db = await openDB();
    const transaction = db.transaction([QUEUE_STORE], 'readwrite');
    const store = transaction.objectStore(QUEUE_STORE);

    await new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    console.log('[Offline] Removed from sync queue:', id);
  } catch (error) {
    console.error('[Offline] Failed to remove from sync queue:', error);
  }
}

// Mark dream as synced
export async function markDreamAsSynced(id: string): Promise<void> {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    const dream = await new Promise<OfflineDream>((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    if (dream) {
      dream.synced = true;
      await new Promise((resolve, reject) => {
        const request = store.put(dream);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      console.log('[Offline] Dream marked as synced:', id);
    }
  } catch (error) {
    console.error('[Offline] Failed to mark dream as synced:', error);
  }
}

// Clear all offline data (for testing)
export async function clearOfflineData(): Promise<void> {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME, QUEUE_STORE], 'readwrite');
    
    await Promise.all([
      new Promise((resolve, reject) => {
        const request = transaction.objectStore(STORE_NAME).clear();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      }),
      new Promise((resolve, reject) => {
        const request = transaction.objectStore(QUEUE_STORE).clear();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      })
    ]);

    console.log('[Offline] All offline data cleared');
  } catch (error) {
    console.error('[Offline] Failed to clear offline data:', error);
  }
}

// Check if online
export function isOnline(): boolean {
  return navigator.onLine;
}

// Listen for online/offline events
export function setupOnlineListeners(
  onOnline: () => void,
  onOffline: () => void
): () => void {
  window.addEventListener('online', onOnline);
  window.addEventListener('offline', onOffline);

  return () => {
    window.removeEventListener('online', onOnline);
    window.removeEventListener('offline', onOffline);
  };
}
