import { db } from './offlineDb'

/**
 * Store a blob in the local offline database.
 */
export async function storeBlob(key: string, blob: Blob, contentType?: string): Promise<void> {
  await db.file_blobs.put({
    key,
    blob,
    content_type: contentType ?? blob.type,
    created_at: new Date().toISOString(),
  })
}

/**
 * Get a blob from the local offline database.
 */
export async function getBlob(key: string): Promise<Blob | undefined> {
  const entry = await db.file_blobs.get(key)
  return entry?.blob
}

/**
 * Get a blob URL (createObjectURL) for a stored blob.
 * Returns undefined if the blob is not found.
 */
export async function getBlobUrl(key: string): Promise<string | undefined> {
  const blob = await getBlob(key)
  if (!blob) return undefined
  return URL.createObjectURL(blob)
}

/**
 * Delete a blob from the local offline database.
 */
export async function deleteBlob(key: string): Promise<void> {
  await db.file_blobs.delete(key)
}

/**
 * Delete multiple blobs matching a prefix (e.g., all blobs for an inspection).
 */
export async function deleteBlobsByPrefix(prefix: string): Promise<void> {
  const keys = await db.file_blobs
    .where('key')
    .startsWith(prefix)
    .primaryKeys()
  await db.file_blobs.bulkDelete(keys)
}
