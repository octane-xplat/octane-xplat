import type {
  Accelerator,
  AcceleratorPlatform,
  GlobalShortcutCode,
  GlobalShortcutError,
  GlobalShortcutErrorCode,
} from './types.js'

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const LETTER_CODES = [...LETTERS].map((c) => `Key${c}` as const)
const DIGIT_CODES = Array.from({ length: 10 }, (_, i) => `Digit${i}` as const)
const FUNCTION_CODES = Array.from({ length: 24 }, (_, i) => `F${i + 1}` as const)
const NAV_CODES = [
  'Space',
  'Enter',
  'Escape',
  'Tab',
  'Backspace',
  'Delete',
  'Insert',
  'Home',
  'End',
  'PageUp',
  'PageDown',
  'ArrowUp',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
] as const

const PUNCT_CODES = [
  'Minus',
  'Equal',
  'BracketLeft',
  'BracketRight',
  'Backslash',
  'Semicolon',
  'Quote',
  'Comma',
  'Period',
  'Slash',
  'Backquote',
] as const

const NUMPAD_CODES = [
  'Numpad0',
  'Numpad1',
  'Numpad2',
  'Numpad3',
  'Numpad4',
  'Numpad5',
  'Numpad6',
  'Numpad7',
  'Numpad8',
  'Numpad9',
  'NumpadAdd',
  'NumpadSubtract',
  'NumpadMultiply',
  'NumpadDivide',
  'NumpadDecimal',
  'NumpadEnter',
] as const

const ALL_CODES: ReadonlySet<string> = new Set([
  ...LETTER_CODES,
  ...DIGIT_CODES,
  ...FUNCTION_CODES,
  ...NAV_CODES,
  ...PUNCT_CODES,
  ...NUMPAD_CODES,
])

/** Carbon kVK virtual key codes for macOS. F21–F24 and Insert have no mapping. */
const MAC_KEYS: Readonly<Record<string, number>> = {
  // ANSI letter row — kVK codes are positional and stable across layouts.
  KeyA: 0x00,
  KeyB: 0x0b,
  KeyC: 0x08,
  KeyD: 0x02,
  KeyE: 0x0e,
  KeyF: 0x03,
  KeyG: 0x05,
  KeyH: 0x04,
  KeyI: 0x22,
  KeyJ: 0x26,
  KeyK: 0x28,
  KeyL: 0x25,
  KeyM: 0x2e,
  KeyN: 0x2d,
  KeyO: 0x1f,
  KeyP: 0x23,
  KeyQ: 0x0c,
  KeyR: 0x0f,
  KeyS: 0x01,
  KeyT: 0x11,
  KeyU: 0x20,
  KeyV: 0x09,
  KeyW: 0x0d,
  KeyX: 0x07,
  KeyY: 0x10,
  KeyZ: 0x06,
  Digit0: 0x1d,
  Digit1: 0x12,
  Digit2: 0x13,
  Digit3: 0x14,
  Digit4: 0x15,
  Digit5: 0x17,
  Digit6: 0x16,
  Digit7: 0x1a,
  Digit8: 0x1c,
  Digit9: 0x19,
  F1: 0x7a,
  F2: 0x78,
  F3: 0x63,
  F4: 0x76,
  F5: 0x60,
  F6: 0x61,
  F7: 0x62,
  F8: 0x64,
  F9: 0x65,
  F10: 0x6d,
  F11: 0x67,
  F12: 0x6f,
  F13: 0x69,
  F14: 0x6b,
  F15: 0x71,
  F16: 0x6a,
  F17: 0x40,
  F18: 0x4f,
  F19: 0x50,
  F20: 0x5a,
  Space: 0x31,
  Enter: 0x24,
  Escape: 0x35,
  Tab: 0x30,
  Backspace: 0x33,
  Delete: 0x75,
  Home: 0x73,
  End: 0x77,
  PageUp: 0x74,
  PageDown: 0x79,
  ArrowUp: 0x7e,
  ArrowDown: 0x7d,
  ArrowLeft: 0x7b,
  ArrowRight: 0x7c,
  Minus: 0x1b,
  Equal: 0x18,
  BracketLeft: 0x21,
  BracketRight: 0x1e,
  Backslash: 0x2a,
  Semicolon: 0x29,
  Quote: 0x27,
  Comma: 0x2b,
  Period: 0x2f,
  Slash: 0x2c,
  Backquote: 0x32,
  Numpad0: 0x52,
  Numpad1: 0x53,
  Numpad2: 0x54,
  Numpad3: 0x55,
  Numpad4: 0x56,
  Numpad5: 0x57,
  Numpad6: 0x58,
  Numpad7: 0x59,
  Numpad8: 0x5b,
  Numpad9: 0x5c,
  NumpadAdd: 0x45,
  NumpadSubtract: 0x4e,
  NumpadMultiply: 0x43,
  NumpadDivide: 0x4b,
  NumpadDecimal: 0x41,
  NumpadEnter: 0x4c,
}

