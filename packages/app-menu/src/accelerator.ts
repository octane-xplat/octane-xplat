/** Parsed accelerator: one key plus the pressed modifiers. `mod` is the
 *  platform's primary modifier (Command on macOS, Control elsewhere); `meta`
 *  is Command on macOS but the Super/Windows key elsewhere. */
export interface ParsedAccelerator {
  key: string
  modifiers: {
    mod: boolean
    ctrl: boolean
    alt: boolean
    shift: boolean
    meta: boolean
  }
}

export interface AppKitAccelerator {
  keyEquivalent: string
  modifierMask: number
}

export interface WinUIAccelerator {
  key: number
  modifiers: number
}

const MODIFIER_TOKENS: Record<string, keyof ParsedAccelerator['modifiers']> = {
  mod: 'mod',
  ctrl: 'ctrl',
  control: 'ctrl',
  alt: 'alt',
  option: 'alt',
  shift: 'shift',
  meta: 'meta',
  cmd: 'meta',
  command: 'meta',
  super: 'meta',
}

const NAMED_KEYS = new Set([
  'enter',
  'escape',
  'tab',
  'space',
  'backspace',
  'delete',
  'arrowup',
  'arrowdown',
  'arrowleft',
  'arrowright',
  'home',
  'end',
  'pageup',
  'pagedown',
  'plus',
])

const CANONICAL_NAMED: Record<string, string> = {
  enter: 'Enter',
  escape: 'Escape',
  tab: 'Tab',
  space: 'Space',
  backspace: 'Backspace',
  delete: 'Delete',
  arrowup: 'ArrowUp',
  arrowdown: 'ArrowDown',
  arrowleft: 'ArrowLeft',
  arrowright: 'ArrowRight',
  home: 'Home',
  end: 'End',
  pageup: 'PageUp',
  pagedown: 'PageDown',
  plus: 'Plus',
}

const PUNCTUATION = new Set([',', '.', '/', ';', "'", '[', ']', '\\', '-', '=', '`'])

function fail(message: string): never {
  throw new TypeError(message)
}

/** Parse a `'Mod+Shift+Z'`-style accelerator. `+`-separated, case-insensitive
 *  modifier tokens (`Mod`, `Ctrl`/`Control`, `Alt`/`Option`, `Shift`,
 *  `Meta`/`Cmd`/`Command`/`Super`) plus exactly one key: `A`–`Z`, `0`–`9`,
 *  `F1`–`F24`, `Enter`, `Escape`, `Tab`, `Space`, `Backspace`, `Delete`,
 *  `ArrowUp/Down/Left/Right`, `Home`, `End`, `PageUp`, `PageDown`, `Plus`, or
 *  the punctuation `` , . / ; ' [ ] \ - = ` ``. At least one non-Shift
 *  modifier is required unless the key is F1–F24 — plain letters as app
 *  accelerators would steal typing. */
export function parseAccelerator(source: string): ParsedAccelerator {
  if (typeof source !== 'string' || !source.trim()) {
    fail('accelerator must be a non-empty string')
  }
  const tokens = source.split('+').map((token) => token.trim())
  const modifiers = { mod: false, ctrl: false, alt: false, shift: false, meta: false }
  let key: string | null = null
  for (const token of tokens) {
    const lower = token.toLowerCase()
    const modifier = MODIFIER_TOKENS[lower]
    if (modifier) {
      modifiers[modifier] = true
      continue
    }
    if (!token) {
      fail(`invalid accelerator "${source}" — empty key token`)
    }
    let candidate: string | null = null
    if (/^[a-z]$/i.test(token)) {
      candidate = token.toUpperCase()
    } else if (/^[0-9]$/.test(token)) {
      candidate = token
    } else if (/^f([1-9]|1[0-9]|2[0-4])$/i.test(token)) {
      candidate = token.toUpperCase()
    } else if (NAMED_KEYS.has(lower)) {
      candidate = CANONICAL_NAMED[lower]!
    } else if (token.length === 1 && PUNCTUATION.has(token)) {
      candidate = token
    }
    if (candidate === null) {
      fail(`invalid accelerator "${source}" — unknown key "${token}"`)
    }
    if (key !== null) {
      fail(`invalid accelerator "${source}" — more than one key`)
    }
    key = candidate
  }
  if (key === null) {
    fail(`invalid accelerator "${source}" — a key is required`)
  }
  const hasModifier = modifiers.mod || modifiers.ctrl || modifiers.alt || modifiers.meta
  const isFunctionKey = /^F(?:[1-9]|1[0-9]|2[0-4])$/.test(key)
  if (!hasModifier && !isFunctionKey) {
    fail(
      `invalid accelerator "${source}" — requires a non-Shift modifier (plain keys are reserved for typing)`,
    )
  }
  return { key, modifiers }
}

const NS_SHIFT = 1 << 17
const NS_CONTROL = 1 << 18
const NS_OPTION = 1 << 19
const NS_COMMAND = 1 << 20

