import { File, Folder, knownFolders, path as nsPath } from '@nativescript/core'
import {
  appInfo,
  authSession,
  clipboard,
  connectivity,
  device,
  keepAwake,
  random,
  storage,
  webAuthn,
} from '@octane-xplat/platform'

import { files } from '@octane-xplat/files'
import { secureStorage } from '@octane-xplat/secure-storage'
import { Windows, NSWinRT } from '@octane-xplat/platform/windows'
import { Application, Screen } from '@nativescript/core'

type Emit = (event: string, data?: Record<string, unknown>) => void

const PERSIST_KEY = 'core20-service-persist'

async function clipboardSpec(): Promise<Record<string, unknown>> {
  const unicode = 'Core20 café  🔒 §±'
  const absentBefore = clipboard.canCopy ? await clipboard.readText() : null
  const wrote = await clipboard.writeText(unicode)
  const readBack = wrote ? await clipboard.readText() : null
  const wroteEmpty = await clipboard.writeText('')
  const readEmpty = await clipboard.readText()
  return {
    canCopy: clipboard.canCopy,
    wrote,
    readBack,
    matched: readBack === unicode,
    absentBefore: absentBefore ?? null,
    wroteEmpty,
    readEmpty,
    emptyRoundtrips: wroteEmpty && readEmpty === '',
  }
}

async function randomSpec(): Promise<Record<string, unknown>> {
  const supported = random.supported
  const small = supported ? Array.from(random.bytes(32)) : []
  const zero = supported ? random.bytes(0).length : -1
  const a = supported ? Array.from(random.bytes(16)) : []
  const b = supported ? Array.from(random.bytes(16)) : []
  const filled = new Uint8Array(70000)
  if (supported) {
    random.fill(filled)
  }
  let filledDistinct = 0
  if (supported) {
    const seen = new Set<number>()
    for (const byte of filled.subarray(0, 4096)) {
      seen.add(byte)
    }

    filledDistinct = seen.size
  }
  let nonViewError = ''
  try {
    random.fill({} as never)
  } catch (error) {
    nonViewError = error instanceof TypeError ? 'TypeError' : String(error)
  }
  let negativeError = ''
  try {
    random.bytes(-1)
  } catch (error) {
    negativeError = error instanceof RangeError ? 'RangeError' : String(error)
  }
  return {
    supported,
    smallLength: small.length,
    zeroLength: zero,
    smallDistinct: new Set(small).size > 1,
    consecutiveDistinct: a.join(',') !== b.join(','),
    filledDistinct,
    nonViewError,
    negativeError,
  }
}

function storageProbe(): Record<string, unknown> {
  try {
    const values = Windows?.Storage?.ApplicationData?.Current?.LocalSettings?.Values
    if (!values) {
      return { valuesPresent: false }
    }

    return {
      valuesPresent: true,
      hasLookup: typeof values.Lookup === 'function',
      hasInsert: typeof values.Insert === 'function',
      hasRemove: typeof values.Remove === 'function',
      hasHasKey: typeof values.HasKey === 'function',
      hasFirst: typeof values.First === 'function',
      hasSize: typeof values.Size === 'number' || typeof values.Size === 'function',
      ownKeys: Object.getOwnPropertyNames(values).slice(0, 24).join(','),
      protoKeys: Object.getOwnPropertyNames(Object.getPrototypeOf(values) ?? {})
        .slice(0, 24)
        .join(','),
    }
  } catch (error) {
    return { valuesPresent: false, probeError: String(error) }
  }
}

async function storageSpec(persistValue?: string): Promise<Record<string, unknown>> {
  const key = 'core20-service-rt'
  const hadBefore = storage.getString(key)
  storage.setString(key, 'roundtrip')
  const read = storage.getString(key)
  storage.setString(key, '')
  const emptyRead = storage.getString(key)
  storage.setString(key, 'ctrl')
  const ctrlRead = storage.getString(key)
  storage.remove(key)
  const removedRead = storage.getString(key)
  // Preferences load asynchronously at leaf init; give the snapshot a
  // bounded moment before reading the cross-launch value.
  if (persistValue === undefined) {
    await new Promise((resolve) => setTimeout(resolve, 400))
  }
  const persistRead = persistValue === undefined ? storage.getString(PERSIST_KEY) : null
  if (persistValue !== undefined) {
    storage.setString(PERSIST_KEY, persistValue)
  }
  return {
    hadBefore,
    read,
    emptyRead,
    ctrlRead,
    removedRead,
    persistRead,
    persistWrote: persistValue ?? null,
    flush: storage.flush(),
    probe: storageProbe(),
  }
}

async function keepAwakeSpec(): Promise<Record<string, unknown>> {
  const activated = await keepAwake.activate()
  const deactivated = await keepAwake.deactivate()
  const activatedTwo = await Promise.all([
    keepAwake.activate('spec-a'),
    keepAwake.activate('spec-b'),
  ])
  const releaseA = await keepAwake.deactivate('spec-a')
  const releaseB = await keepAwake.deactivate('spec-b')
  return { activated, deactivated, activatedTwo, releaseA, releaseB }
}

async function connectivitySpec(): Promise<Record<string, unknown>> {
  const current = connectivity.getState()
  const events: unknown[] = []
  const unsubscribe = connectivity.subscribe((next) => events.push(next))
  const resample = connectivity.getState()
  unsubscribe()
  return { current, resample, eventCount: events.length }
}

async function deviceSpec(): Promise<Record<string, unknown>> {
  return { ...device }
}

async function appInfoSpec(): Promise<Record<string, unknown>> {
  return { ...appInfo }
}

async function filesSpec(): Promise<Record<string, unknown>> {
  const draft = await files.writeText('core20-draft.txt', 'Passport ✓')
  const text = await files.readText(draft)
  const bin = await files.writeBytes('core20-bin.dat', new Uint8Array([0, 1, 2, 250, 255]))
  const bytes = await files.readBytes(bin)
  // pick/export open a real OS dialog now — bounded evidence is
  // picker-invoke's datum; presence only here.
  const pickFn = typeof files.pick
  const exportFn = typeof files.export
  let released = false
  try {
    files.release(draft)
    released = true
  } catch {}
  let releasedAgain = false
  try {
    files.release(draft)
    releasedAgain = true
  } catch {}
  return {
    draftUri: draft.uri,
    matchedText: text === 'Passport ✓',
    matchedBytes: bytes.length === 5 && bytes[3] === 250 && bytes[4] === 255,
    differentUris: draft.uri !== bin.uri,
    pickFn,
    exportFn,
    released,
    releasedAgain,
  }
}

