import { db, type SyncQueueItem, type EntityType, type OperationType } from './offlineDb'

export interface EnqueueMutationInput {
  temp_id: string
  entity: EntityType
  operation: OperationType
  payload: Record<string, unknown>
  blob_keys?: string[]
  depends_on?: string[]
  inspection_id?: string | null
}

/**
 * Enqueue a mutation for later sync.
 */
export async function enqueueMutation(input: EnqueueMutationInput): Promise<number> {
  const now = new Date().toISOString()
  const item: SyncQueueItem = {
    temp_id: input.temp_id,
    entity: input.entity,
    operation: input.operation,
    payload: input.payload,
    blob_keys: input.blob_keys ?? [],
    depends_on: input.depends_on ?? [],
    inspection_id: input.inspection_id ?? null,
    status: 'pending',
    retry_count: 0,
    last_error: null,
    created_at: now,
    updated_at: now,
  }
  return await db.sync_queue.add(item)
}

/**
 * Get count of pending items in the sync queue.
 */
export async function getPendingCount(): Promise<number> {
  return db.sync_queue.where('status').equals('pending').count()
}

/**
 * Get all failed items from the sync queue.
 */
export async function getFailedItems(): Promise<SyncQueueItem[]> {
  return db.sync_queue.where('status').equals('failed').toArray()
}

/**
 * Get all pending items sorted by created_at.
 */
export async function getPendingItems(): Promise<SyncQueueItem[]> {
  return db.sync_queue
    .where('status')
    .equals('pending')
    .sortBy('created_at')
}

/**
 * Update a queue item status.
 */
export async function updateQueueItem(
  id: number,
  updates: Partial<Pick<SyncQueueItem, 'status' | 'retry_count' | 'last_error' | 'payload'>>,
): Promise<void> {
  await db.sync_queue.update(id, {
    ...updates,
    updated_at: new Date().toISOString(),
  })
}

/**
 * Mark a queue item as done and optionally clean up.
 */
export async function markQueueItemDone(id: number): Promise<void> {
  await db.sync_queue.update(id, {
    status: 'done',
    updated_at: new Date().toISOString(),
  })
}

/**
 * Retry a single failed item by resetting its status to pending.
 */
export async function retryQueueItem(id: number): Promise<void> {
  await db.sync_queue.update(id, {
    status: 'pending',
    retry_count: 0,
    last_error: null,
    updated_at: new Date().toISOString(),
  })
}

/**
 * Retry all failed items.
 */
export async function retryAllFailed(): Promise<void> {
  const failed = await getFailedItems()
  await Promise.all(failed.map((item) => retryQueueItem(item.id!)))
}

/**
 * Clean up completed items from the queue.
 */
export async function cleanupDoneItems(): Promise<void> {
  const doneIds = await db.sync_queue
    .where('status')
    .equals('done')
    .primaryKeys()
  await db.sync_queue.bulkDelete(doneIds)
}
