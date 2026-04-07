import { useEffect, useState } from 'react'
import { subscribeSyncState, type SyncState } from '@/services/sync'
import type { SyncQueueItem } from '@/services/offlineDb'
import { getQueueItems } from '@/services/sync'

export type SyncStatus = 'synced' | 'syncing' | 'pending' | 'error' | 'conflict'

function deriveLegacyStatus(s: SyncState): SyncStatus {
  if (s.conflictCount > 0) return 'conflict'
  if (s.isSyncing) return 'syncing'
  if (s.pendingCount > 0) return 'pending'
  return 'synced'
}

export function useSyncStatus() {
  const [status, setStatus] = useState<SyncStatus>('synced')
  const [pendingCount, setPendingCount] = useState(0)
  const [failedItems, setFailedItems] = useState<SyncQueueItem[]>([])

  useEffect(() => {
    return subscribeSyncState(async (state) => {
      setStatus(deriveLegacyStatus(state))
      setPendingCount(state.pendingCount)
      const failed = await getQueueItems('failed')
      setFailedItems(failed)
    })
  }, [])

  return { status, pendingCount, failedItems }
}