/**
 * Windows keys. `scan` entries are set-1 scan codes translated through
 * MapVirtualKeyExW(MAPVK_VSC_TO_VK_EX) at bind time so they follow the
 * current layout; `vk` entries are fixed virtual keys.
 */
export interface WindowsKeyMapping {
  readonly scan?: number
  readonly vk?: number
}

const WINDOWS_KEYS: Readonly<Record<string, WindowsKeyMapping>> = {
  KeyA: { scan: 0x1e },
  KeyB: { scan: 0x30 },
  KeyC: { scan: 0x2e },
  KeyD: { scan: 0x20 },
  KeyE: { scan: 0x12 },
  KeyF: { scan: 0x21 },
  KeyG: { scan: 0x22 },
  KeyH: { scan: 0x23 },
  KeyI: { scan: 0x17 },
  KeyJ: { scan: 0x24 },
  KeyK: { scan: 0x25 },
  KeyL: { scan: 0x26 },
  KeyM: { scan: 0x32 },
  KeyN: { scan: 0x31 },
  KeyO: { scan: 0x18 },
  KeyP: { scan: 0x19 },
  KeyQ: { scan: 0x10 },
  KeyR: { scan: 0x13 },
  KeyS: { scan: 0x1f },
  KeyT: { scan: 0x14 },
  KeyU: { scan: 0x16 },
  KeyV: { scan: 0x2f },
  KeyW: { scan: 0x11 },
  KeyX: { scan: 0x2d },
  KeyY: { scan: 0x15 },
  KeyZ: { scan: 0x2c },
  Digit1: { scan: 0x02 },
  Digit2: { scan: 0x03 },
  Digit3: { scan: 0x04 },
  Digit4: { scan: 0x05 },
  Digit5: { scan: 0x06 },
  Digit6: { scan: 0x07 },
  Digit7: { scan: 0x08 },
  Digit8: { scan: 0x09 },
  Digit9: { scan: 0x0a },
  Digit0: { scan: 0x0b },
  Minus: { scan: 0x0c },
  Equal: { scan: 0x0d },
  BracketLeft: { scan: 0x1a },
  BracketRight: { scan: 0x1b },
  Backslash: { scan: 0x2b },
  Semicolon: { scan: 0x27 },
  Quote: { scan: 0x28 },
  Comma: { scan: 0x33 },
  Period: { scan: 0x34 },
  Slash: { scan: 0x35 },
  Backquote: { scan: 0x29 },
  Escape: { vk: 0x1b },
  Tab: { vk: 0x09 },
  Backspace: { vk: 0x08 },
  Enter: { vk: 0x0d },
  Space: { vk: 0x20 },
  Delete: { vk: 0x2e },
  Insert: { vk: 0x2d },
  Home: { vk: 0x24 },
  End: { vk: 0x23 },
  PageUp: { vk: 0x21 },
  PageDown: { vk: 0x22 },
  ArrowLeft: { vk: 0x25 },
  ArrowUp: { vk: 0x26 },
  ArrowRight: { vk: 0x27 },
  ArrowDown: { vk: 0x28 },
  F1: { vk: 0x70 },
  F2: { vk: 0x71 },
  F3: { vk: 0x72 },
  F4: { vk: 0x73 },
  F5: { vk: 0x74 },
  F6: { vk: 0x75 },
  F7: { vk: 0x76 },
  F8: { vk: 0x77 },
  F9: { vk: 0x78 },
  F10: { vk: 0x79 },
  F11: { vk: 0x7a },
  F12: { vk: 0x7b },
  F13: { vk: 0x7c },
  F14: { vk: 0x7d },
  F15: { vk: 0x7e },
  F16: { vk: 0x7f },
  F17: { vk: 0x80 },
  F18: { vk: 0x81 },
  F19: { vk: 0x82 },
  F20: { vk: 0x83 },
  F21: { vk: 0x84 },
  F22: { vk: 0x85 },
  F23: { vk: 0x86 },
  F24: { vk: 0x87 },
  Numpad0: { vk: 0x60 },
  Numpad1: { vk: 0x61 },
  Numpad2: { vk: 0x62 },
  Numpad3: { vk: 0x63 },
  Numpad4: { vk: 0x64 },
  Numpad5: { vk: 0x65 },
  Numpad6: { vk: 0x66 },
  Numpad7: { vk: 0x67 },
  Numpad8: { vk: 0x68 },
  Numpad9: { vk: 0x69 },
  NumpadMultiply: { vk: 0x6a },
  NumpadAdd: { vk: 0x6b },
  NumpadSubtract: { vk: 0x6d },
  NumpadDecimal: { vk: 0x6e },
  NumpadDivide: { vk: 0x6f },
  // NumpadEnter shares VK_RETURN with Enter and cannot be told apart → unmapped.
}

