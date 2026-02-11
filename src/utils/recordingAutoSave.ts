/**
 * IndexedDB utility for auto-saving voice recordings
 * Prevents data loss if browser closes unexpectedly during recording
 */

const DB_NAME = 'DreamcatcherRecordings'
const DB_VERSION = 1
const STORE_NAME = 'recordings'

export interface RecordingSession {
  id: string
  chunks: Blob[]
  startTime: number
  lastSaved: number
  duration: number
}

class RecordingAutoSave {
  private db: IDBDatabase | null = null

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' })
        }
      }
    })
  }

  async saveRecordingSession(session: RecordingSession): Promise<void> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'))
        return
      }

      const transaction = this.db.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.put(session)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async getRecordingSession(id: string): Promise<RecordingSession | null> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'))
        return
      }

      const transaction = this.db.transaction([STORE_NAME], 'readonly')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.get(id)

      request.onsuccess = () => resolve(request.result || null)
      request.onerror = () => reject(request.error)
    })
  }

  async getAllRecordingSessions(): Promise<RecordingSession[]> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'))
        return
      }

      const transaction = this.db.transaction([STORE_NAME], 'readonly')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.getAll()

      request.onsuccess = () => resolve(request.result || [])
      request.onerror = () => reject(request.error)
    })
  }

  async deleteRecordingSession(id: string): Promise<void> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'))
        return
      }

      const transaction = this.db.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.delete(id)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async clearOldSessions(maxAgeMs: number = 24 * 60 * 60 * 1000): Promise<void> {
    const sessions = await this.getAllRecordingSessions()
    const now = Date.now()

    const deletePromises = sessions
      .filter(session => now - session.lastSaved > maxAgeMs)
      .map(session => this.deleteRecordingSession(session.id))

    await Promise.all(deletePromises)
  }
}

export const recordingAutoSave = new RecordingAutoSave()
