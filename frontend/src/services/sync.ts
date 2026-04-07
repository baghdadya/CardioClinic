/**
 * Offline sync service for CardioClinic.
 *
 * Responsibilities:
 *  1. Queue write operations (POST/PATCH/PUT/DELETE) when offline.
 *  2. Detect connectivity changes and replay the queue when back online.
 *  3. Handle 409-conflict responses and surface them to the UI.
 *
 * IMPORTANT — medical data must never be silently lost.  Every queued
 * operation is persisted to IndexedDB and only removed after a confirmed
 * server acknowledgement (2xx).  Conflicts are never auto-resolved; they
 * require explicit user action.
 */

import axios, { type AxiosRequestConfig, type AxiosResponse } from 'axios'
import { db, type SyncQueueItem, type SyncQueueStatus } from './offlineDb'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ConnectionStatus = 'online' | 'offline'

export interface SyncState {
  connection: ConnectionStatus
  pendingCount: number
  conflictCount: number
  isSyncing: boolean
}

export type SyncStateListener = (state: SyncState) => void

// ---------------------------------------------------------------------------
// Internal state
// ---------------------------------------------------------------------------

let _isSyncing = false
const _listeners = new Set<SyncStateListener>()

function currentConnection(): ConnectionStatus {
  return navigator.onLine ? 'online' : 'offline'
}

// ---------------------------------------------------------------------------
// State broadcasting
// ---------------------------------------------------------------------------

async function buildState(): Promise<SyncState> {
  const pending = await db.syncQueue.where('status').equals('pending').count()
  const conflict = await db.syncQueue.where('status').equals('conflict').count()
  return {
    connection: currentConnection(),
    pendingCount: pending,
    conflictCount: conflict,
    isSyncing: _isSyncing,
  }
}

async function notify() {
  const state = await buildState()
  _listeners.forEach((fn) => fn(state))
}

/** Subscribe to sync-state changes.  Returns an unsubscribe function. */
export function subscribeSyncState(fn: SyncStateListener): () => void {
  _listeners.add(fn)
  // Fire immediately so the caller gets the initial state
  buildState().then(fn)
  return () => {
    _listeners.delete(fn)
  }
}

// ---------------------------------------------------------------------------
// Queue operations
// ---------------------------------------------------------------------------

/**
 * Enqueue a write request for later replay.
 * Returns a stable local id that callers can use to track the item.
 */
export async function enqueueRequest(
  config: AxiosRequestConfig,
  description?: string,
): Promise<number> {
  const item: SyncQueueItem = {
    method: (config.method?.toUpperCase() ?? 'POST') as SyncQueueItem['method'],
    url: config.url ?? '',
    body: config.data ? JSON.stringify(config.data) : undefined,
    headers: config.headers ? JSON.stringify(config.headers) : undefined,
    timestamp: new Date().toISOString(),
    status: 'pending',
    retryCount: 0,
    description:
      description ??
      `${config.method?.toUpperCase()} ${config.url}`,
  }
  const id = await db.syncQueue.add(item)
  await notify()
  return id as number
}

/** Return all queue items with a given status. */
export async function getQueueItems(
  status?: SyncQueueStatus,
): Promise<SyncQueueItem[]> {
  if (status) {
    return db.syncQueue.where('status').equals(status).sortBy('timestamp')
  }
  return db.syncQueue.orderBy('timestamp').toArray()
}

/** Return a single queue item by id. */
export async function getQueueItem(id: number): Promise<SyncQueueItem | undefined> {
  return db.syncQueue.get(id)
}

/** Update a queue item (partial). */
export async function updateQueueItem(
  id: number,
  changes: Partial<SyncQueueItem>,
): Promise<void> {
  await db.syncQueue.update(id, changes)
  await notify()
}

/** Remove a queue item. */
export async function removeQueueItem(id: number): Promise<void> {
  await db.syncQueue.delete(id)
  await notify()
}

