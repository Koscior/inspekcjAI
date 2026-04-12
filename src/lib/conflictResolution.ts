/**
 * Last-Write-Wins conflict resolution.
 *
 * Compares updated_at timestamps. If server record is newer, server wins.
 * If local is newer (or equal), local wins.
 */
export function resolveConflict<T extends { updated_at: string }>(
  localRecord: T,
  serverRecord: T,
): { winner: T; source: 'local' | 'server'; hadConflict: boolean } {
  const localTime = new Date(localRecord.updated_at).getTime()
  const serverTime = new Date(serverRecord.updated_at).getTime()

  // Server wins if newer or equal (safe default)
  if (serverTime >= localTime) {
    return {
      winner: serverRecord,
      source: 'server',
      hadConflict: serverTime > localTime,
    }
  }

  return {
    winner: localRecord,
    source: 'local',
    hadConflict: false,
  }
}