/** X11 keysym names for the Linux portal trigger strings (pure data). */
const LINUX_KEYS: Readonly<Record<string, string>> = {
  ...Object.fromEntries([...LETTERS].map((c) => [`Key${c}`, c.toLowerCase()])),
  ...Object.fromEntries(DIGIT_CODES.map((code, i) => [code, String(i)])),
  ...Object.fromEntries(FUNCTION_CODES.map((code, i) => [code, `F${i + 1}`])),
  Space: 'space',
  Enter: 'Return',
  Escape: 'Escape',
  Tab: 'Tab',
  Backspace: 'BackSpace',
  Delete: 'Delete',
  Insert: 'Insert',
  Home: 'Home',
  End: 'End',
  PageUp: 'Page_Up',
  PageDown: 'Page_Down',
  ArrowUp: 'Up',
  ArrowDown: 'Down',
  ArrowLeft: 'Left',
  ArrowRight: 'Right',
  Minus: 'minus',
  Equal: 'equal',
  BracketLeft: 'bracketleft',
  BracketRight: 'bracketright',
  Backslash: 'backslash',
  Semicolon: 'semicolon',
  Quote: 'apostrophe',
  Comma: 'comma',
  Period: 'period',
  Slash: 'slash',
  Backquote: 'grave',
  ...Object.fromEntries(Array.from({ length: 10 }, (_, i) => [`Numpad${i}`, `KP_${i}`])),
  NumpadAdd: 'KP_Add',
  NumpadSubtract: 'KP_Subtract',
  NumpadMultiply: 'KP_Multiply',
  NumpadDivide: 'KP_Divide',
  NumpadDecimal: 'KP_Decimal',
  NumpadEnter: 'KP_Enter',
}

const PLATFORM_LABELS: Record<AcceleratorPlatform, string> = {
  mac: 'macOS',
  windows: 'Windows',
  linux: 'Linux',
}

export type ParseAcceleratorResult =
  | { ok: true; accelerator: Accelerator }
  | { ok: false; error: GlobalShortcutError }

const err = (code: GlobalShortcutErrorCode, message: string): ParseAcceleratorResult => ({
  ok: false,
  error: { code, message },
})

interface ParsedModifiers {
  ctrl: boolean
  alt: boolean
  shift: boolean
  meta: boolean
}

const MOD_ALIASES: ReadonlyArray<readonly [readonly string[], keyof ParsedModifiers | 'mod']> = [
  [['ctrl', 'control'], 'ctrl'],
  [['alt', 'option'], 'alt'],
  [['shift'], 'shift'],
  [['meta', 'cmd', 'command', 'super', 'win'], 'meta'],
  [['mod'], 'mod'],
]

const MOD_CANONICAL_NAMES: Record<keyof ParsedModifiers, string> = {
  ctrl: 'Ctrl',
  alt: 'Alt',
  shift: 'Shift',
  meta: 'Meta',
}

const detectPlatform = (): AcceleratorPlatform => {
  const globalProcess: { platform?: string } | undefined = (
    globalThis as { process?: { platform?: string } }
  ).process

  if (globalProcess && typeof globalProcess.platform === 'string') {
    return globalProcess.platform === 'darwin' ? 'mac' : 'windows'
  }

  const nav: { platform?: string; userAgent?: string } | undefined = (
    globalThis as { navigator?: { platform?: string; userAgent?: string } }
  ).navigator

  const hint = `${nav?.platform ?? ''} ${nav?.userAgent ?? ''}`

  return /mac|iphone|ipad/i.test(hint) ? 'mac' : 'windows'
}

