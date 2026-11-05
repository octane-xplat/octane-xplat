import { Windows, NSWinRT } from '@octane-xplat/platform/windows'
import { UnavailabilityError } from '@octane-xplat/lib/capability'
import { assertSafeFileName, concatBytes, exportBusy, fileTooLarge, throwIfAborted } from './file-bytes'
import { MIME_EXTENSIONS } from './file-types.macos'
import type { FileExportResult, FileReadBytesOptions, FileRef, Files } from './types'

const CHUNK_SIZE = 64 * 1024
const owned = new Map<string, { file: any; releasing: boolean }>()

function close(resource: any): void {
  try {
    resource?.Close()
  } catch {
    // Cleanup must not replace a read/write failure.
  }
}

function decode(buffer: any, length: number): Uint8Array {
  const hex = String(Windows.Security.Cryptography.CryptographicBuffer.EncodeToHexString(buffer))
  if (hex.length !== length * 2 || (length && !/^[\da-f]+$/i.test(hex))) {
    throw new Error('files.readBytes: invalid native buffer')
  }
  const bytes = new Uint8Array(length)
  for (let index = 0; index < length; index++) {
    bytes[index] = Number.parseInt(hex.slice(index * 2, index * 2 + 2), 16)
  }
  return bytes
}

function encode(bytes: Uint8Array): any {
  let hex = ''
  for (const byte of bytes) {
    hex += byte.toString(16).padStart(2, '0')
  }
  return Windows.Security.Cryptography.CryptographicBuffer.DecodeFromHexString(hex)
}

async function readBuffer(input: any, count: number, signal?: AbortSignal): Promise<any> {
  const streams = Windows.Storage.Streams
  const operation = input.ReadAsync(
    new streams.Buffer(count),
    count,
    streams.InputStreamOptions.None,
  )
  const cancel = () => {
    try {
      operation.Cancel?.()
    } catch {}
  }
  signal?.addEventListener('abort', cancel, { once: true })
  if (signal?.aborted) {
    cancel()
  }
  try {
    const result = await NSWinRT.toPromise(operation)
    throwIfAborted(signal)
    return result
  } catch (error) {
    throwIfAborted(signal)
    throw error
  } finally {
    signal?.removeEventListener('abort', cancel)
  }
}

async function readBytes(ref: FileRef, options: FileReadBytesOptions = {}): Promise<Uint8Array> {
  const { maxBytes, signal } = options
  if (maxBytes != null && (!Number.isSafeInteger(maxBytes) || maxBytes < 0)) {
    throw new RangeError('files.readBytes: maxBytes must be a non-negative safe integer')
  }
  throwIfAborted(signal)
  const file = await pickedFile(ref.uri)
  throwIfAborted(signal)
  if (maxBytes != null) {
    const properties = await NSWinRT.toPromise(file.GetBasicPropertiesAsync())
    throwIfAborted(signal)
    if (Number(properties.Size) > maxBytes) {
      throw fileTooLarge(ref.name, maxBytes)
    }
  }
  // OpenReadAsync projects IRandomAccessStreamWithContentType without inherited
  // stream methods in alpha.144. Request IInputStream directly instead.
  const input = await NSWinRT.toPromise(file.OpenSequentialReadAsync())
  try {
    throwIfAborted(signal)
    const chunks: Uint8Array[] = []
    let total = 0
    while (true) {
      throwIfAborted(signal)
      // One sentinel byte detects a file growing past the bound mid-read.
      const request = maxBytes == null ? CHUNK_SIZE : Math.min(CHUNK_SIZE, maxBytes - total + 1)
      // DataReader.LoadAsync's specialized async operation crashes the standalone
      // alpha.144 host. IInputStream.ReadAsync uses the working buffer projection.
      const buffer = await readBuffer(input, request, signal)
      const count = Number(buffer.Length)
      if (!Number.isInteger(count) || count < 0 || count > request) {
        throw new Error('files.readBytes: invalid native read length')
      }

      if (!count) {
        return concatBytes(chunks, total)
      }

      total += count
      if (maxBytes != null && total > maxBytes) {
        throw fileTooLarge(ref.name, maxBytes)
      }

      chunks.push(decode(buffer, count))
    }
  } finally {
    close(input)
  }
}

