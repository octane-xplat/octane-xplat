import { File, knownFolders, path as nsPath } from '@nativescript/core'

/**
 * Windows preferences persist to a JSON document in the app container's
 * local state. The upstream ApplicationSettings path is unusable on this
 * host: the NSWinRT projection surfaces ApplicationData.LocalSettings.Values
 * as an opaque handle — none of IMap's members (HasKey, Lookup, Insert,
 * Remove, First) are callable, so every read/write through it is a no-op.
 *
 * Reads are synchronous from an in-memory snapshot populated by the
 * initial load; writes enqueue an async write of the whole snapshot at
 * call time (not behind the load) and the post-load write converges the
 * file. `flush` stays false: no blocking commit confirmation is exposed.
 *
 * @example
 * import { storage } from '@octane-xplat/platform'
 * storage.setString('draft', 'Passport')
 * const draft = storage.getString('draft')
 */
const entries = new Map<string, string>()

const storePath = (): string =>
  nsPath.join(knownFolders.documents().path, 'octane-preferences.json')

let writeTail: Promise<unknown> = Promise.resolve()

const writeFile = (): void => {
  const snapshot = JSON.stringify([...entries])

  writeTail = writeTail
    .then(() => File.fromPath(storePath()).writeText(snapshot))
    .catch((error) => {
      ;(globalThis as Record<string, unknown>).__xplatStorageWriteError =
        error instanceof Error ? error.message : String(error)
    })

  ;(globalThis as Record<string, unknown>).__xplatStorageWriteCount =
    (((globalThis as Record<string, unknown>).__xplatStorageWriteCount as number) ?? 0) + 1
}

// The file APIs' *Sync variants are stubs on this host (readTextSync yields
// "undefined", writeTextSync reports success without writing); only the async
// calls perform real IO.
const load: Promise<unknown> = (async () => {
  try {
    const path = storePath()

    if (File.exists(path)) {
      const text = await File.fromPath(path).readText()

      for (const pair of JSON.parse(text) as [string, string][]) {
        entries.set(pair[0], String(pair[1]))
      }
    }
  } catch (error) {
    ;(globalThis as Record<string, unknown>).__xplatStorageLoadError =
      error instanceof Error ? error.message : String(error)
  }

  writeFile()
})()

const persist = (): void => {
  writeFile()
}

export const storage = {
  getString: (key: string): string | null => {
    const value = entries.get(key)

    return value === undefined ? null : value
  },
  setString: (key: string, value: string): void => {
    entries.set(key, value)
    persist()
  },
  remove: (key: string): void => {
    if (entries.delete(key)) {
      persist()
    }
  },
  /** False: persistence is asynchronous; no blocking commit is exposed. */
  flush: (): boolean => false,
}
