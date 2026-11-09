import { File, knownFolders, path as nsPath } from '@nativescript/core'

/**
 * Windows preferences persist to a JSON document in the app container's
 * local state. The upstream ApplicationSettings path is unusable on this
 * host: the NSWinRT projection surfaces ApplicationData.LocalSettings.Values
 * as an opaque handle — none of IMap's members (HasKey, Lookup, Insert,
 * Remove, First) are callable, so every read/write through it is a no-op.
 *
 * Reads are synchronous from an in-memory snapshot; writes persist
 * synchronously at call time so a killed process cannot lose them, and
 * the initial disk load converges the file once it resolves. `flush`
 * stays false: the contract exposes no blocking commit confirmation.
 *
 * @example
 * import { storage } from '@octane-xplat/platform'
 * storage.setString('draft', 'Passport')
 * const draft = storage.getString('draft')
 */
const entries = new Map<string, string>()

const storePath = (): string =>
  nsPath.join(knownFolders.documents().path, 'octane-preferences.json')

const writeFile = (): void => {
  try {
    File.fromPath(storePath()).writeTextSync(JSON.stringify([...entries]))
  } catch {}
}

void (async () => {
  try {
    const path = storePath()

    if (File.exists(path)) {
      const text = await File.fromPath(path).readText()

      for (const pair of JSON.parse(text) as [string, string][]) {
        entries.set(pair[0], String(pair[1]))
      }
    }
  } catch {}

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
