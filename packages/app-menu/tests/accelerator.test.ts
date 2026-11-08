import { describe, expect, it } from 'vitest'
import {
  parseAccelerator,
  toAppKit,
  toGtk,
  toWinUI,
  type ParsedAccelerator,
} from '../src/accelerator'

const parse = (source: string) => parseAccelerator(source)

describe('parseAccelerator', () => {
  it('parses modifiers and a key', () => {
    expect(parse('Mod+Shift+Z')).toEqual({
      key: 'Z',
      modifiers: { mod: true, ctrl: false, alt: false, shift: true, meta: false },
    })
    expect(parse('ctrl+alt+delete')).toEqual({
      key: 'Delete',
      modifiers: { mod: false, ctrl: true, alt: true, shift: false, meta: false },
    })
  })

  it('accepts every modifier alias', () => {
    for (const [token, flag] of [
      ['Mod', 'mod'],
      ['Ctrl', 'ctrl'],
      ['Control', 'ctrl'],
      ['Alt', 'alt'],
      ['Option', 'alt'],
      ['Meta', 'meta'],
      ['Cmd', 'meta'],
      ['Command', 'meta'],
      ['Super', 'meta'],
    ] as const) {
      const parsed = parse(`${token}+A`)
      expect(parsed.modifiers[flag], token).toBe(true)
    }
    expect(parse('shift+F5').modifiers.shift).toBe(true)
  })

  it('normalizes key spelling', () => {
    expect(parse('Mod+n').key).toBe('N')
    expect(parse('Mod+enter').key).toBe('Enter')
    expect(parse('Mod+f5').key).toBe('F5')
    expect(parse('Mod+,').key).toBe(',')
    expect(parse('Mod+Plus').key).toBe('Plus')
    expect(parse('Mod+ArrowUp').key).toBe('ArrowUp')
    expect(parse('Mod+PageDown').key).toBe('PageDown')
    expect(parse('Mod+`').key).toBe('`')
  })

  it('rejects empty, unknown, key-less and multi-key accelerators', () => {
    for (const source of ['', '   ', 'Mod+', 'Mod+Hyper', 'N', 'Mod+N+O', 'Mod+Shift']) {
      expect(() => parse(source), JSON.stringify(source)).toThrow(TypeError)
    }
    expect(() => parse('Nope+K')).toThrow(/unknown/)
  })

  it('requires a non-Shift modifier except for function keys', () => {
    expect(() => parse('Shift+A')).toThrow(/modifier/)
    expect(parse('Shift+F24').key).toBe('F24')
    expect(parse('F1').key).toBe('F1')
    expect(() => parse('A')).toThrow(/modifier/)
    expect(() => parse('Mod+F25')).toThrow()
  })
})

const shift = 1 << 17,
  control = 1 << 18,
  option = 1 << 19,
  command = 1 << 20

describe('toAppKit', () => {
  it('maps Mod and Meta to Command, Ctrl to Control, Alt to Option', () => {
    expect(toAppKit(parse('Mod+N'))).toEqual({ keyEquivalent: 'n', modifierMask: command })
    expect(toAppKit(parse('Meta+Q'))).toEqual({ keyEquivalent: 'q', modifierMask: command })
    expect(toAppKit(parse('Ctrl+Alt+Shift+,'))).toEqual({
      keyEquivalent: ',',
      modifierMask: control | option | shift,
    })
  })

  it('maps named keys to unicode key equivalents', () => {
    const cases: [string, number][] = [
      ['F1', 0xf704],
      ['F24', 0xf704 + 23],
      ['ArrowUp', 0xf700],
      ['ArrowDown', 0xf701],
      ['ArrowLeft', 0xf702],
      ['ArrowRight', 0xf703],
      ['Delete', 0xf728],
      ['Home', 0xf729],
      ['End', 0xf72b],
      ['PageUp', 0xf72c],
      ['PageDown', 0xf72d],
      ['Backspace', 0x08],
      ['Enter', 0x0d],
      ['Escape', 0x1b],
      ['Tab', 0x09],
      ['Space', 0x20],
    ]
    for (const [key, code] of cases) {
      const { keyEquivalent } = toAppKit(parse(`Mod+${key}`))
      expect(keyEquivalent, key).toBe(String.fromCharCode(code))
    }
  })
})

