import { supabase } from '@/config/supabase'
import { db, isTempId, type SyncQueueItem, type EntityType } from './offlineDb'
import { getPendingItems, updateQueueItem, markQueueItemDone } from './syncQueue'
import { getBlob, deleteBlob } from './offlineStorage'
import { resolveConflict } from './conflictResolution'
import { STORAGE_BUCKETS } from '@/config/constants'

const MAX_RETRIES = 5
const MAX_DEFERRALS = 3

export interface SyncResult {
  processed: number
  failed: number
  deferred: number
}

// Map entity types to their Supabase table names
const ENTITY_TABLE_MAP: Record<EntityType, string> = {
  inspection: 'inspections',
  client: 'clients',
  defect: 'defects',
  photo: 'photos',
  floor_plan: 'floor_plans',
  pin: 'pins',
  checklist_item: 'checklist_items',
  voice_note: 'voice_notes',
  report: 'reports',
}

// Map entity types to their storage bucket (for file entities)
const ENTITY_BUCKET_MAP: Partial<Record<EntityType, string>> = {
  photo: STORAGE_BUCKETS.photos,
  floor_plan: STORAGE_BUCKETS.floorPlans,
  voice_note: STORAGE_BUCKETS.voiceNotes,
  report: STORAGE_BUCKETS.reportPdfs,
}

class SyncProcessor {
  private isRunning = false

  async processAll(): Promise<SyncResult> {
    if (this.isRunning) return { processed: 0, failed: 0, deferred: 0 }

    this.isRunning = true
    const result: SyncResult = { processed: 0, failed: 0, deferred: 0 }
    const deferralCounts = new Map<number, number>()

    try {
      let items = await getPendingItems()

      while (items.length > 0) {
        let madeProgress = false

        for (const item of items) {
          const id = item.id!

          // Check if dependencies are resolved
          if (!await this.areDependenciesResolved(item)) {
            const deferrals = (deferralCounts.get(id) ?? 0) + 1
            deferralCounts.set(id, deferrals)

            if (deferrals >= MAX_DEFERRALS) {
              await updateQueueItem(id, {
                status: 'failed',
                last_error: 'Nierozwiązane zależności po maksymalnej liczbie odroczeń',
              })
              result.failed++
            } else {
              result.deferred++
            }
            continue
          }

          // Process the item
          await updateQueueItem(id, { status: 'processing' })

          try {
            await this.processItem(item)
            await markQueueItemDone(id)
            result.processed++
            madeProgress = true
          } catch (err) {
            const retryCount = (item.retry_count ?? 0) + 1
            const errorMsg = err instanceof Error ? err.message : String(err)

            if (retryCount >= MAX_RETRIES) {
              await updateQueueItem(id, {
                status: 'failed',
                retry_count: retryCount,
                last_error: errorMsg,
              })
              result.failed++
            } else {
              await updateQueueItem(id, {
                status: 'pending',
                retry_count: retryCount,
                last_error: errorMsg,
              })
            }
          }
        }

        // If no progress was made, break to avoid infinite loop
        if (!madeProgress) break

        // Fetch remaining pending items for next iteration
        items = await getPendingItems()
      }
    } finally {
      this.isRunning = false
    }

    return result
  }

  private async areDependenciesResolved(item: SyncQueueItem): Promise<boolean> {
    if (item.depends_on.length === 0) return true

    for (const depTempId of item.depends_on) {
      if (!isTempId(depTempId)) continue

      const remap = await db.id_remaps.get(depTempId)
      if (!remap) return false
    }
    return true
  }

  private async processItem(item: SyncQueueItem): Promise<void> {
    // Resolve temp IDs in payload
    const resolvedPayload = await this.resolveIds(item.payload)
    const table = ENTITY_TABLE_MAP[item.entity]

    switch (item.operation) {
      case 'insert':
        await this.processInsert(item, resolvedPayload, table)
        break
      case 'update':
        await this.processUpdate(item, resolvedPayload, table)
        break
      case 'delete':
        await this.processDelete(resolvedPayload, table)
        break
    }
  }