/**
 * Delete a file or folder through the awaited WinRT path. Upstream
 * `File.remove()`/`removeSync()`/`Folder.remove()` is broken on Windows:
 * `FileSystemAccess.deleteFile` calls `DeleteAsync` on the pending
 * `IAsyncOperation` rather than the entity, and the unprojected member
 * access throws `HRESULT 0x80004005` into `onError` — nothing is deleted.
 */
async function deleteItemByPath(path: string): Promise<void> {
  try {
    const file = await NSWinRT.toPromise(Windows.Storage.StorageFile.GetFileFromPathAsync(path))
    await NSWinRT.toPromise(file.DeleteAsync())
  } catch {
    const folder = await NSWinRT.toPromise(Windows.Storage.StorageFolder.GetFolderFromPathAsync(path))
    await NSWinRT.toPromise(folder.DeleteAsync())
  }
}

async function coreFsSpec(): Promise<Record<string, unknown>> {
  const documents = knownFolders.documents().path
  const dir = nsPath.join(documents, 'core20-service-fs')
  const folder = Folder.fromPath(dir)
  const filePath = nsPath.join(dir, 'core20-fs.txt')
  const target = File.fromPath(filePath)
  const existsBefore = File.exists(filePath)
  await target.writeText('chunk αβγ')
  const existsAfter = File.exists(filePath)
  const text = await target.readText()
  // Evidence for the upstream fake-sync gap: PathIO ops return before completing.
  const syncText = target.readTextSync()
  const nestedPath = nsPath.join(dir, 'nested', 'inner')
  const nested = Folder.fromPath(nestedPath)
  const nestedExists = nested !== null && Folder.exists(nestedPath)
  const temp = knownFolders.temp()
  const tempFile = temp.getFile('core20-temp-unique.txt')
  const tempPath = tempFile.path
  const tempExists = File.exists(tempPath)
  for (const entity of [target, tempFile, nested, folder]) {
    try {
      await deleteItemByPath(entity.path)
    } catch {}
  }
  return {
    documentsPresent: typeof documents === 'string' && documents.length > 0,
    existsBefore,
    existsAfter,
    matchedText: text === 'chunk αβγ',
    syncText,
    nestedExists,
    tempPath,
    tempExists,
  }
}

const SECURE_KEY = 'core20-secure-rt'
const SECURE_PERSIST_KEY = 'core20-secure-persist'

/** Credential Locker backed secure storage: missing/read/write/remove,
 *  empty/control/Unicode values, packaged identity and cross-launch
 *  persistence. Access policy and roaming stay bounded — the leaf does not
 *  expose them. */
async function secureStorageSpec(persistValue?: string): Promise<Record<string, unknown>> {
  const supported = secureStorage.supported
  const available = supported ? await secureStorage.isAvailable() : false
  const result: Record<string, unknown> = { supported, available }
  if (!available) {
    return result
  }
  const missing = await secureStorage.get(SECURE_KEY)
  const wrote = await secureStorage.set(SECURE_KEY, 'vault-roundtrip')
  const read = wrote ? await secureStorage.get(SECURE_KEY) : null
  const wroteEmpty = await secureStorage.set(SECURE_KEY, '')
  const readEmpty = wroteEmpty ? await secureStorage.get(SECURE_KEY) : null
  const wroteCtrl = await secureStorage.set(SECURE_KEY, 'ctrl')
  const readCtrl = wroteCtrl ? await secureStorage.get(SECURE_KEY) : null
  const wroteOther = await secureStorage.set('core20-secure-other', 'other-value')
  const readOther = wroteOther ? await secureStorage.get('core20-secure-other') : null
  const removed = await secureStorage.remove(SECURE_KEY)
  const removedRead = await secureStorage.get(SECURE_KEY)
  const removedOther = await secureStorage.remove('core20-secure-other')
  const removedMissing = await secureStorage.remove(SECURE_KEY)
  let persistRead: string | null = null
  if (persistValue === undefined) {
    persistRead = await secureStorage.get(SECURE_PERSIST_KEY)
  } else {
    await secureStorage.set(SECURE_PERSIST_KEY, persistValue)
  }
  return {
    ...result,
    missing,
    wrote,
    read,
    wroteEmpty,
    readEmpty,
    wroteCtrl,
    readCtrl,
    otherRead: readOther,
    removed,
    removedRead,
    removedOther,
    removedMissing,
    persistRead,
    persistWrote: persistValue ?? null,
  }
}

/** readBytes bounds: maxBytes rejects oversized reads without loading, and a
 *  pre-aborted signal rejects with AbortError. */
async function filesChunkSpec(): Promise<Record<string, unknown>> {
  const ref = await files.writeBytes('core20-chunk.dat', new Uint8Array([9, 8, 7, 6, 5, 4]))
  let maxError = ''
  try {
    await files.readBytes(ref, { maxBytes: 3 })
  } catch (error) {
    maxError = String(error)
  }
  // The packaged runtime has no global AbortController — the signal contract
  // is duck-typed (aborted flag, listeners, throwIfAborted).
  const listeners = new Set<() => void>()
  const signal: {
    aborted: boolean
    addEventListener(type: string, listener: () => void): void
    removeEventListener(type: string, listener: () => void): void
    throwIfAborted(): void
  } = {
    aborted: false,
    addEventListener(_type, listener) {
      listeners.add(listener)
    },
    removeEventListener(_type, listener) {
      listeners.delete(listener)
    },
    throwIfAborted() {
      if (signal.aborted) {
        const error = new Error('The operation was aborted')
        error.name = 'AbortError'
        throw error
      }
    },
  }
  signal.aborted = true
  for (const listener of listeners) {
    listener()
  }
  let abortError = ''
  try {
    await files.readBytes(ref, { signal: signal as unknown as AbortSignal })
  } catch (error) {
    abortError = error instanceof Error ? error.name : String(error)
  }
  const full = await files.readBytes(ref, { maxBytes: 64 })
  try {
    files.release(ref)
  } catch {}
  return {
    uri: ref.uri,
    maxError,
    abortError,
    fullLength: full.length,
    abortControllerPresent: typeof AbortController !== 'undefined',
  }
}