describe('toGtk', () => {
  it('maps Mod to Control and Meta to Super', () => {
    expect(toGtk(parse('Mod+N'))).toBe('<Control>n')
    expect(toGtk(parse('Meta+ArrowLeft'))).toBe('<Super>Left')
    expect(toGtk(parse('Mod+Shift+Z'))).toBe('<Control><Shift>z')
    expect(toGtk(parse('Ctrl+Alt+Option+Super+Shift+A'))).toBe(
      '<Control><Shift><Alt><Super>a',
    )
  })

  it('maps named and punctuation keys to keyval names', () => {
    const cases: [string, string][] = [
      ['Enter', 'Return'],
      ['Escape', 'Escape'],
      ['Tab', 'Tab'],
      ['Space', 'space'],
      ['Backspace', 'BackSpace'],
      ['Delete', 'Delete'],
      ['ArrowUp', 'Up'],
      ['ArrowDown', 'Down'],
      ['ArrowLeft', 'Left'],
      ['ArrowRight', 'Right'],
      ['Home', 'Home'],
      ['End', 'End'],
      ['PageUp', 'Page_Up'],
      ['PageDown', 'Page_Down'],
      ['Plus', 'plus'],
      [',', 'comma'],
      ['.', 'period'],
      ['/', 'slash'],
      [';', 'semicolon'],
      ["'", 'apostrophe'],
      ['[', 'bracketleft'],
      [']', 'bracketright'],
      ['\\', 'backslash'],
      ['-', 'minus'],
      ['=', 'equal'],
      ['`', 'grave'],
      ['F5', 'F5'],
      ['0', '0'],
    ]
    for (const [key, name] of cases) {
      expect(toGtk(parse(`Mod+${key}`)), key).toBe(`<Control>${name}`)
    }
  })
})

describe('toWinUI', () => {
  it('maps to VirtualKey and VirtualKeyModifiers', () => {
    expect(toWinUI(parse('Mod+N'))).toEqual({ key: 78, modifiers: 1 })
    expect(toWinUI(parse('Meta+Q'))).toEqual({ key: 81, modifiers: 8 })
    expect(toWinUI(parse('Ctrl+Alt+Shift+F5'))).toEqual({ key: 116, modifiers: 7 })
    expect(toWinUI(parse('Mod+,'))).toEqual({ key: 188, modifiers: 1 })
    expect(toWinUI(parse('Mod+ArrowLeft'))).toEqual({ key: 37, modifiers: 1 })
    expect(toWinUI(parse('Mod+='))).toEqual({ key: 187, modifiers: 1 })
    expect(toWinUI(parse('Mod+Enter'))).toEqual({ key: 13, modifiers: 1 })
    expect(toWinUI(parse('Mod+0'))).toEqual({ key: 48, modifiers: 1 })
  })
})

describe('platform Mod semantics', () => {
  const parsed: ParsedAccelerator = parse('Mod+K')
  it('is Command on macOS, Control on GTK and WinUI', () => {
    expect(toAppKit(parsed).modifierMask & command).toBeTruthy()
    expect(toGtk(parsed)).toContain('<Control>')
    expect(toWinUI(parsed).modifiers & 1).toBeTruthy()
    const meta = parse('Meta+K')
    expect(toAppKit(meta).modifierMask & command).toBeTruthy()
    expect(toGtk(meta)).toContain('<Super>')
    expect(toWinUI(meta).modifiers & 8).toBeTruthy()
  })
})
