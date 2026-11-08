/** Detected host platform for global shortcut support. */
export type GlobalShortcutPlatform = 'macos' | 'windows' | 'linux' | 'web' | 'mobile' | 'unknown'

/** OS mechanism used to deliver global hotkeys, or 'none' when unsupported. */
export type GlobalShortcutMechanism = 'carbon' | 'win32' | 'xdg-portal' | 'none'

/** Reported capability of the current host. */
export interface GlobalShortcutSupport {
  /** Whether system-wide hotkeys can be registered on this host. */
  supported: boolean
  /** Detected host platform. */
  platform: GlobalShortcutPlatform
  /** Mechanism that delivers hotkeys when supported. */
  mechanism: GlobalShortcutMechanism
  /**
   * 'exact': the OS registers exactly the requested accelerator. 'desktop':
   * the desktop environment (portal) may ask the user and may assign a
   * different trigger. 'none': unsupported.
   */
  assignment: 'exact' | 'desktop' | 'none'
  /** Present when unsupported or degraded; a fixed English sentence. */
  reason?: string
}

/** A parsed accelerator: modifier booleans plus a physical key code. */
export interface Accelerator {
  ctrl: boolean
  alt: boolean
  shift: boolean
  meta: boolean
  /** Physical key code (KeyboardEvent.code vocabulary). */
  code: GlobalShortcutCode
  /** Canonical text form: `Ctrl+Alt+Shift+Meta+<Code>` (Mod resolved). */
  text: string
}

/** Platform whose key table applies when parsing. */
export type AcceleratorPlatform = 'mac' | 'windows' | 'linux'

/** Physical key codes accepted in accelerators. */
export type GlobalShortcutCode =
  | `Key${'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I' | 'J' | 'K' | 'L' | 'M' | 'N' | 'O' | 'P' | 'Q' | 'R' | 'S' | 'T' | 'U' | 'V' | 'W' | 'X' | 'Y' | 'Z'}`
  | `Digit${0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9}`
  | `F${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20 | 21 | 22 | 23 | 24}`
  | 'Space'
  | 'Enter'
  | 'Escape'
  | 'Tab'
  | 'Backspace'
  | 'Delete'
  | 'Insert'
  | 'Home'
  | 'End'
  | 'PageUp'
  | 'PageDown'
  | 'ArrowUp'
  | 'ArrowDown'
  | 'ArrowLeft'
  | 'ArrowRight'
  | 'Minus'
  | 'Equal'
  | 'BracketLeft'
  | 'BracketRight'
  | 'Backslash'
  | 'Semicolon'
  | 'Quote'
  | 'Comma'
  | 'Period'
  | 'Slash'
  | 'Backquote'
  | 'Numpad0'
  | 'Numpad1'
  | 'Numpad2'
  | 'Numpad3'
  | 'Numpad4'
  | 'Numpad5'
  | 'Numpad6'
  | 'Numpad7'
  | 'Numpad8'
  | 'Numpad9'
  | 'NumpadAdd'
  | 'NumpadSubtract'
  | 'NumpadMultiply'
  | 'NumpadDivide'
  | 'NumpadDecimal'
  | 'NumpadEnter'

/** Machine-readable failure classification for registration outcomes. */
export type GlobalShortcutErrorCode =
  | 'invalid-accelerator'
  | 'reserved'
  | 'conflict'
  | 'duplicate-id'
  | 'unsupported'
  | 'denied'
  | 'unavailable'
  | 'disposed'

/** A structured failure; `register` returns these instead of throwing. */
export interface GlobalShortcutError {
  code: GlobalShortcutErrorCode
  /** Fixed English sentence describing the failure. */
  message: string
  id?: string
  accelerator?: string
}

/** Event delivered to `onPress` each time the hotkey fires. */
export interface GlobalShortcutEvent {
  id: string
  /** Canonical accelerator text that fired. */
  accelerator: string
  /** `Date.now()` at delivery time. */
  timestamp: number
}

/** Options accepted by `GlobalShortcuts.register`. */
export interface GlobalShortcutOptions {
  /** Caller-chosen unique id within this instance. */
  id: string
  /** Accelerator text, e.g. `'Ctrl+Alt+KeyK'`. */
  accelerator: string
  /** Optional human description (desktop portals may display it). */
  description?: string
  /** Invoked once per activation; held keys do not repeat. */
  onPress(event: GlobalShortcutEvent): void
}

/** A live registration. `unregister` releases the OS binding. */
export interface GlobalShortcut {
  readonly id: string
  /** Canonical accelerator text. */
  readonly accelerator: string
  /**
   * OS/desktop-reported trigger label; equals `accelerator` for 'exact'
   * assignment hosts.
   */
  readonly trigger: string
  /** Release this registration. Resolves false if already released. */
  unregister(): Promise<boolean>
}

export type GlobalShortcutResult =
  | { ok: true; shortcut: GlobalShortcut }
  | { ok: false; error: GlobalShortcutError }

/** A registry of global shortcuts. Create via `createGlobalShortcuts`. */
export interface GlobalShortcuts {
  /**
   * Register a system-wide hotkey. Never throws for expected outcomes —
   * inspect `result.ok`. Throws `TypeError` for programmer errors (empty id,
   * non-function onPress).
   */
  register(options: GlobalShortcutOptions): Promise<GlobalShortcutResult>
  /** Release a registration by id; false when not registered. */
  unregister(id: string): Promise<boolean>
  /** Release every registration owned by this instance. */
  unregisterAll(): Promise<void>
  /** Live registrations of this instance. */
  list(): readonly GlobalShortcut[]
  /**
   * Release every registration and backend resource. Idempotent; settles
   * in-flight `register` calls with `disposed`, and later `register` calls
   * return `disposed` errors.
   */
  dispose(): Promise<void>
  readonly disposed: boolean
}

/** Options accepted by `createGlobalShortcuts`. */
export interface CreateGlobalShortcutsOptions {
  /** Called when an `onPress` handler throws; otherwise rethrown asynchronously. */
  onError?(error: unknown): void
  /** Optional app id hint for desktop portals. */
  appId?: string
}
