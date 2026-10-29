import { afterEach, describe, expect, it, vi } from 'vitest'
import { bindSegmentedControlKeys } from './segmented-control-keys.macos'
import type { AppKitSegment } from './segmented-control-keys.macos'

afterEach(() => vi.unstubAllGlobals())

function fixture() {
	let monitor!: (event: any) => any
	const removeMonitor = vi.fn()
	vi.stubGlobal('NSEvent', {
		addLocalMonitorForEventsMatchingMaskHandler: (_mask: number, callback: typeof monitor) => {
			monitor = callback
			return 'segment-monitor'
		},
		removeMonitor,
	})
	const selected: string[] = []
	const owner: any = { firstResponder: null }
	owner.makeFirstResponder = vi.fn((view) => { owner.firstResponder = view; return true })
	const rows = ['a', 'b', 'c'].map((value) => ({ value, subviews: { count: 0 }, window: owner }))
	let children = rows.slice()
	const root = { window: owner, subviews: { count: 3, objectAtIndex: (index: number) => children[index] } }
	const segments = new Map<NSView, () => AppKitSegment>()
	const disabled = new Set(['b'])
	for (const row of rows) {
		segments.set(row as unknown as NSView, () => ({
			view: row as unknown as NSView,
			value: row.value,
			disabled: disabled.has(row.value),
			select: () => selected.push(row.value),
		}))
	}
	owner.firstResponder = rows[0]
	let direction: 'ltr' | 'rtl' = 'ltr'
	const off = bindSegmentedControlKeys(() => root as unknown as NSView, segments, () => direction)
	const key = (keyCode: number, window = owner, modifierFlags = 0) => monitor({ keyCode, window, modifierFlags })
	return { rows, owner, off, key, selected, removeMonitor, disabled, rtl: () => { direction = 'rtl' }, reorder: () => { children = [rows[2], rows[1], rows[0]] } }
}

describe('AppKit segmented key adapter', () => {
	it('skips disabled segments, wraps and supports Home/End', () => {
		const env = fixture()
		expect(env.key(124)).toBeNull()
		expect(env.selected).toEqual(['c'])
		expect(env.key(124)).toBeNull()
		expect(env.selected).toEqual(['c', 'a'])
		env.key(119)
		env.key(115)
		expect(env.selected).toEqual(['c', 'a', 'c', 'a'])
		env.off()
		expect(env.removeMonitor).toHaveBeenCalledWith('segment-monitor')
	})

	it('reads changed disabled state and actual subview order', () => {
		const env = fixture()
		env.reorder()
		env.disabled.clear()
		env.key(123)
		expect(env.selected).toEqual(['b'])
	})

	it('preserves unrelated responders, windows, shortcuts and renderer activation', () => {
		const env = fixture()
		expect(env.key(124, {})).not.toBeNull()
		expect(env.key(124, env.owner, 1 << 20)).not.toBeNull()
		expect(env.key(36)).not.toBeNull()
		env.owner.firstResponder = {}
		expect(env.key(124)).not.toBeNull()
		expect(env.selected).toEqual([])
	})

	it('leaves the key unhandled when AppKit refuses focus', () => {
		const env = fixture()
		env.owner.makeFirstResponder.mockReturnValue(false)
		expect(env.key(124)).not.toBeNull()
		expect(env.selected).toEqual([])
	})

	it('reverses horizontal navigation in RTL without reversing vertical keys', () => {
		const env = fixture()
		env.disabled.clear()
		env.rtl()
		env.key(124)
		expect(env.selected).toEqual(['c'])
		env.key(125)
		expect(env.selected).toEqual(['c', 'a'])
	})
})
