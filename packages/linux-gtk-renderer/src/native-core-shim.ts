import { registerStylesheet } from '@octane-xplat/css-engine'

// The shared pan leaf imports Utils eagerly, but this renderer doesn't
// implement NativeScript gestures. Fail explicitly if pan velocity is ever
// requested.
export const Utils = {
  layout: {
    getDisplayDensity() {
      throw new Error('NativeScript display density is unavailable in the GTK renderer')
    },
  },
  /** Token href activation goes through the host URI seam (Gtk.show_uri_full
   *  on the app's main window), same path as ui's nav-href.gtk. */
  openUrl(url: string): void {
    const open = (globalThis as any).__octaneGtkHost?.openUri

    if (typeof open !== 'function' || open(url) !== true) {
      console.warn(`[linux-gtk] Cannot open external URI on this GTK host: ${url}`)
    }
  },
}

// The GTK build may resolve a shared native leaf before tree-shaking it.
// These values keep import-time platform checks safe; components that need
// NativeScript application services need explicit GTK leaves or render an
// unsupported state.
let addCssSeq = 0

export const Application = {
  ios: null,
  android: null,
  on() {},
  off() {},
  /** NS parity: theme/runtime CSS injection (theme-css-inject.ts uses this). */
  addCss(css: string) {
    registerStylesheet('addCss:' + ++addCssSeq, css)
  },
}

export const isAndroid = false
export const isIOS = false

// platform/system-bars constructs a Color before its Android gate; on GTK it
// is inert but must stay constructable.
export class Color {
  readonly argb = 0
  readonly android = 0
  readonly ios = null
  constructor(readonly value?: string | number) {}
}

// NS `Screen.mainScreen` reports the primary display in DIPs. GTK4 window
// coordinates are already DIPs; the monitor scale factor is the pixel ratio.
// Gdk is read lazily so unit tests without GI imports keep 0×0 / scale 1.
function primaryMonitor(): { w: number; h: number; scale: number } {
  try {
    const Gdk = (globalThis as unknown as { imports?: { gi?: { Gdk?: any } } }).imports?.gi?.Gdk
    const mon =
      Gdk?.Display?.get_default?.()?.get_monitors?.()?.get_item?.(0) ??
      Gdk?.Display?.get_default?.()?.get_primary_monitor?.()

    const geo = mon?.get_geometry?.()

    return {
      w: Number(geo?.width ?? 0),
      h: Number(geo?.height ?? 0),
      scale: Number(mon?.get_scale_factor?.() ?? 1) || 1,
    }
  } catch {
    return { w: 0, h: 0, scale: 1 }
  }
}

export const Screen = {
  mainScreen: {
    get widthDIPs() {
      return primaryMonitor().w
    },
    get heightDIPs() {
      return primaryMonitor().h
    },
    get scale() {
      return primaryMonitor().scale
    },
    get widthPixels() {
      return this.widthDIPs * this.scale
    },
    get heightPixels() {
      return this.heightDIPs * this.scale
    },
  },
}

export const AccessibilityRole = {
  button: 'button',
  link: 'link',
  heading: 'heading',
  image: 'image',
  text: 'text',
}

// Octane's universal entry may evaluate the NativeScript driver module while
// the GTK renderer is selected. The GTK host never instantiates these
// NativeScript node classes.
export class ActionBar {}
export class ContentView {}
export class FormattedString {}
export class LayoutBase {}
export class ListView {}
export class Span {}
export class TextBase {}
export class View {}
export const unsetValue = Symbol('unsetValue')

// There is no display-link driver — motion's clock just needs a frame-shaped
// timer; the GJS host runs setTimeout on the GLib main loop.
export function requestAnimationFrame(callback: (time: number) => void): unknown {
  return setTimeout(() => callback(Date.now()), 16)
}

export function cancelAnimationFrame(id: number) {
  clearTimeout(id)
}

// Sync KV seam — @octane-xplat/ui query-storage and platform/storage persist
// through ApplicationSettings on native. Persisted with a GLib.KeyFile at
// `${XDG_CONFIG_HOME:-~/.config}/<applicationId>/settings.ini`, resolved
// lazily on first access so unit tests (no GLib) keep in-memory behavior.
// GLib key names allow only [A-Za-z0-9-], so each storage key is stored under
// group 'settings' as 'k' + lowercase hex of its UTF-8 bytes; the decoded
// name map is rebuilt on load so getAllKeys still returns the real keys.
let keyFileStore: {
  dir: string
  path: string
  keys: Map<string, { t: string; v: unknown }>
  names: Map<string, string>
  write(): void
} | null = null

const hexName = (key: string) =>
  'k' + Array.from(new TextEncoder().encode(key), (b) => b.toString(16).padStart(2, '0')).join('')

const warnedPaths = new Set<string>()
function warnOnce(path: string, error: unknown) {
  if (warnedPaths.has(path)) {
    return
  }

  warnedPaths.add(path)
  console.warn('[linux-gtk] settings write failed', path, error)
}