/** The driver presets a non-text clipboard payload; the app must read null. */
async function clipboardNontextSpec(): Promise<Record<string, unknown>> {
  const read = clipboard.canCopy ? await clipboard.readText() : null
  return { canCopy: clipboard.canCopy, read }
}

/** Auth surfaces report bounded unavailability on Windows. */
async function authSpec(): Promise<Record<string, unknown>> {
  const sessionSupported = authSession.supported
  const sessionAvailable = await authSession.isAvailable()
  let sessionError = ''
  try {
    await authSession.open('https://example.invalid/', { callbackScheme: 'core20' })
  } catch (error) {
    sessionError = error instanceof Error ? error.name : String(error)
  }
  const passkeySupported = webAuthn.supported
  const passkeyAvailable = await webAuthn.isAvailable()
  let passkeyError = ''
  try {
    await webAuthn.get({} as never)
  } catch (error) {
    passkeyError = error instanceof Error ? error.name : String(error)
  }
  return {
    sessionSupported,
    sessionAvailable,
    sessionError,
    passkeySupported,
    passkeyAvailable,
    passkeyError,
  }
}

/** Primary-window DIPs and orientation from the shared Screen projection. */
async function windowMetricsSpec(): Promise<Record<string, unknown>> {
  try {
    const main = Screen.mainScreen
    return {
      widthDIPs: main.widthDIPs,
      heightDIPs: main.heightDIPs,
      widthPixels: main.widthPixels,
      heightPixels: main.heightPixels,
      orientation: main.widthDIPs >= main.heightDIPs ? 'landscape' : 'portrait',
    }
  } catch (error) {
    return { error: String(error) }
  }
}

/** Pickers and user-directed export are unavailable on packaged Windows. */
/** Bounded completed-selection pick: the driver types a real path into the
 * open dialog before the race resolves. 'pending-dialog' means the dialog
 * outlasted the window; 'cancelled' means the driver Escape landed. */
async function pickerSelectSpec(): Promise<Record<string, unknown>> {
  const out: Record<string, unknown> = {}
  const raced = await Promise.race([
    files.pick()
      .then(async (ref) => {
        if (ref === null) return { pickSelected: 'cancelled' }
        const entry: Record<string, unknown> = {
          pickSelected: `ok:${ref.name}`,
          selectedUri: ref.uri,
        }
        try {
          entry.readBack = await files.readText(ref)
        } catch (error) {
          entry.readError = error instanceof Error ? error.message : String(error)
        }
        return entry
      })
      .catch((error: unknown) => ({
        pickSelected: `error:${error instanceof Error ? `${error.name}:${error.message}` : String(error)}`,
      })),
    new Promise<Record<string, unknown>>((resolve) =>
      setTimeout(() => resolve({ pickSelected: 'pending-dialog' }), 12000),
    ),
  ])
  Object.assign(out, raced)
  return out
}

/** Bounded multi-select pick: the driver types two quoted paths into the
 * filename box, which the OS picker treats as a multi-selection. */
async function pickerMultiSpec(): Promise<Record<string, unknown>> {
  const raced = await Promise.race([
    files
      .pickMultiple()
      .then(async (refs) => {
        const entry: Record<string, unknown> = {
          multiSelected: refs.length === 0 ? 'cancelled' : `ok:${refs.length}`,
          multiNames: refs.map((ref) => ref.name),
        }
        try {
          entry.firstReadBack = refs.length ? await files.readText(refs[0]) : null
        } catch (error) {
          entry.readError = error instanceof Error ? error.message : String(error)
        }
        return entry
      })
      .catch((error: unknown) => ({
        multiSelected: `error:${error instanceof Error ? `${error.name}:${error.message}` : String(error)}`,
      })),
    new Promise<Record<string, unknown>>((resolve) =>
      setTimeout(() => resolve({ multiSelected: 'pending-dialog' }), 12000),
    ),
  ])
  return { ...raced }
}

/** Bounded save-commit export: the driver types a destination path into the
 * save dialog; the leaf then writes bytes through the token grant. */
async function pickerSaveSpec(): Promise<Record<string, unknown>> {
  const payload = new Uint8Array([99,111,114,101,50,48,45,101,120,112,111,114,116,101,100])
  const raced = await Promise.race([
    files
      .export('core20-exported.txt', payload)
      .then((result) => ({ exportResult: result }))
      .catch((error: unknown) => ({
        exportResult: `error:${error instanceof Error ? `${error.name}:${error.message}` : String(error)}`,
      })),
    new Promise<Record<string, unknown>>((resolve) =>
      setTimeout(() => resolve({ exportResult: 'pending-dialog' }), 12000),
    ),
  ])
  return { ...raced }
}

async function filesPickersSpec(): Promise<Record<string, unknown>> {
  // Presence-only: invoking pick/pickMultiple/export opens a real OS dialog
  // owned by the app HWND (bounded dialog evidence lives in picker-invoke).
  return {
    pickFn: typeof files.pick,
    pickMultipleFn: typeof files.pickMultiple,
    exportFn: typeof files.export,
  }
}

/** PasswordVault depth: overwrite, empty, control-character and missing-key
 *  semantics on the packaged-identity namespace. */
async function secureDepthSpec(): Promise<Record<string, unknown>> {
  const supported = secureStorage.supported
  const available = supported ? await secureStorage.isAvailable() : false
  const result: Record<string, unknown> = { supported, available }
  if (!available) {
    return result
  }
  const key = 'core20-secure-depth'
  const ctrl = 'ctrl-'
  const wroteEmpty = await secureStorage.set(key, '')
  const readEmpty = wroteEmpty ? await secureStorage.get(key) : null
  const wroteCtrl = await secureStorage.set(key, ctrl)
  const readCtrl = wroteCtrl ? await secureStorage.get(key) : null
  const wroteOver = await secureStorage.set(key, 'second')
  const readOver = wroteOver ? await secureStorage.get(key) : null
  const removed = await secureStorage.remove(key)
  const readAfterRemove = await secureStorage.get(key)
  return {
    ...result,
    wroteEmpty,
    readEmpty,
    wroteCtrl,
    readCtrl,
    readOver,
    removed,
    readAfterRemove,
  }
}

