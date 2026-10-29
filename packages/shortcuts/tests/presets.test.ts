import {
	chromeBrowserShortcuts,
	commonBrowserShortcuts,
	edgeBrowserShortcuts,
	firefoxBrowserShortcuts,
	linuxOsShortcuts,
	macOsShortcuts,
	safariBrowserShortcuts,
	windowsOsShortcuts,
} from '../src/index.web'
import { compileBlocklist } from '../src/engine/blocklists/compileBlocklist'

function combos(entries: readonly { combo: string }[]): string[] {
	return entries.map((entry) => entry.combo)
}

describe('blocklist presets', () => {
	it('tags common and browser-specific entries with their source metadata', () => {
		expect(commonBrowserShortcuts.length).toBeGreaterThan(0)
		expect(commonBrowserShortcuts.every((entry) => entry.category === 'browser')).toBe(true)
		expect(chromeBrowserShortcuts.every((entry) => entry.browser === 'chrome')).toBe(true)
		expect(edgeBrowserShortcuts.every((entry) => entry.browser === 'edge')).toBe(true)
		expect(firefoxBrowserShortcuts.every((entry) => entry.browser === 'firefox')).toBe(true)
		expect(safariBrowserShortcuts.every((entry) => entry.browser === 'safari')).toBe(true)
	})

	it('covers the shared browser actions and browser-specific reservations', () => {
		expect(combos(commonBrowserShortcuts)).toEqual(
			expect.arrayContaining(['Mod+F', 'Mod+P', 'Mod+S', 'Mod+O', 'Mod+0', 'Mod+-']),
		)
		expect(combos(commonBrowserShortcuts)).not.toContain('Mod+Shift+N')
		expect(combos(chromeBrowserShortcuts)).toEqual(
			expect.arrayContaining(['Ctrl+Shift+N', 'Ctrl+Shift+J', 'Meta+Option+I']),
		)
		expect(combos(edgeBrowserShortcuts)).toEqual(
			expect.arrayContaining(['Ctrl+Shift+N', 'Ctrl+Shift+K', 'Meta+Shift+C']),
		)
		expect(combos(firefoxBrowserShortcuts)).toEqual(
			expect.arrayContaining(['Ctrl+Shift+P', 'Ctrl+Shift+A', 'Meta+Option+K']),
		)
		expect(combos(safariBrowserShortcuts)).toEqual(
			expect.arrayContaining(['Meta+Shift+N', 'Meta+Control+1', 'Meta+Shift+D']),
		)
	})

	it('tags operating-system presets by platform', () => {
		expect(
			macOsShortcuts.every((entry) => entry.category === 'os' && entry.platform === 'mac'),
		).toBe(true)
		expect(
			windowsOsShortcuts.every((entry) => entry.category === 'os' && entry.platform === 'windows'),
		).toBe(true)
		expect(
			linuxOsShortcuts.every((entry) => entry.category === 'os' && entry.platform === 'linux'),
		).toBe(true)
	})

	it('keeps every preset entry parseable on every supported platform', () => {
		const entries = [
			...commonBrowserShortcuts,
			...chromeBrowserShortcuts,
			...edgeBrowserShortcuts,
			...firefoxBrowserShortcuts,
			...safariBrowserShortcuts,
			...linuxOsShortcuts,
			...macOsShortcuts,
			...windowsOsShortcuts,
		]

		for (const platform of ['mac', 'windows', 'linux', 'other'] as const) {
			expect(() => compileBlocklist(entries, platform)).not.toThrow()
		}

		const unscopedEntries = entries.map((entry) => ({ ...entry, platform: undefined }))
		expect(() => compileBlocklist(unscopedEntries, 'other')).not.toThrow()
	})
})
