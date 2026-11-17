import {
  CopySymbolicHotKeys,
  GetApplicationEventTarget,
  GetEventParameter,
  InstallEventHandler,
  NSApplicationWillTerminateNotification,
  NSNotificationCenter,
  RegisterEventHotKey,
  RemoveEventHandler,
  UnregisterEventHotKey,
  interop,
} from '@octane-xplat/platform/macos'

import { macKeyCode } from './accelerator.js'
import type { BindOutcome, BindRequest, HotkeyBackend } from './backend.js'
import type { Accelerator, GlobalShortcutSupport } from './types.js'

// Carbon modifier bits.
const CMD = 256
const SHIFT = 512
const OPTION = 2048
const CONTROL = 4096
const MOD_MASK = CMD | SHIFT | OPTION | CONTROL
const EVENT_HOTKEY_EXISTS = -9878
const K_EVENT_HOTKEY_PRESSED = 5

function fourcc(text: string): number {
  return (
    ((text.charCodeAt(0) << 24) |
      (text.charCodeAt(1) << 16) |
      (text.charCodeAt(2) << 8) |
      text.charCodeAt(3)) >>>
    0
  )
}

const HOTKEY_SIGNATURE = fourcc('Oxgs')

type InteropReference = InstanceType<typeof interop.Reference>

interface SymbolicEntry {
  enabled: boolean
  code: number
  modifiers: number
}

// ObjC collection shapes produced by CopySymbolicHotKeys. The bridge returns
// `any`; bind them once to named types rather than asserting inline.
interface NSDictionaryLike {
  allKeys: NSArrayLike
  objectForKey(key: unknown): unknown
}

interface NSArrayLike {
  count: number
  objectAtIndex(index: number): unknown
}

let handlerRef: InteropReference | null = null
// The Carbon UPP must stay strongly referenced for the handler's lifetime.
let handlerFn:
  | ((callRef: unknown, event: interop.PointerConvertible, userData: unknown) => number)
  | null = null

const dispatch = new Map<number, () => void>()
let symbolicCache: SymbolicEntry[] | null = null

const carbonMods = (accelerator: Accelerator): number => {
  let mods = 0

  if (accelerator.meta) {
    mods |= CMD
  }

  if (accelerator.shift) {
    mods |= SHIFT
  }

  if (accelerator.alt) {
    mods |= OPTION
  }

  if (accelerator.ctrl) {
    mods |= CONTROL
  }

  return mods
}

const SUPPORT: GlobalShortcutSupport = {
  supported: true,
  platform: 'macos',
  mechanism: 'carbon',
  assignment: 'exact',
}

function ensureHandler(): void {
  if (handlerRef !== null) {
    return
  }

  const ref = new interop.Reference()
  const spec = new Uint32Array([fourcc('keyb'), K_EVENT_HOTKEY_PRESSED])
  const handler = (_callRef: unknown, event: interop.PointerConvertible): number => {
    const id = new Uint32Array(2)

    GetEventParameter(event, fourcc('----'), fourcc('hkid'), null, 8, null, id)
    dispatch.get(id[1])?.()
    return 0
  }

  const status = InstallEventHandler(GetApplicationEventTarget(), handler, 1, spec, null, ref)

  if (status !== 0) {
    throw new Error(`InstallEventHandler failed with status ${status}`)
  }

  handlerRef = ref
  handlerFn = handler
}