/** Sandbox identity: unique write names, cleanup and release ownership. */
async function filesIdentitySpec(): Promise<Record<string, unknown>> {
  const result: Record<string, unknown> = {}
  const owned: Awaited<ReturnType<typeof files.writeBytes>>[] = []
  const foreignPath = nsPath.join(knownFolders.temp().path, `core20-foreign-${Date.now()}.dat`)
  let foreign: File | undefined
  let step = 'foreign-fromPath'
  const exists = (path: string) => {
    try {
      return File.exists(path)
    } catch {
      return false
    }
  }
  async function releaseOwned(): Promise<void> {
    for (const ref of owned) {
      files.release(ref)
    }
    const deadline = Date.now() + 5000
    while (owned.some((ref) => exists(ref.uri)) && Date.now() < deadline) {
      await new Promise<void>((resolve) => setTimeout(resolve, 50))
    }
  }
  try {
    foreign = File.fromPath(foreignPath)
    step = 'foreign-writeText'
    await foreign.writeText('foreign-sentinel')
    step = 'write-a'
    const a = await files.writeBytes('core20-id-a.dat', new Uint8Array([7]))
    owned.push(a)
    step = 'write-b'
    const b = await files.writeBytes('core20-id-a.dat', new Uint8Array([8]))
    owned.push(b)
    step = 'read-a'
    const readA = await files.readBytes(a)
    step = 'read-b'
    const readB = await files.readBytes(b)
    step = 'exists-before-release'
    const existedBeforeRelease = exists(a.uri) && exists(b.uri)
    step = 'release-foreign'
    files.release({ name: foreign.name, uri: foreign.path })
    step = 'release-owned'
    await releaseOwned()
    step = 'foreign-readText'
    const foreignSurvived = (await foreign.readText()) === 'foreign-sentinel'
    step = 'exists-after-release'
    Object.assign(result, {
      sameNameDistinct: a.uri !== b.uri,
      exactBytes: readA.length === 1 && readA[0] === 7 && readB.length === 1 && readB[0] === 8,
      existedBeforeRelease,
      removedA: !exists(a.uri),
      removedB: !exists(b.uri),
      foreignSurvived,
    })

    step = 'done'
  } catch (error) {
    result.failedStep = step
    result.specError = error instanceof Error ? error.message : String(error)
  } finally {
    // Also clean the first output if creating or reading the second one fails.
    try {
      await releaseOwned()
    } catch (error) {
      result.releaseError = error instanceof Error ? error.message : String(error)
    }

    if (foreign) {
      try {
        if (exists(foreign.path)) {
          await deleteItemByPath(foreign.path)
        }
        result.foreignRemoved = !exists(foreign.path)
      } catch (error) {
        result.removeError = error instanceof Error ? error.message : String(error)
      }
    }
  }
  return result
}

/** Streaming depth: multi-chunk reads, exact bounds and mid-read abort. */
async function filesStreamSpec(): Promise<Record<string, unknown>> {
  const size = 512 * 1024
  const source = new Uint8Array(size)
  for (let index = 0; index < size; index++) {
    source[index] = (index * 31 + 7) & 0xff
  }
  const ref = await files.writeBytes('core20-stream.bin', source)
  try {
    const back = await files.readBytes(ref)
    let fullMatch = back.length === size
    for (let index = 0; fullMatch && index < size; index++) {
      if (back[index] !== source[index]) {
        fullMatch = false
      }
    }
    const exact = await files.readBytes(ref, { maxBytes: size })
    let underError = ''
    try {
      await files.readBytes(ref, { maxBytes: size - 1 })
    } catch (error) {
      underError = String(error)
    }
    // Mid-read abort: the leaf registers one cancel listener per chunk and
    // only reads the `aborted` flag — flip it after several chunks stream.
    let calls = 0
    let aborted = false
    const listeners = new Set<() => void>()
    const signal = {
      get aborted() {
        return aborted
      },
      addEventListener(_type: string, listener: () => void) {
        listeners.add(listener)
        if (++calls === 3) {
          aborted = true
          for (const fire of listeners) {
            fire()
          }
        }
      },
      removeEventListener(_type: string, listener: () => void) {
        listeners.delete(listener)
      },
      throwIfAborted() {},
    }
    let midAbort = ''
    try {
      await files.readBytes(ref, { signal: signal as unknown as AbortSignal })
    } catch (error) {
      midAbort = error instanceof Error ? error.name : String(error)
    }
    return { fullMatch, exactLength: exact.length, underError, midAbort, calls }
  } finally {
    try {
      files.release(ref)
    } catch {}
  }
}

/** Tag edge cases: duplicate activation, unknown-tag release, re-acquire. */
async function keepAwakeDepthSpec(): Promise<Record<string, unknown>> {
  return {
    first: await keepAwake.activate('spec-dup'),
    again: await keepAwake.activate('spec-dup'),
    releaseDup: await keepAwake.deactivate('spec-dup'),
    releaseDupAgain: await keepAwake.deactivate('spec-dup'),
    missing: await keepAwake.deactivate('spec-never-active'),
    pairA: await keepAwake.activate('spec-pair-a'),
    pairB: await keepAwake.activate('spec-pair-b'),
    releaseBogus: await keepAwake.deactivate('spec-bogus'),
    releasePairA: await keepAwake.deactivate('spec-pair-a'),
    releasePairB: await keepAwake.deactivate('spec-pair-b'),
    reacquire: await keepAwake.activate('spec-re'),
    releaseRe: await keepAwake.deactivate('spec-re'),
  }
}

/**
 * Upstream File/Folder member surface depth. `deleteFile` is proven broken
 * upstream; this probes the sibling members sharing its synchronous
 * `GetFileFromPathAsync` + async-op-on-object shape, recording each outcome.
 */
