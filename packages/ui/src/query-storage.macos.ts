import { createMemoryQueryStorage, type QueryStorageAdapter } from './query-cache'

/**
 * Default query persistence adapter on macOS — the AppKit host has no
 * `__xplatAppKit` defaults bridge yet, so persisted snapshots live for the
 * process only. Supply a durable adapter via `persist.storage` when an
 * AppKit bridge lands.
 */
export const platformQueryStorage: QueryStorageAdapter = createMemoryQueryStorage()