function symbolicHotKeys(): SymbolicEntry[] {
  if (symbolicCache !== null) {
    return symbolicCache
  }

  const entries: SymbolicEntry[] = []

  try {
    const ref = new interop.Reference(interop.types.id)

    if (CopySymbolicHotKeys(ref) === 0) {
      // The bridge returns `any`-typed Foundation objects; bind once to the
      // named collection shapes rather than asserting inline.
      const array = ref.value as unknown as NSArrayLike

      for (let i = 0; i < array.count; i++) {
        const dict = array.objectAtIndex(i) as unknown as NSDictionaryLike
        const record: Record<string, string> = {}

        for (let j = 0; j < dict.allKeys.count; j++) {
          const key = dict.allKeys.objectAtIndex(j)

          record[String(key)] = String(dict.objectForKey(key))
        }

        const code = Number(record['kHISymbolicHotKeyCode'])
        const modifiers = Number(record['kHISymbolicHotKeyModifiers'])

        if (Number.isFinite(code) && code !== 65535 && Number.isFinite(modifiers)) {
          entries.push({
            enabled: record['kHISymbolicHotKeyEnabled'] === 'true',
            code,
            modifiers,
          })
        }
      }
    }
  } catch {
    // Older systems may not expose the call or the array shape may differ;
    // a failed decode means no dynamic reserved entries.
  }

  symbolicCache = entries
  return entries
}

export const backend: HotkeyBackend = {
  platform: 'mac',

  support() {
    return Promise.resolve({ ...SUPPORT })
  },

  reserved(accelerator: Accelerator): string | null {
    const code = macKeyCode(accelerator.code)

    if (code === null) {
      return null
    }

    const mods = carbonMods(accelerator)

    for (const entry of symbolicHotKeys()) {
      if (entry.enabled && entry.code === code && (entry.modifiers & MOD_MASK) === mods) {
        return `The accelerator ${accelerator.text} is already used by an enabled macOS system shortcut.`
      }
    }

    return null
  },

  bind(request: BindRequest, onPress: () => void): Promise<BindOutcome> {
    const code = macKeyCode(request.accelerator.code)

    if (code === null) {
      return Promise.resolve({
        ok: false,
        error: {
          code: 'invalid-accelerator',
          message: `The key ${request.accelerator.code} cannot be used for a global shortcut on macOS.`,
        },
      })
    }

    try {
      ensureHandler()
    } catch (error) {
      return Promise.resolve({
        ok: false,
        error: {
          code: 'unavailable',
          message: `The macOS hotkey event handler could not be installed: ${String(error instanceof Error ? error.message : error)}`,
        },
      })
    }

    const ref = new interop.Reference()
    const status = RegisterEventHotKey(
      code,
      carbonMods(request.accelerator),
      { signature: HOTKEY_SIGNATURE, id: request.key },
      GetApplicationEventTarget(),
      1,
      ref,
    )

    if (status === EVENT_HOTKEY_EXISTS) {
      return Promise.resolve({
        ok: false,
        error: {
          code: 'conflict',
          message: `The accelerator ${request.accelerator.text} is already held by another process.`,
        },
      })
    }

    if (status !== 0) {
      return Promise.resolve({
        ok: false,
        error: {
          code: 'unavailable',
          message: `macOS refused the accelerator ${request.accelerator.text} with status ${status}.`,
        },
      })
    }

    dispatch.set(request.key, onPress)
    return Promise.resolve({
      ok: true,
      trigger: request.accelerator.text,
      release: async () => {
        dispatch.delete(request.key)
        UnregisterEventHotKey(ref.value)
        if (dispatch.size === 0 && handlerRef !== null) {
          RemoveEventHandler(handlerRef.value as interop.PointerConvertible)
          handlerRef = null
          handlerFn = null
        }
      },
    })
  },

  onExit(listener: () => void): () => void {
    try {
      const center = NSNotificationCenter.defaultCenter
      const token = center.addObserverForNameObjectQueueUsingBlock(
        NSApplicationWillTerminateNotification,
        null,
        null,
        () => listener(),
      )

      return () => center.removeObserver(token)
    } catch {
      // No AppKit notification center in this host; process exit releases
      // Carbon hotkeys regardless.
      return () => {}
    }
  },
}

// Explicit read: keeps the installed handler function reachable for GC and
// satisfies unused-local checks; the variable is what keeps the UPP alive.
void handlerFn