async function coreFsDepthSpec(): Promise<Record<string, unknown>> {
  const result: Record<string, unknown> = {}
  const probe = async (name: string, run: () => unknown | Promise<unknown>) => {
    try {
      result[name] = await run()
    } catch (error) {
      result[name] = `error: ${error instanceof Error ? error.message : String(error)}`
    }
  }
  const dir = nsPath.join(knownFolders.temp().path, `core20-depth-${Date.now()}`)
  const folder = Folder.fromPath(dir)
  const filePath = nsPath.join(dir, 'alpha.txt')
  const otherPath = nsPath.join(dir, 'beta.txt')
  const renamedPath = nsPath.join(dir, 'gamma.txt')
  try {
    const file = File.fromPath(filePath)
    await file.writeText('depth-payload')
    await probe('lastModified', () => file.lastModified instanceof Date && !Number.isNaN(file.lastModified.getTime()))
    await probe('size', () => file.size)
    const other = File.fromPath(otherPath)
    await other.writeText('second')
    await probe('entities', async () => {
      const entities = await folder.getEntities()
      return Array.isArray(entities) ? entities.map((entity) => entity.name).sort() : 'not-an-array'
    })
    await probe('eachEntity', async () => {
      const names: string[] = []
      await folder.eachEntity((entity) => {
        names.push(entity.name)
        return true
      })
      return names.sort()
    })
    // rename has deleteFile's exact shape: async op invoked on the pending
    // IAsyncOperation. Record both the call result and whether it moved.
    await probe('rename', async () => {
      const outcome = await file.rename('gamma.txt')
      return { outcome, moved: File.exists(renamedPath), original: File.exists(filePath) }
    })
    await probe('removeFile', async () => {
      const outcome = await other.remove()
      return { outcome, gone: !File.exists(otherPath) }
    })
  } finally {
    for (const path of [filePath, otherPath, renamedPath, dir]) {
      try {
        await deleteItemByPath(path)
      } catch {}
    }
  }
  return result
}

/** Subscriber semantics: fan-out, unsubscribe isolation, resubscription. */
async function connectivityDepthSpec(): Promise<Record<string, unknown>> {
  const before = connectivity.getState()
  const eventsA: unknown[] = []
  const eventsB: unknown[] = []
  const unsubscribeA = connectivity.subscribe((next) => eventsA.push(next))
  const unsubscribeB = connectivity.subscribe((next) => eventsB.push(next))
  const during = connectivity.getState()
  unsubscribeA()
  const afterUnsubA = connectivity.getState()
  unsubscribeB()
  const eventsC: unknown[] = []
  const resub = connectivity.subscribe((next) => eventsC.push(next))
  resub()
  return {
    stateShape: typeof before === 'object' && before !== null && typeof before.online === 'boolean',
    stateStable: JSON.stringify(before) === JSON.stringify(afterUnsubA),
    eventCountA: eventsA.length,
    eventCountB: eventsB.length,
    eventsMatch: JSON.stringify(eventsA) === JSON.stringify(eventsB),
    resubWorked: true,
    during,
  }
}

/** Value-type breadth: unicode/long strings, key isolation, remove-missing. */
async function storageDepthSpec(): Promise<Record<string, unknown>> {
  const keys = { uni: 'core20-depth-uni', long: 'core20-depth-long', a: 'core20-depth-a', b: 'core20-depth-b' }
  const result: Record<string, unknown> = {}
  try {
    const unicode = 'depth--\u{1F600}-\u0301-\u0000-end'
    storage.setString(keys.uni, unicode)
    result.uniRead = storage.getString(keys.uni) === unicode
    const long = 'x'.repeat(8192) + 'Ω'
    storage.setString(keys.long, long)
    const longBack = storage.getString(keys.long)
    result.longLength = longBack === null ? -1 : longBack.length
    result.longTail = longBack === null ? false : longBack.endsWith('Ω')
    storage.setString(keys.a, 'first')
    storage.setString(keys.b, 'second')
    storage.setString(keys.a, 'overwritten')
    result.isolation = storage.getString(keys.b) === 'second'
    result.overwrite = storage.getString(keys.a) === 'overwritten'
    let removedMissing = 'no-throw'
    try {
      storage.remove('core20-depth-never-set')
    } catch (error) {
      removedMissing = `throw: ${error instanceof Error ? error.message : String(error)}`
    }
    result.removedMissing = removedMissing
    result.missingRead = storage.getString('core20-depth-never-set')
    result.flushFalse = storage.flush() === false
  } finally {
    for (const key of Object.values(keys)) {
      try {
        storage.remove(key)
      } catch {}
    }
  }
  return result
}

/** Text breadth: supplementary-plane unicode, empty write, overwrite. */
async function clipboardDepthSpec(): Promise<Record<string, unknown>> {
  const result: Record<string, unknown> = { canCopy: clipboard.canCopy }
  if (!clipboard.canCopy) {
    return result
  }
  // SetContent+Flush commits asynchronously — an immediate read can see a
  // stale or empty payload (verified racy across 1.0.0.211 launches). Settle
  // before reading to model the real contract.
  const settle = () => new Promise((resolve) => setTimeout(resolve, 350))
  const unicode = 'clip--\u{1F600}-\u{1F1EF}\u{1F1F5}-e\u0301-\u0000-end'
  result.wroteUni = await clipboard.writeText(unicode)
  await settle()
  const uniBack = await clipboard.readText()
  result.uniRead = uniBack === unicode
  result.uniReadBack = uniBack
  const empty = await clipboard.writeText('')
  result.wroteEmpty = empty
  await settle()
  result.emptyRead = await clipboard.readText()
  // Probe where reads diverge: truncation at the first U+0000, or emoji loss.
  const nulPayload = 'before' + '\u0000' + 'after'
  await clipboard.writeText(nulPayload)
  await settle()
  result.nulReadBack = await clipboard.readText()
  const emojiOnly = '\u{1F600}'
  await clipboard.writeText(emojiOnly)
  await settle()
  result.emojiReadBack = await clipboard.readText()
  const first = await clipboard.writeText('clip-first')
  const overwrite = await clipboard.writeText('clip-second')
  await settle()
  result.overwrite = overwrite && (await clipboard.readText()) === 'clip-second'
  result.first = first
  // Restore a harmless payload so later specs and manual use see clean state.
  try {
    await clipboard.writeText('')
  } catch {}
  return result
}

/**
 * Live trait-change delivery: subscribe on the primitives
 * `observeWindowsMediaTraits` listens to (orientationChanged + root
 * layoutChanged) and record each sampled trait set. The driver resizes the
 * window between -start and -read; the events buffer proves OS delivery.
 */