function loadKeyFile() {
  if (keyFileStore !== null) {
    return keyFileStore
  }

  try {
    const g = globalThis as unknown as {
      imports?: { gi?: { GLib?: any; Gio?: any } }
    }

    const GLib = g.imports?.gi?.GLib
    const Gio = g.imports?.gi?.Gio

    if (!GLib || !Gio) {
      throw new Error('no GLib')
    }

    const appId =
      Gio.Application.get_default?.()?.get_application_id?.() ??
      GLib.get_prgname?.() ??
      'octane-app'

    const dir = GLib.build_filenamev([GLib.get_user_config_dir(), String(appId)])
    const path = GLib.build_filenamev([dir, 'settings.ini'])
    const keys = new Map<string, { t: string; v: unknown }>()
    const names = new Map<string, string>()

    const kf = new GLib.KeyFile()

    try {
      kf.load_from_file(path, GLib.KeyFileFlags.NONE)

      const [groups] = kf.get_groups()

      for (const grp of groups ?? []) {
        const [names0] = kf.get_keys(grp)

        for (const hex0 of names0 ?? []) {
          const hex = String(hex0)
          const real = new TextDecoder().decode(
            Uint8Array.from(hex.slice(1).match(/../g) ?? [], (h) => parseInt(h, 16)),
          )

          const raw = String(kf.get_string(grp, hex))
          const t = raw[0]
          const v = raw.slice(1)

          keys.set(
            real,
            t === 's' ? { t, v } : t === 'n' ? { t, v: Number(v) } : { t: 'b', v: v === 'true' },
          )

          names.set(real, hex)
        }
      }
    } catch {
      // Missing/corrupt file starts empty.
    }

    keyFileStore = {
      dir,
      path,
      keys,
      names,
      write() {
        const kf2 = new GLib.KeyFile()

        for (const [key, e] of this.keys) {
          kf2.set_string('settings', this.names.get(key) ?? hexName(key), `${e.t}${e.v}`)
        }

        GLib.mkdir_with_parents(this.dir, 0o700)

        // Atomic write: temp file + rename, so a crash mid-flush cannot
        // truncate a previously good settings file.
        const [contents] = kf2.to_data()

        if (!GLib.file_set_contents(this.path, contents)) {
          throw new Error('keyfile save failed')
        }
      },
    }
  } catch {
    keyFileStore = { dir: '', path: '', keys: new Map(), names: new Map(), write() {} }
  }

  return keyFileStore
}

function persist(store: { write(): void; dir: string; path: string }) {
  if (!store.dir) {
    return
  }

  try {
    store.write()
  } catch (error) {
    warnOnce(store.path, error)
  }
}

const settingsStore = new Map<string, unknown>()

function getEntry(key: string): unknown {
  const store = loadKeyFile()

  if (store.dir) {
    const e = store.keys.get(key)

    return e === undefined ? undefined : e.v
  }

  return settingsStore.get(key)
}

function setEntry(key: string, t: string, v: unknown) {
  const store = loadKeyFile()

  if (store.dir) {
    store.keys.set(key, { t, v })
    store.names.set(key, store.names.get(key) ?? hexName(key))
    persist(store)
    return
  }

  settingsStore.set(key, v)
}

export const ApplicationSettings = {
  getString(key: string): string | undefined {
    const v = getEntry(key)

    return v === undefined || typeof v === 'string' ? v : String(v)
  },
  getNumber(key: string): number | undefined {
    const v = getEntry(key)

    return typeof v === 'number' ? v : v === undefined ? undefined : Number(v)
  },
  getBoolean(key: string): boolean | undefined {
    const v = getEntry(key)

    return typeof v === 'boolean' ? v : v === undefined ? undefined : Boolean(v)
  },
  getAllKeys(): string[] {
    const store = loadKeyFile()

    return store.dir ? [...store.keys.keys()] : [...settingsStore.keys()]
  },
  hasKey(key: string): boolean {
    const store = loadKeyFile()

    return store.dir ? store.keys.has(key) : settingsStore.has(key)
  },
  setString(key: string, value: string) {
    setEntry(key, 's', value)
  },
  setNumber(key: string, value: number) {
    setEntry(key, 'n', value)
  },
  setBoolean(key: string, value: boolean) {
    setEntry(key, 'b', value)
  },
  remove(key: string) {
    const store = loadKeyFile()

    if (store.dir) {
      store.keys.delete(key)
      store.names.delete(key)
      persist(store)
      return
    }

    settingsStore.delete(key)
  },
  clear() {
    const store = loadKeyFile()

    if (store.dir) {
      store.keys.clear()
      persist(store)
      return
    }

    settingsStore.clear()
  },
  flush(): boolean {
    const store = loadKeyFile()

    if (!store.dir) {
      return true
    }

    try {
      store.write()
      return true
    } catch {
      return false
    }
  },
}

// Connectivity — GTK4 has no @nativescript/core equivalent in GJS scope.
// Report `unknown` honestly; monitoring is a no-op rather than fake events.
const UNKNOWN = 6 // Connectivity.connectionType.unknown in @nativescript/core

export const Connectivity = {
  connectionType: {
    none: 0,
    wifi: 1,
    mobile: 2,
    ethernet: 3,
    bluetooth: 4,
    vpn: 5,
    unknown: UNKNOWN,
  },
  getConnectionType(): number {
    return UNKNOWN
  },
  startMonitoring() {},
  stopMonitoring() {},
}

// platform/device.ts reads Device at import time on some leaves.
export const Device = {
  deviceType: 'Desktop',
  os: 'Linux',
  osVersion: '',
  model: '',
  sdkVersion: '',
  language: 'en',
  manufacturer: '',
  platform: 'linux',
  region: '',
  uuid: '',
}
