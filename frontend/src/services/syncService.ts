/**
 * Backward-compatibility shim.
 *
 * The canonical sync implementation now lives in @/services/sync.
 * This file re-exports the APIs that existing hooks and components import
 * so nothing breaks during the migration.
 */

export type { SyncState as SyncStatus } from './sync'
export {
  enqueueRequest as enqueueWrite,
  processQueue,
  getQueueItems,
  subscribeSyncState,
  initSyncListeners,
} from './sync'

import { db } from './offlineDb'
import type { SyncQueueItem } from './offlineDb'

/** @deprecated — use subscribeSyncState instead */
export async function getPendingCount(): Promise<number> {
  return db.syncQueue.where('status').anyOf('pending', 'syncing').count()
}

/** @deprecated — use getQueueItems('failed') instead */
export async function getFailedItems(): Promise<SyncQueueItem[]> {
  return db.syncQueue.where('status').equals('failed').toArray()
}

/** Reset all failed items to pending and re-process. */
export async function retryFailed(): Promise<void> {
  const { processQueue } = await import('./sync')
  await db.syncQueue
    .where('status')
    .equals('failed')
    .modify({ status: 'pending', retryCount: 0 })
  await processQueue()
}