const mediaLiveEvents: Record<string, unknown>[] = []
const mediaLiveOffs: (() => void)[] = []

async function mediaLiveStartSpec(): Promise<Record<string, unknown>> {
  mediaLiveEvents.length = 0
  mediaLiveOffs.length = 0
  const sample = (source: string) => {
    const screen = Screen.mainScreen
    mediaLiveEvents.push({
      source,
      widthDIPs: screen.widthDIPs,
      heightDIPs: screen.heightDIPs,
      scale: screen.scale,
    })
  }
  const root = Application.getRootView()
  const onOrientation = () => sample('orientation')
  const onLayout = () => sample('layout')
  try {
    Application.on(Application.orientationChangedEvent, onOrientation)
    mediaLiveOffs.push(() => Application.off(Application.orientationChangedEvent, onOrientation))
  } catch {}
  if (root) {
    try {
      root.on('layoutChanged', onLayout)
      mediaLiveOffs.push(() => root.off('layoutChanged', onLayout))
    } catch {}
  }
  sample('baseline')
  return { subscribed: mediaLiveOffs.length > 0, rootBound: root !== null && root !== undefined }
}

async function mediaLiveReadSpec(): Promise<Record<string, unknown>> {
  const events = mediaLiveEvents.map((event) => ({ ...event }))
  let released = true
  for (const off of mediaLiveOffs) {
    try {
      off()
    } catch {
      released = false
    }
  }
  mediaLiveOffs.length = 0
  const widths = new Set(events.map((event) => event.widthDIPs))
  return {
    eventCount: events.length,
    widthChanged: widths.size > 1,
    lastEvents: events.slice(-4),
    released,
  }
}

/**
 * Picker surface probe: does FileOpenPicker project, and is an owner-window
 * initializer reachable? Emits the WinRT surface; driver asserts nothing
 * (evidence only — bounded availability is a valid result).
 */
async function pickerProbeSpec(): Promise<Record<string, unknown>> {
  const pickers = Windows?.Storage?.Pickers
  const out: Record<string, unknown> = {
    pickersNs: pickers !== null && typeof pickers === 'object',
    fileOpenPicker: typeof pickers?.FileOpenPicker,
    fileSavePicker: typeof pickers?.FileSavePicker,
    folderPicker: typeof pickers?.FolderPicker,
  }
  try {
    const picker = pickers?.FileOpenPicker ? new pickers.FileOpenPicker() : null
    out.ctorOk = picker !== null
    if (picker) {
      out.pickSingleFileAsync = typeof picker.PickSingleFileAsync
      out.fileTypeFilter = typeof picker.FileTypeFilter
      out.filterAppend = typeof picker.FileTypeFilter?.Append
      out.filterAppendLower = typeof picker.FileTypeFilter?.append
      out.filterAdd = typeof picker.FileTypeFilter?.Add
      // IInitializeWithWindow is how a desktop picker gets an owner HWND —
      // enumerate every member on the instance and its prototype chain for a
      // projected initializer or interface-cast escape hatch.
      out.initWithWindow = typeof picker.InitializeWithWindow
      out.initWithWindowLower = typeof picker.initializeWithWindow
      out.as = typeof picker.as
      out.pickerOwn = Object.getOwnPropertyNames(picker)
      const proto = Object.getPrototypeOf(picker)
      out.pickerProto = proto ? Object.getOwnPropertyNames(proto) : []
      const proto2 = proto ? Object.getPrototypeOf(proto) : null
      out.pickerProto2 = proto2 ? Object.getOwnPropertyNames(proto2) : []
    }
  } catch (error) {
    out.ctorError = error instanceof Error ? error.message : String(error)
  }
  // Full NSWinRT helper surface — an unreferenced cast/QI helper may exist.
  try {
    out.nswinrtKeys = Object.getOwnPropertyNames(NSWinRT).sort()
    const interop = NSWinRT?.interop
    out.nswinrtInteropKeys = interop ? Object.getOwnPropertyNames(interop).sort() : []
    for (const name of ['win32', 'dotnet', 'proxy', 'import', 'getStatus', 'getResults']) {
      const member = NSWinRT?.[name]
      out['nswinrt_' + name] = typeof member
      if (typeof member === 'object' && member !== null) {
        try {
          out['nswinrt_' + name + 'Keys'] = Object.getOwnPropertyNames(member).sort()
        } catch {}
      }
    }
    // The projected picker carries a native `handle` own-property — check its
    // type and whether interop.handleOf can read the IInspectable pointer.
    const picker2 = pickers?.FileOpenPicker ? new pickers.FileOpenPicker() : null
    if (picker2) {
      out.handleType = typeof picker2.handle
      if (typeof interop?.handleOf === 'function') {
        try {
          const h = interop.handleOf(picker2)
          out.handleOf = typeof h
          out.handleOfValue = String(h)
        } catch (error) {
          out.handleOfError = error instanceof Error ? error.message : String(error)
        }
      }
    }
  } catch (error) {
    out.nswinrtError = error instanceof Error ? error.message : String(error)
  }
  // Owner-window reachability: Microsoft.UI.Win32Interop +
  // root XamlRoot.ContentIslandEnvironment.AppWindowId -> GetHwndFromWindowId.
  const runtime = globalThis as Record<string, any>
  const ms = runtime.Microsoft
  out.microsoftNs = typeof ms === 'object' && ms !== null
  out.win32Interop = typeof ms?.UI?.Win32Interop
  out.getHwndFromWindowId = typeof ms?.UI?.Win32Interop?.GetHwndFromWindowId
  out.getWindowIdFromWindow = typeof ms?.UI?.Win32Interop?.GetWindowIdFromWindow
  out.appWindowNs = typeof ms?.UI?.Windowing?.AppWindow
  try {
    const root = Application.getRootView()
    const nv = root?.nativeViewProtected ?? root?.nativeView
    const xr = nv?.XamlRoot
    out.rootView = nv !== null && nv !== undefined
    out.xamlRoot = typeof xr === 'object' && xr !== null
    out.contentIslandEnv = typeof xr?.ContentIslandEnvironment === 'object'
    const appWindowId = xr?.ContentIslandEnvironment?.AppWindowId
    out._appWindowId = appWindowId
    out.appWindowId = typeof appWindowId === 'object' && appWindowId !== null
    if (appWindowId && typeof ms?.UI?.Windowing?.AppWindow?.GetFromWindowId === 'function') {
      const appWindow = ms.UI.Windowing.AppWindow.GetFromWindowId(appWindowId)
      out.appWindow = appWindow !== null && appWindow !== undefined
    }
    if (appWindowId && typeof ms?.UI?.Win32Interop?.GetHwndFromWindowId === 'function') {
      const hwnd = ms.UI.Win32Interop.GetHwndFromWindowId(appWindowId)
      out.hwndType = typeof hwnd
      out.hwndPresent = hwnd !== null && hwnd !== undefined && String(hwnd) !== '0'
    }
  } catch (error) {
    out.hwndError = error instanceof Error ? error.message : String(error)
  }
  // WASDK 1.8 pickers take a WindowId/AppWindow directly — no HWND needed.
  const msPickers = ms?.Windows?.Storage?.Pickers
  out.msPickersNs = typeof msPickers === 'object' && msPickers !== null
  out.msFileOpenPicker = typeof msPickers?.FileOpenPicker
  out.msFileSavePicker = typeof msPickers?.FileSavePicker
  out.msFolderPicker = typeof msPickers?.FolderPicker
  if (typeof msPickers?.FileOpenPicker === 'function') {
    const ctorAttempts: string[] = []
    for (const arg of [undefined, out._appWindowId ?? undefined] as const) {
      try {
        const mp = arg === undefined ? new msPickers.FileOpenPicker() : new msPickers.FileOpenPicker(arg)
        out.msCtorOk = mp !== null
        out.msCtorVia = arg === undefined ? 'no-arg' : 'appWindowId'
        out.msMembers = Object.getOwnPropertyNames(Object.getPrototypeOf(mp))
        break
      } catch (error) {
        ctorAttempts.push(error instanceof Error ? error.message : String(error))
      }
    }
    out.msCtorAttempts = ctorAttempts
  }
  delete out._appWindowId
  return out
}

