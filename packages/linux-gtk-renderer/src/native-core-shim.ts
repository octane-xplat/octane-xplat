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
let keyFileStore: {
  dir: string
  path: string
  keys: Map<string, { t: string; v: unknown }>
  write(): void
} | null = null

function loadKeyFile() {
  if (keyFileStore !== null) return keyFileStore
  try {
    const g = globalThis as unknown as {
      imports?: { gi?: { GLib?: any; Gio?: any } }
    }
    const GLib = g.imports?.gi?.GLib
    const Gio = g.imports?.gi?.Gio
    if (!GLib || !Gio) throw new Error('no GLib')

    const appId =
      Gio.Application.get_default?.()?.get_application_id?.() ??
      GLib.get_prgname?.() ??
      'octane-app'
    const dir = GLib.build_filenamev([GLib.get_user_config_dir(), String(appId)])
    const path = GLib.build_filenamev([dir, 'settings.ini'])
    const keys = new Map<string, { t: string; v: unknown }>()

    const kf = new GLib.KeyFile()
    try {
      kf.load_from_file(path, GLib.KeyFileFlags.KEEP_COMMENTS)
      const [groups] = kf.get_groups()
      for (const grp of groups ?? []) {
        const [names] = kf.get_keys(grp)
        for (const name of names ?? []) {
          const raw = String(kf.get_value(grp, name))
          const t = raw[0]
          const v = raw.slice(1)
          keys.set(
            `${grp}/${name}`,
            t === 's'
              ? { t, v }
              : t === 'n'
                ? { t, v: Number(v) }
                : { t: 'b', v: v === 'true' },
          )
        }
      }
    } catch {
      // Missing/corrupt file starts empty.
    }

    keyFileStore = {
      dir,
      path,
      keys,
      write() {
        const kf2 = new GLib.KeyFile()
        for (const [compound, e] of this.keys) {
          const i = compound.lastIndexOf('/')
          kf2.set_value(compound.slice(0, i), compound.slice(i + 1), `${e.t}${e.v}`)
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
    keyFileStore = { dir: '', path: '', keys: new Map(), write() {} }
  }
  return keyFileStore
}

function persist(store: { keys: Map<string, { t: string; v: unknown }>; write(): void; dir: string }) {
  if (!store.dir) return
  try {
    store.write()
  } catch {
    // Persistence is best-effort; the in-memory value still applied.
  }
}

const settingsStore = new Map<string, unknown>()

function getEntry(key: string): unknown {
  const store = loadKeyFile()
  if (store.dir) {
    const e = store.keys.get(`settings/${key}`)
    return e === undefined ? undefined : e.v
  }
  return settingsStore.get(key)
}

function setEntry(key: string, t: string, v: unknown) {
  const store = loadKeyFile()
  if (store.dir) {
    store.keys.set(`settings/${key}`, { t, v })
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
    if (store.dir) {
      return [...store.keys.keys()]
        .filter((k) => k.startsWith('settings/'))
        .map((k) => k.slice('settings/'.length))
    }
    return [...settingsStore.keys()]
  },
  hasKey(key: string): boolean {
    const store = loadKeyFile()
    return store.dir
      ? store.keys.has(`settings/${key}`)
      : settingsStore.has(key)
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
      store.keys.delete(`settings/${key}`)
      persist(store)
      return
    }
    settingsStore.delete(key)
  },
  clear() {
    const store = loadKeyFile()
    if (store.dir) {
      for (const k of [...store.keys.keys()]) {
        if (k.startsWith('settings/')) store.keys.delete(k)
      }
      persist(store)
      return
    }
    settingsStore.clear()
  },
  flush(): boolean {
    const store = loadKeyFile()
    if (!store.dir) return true
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