const APPKIT_KEYS: Record<string, number> = {
  ArrowUp: 0xf700,
  ArrowDown: 0xf701,
  ArrowLeft: 0xf702,
  ArrowRight: 0xf703,
  Delete: 0xf728,
  Home: 0xf729,
  End: 0xf72b,
  PageUp: 0xf72c,
  PageDown: 0xf72d,
  Backspace: 0x08,
  Enter: 0x0d,
  Escape: 0x1b,
  Tab: 0x09,
  Space: 0x20,
  Plus: '+'.charCodeAt(0),
}

/** Map to AppKit `{ keyEquivalent, modifierMask }`. `mod` and `meta` are both
 *  Command here. */
export function toAppKit(parsed: ParsedAccelerator): AppKitAccelerator {
  let modifierMask = 0
  if (parsed.modifiers.shift) modifierMask |= NS_SHIFT
  if (parsed.modifiers.ctrl) modifierMask |= NS_CONTROL
  if (parsed.modifiers.alt) modifierMask |= NS_OPTION
  if (parsed.modifiers.mod || parsed.modifiers.meta) modifierMask |= NS_COMMAND

  const code = APPKIT_KEYS[parsed.key]
  const keyEquivalent =
    code !== undefined
      ? String.fromCharCode(code)
      : /^F\d+$/.test(parsed.key)
        ? String.fromCharCode(0xf704 + Number(parsed.key.slice(1)) - 1)
        : parsed.key.length === 1
          ? // Always lowercase — AppKit matches keyEquivalent against the
            // event's charactersIgnoringModifiers (lowercase for letters);
            // an uppercase letter is unreachable by key events.
            parsed.key.toLowerCase()
          : parsed.key
  return { keyEquivalent, modifierMask }
}

const GTK_KEYS: Record<string, string> = {
  Enter: 'Return',
  Escape: 'Escape',
  Tab: 'Tab',
  Space: 'space',
  Backspace: 'BackSpace',
  Delete: 'Delete',
  ArrowUp: 'Up',
  ArrowDown: 'Down',
  ArrowLeft: 'Left',
  ArrowRight: 'Right',
  Home: 'Home',
  End: 'End',
  PageUp: 'Page_Up',
  PageDown: 'Page_Down',
  Plus: 'plus',
  ',': 'comma',
  '.': 'period',
  '/': 'slash',
  ';': 'semicolon',
  "'": 'apostrophe',
  '[': 'bracketleft',
  ']': 'bracketright',
  '\\': 'backslash',
  '-': 'minus',
  '=': 'equal',
  '`': 'grave',
}

/** Map to a GTK accelerator string such as `<Control><Shift>z`. `mod` is
 *  Control and `meta` is Super here. */
export function toGtk(parsed: ParsedAccelerator): string {
  let accel = ''
  if (parsed.modifiers.ctrl || parsed.modifiers.mod) accel += '<Control>'
  if (parsed.modifiers.shift) accel += '<Shift>'
  if (parsed.modifiers.alt) accel += '<Alt>'
  if (parsed.modifiers.meta) accel += '<Super>'
  const named = GTK_KEYS[parsed.key]
  accel += named ?? (parsed.key.length === 1 ? parsed.key.toLowerCase() : parsed.key)
  return accel
}

const WINUI_CONTROL = 1
const WINUI_MENU = 2
const WINUI_SHIFT = 4
const WINUI_WINDOWS = 8

const WINUI_KEYS: Record<string, number> = {
  Backspace: 8,
  Tab: 9,
  Enter: 13,
  Escape: 27,
  Space: 32,
  PageUp: 33,
  PageDown: 34,
  End: 35,
  Home: 36,
  ArrowLeft: 37,
  ArrowUp: 38,
  ArrowRight: 39,
  ArrowDown: 40,
  Delete: 46,
  ';': 186,
  Plus: 187,
  '=': 187,
  ',': 188,
  '-': 189,
  '.': 190,
  '/': 191,
  '`': 192,
  '[': 219,
  '\\': 220,
  ']': 221,
  "'": 222,
}

/** Map to WinUI `{ key: VirtualKey, modifiers: VirtualKeyModifiers }`.
 *  `mod` is Control and `meta` is the Windows key here. */
export function toWinUI(parsed: ParsedAccelerator): WinUIAccelerator {
  let modifiers = 0
  if (parsed.modifiers.ctrl || parsed.modifiers.mod) modifiers |= WINUI_CONTROL
  if (parsed.modifiers.alt) modifiers |= WINUI_MENU
  if (parsed.modifiers.shift) modifiers |= WINUI_SHIFT
  if (parsed.modifiers.meta) modifiers |= WINUI_WINDOWS

  let key = WINUI_KEYS[parsed.key]
  if (key === undefined) {
    if (/^[A-Z]$/.test(parsed.key)) {
      key = parsed.key.charCodeAt(0)
    } else if (/^[0-9]$/.test(parsed.key)) {
      key = parsed.key.charCodeAt(0)
    } else if (/^F\d+$/.test(parsed.key)) {
      key = 112 + Number(parsed.key.slice(1)) - 1
    } else {
      fail(`no WinUI VirtualKey for "${parsed.key}"`)
    }
  }
  return { key, modifiers }
}