  private async processInsert(
    item: SyncQueueItem,
    payload: Record<string, unknown>,
    table: string,
  ): Promise<void> {
    // Upload blobs first (if any)
    await this.uploadBlobs(item)

    // Remove local-only fields before sending to Supabase
    const { _sync_status, ...insertPayload } = payload
    void _sync_status

    // Remove the temp ID — let Supabase generate a real one
    const tempId = insertPayload.id as string
    delete insertPayload.id

    const { data, error } = await supabase
      .from(table)
      .insert(insertPayload)
      .select()
      .single()

    if (error) throw error

    const realId = (data as { id: string }).id

    // Save the ID remap
    await db.id_remaps.put({
      temp_id: tempId,
      real_id: realId,
      created_at: new Date().toISOString(),
    })

    // Update local record: remove temp, insert real
    const dexieTable = this.getDexieTable(item.entity)
    await dexieTable.delete(tempId)
    await dexieTable.put({ ...data, _sync_status: 'synced' })

    // Rewrite dependents
    await this.rewriteDependents(tempId, realId)
  }

  private async processUpdate(
    item: SyncQueueItem,
    payload: Record<string, unknown>,
    table: string,
  ): Promise<void> {
    const id = payload.id as string
    const { _sync_status, ...updatePayload } = payload
    void _sync_status

    // Check for conflicts — fetch current server record
    const { data: serverRecord } = await supabase
      .from(table)
      .select('*')
      .eq('id', id)
      .single()

    if (serverRecord && 'updated_at' in updatePayload && 'updated_at' in serverRecord) {
      const { source } = resolveConflict(
        updatePayload as { updated_at: string },
        serverRecord as { updated_at: string },
      )

      if (source === 'server') {
        // Server wins — update local with server data
        const dexieTable = this.getDexieTable(item.entity)
        await dexieTable.put({ ...serverRecord, _sync_status: 'synced' })
        return
      }
    }

    // Upload blobs if any
    await this.uploadBlobs(item)

    // Remove id from update payload
    delete updatePayload.id

    const { data, error } = await supabase
      .from(table)
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    // Update local record
    const dexieTable = this.getDexieTable(item.entity)
    await dexieTable.put({ ...data, _sync_status: 'synced' })
  }

  private async processDelete(
    payload: Record<string, unknown>,
    table: string,
  ): Promise<void> {
    const id = payload.id as string

    const { error } = await supabase
      .from(table)
      .delete()
      .eq('id', id)

    // Ignore "not found" errors — record may already be deleted
    if (error && !error.message.includes('not found')) throw error
  }

  private async uploadBlobs(item: SyncQueueItem): Promise<void> {
    const bucket = ENTITY_BUCKET_MAP[item.entity]
    if (!bucket || item.blob_keys.length === 0) return

    for (const blobKey of item.blob_keys) {
      const blob = await getBlob(blobKey)
      if (!blob) continue

      const { error } = await supabase.storage
        .from(bucket)
        .upload(blobKey, blob, {
          contentType: blob.type || 'application/octet-stream',
          upsert: true,
        })

      if (error) throw error

      // Clean up the local blob after successful upload
      await deleteBlob(blobKey)
    }
  }

  private async resolveIds(payload: Record<string, unknown>): Promise<Record<string, unknown>> {
    const resolved = { ...payload }

    for (const [key, value] of Object.entries(resolved)) {
      if (typeof value === 'string' && isTempId(value)) {
        const remap = await db.id_remaps.get(value)
        if (remap) {
          resolved[key] = remap.real_id
        }
      }
    }

    return resolved
  }

  private async rewriteDependents(tempId: string, realId: string): Promise<void> {
    // Find all pending queue items that depend on this temp ID
    const pendingItems = await getPendingItems()

    for (const item of pendingItems) {
      let changed = false
      const newPayload = { ...item.payload }
      const newDependsOn = [...item.depends_on]

      // Rewrite depends_on
      const depIdx = newDependsOn.indexOf(tempId)
      if (depIdx >= 0) {
        newDependsOn[depIdx] = realId
        changed = true
      }

      // Rewrite payload values
      for (const [key, value] of Object.entries(newPayload)) {
        if (value === tempId) {
          newPayload[key] = realId
          changed = true
        }
      }

      if (changed) {
        await updateQueueItem(item.id!, {
          payload: newPayload,
        })
        // Also update depends_on directly (not in the updateQueueItem helper)
        await db.sync_queue.update(item.id!, { depends_on: newDependsOn })
      }
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private getDexieTable(entity: EntityType): any {
    const tableMap = {
      inspection: db.inspections,
      client: db.clients,
      defect: db.defects,
      photo: db.photos,
      floor_plan: db.floor_plans,
      pin: db.pins,
      checklist_item: db.checklist_items,
      voice_note: db.voice_notes,
      report: db.reports,
    }
    return tableMap[entity]
  }
}

export const syncProcessor = new SyncProcessor()