/**
 * Bounded real PickSingleFileAsync attempt. Without an owner HWND a desktop
 * picker normally rejects immediately; if it actually shows a dialog the
 * 8-second race reports timeout-pending and the driver dismisses it. Runs
 * last in the spec list so a lingering dialog cannot affect other specs.
 */
async function pickerInvokeSpec(): Promise<Record<string, unknown>> {
  const out: Record<string, unknown> = { available: false }
  const pickers = Windows?.Storage?.Pickers
  if (!pickers?.FileOpenPicker) return out
  out.available = true
  const picker = new pickers.FileOpenPicker()
  const filter = picker.FileTypeFilter
  out.filterMembers = filter ? Object.getOwnPropertyNames(Object.getPrototypeOf(filter)) : []
  const filterAttempts: string[] = []
  for (const [name, arg] of [
    ['Append', '*.*'],
    ['Append', '*'],
    ['append', '*.*'],
    ['Add', '*.*'],
    ['Insert', '*.*'],
    ['SetAt', '*.*'],
  ] as const) {
    if (typeof filter?.[name] === 'function') {
      try {
        if (name === 'SetAt' || name === 'Insert') {
          filter[name](0, arg)
        } else {
          filter[name](arg)
        }
        out.filterVia = `${name}(${JSON.stringify(arg)})`
        break
      } catch (error) {
        filterAttempts.push(`${name}: ${error instanceof Error ? error.message : String(error)}`)
      }
    }
  }
  out.filterAttempts = filterAttempts
  try {
    const loc = pickers.PickerLocationId
    out.locationIdType = typeof loc
    if (loc && typeof picker.SuggestedStartLocation !== 'undefined') {
      try {
        picker.SuggestedStartLocation = loc.DocumentsLibrary ?? loc.ComputerFolder ?? loc.Desktop
        out.startLocationSet = true
      } catch (error) {
        out.startLocationError = error instanceof Error ? error.message : String(error)
      }
    }
  } catch {}
  // Owner-window acquisition: HWND via win32 FFI + IInitializeWithWindow via
  // the dotnet bridge (CsWinRT's WinRT.Interop helper). Each step is emitted.
  const win32 = NSWinRT?.win32
  const dotnet = NSWinRT?.dotnet
  const interop = NSWinRT?.interop
  let hwnd: number | null = null
  const hwndAttempts: string[] = []
  if (typeof win32?.call === 'function') {
    for (const fn of ['GetActiveWindow', 'GetForegroundWindow']) {
      try {
        const v = win32.call('user32.dll', fn, 'pointer')
        hwndAttempts.push(`${fn}=${String(v)}`)
        if (typeof v === 'number' && v !== 0 && hwnd === null) hwnd = v
      } catch (error) {
        hwndAttempts.push(`${fn}: ${error instanceof Error ? error.message : String(error)}`)
      }
    }
    // GetGUIThreadInfo(own thread) -> GUITHREADINFO.hwndActive needs an
    // out-buffer; probe pointerFromBuffer's marshalling first.
    try {
      if (typeof interop?.pointerFromBuffer === 'function') {
        const buf = new ArrayBuffer(72)
        const view = new DataView(buf)
        view.setUint32(0, 72, true)
        const ptr = interop.pointerFromBuffer(buf)
        out.ptrFromBufferType = typeof ptr
        const tid = win32.call('kernel32.dll', 'GetCurrentThreadId', 'u32')
        const ok = win32.call('user32.dll', 'GetGUIThreadInfo', 'i32', {
          type: 'u32',
          value: tid,
        },
        { type: 'pointer', value: typeof ptr === 'number' ? ptr : 0 })
        out.guiThreadOk = ok
        if (ok) {
          const active = Number(view.getBigInt64(8, true))
          hwndAttempts.push(`GetGUIThreadInfo.hwndActive=${active}`)
          if (active !== 0 && hwnd === null) hwnd = active
        }
      }
    } catch (error) {
      hwndAttempts.push(`GetGUIThreadInfo: ${error instanceof Error ? error.message : String(error)}`)
    }
  }
  out.hwndAttempts = hwndAttempts
  out.hwnd = hwnd
  // The picker's native pointer identity — the bridge marshals __native_ptr
  // objects back into real WinRT RCWs (WinRtRef tag).
  out.pickerNativePtrType = typeof picker.__native_ptr
  out.handleMembers = picker.handle ? Object.getOwnPropertyNames(picker.handle) : []
  try {
    const h = interop?.handleOf?.(picker)
    out.handleOfMembers = h ? Object.getOwnPropertyNames(h) : []
    out.handleOfNativePtr = typeof h?.__native_ptr
  } catch {}
  // Managed interop: OctaneXplat.Interop.ServiceInterop.InitializeWithWindow
  // (compiled into the app assembly via App_Resources\Windows\Interop)
  // takes (object picker, long hwnd) — both marshal cleanly.
  if (hwnd !== null && typeof dotnet?.invoke === 'function') {
    // Real leaf path: files.pick() runs the managed dispatcher pick and
    // polls PickState — while the OS dialog is open it stays pending.
    // The race bounds the spec; the driver dismisses the dialog with
    // Escape after capture. A concurrent second pick proves the busy guard.
    try {
      const pickPromise = files.pick()
      const raced = await Promise.race([
        pickPromise
          .then((ref) => ({ pickLeaf: ref === null ? 'cancelled' : `ok:${ref.name}` }))
          .catch((error: unknown) => ({
            pickLeaf: `error:${error instanceof Error ? `${error.name}:${error.message}` : String(error)}`,
          })),
        new Promise<{ pickLeaf: string }>((resolve) =>
          setTimeout(() => resolve({ pickLeaf: 'pending-dialog' }), 6000),
        ),
      ])
      Object.assign(out, raced)
      try {
        await files.pick()
        out.concurrentPick = 'resolved-unexpectedly'
      } catch (error) {
        out.concurrentPick = error instanceof Error ? error.message : String(error)
      }
    } catch (error) {
      out.pickLeafError = error instanceof Error ? error.message : String(error)
    }
  }
  try {
    const op = picker.PickSingleFileAsync()
    out.opType = typeof op
    const result = await Promise.race([
      NSWinRT.toPromise(op)
        .then((file: { Name?: string } | null) => ({
          kind: 'resolved',
          fileName: file?.Name ?? null,
          nullFile: file === null || file === undefined,
        }))
        .catch((error: unknown) => ({
          kind: 'rejected',
          error: error instanceof Error ? error.message : String(error),
        })),
      new Promise<{ kind: string }>((resolve) =>
        setTimeout(() => resolve({ kind: 'timeout-pending' }), 8000),
      ),
    ])
    Object.assign(out, result)
  } catch (error) {
    out.invokeError = error instanceof Error ? error.message : String(error)
  }
  return out
}