async function createOwned(name: string, write: (file: any) => Promise<void>): Promise<FileRef> {
  assertSafeFileName(name)
  const storage = Windows.Storage
  const file = await NSWinRT.toPromise(
    storage.ApplicationData.Current.TemporaryFolder.CreateFileAsync(
      name,
      storage.CreationCollisionOption.GenerateUniqueName,
    ),
  )
  try {
    await write(file)
  } catch (error) {
    try {
      await NSWinRT.toPromise(file.DeleteAsync())
    } catch {}

    throw error
  }
  owned.set(file.Path, { file, releasing: false })
  return { name, uri: file.Path }
}

async function writeBytes(name: string, bytes: Uint8Array): Promise<FileRef> {
  return createOwned(name, async (file) => {
    const stream = await NSWinRT.toPromise(file.OpenAsync(Windows.Storage.FileAccessMode.ReadWrite))
    let output: any
    try {
      // IRandomAccessStream does not project inherited IOutputStream methods.
      output = stream.GetOutputStreamAt(0)
      for (let offset = 0; offset < bytes.byteLength; offset += CHUNK_SIZE) {
        const chunk = bytes.subarray(offset, offset + CHUNK_SIZE)
        const count = Number(await NSWinRT.toPromise(output.WriteAsync(encode(chunk))))
        if (count !== chunk.byteLength) {
          throw new Error('files.writeBytes: incomplete native write')
        }
      }

      if (!(await NSWinRT.toPromise(output.FlushAsync()))) {
        throw new Error('files.writeBytes: native stream flush failed')
      }
    } finally {
      close(output)
      close(stream)
    }
  })
}

type DotnetBridge = {
  invoke?: (assembly: string, type: string, method: string, args: unknown[]) => unknown
}
type Win32Bridge = { call?: (dll: string, fn: string, ret: string, ...args: unknown[]) => unknown }

const PICKER_TYPE = 'OctaneXplat.Interop.ServiceInterop'
let exportInFlight = false

/**
 * The app window's HWND through the runtime's Win32 FFI. The active window is
 * the app-relevant owner; foreground is the fallback. `Microsoft.UI
 * .Win32Interop.GetHwndFromWindowId` is unprojected on the pinned runtime.
 */
function ownerHwnd(): number | null {
  const win32 = (NSWinRT as { win32?: Win32Bridge }).win32
  if (typeof win32?.call !== 'function') return null
  for (const fn of ['GetActiveWindow', 'GetForegroundWindow']) {
    try {
      const value = win32.call('user32.dll', fn, 'pointer')
      if (typeof value === 'number' && value !== 0) return value
    } catch {}
  }
  return null
}

function filterError(): Error {
  const error = new Error(
    'files.pick: could not resolve the requested file types; use explicit filename extensions',
  )
  error.name = 'UnsupportedFileTypeError'
  return error
}

/** accept tokens ('.ext', MIME, 'image/*') -> comma-separated extensions. */
function pickFilter(accept?: string): string {
  if (!accept) return ''
  const extensions = new Set<string>()
  for (const raw of accept.split(',')) {
    const token = raw.trim().toLowerCase()
    if (!token) continue
    if (token.startsWith('.')) {
      extensions.add(token)
      continue
    }
    const mapped = MIME_EXTENSIONS[token]
    if (!mapped) throw filterError()
    for (const extension of mapped) extensions.add(`.${extension}`)
  }
  return [...extensions].join(',')
}

function dotnetInvoke(method: string, args: unknown[]): string {
  const dotnet = (NSWinRT as { dotnet?: DotnetBridge }).dotnet
  if (typeof dotnet?.invoke !== 'function') throw new UnavailabilityError('files.pick')
  return String(dotnet.invoke('', PICKER_TYPE, method, args))
}

function baseName(uri: string): string {
  return uri.replace(/^.*[\\/]/, '') || uri
}

/**
 * The projected WinRT pickers cannot cross `dotnet.invoke` (they marshal as
 * `System.String`), and the bridge awaits `Task`-returning methods on the
 * caller thread — which deadlocks the dialog's message pump. The app-shipped
 * `ServiceInterop` helper instead enqueues the pick on the captured
 * dispatcher and JS polls `PickState` until the dialog resolves.
 */