// ---------------------------------------------------------------------------
// Conflict resolution helpers
// ---------------------------------------------------------------------------

/**
 * Resolve a conflict by keeping the local (offline) version.
 * Sends the request again with a force-overwrite header so the server
 * accepts it despite version mismatch.
 */
export async function resolveKeepLocal(id: number): Promise<boolean> {
  const item = await db.syncQueue.get(id)
  if (!item) return false

  try {
    const headers: Record<string, string> = item.headers
      ? JSON.parse(item.headers)
      : {}
    headers['X-Force-Overwrite'] = 'true'

    await axios({
      method: item.method,
      url: item.url,
      data: item.body ? JSON.parse(item.body) : undefined,
      headers,
    })
    await db.syncQueue.delete(id)
    await notify()
    return true
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    await db.syncQueue.update(id, { lastError: msg })
    await notify()
    return false
  }
}

/** Resolve a conflict by discarding the local version. */
export async function resolveKeepServer(id: number): Promise<void> {
  await db.syncQueue.delete(id)
  await notify()
}

// ---------------------------------------------------------------------------
// Sync process
// ---------------------------------------------------------------------------

const MAX_RETRIES = 5

/**
 * Process all pending queue items sequentially (oldest first).
 * Called automatically when the browser comes back online and can also be
 * triggered manually.
 */
export async function processQueue(): Promise<void> {
  if (_isSyncing) return
  if (!navigator.onLine) return

  _isSyncing = true
  await notify()

  const pending = await db.syncQueue
    .where('status')
    .equals('pending')
    .sortBy('timestamp')

  let successCount = 0
  let conflictCount = 0
  const errors: string[] = []

  for (const item of pending) {
    if (!navigator.onLine) break // went offline mid-sync

    try {
      await db.syncQueue.update(item.id!, { status: 'syncing' })

      const headers: Record<string, string> = item.headers
        ? JSON.parse(item.headers)
        : {}

      const response: AxiosResponse = await axios({
        method: item.method,
        url: item.url,
        data: item.body ? JSON.parse(item.body) : undefined,
        headers,
      })

      if (response.status >= 200 && response.status < 300) {
        await db.syncQueue.delete(item.id!)
        successCount++
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: AxiosResponse; message?: string }

      if (axiosErr.response?.status === 409) {
        // Conflict — store server payload so the modal can display it
        await db.syncQueue.update(item.id!, {
          status: 'conflict' as SyncQueueStatus,
          serverData: JSON.stringify(axiosErr.response.data),
          lastError: 'Conflict: server data has changed since your edit',
        })
        conflictCount++
      } else {
        const retries = (item.retryCount ?? 0) + 1
        const newStatus: SyncQueueStatus =
          retries >= MAX_RETRIES ? 'failed' : 'pending'
        const msg = axiosErr.message ?? 'Unknown error'
        await db.syncQueue.update(item.id!, {
          status: newStatus,
          retryCount: retries,
          lastError: msg,
        })
        errors.push(`${item.method} ${item.url}: ${msg}`)
      }
    }
  }

  // Write sync log
  await db.syncLog.add({
    timestamp: new Date().toISOString(),
    success: errors.length === 0 && conflictCount === 0,
    itemCount: successCount,
    conflictCount,
    errors,
  })

  _isSyncing = false
  await notify()
}

// ---------------------------------------------------------------------------
// Connectivity listeners — attach once at app startup
// ---------------------------------------------------------------------------

let _initialized = false

export function initSyncListeners(): () => void {
  if (_initialized) return () => {}
  _initialized = true

  const onOnline = () => {
    notify()
    processQueue()
  }

  const onOffline = () => {
    notify()
  }

  window.addEventListener('online', onOnline)
  window.addEventListener('offline', onOffline)

  // Run an initial sync in case there are queued items from a previous session
  if (navigator.onLine) {
    processQueue()
  }

  return () => {
    window.removeEventListener('online', onOnline)
    window.removeEventListener('offline', onOffline)
    _initialized = false
  }
}