/** Pointer/hover/reduced-motion availability on the packaged projection. */
async function mediaDepthSpec(): Promise<Record<string, unknown>> {
  const runtime = globalThis as Record<string, any>
  const view = runtime.NativeScript ?? null
  return {
    screen: typeof Screen.mainScreen === 'object' && Screen.mainScreen !== null,
    pointerDevice:
      typeof runtime.PointerDevice !== 'undefined' ||
      typeof runtime.Windows?.Devices?.Input?.PointerDevice !== 'undefined',
    uiSettings: typeof runtime.Windows?.UI?.ViewManagement?.UISettings !== 'undefined',
    nsWidgetsPointer: view && typeof view.Widgets?.PointerDevice !== 'undefined',
  }
}

export async function runServiceSpec(spec: string, record: Emit): Promise<void> {
  try {
    let result: Record<string, unknown>
    switch (spec) {
      case 'clipboard':
        result = await clipboardSpec()
        break
      case 'random':
        result = await randomSpec()
        break
      case 'storage':
        result = await storageSpec()
        break
      case 'storage-persist':
        result = await storageSpec('persisted-across-launches')
        break
      case 'storage-verify':
        result = await storageSpec()
        break
      case 'keepawake':
        result = await keepAwakeSpec()
        break
      case 'connectivity':
        result = await connectivitySpec()
        break
      case 'device':
        result = await deviceSpec()
        break
      case 'appinfo':
        result = await appInfoSpec()
        break
      case 'files':
        result = await filesSpec()
        break
      case 'corefs':
        result = await coreFsSpec()
        break
      case 'secure-storage':
        result = await secureStorageSpec()
        break
      case 'secure-persist':
        result = await secureStorageSpec('persisted-secure-across-launches')
        break
      case 'secure-verify':
        result = await secureStorageSpec()
        break
      case 'files-chunk':
        result = await filesChunkSpec()
        break
      case 'clipboard-nontext':
        result = await clipboardNontextSpec()
        break
      case 'auth':
        result = await authSpec()
        break
      case 'window-metrics':
        result = await windowMetricsSpec()
        break
      case 'files-pickers':
        result = await filesPickersSpec()
        break
      case 'secure-depth':
        result = await secureDepthSpec()
        break
      case 'files-identity':
        result = await filesIdentitySpec()
        break
      case 'files-stream':
        result = await filesStreamSpec()
        break
      case 'corefs-depth':
        result = await coreFsDepthSpec()
        break
      case 'connectivity-depth':
        result = await connectivityDepthSpec()
        break
      case 'media-live-start':
        result = await mediaLiveStartSpec()
        break
      case 'media-live-read':
        result = await mediaLiveReadSpec()
        break
      case 'picker-probe':
        result = await pickerProbeSpec()
        break
      case 'picker-invoke':
        result = await pickerInvokeSpec()
        break
      case 'picker-select':
        result = await pickerSelectSpec()
        break
      case 'picker-save':
        result = await pickerSaveSpec()
        break
      case 'picker-multi':
        result = await pickerMultiSpec()
        break
      case 'storage-depth':
        result = await storageDepthSpec()
        break
      case 'clipboard-depth':
        result = await clipboardDepthSpec()
        break
      case 'keepawake-depth':
        result = await keepAwakeDepthSpec()
        break
      case 'media-depth':
        result = await mediaDepthSpec()
        break
      default:
        record('service-error', { spec, message: 'Unknown service spec' })
        return
    }

    record('service-result', { spec, ...result })
  } catch (error) {
    record('service-error', { spec, message: String(error) })
  }
}