async function managedPick(
  kind: 'single' | 'multiple' | 'save',
  filter: string,
  suggestedName?: string,
): Promise<string> {
  const hwnd = ownerHwnd()
  if (hwnd == null) throw new UnavailabilityError('files.' + kind)
  const start = dotnetInvoke('PickStart', [kind, hwnd, filter, suggestedName ?? ''])
  if (start !== 'started') throw new Error(`files.${kind}: ${start}`)
  while (true) {
    const state = dotnetInvoke('PickState', [])
    if (state !== 'pending') return state
    await new Promise((resolve) => setTimeout(resolve, 200))
  }
}

function pickResult(state: string, kind: string): string {
  if (state === 'cancelled' || state.startsWith('ok:')) return state
  throw new Error(`files.${kind}: ${state}`)
}

// Picker results carry access on the StorageFile, not its path — the helper
// registers each result in FutureAccessList and returns "token|path".
const pickedTokens = new Map<string, string>()

function pickedRef(entry: string): FileRef {
  const split = entry.indexOf('|')
  const uri = split >= 0 ? entry.slice(split + 1) : entry
  if (split > 0) pickedTokens.set(uri, entry.slice(0, split))
  return { name: baseName(uri), uri }
}

function pickedFile(uri: string): Promise<any> {
  const token = pickedTokens.get(uri)
  if (token) {
    return NSWinRT.toPromise(
      Windows.Storage.AccessCache.StorageApplicationPermissions.FutureAccessList.GetFileAsync(token),
    )
  }
  return NSWinRT.toPromise(Windows.Storage.StorageFile.GetFileFromPathAsync(uri))
}

/**
 * Experimental Windows file I/O through WinRT. Writes create owned temporary
 * copies; release schedules their deletion. Pickers run managed-side in the
 * app process (`ServiceInterop`) because the projected WinRT objects cannot
 * cross the bridge.
 *
 * @example
 * import { files } from '@octane-xplat/files'
 * const draft = await files.writeText('draft.txt', 'Passport')
 * const text = await files.readText(draft)
 * files.release(draft)
 */
/** File service — pickers, sandbox IO, user-directed export. */
export const files: Files = {
  pick: async (accept) => {
    const state = pickResult(await managedPick('single', pickFilter(accept)), 'pick')
    return state === 'cancelled' ? null : pickedRef(state.slice(3))
  },
  pickMultiple: async (accept) => {
    const state = pickResult(await managedPick('multiple', pickFilter(accept)), 'pickMultiple')
    if (state === 'cancelled') return []
    return state
      .slice(3)
      .split('\n')
      .filter((entry) => entry.length > 0)
      .map(pickedRef)
  },
  async readText(ref) {
    const file = await pickedFile(ref.uri)
    return NSWinRT.toPromise(Windows.Storage.FileIO.ReadTextAsync(file))
  },
  readBytes,
  writeText: (name, text) =>
    createOwned(name, async (file) => {
      await NSWinRT.toPromise(Windows.Storage.FileIO.WriteTextAsync(file, text))
    }),
  writeBytes,
  async export(name, bytes, opts) {
    if (exportInFlight) throw exportBusy()
    exportInFlight = true
    try {
      const own = name.replace(/^.*[\\/]/, '')
      const dot = own.lastIndexOf('.')
      const extension =
        dot > 0 ? own.slice(dot) : opts?.mimeType ? `.${MIME_EXTENSIONS[opts.mimeType.toLowerCase()]?.[0] ?? 'bin'}` : '.txt'
      const state = pickResult(await managedPick('save', extension, own), 'export')
      if (state === 'cancelled') return 'cancelled'
      const ref = pickedRef(state.slice(3))
      const file = await pickedFile(ref.uri)
      await NSWinRT.toPromise(Windows.Storage.FileIO.WriteBytesAsync(file, encode(bytes)))
      return 'saved' as FileExportResult
    } finally {
      exportInFlight = false
    }
  },
  release(ref) {
    const entry = owned.get(ref.uri)
    if (!entry || entry.releasing) {
      return
    }
    entry.releasing = true
    void Promise.resolve()
      .then(() => NSWinRT.toPromise(entry.file.DeleteAsync()))
      .then(
        () => owned.delete(ref.uri),
        () => {
          entry.releasing = false
        },
      )
  },
}
