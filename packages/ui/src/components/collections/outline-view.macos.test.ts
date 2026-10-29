import { describe, expect, it } from 'vitest'
import { getOutlineFromViewCapabilities } from './outline-view.macos.tsrx'
import { appKitOutlineRoot, createAppKitOutlineSnapshot } from './outline-snapshot.macos'

describe('AppKit outline snapshots (source cases)', () => {
	it('reports only an installed renderer reader as snapshot-capable', () => {
		const original = Object.getOwnPropertyDescriptor(globalThis, '__xplatAppKit')
		try {
			Object.defineProperty(globalThis, '__xplatAppKit', { configurable: true, value: {} }); expect(getOutlineFromViewCapabilities()).toEqual({ isSupported: false, mode: 'unsupported' })
			Object.defineProperty(globalThis, '__xplatAppKit', { configurable: true, value: { readOutlineHeadings() { return [] } } }); expect(getOutlineFromViewCapabilities()).toEqual({ isSupported: true, mode: 'snapshot' })
		} finally { if (original) Object.defineProperty(globalThis, '__xplatAppKit', original); else Reflect.deleteProperty(globalThis, '__xplatAppKit') }
	})
	it('unwraps native roots, refs and portable scroll handles without inventing a root', () => {
		const view = {}; expect(appKitOutlineRoot(view)).toBe(view); expect(appKitOutlineRoot({ current: view })).toBe(view); expect(appKitOutlineRoot({ current: { native: view } })).toBe(view)
		expect(appKitOutlineRoot({ current: null })).toBeNull(); expect(appKitOutlineRoot(undefined)).toBeNull()
	})
	it('keeps snapshot identity per root/reader, reserves authored IDs and rereads only after root replacement', () => {
		let calls = 0, label = 'Intro'; const root = {}, reader = () => { calls++; return [{ id: '', label, level: 1 }, { id: 'intro', label: 'Explicit intro', level: 2 }, { id: '', label: 'Intro', level: 3 }, { id: 'intro', label: 'Duplicate authored ID', level: 4 }] }
		const snapshot = createAppKitOutlineSnapshot(), first = snapshot.read(root, reader)
		expect(first.map((item) => item.id)).toEqual(['intro-1', 'intro', 'intro-2']); label = 'Changed'; expect(snapshot.read(root, reader)).toBe(first); expect(calls).toBe(1)
		expect(snapshot.read({}, reader)[0].label).toBe('Changed'); expect(calls).toBe(2); expect(snapshot.read(root, () => [{ id: 'new-reader', label: 'New bridge', level: 2 }])[0].id).toBe('new-reader'); expect(snapshot.read(null, reader)).toEqual([])
	})
})