const isMapped = (platform: AcceleratorPlatform, code: string): boolean => {
  if (platform === 'mac') {
    return MAC_KEYS[code] !== undefined
  }

  if (platform === 'windows') {
    return WINDOWS_KEYS[code] !== undefined
  }

  return LINUX_KEYS[code] !== undefined
}

/**
 * Parse an accelerator string such as `'Ctrl+Alt+KeyK'` into its normalized
 * form. Keys are physical `KeyboardEvent.code` names — global shortcuts fire
 * by position, not by produced character, so single letters like `'k'` are
 * rejected. Returns a structured error instead of throwing.
 */
export function parseAccelerator(
  input: string,
  options?: { platform?: AcceleratorPlatform },
): ParseAcceleratorResult {
  const platform = options?.platform ?? detectPlatform()

  if (typeof input !== 'string' || input.trim() === '') {
    return err('invalid-accelerator', 'An accelerator must be a non-empty string.')
  }

  if (/^[a-z0-9]$/i.test(input.trim())) {
    return err(
      'invalid-accelerator',
      'Single letters and digits are not valid accelerators; use a physical key code such as KeyK or Digit1 because global shortcuts use physical key positions.',
    )
  }

  const tokens = input
    .split('+')
    .map((token) => token.trim())
    .filter((token) => token !== '')

  if (tokens.length === 0) {
    return err('invalid-accelerator', 'An accelerator must be a non-empty string.')
  }

  const modifiers: ParsedModifiers = { ctrl: false, alt: false, shift: false, meta: false }
  const keys: string[] = []

  for (const token of tokens) {
    const lower = token.toLowerCase()
    const alias = MOD_ALIASES.find(([names]) => names.includes(lower))

    if (alias) {
      const [, slot] = alias
      const canonical =
        slot === 'mod'
          ? platform === 'mac'
            ? ('meta' as const)
            : ('ctrl' as const)
          : (slot as keyof ParsedModifiers)

      const label = MOD_CANONICAL_NAMES[canonical]

      if (modifiers[canonical]) {
        return err('invalid-accelerator', `The accelerator repeats the ${label} modifier.`)
      }

      modifiers[canonical] = true
      continue
    }

    const codeName = ALL_CODES.has(token)
      ? token
      : ([...ALL_CODES].find((candidate) => candidate.toLowerCase() === lower) ?? null)

    if (codeName === null) {
      return err(
        'invalid-accelerator',
        `'${token}' is not a valid global shortcut key; use a physical key code such as KeyK or Digit1.`,
      )
    }

    keys.push(codeName)
  }

  if (keys.length === 0) {
    return err('invalid-accelerator', 'An accelerator must name exactly one key.')
  }

  if (keys.length > 1) {
    return err('invalid-accelerator', 'An accelerator must name exactly one key.')
  }

  const code = keys[0] as GlobalShortcutCode
  const isBareFunction = /^F(1[3-9]|2[0-4])$/.test(code)

  if (!modifiers.ctrl && !modifiers.alt && !modifiers.meta && !isBareFunction) {
    return err(
      'invalid-accelerator',
      'A global shortcut needs Ctrl, Alt or Meta; bare F13-F24 are the only allowed modifier-free keys.',
    )
  }

  if (!isMapped(platform, code)) {
    return err(
      'invalid-accelerator',
      `The key ${code} cannot be used for a global shortcut on ${PLATFORM_LABELS[platform]}.`,
    )
  }

  const text = [
    modifiers.ctrl ? 'Ctrl' : null,
    modifiers.alt ? 'Alt' : null,
    modifiers.shift ? 'Shift' : null,
    modifiers.meta ? 'Meta' : null,
    code,
  ]
    .filter((part): part is string => part !== null)
    .join('+')

  return { ok: true, accelerator: { ...modifiers, code, text } }
}

/** Carbon kVK code for an accelerator code, or null when unmappable. */
export function macKeyCode(code: GlobalShortcutCode): number | null {
  const value = MAC_KEYS[code]

  return value === undefined ? null : value
}

/** Windows mapping (scan code or fixed VK) for an accelerator code. */
export function windowsKeyMapping(code: GlobalShortcutCode): WindowsKeyMapping | null {
  const value = WINDOWS_KEYS[code]

  return value === undefined ? null : value
}

/** X11 keysym name for an accelerator code (Linux portal trigger text). */
export function linuxKeysym(code: GlobalShortcutCode): string | null {
  const value = LINUX_KEYS[code]

  return value === undefined ? null : value
}
