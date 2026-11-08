import { describe, expect, it } from 'vitest'

import { linuxKeysym, macKeyCode, parseAccelerator, windowsKeyMapping } from '../src/accelerator'

const ok = (input: string, platform?: 'mac' | 'windows' | 'linux') => {
	const result = parseAccelerator(input, platform ? { platform } : undefined)
	if (!result.ok) throw new Error(result.error.message)
	return result.accelerator
}

const bad = (input: string, platform?: 'mac' | 'windows' | 'linux') => {
	const result = parseAccelerator(input, platform ? { platform } : undefined)
	if (result.ok) throw new Error(`expected ${input} to be rejected`)
	return result.error
}

describe('parseAccelerator', () => {
	it('normalizes modifiers to canonical order and case', () => {
		const accelerator = ok('shift+ctrl+keyk', 'windows')
		expect(accelerator).toMatchObject({ ctrl: true, shift: true, alt: false, meta: false })
		expect(accelerator.code).toBe('KeyK')
		expect(accelerator.text).toBe('Ctrl+Shift+KeyK')
	})

	it('normalizes key codes case-insensitively', () => {
		expect(ok('ctrl+alt+keyk', 'mac').code).toBe('KeyK')
		expect(ok('ctrl+digit1', 'mac').text).toBe('Ctrl+Digit1')
		expect(ok('ctrl+F5', 'mac').text).toBe('Ctrl+F5')
	})

	it('resolves Mod by platform', () => {
		expect(ok('Mod+KeyK', 'mac')).toMatchObject({ meta: true, ctrl: false })
		expect(ok('Mod+KeyK', 'windows')).toMatchObject({ ctrl: true, meta: false })
		expect(ok('Mod+KeyK', 'linux')).toMatchObject({ ctrl: true, meta: false })
	})

	it('accepts modifier aliases', () => {
		expect(ok('command+space', 'mac').meta).toBe(true)
		expect(ok('cmd+space', 'mac').meta).toBe(true)
		expect(ok('option+keyp', 'mac').alt).toBe(true)
		expect(ok('control+keyp', 'mac').ctrl).toBe(true)
		expect(ok('super+keyp', 'linux').meta).toBe(true)
		expect(ok('win+keyp', 'windows').meta).toBe(true)
	})

	it('rejects single letters and digits with a physical-code hint', () => {
		const error = bad('k', 'mac')
		expect(error.code).toBe('invalid-accelerator')
		expect(error.message).toContain('KeyK')
		expect(bad('5', 'mac').code).toBe('invalid-accelerator')
	})

	it('requires Ctrl, Alt or Meta', () => {
		expect(bad('Shift+KeyK', 'mac').code).toBe('invalid-accelerator')
		expect(bad('KeyK', 'mac').code).toBe('invalid-accelerator')
		expect(bad('Shift+Space', 'windows').code).toBe('invalid-accelerator')
	})

	it('allows bare F13–F24 but not F1–F12', () => {
		expect(ok('F13', 'windows').text).toBe('F13')
		expect(ok('F24', 'windows').text).toBe('F24')
		expect(bad('F12', 'windows').code).toBe('invalid-accelerator')
		expect(bad('F1', 'linux').code).toBe('invalid-accelerator')
	})

	it('rejects duplicate and unknown tokens', () => {
		expect(bad('ctrl+ctrl+keyk', 'mac').code).toBe('invalid-accelerator')
		expect(bad('ctrl+mod+keyk', 'windows').code).toBe('invalid-accelerator')
		expect(bad('ctrl+what', 'mac').code).toBe('invalid-accelerator')
		expect(bad('', 'mac').code).toBe('invalid-accelerator')
		expect(bad('   ', 'mac').code).toBe('invalid-accelerator')
	})

	it('rejects more than one key', () => {
		expect(bad('ctrl+keyk+keyj', 'mac').code).toBe('invalid-accelerator')
		expect(bad('ctrl+keyk+space', 'mac').code).toBe('invalid-accelerator')
	})

	it('rejects keys unmappable on the target platform', () => {
		// F21–F24 have no Carbon virtual key.
		expect(bad('F21', 'mac').code).toBe('invalid-accelerator')
		expect(bad('Insert', 'mac').code).toBe('invalid-accelerator')
		// NumpadEnter shares VK_RETURN on Windows and cannot be distinguished.
		expect(bad('Ctrl+Alt+NumpadEnter', 'windows').code).toBe('invalid-accelerator')
		expect(ok('Ctrl+Alt+NumpadEnter', 'mac').code).toBe('NumpadEnter')
		expect(ok('Ctrl+Alt+NumpadEnter', 'linux').code).toBe('NumpadEnter')
	})
})

describe('platform key tables', () => {
	it('maps letters to Carbon virtual keys', () => {
		expect(macKeyCode('KeyA')).toBe(0x00)
		expect(macKeyCode('KeyK')).toBe(0x28)
		expect(macKeyCode('Space')).toBe(0x31)
		expect(macKeyCode('F13')).toBe(0x69)
		expect(macKeyCode('F21')).toBeNull()
	})

	it('maps letters and digits to scan codes, others to fixed VKs', () => {
		expect(windowsKeyMapping('KeyK')).toEqual({ scan: 0x25 })
		expect(windowsKeyMapping('Digit1')).toEqual({ scan: 0x02 })
		expect(windowsKeyMapping('F5')).toEqual({ vk: 0x74 })
		expect(windowsKeyMapping('Space')).toEqual({ vk: 0x20 })
		expect(windowsKeyMapping('NumpadEnter')).toBeNull()
	})

	it('maps codes to X11 keysyms for portal triggers', () => {
		expect(linuxKeysym('KeyK')).toBe('k')
		expect(linuxKeysym('F5')).toBe('F5')
		expect(linuxKeysym('Enter')).toBe('Return')
		expect(linuxKeysym('ArrowUp')).toBe('Up')
		expect(linuxKeysym('NumpadEnter')).toBe('KP_Enter')
	})
})
