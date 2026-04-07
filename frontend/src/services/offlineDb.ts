import Dexie, { type Table } from 'dexie'
import type { Patient, Appointment } from '@/types'

// ---------- Sync Queue ----------

export type SyncQueueStatus = 'pending' | 'syncing' | 'synced' | 'conflict' | 'failed'

export interface SyncQueueItem {
  id?: number
  method: 'POST' | 'PATCH' | 'DELETE' | 'PUT'
  url: string
  body?: string                    // JSON-serialised request body
  headers?: string                 // JSON-serialised extra headers
  timestamp: string                // ISO-8601 when the request was queued
  status: SyncQueueStatus
  retryCount: number
  lastError?: string
  /** Server data returned on 409 — stored for the conflict modal */
  serverData?: string
  /** Human-readable description so the conflict modal can show what changed */
  description?: string
}

// ---------- Sync Log ----------

export interface SyncLog {
  id?: number
  timestamp: string
  success: boolean
  itemCount: number
  conflictCount: number
  errors: string[]
}

// ---------- Database ----------

class CardioClinicDB extends Dexie {
  patients!: Table<Patient & { _syncStatus?: string }>
  appointments!: Table<Appointment & { _syncStatus?: string }>
  syncQueue!: Table<SyncQueueItem>
  syncLog!: Table<SyncLog>

  constructor() {
    super('CardioClinicDB')

    this.version(1).stores({
      patients: 'id, full_name, phone, updated_at',
      appointments: 'id, patient_id, scheduled_at, status',
      syncQueue: '++id, status, timestamp',
      syncLog: '++id, timestamp',
    })
  }
}

export const db = new CardioClinicDB()
