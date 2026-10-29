/** @jsxImportSource @octane-xplat/jsx */
import { expect, it, vi } from 'vitest'
import { createObjectContainer, createObjectDriver, createUniversalRoot, flushUniversalSync } from 'octane/universal/native'
import { Outline } from './Outline.macos.tsrx'

it('mounted AppKit Outline activates current items/callbacks, exposes selection, and retires work on unmount', () => {
	vi.useFakeTimers()
	const previous = Object.getOwnPropertyDescriptor(globalThis, '__xplatAppKit'), window = {}, moves: any[] = [], events: string[] = []
	const document = { frame: { size: { width: 320, height: 500 } }, flipped: true }
	const clip = { bounds: { origin: { x: 0, y: 0 }, size: { width: 320, height: 100 } }, scrollToPoint(point: any) { moves.push(point) } }
	const viewport = { window, documentView: document, contentView: clip, reflectScrolledClipView() {} }
	const heading = { window, bounds: {}, isDescendantOf: (root: unknown) => root === document, convertRectToView: () => ({ origin: { x: 0, y: 240 }, size: { width: 200, height: 20 } }) }
	Object.defineProperty(globalThis, '__xplatAppKit', { configurable: true, value: { readOutlineHeadings: () => [{ id: 'details', label: 'Details', level: 2, view: heading }] } })
	const container = createObjectContainer('nativescript'), root = createUniversalRoot(container, createObjectDriver('nativescript'))
	const items = [{ id: 'details', label: 'Details', level: 2 }]
	const render = (onNavigateStart: (id: string) => void) => flushUniversalSync(() => root.render(Outline, { items, scrollContainerRef: { current: viewport }, onNavigateStart, onNavigateEnd: (id: string) => events.push(`end:${id}`) }))
	const rows = () => { const all = (node: any): any[] => [node, ...(node.children?.flatMap(all) ?? [])]; return container.children.flatMap(all).filter((node: any) => node.props?.accessibilityRole === 'button') }
	try {
		render((id) => events.push(`old:${id}`)); const row = rows()[0]
		render((id) => events.push(`current:${id}`)); row.props.onTap(); flushUniversalSync(() => {})
		expect(moves).toEqual([{ x: 0, y: 240 }]); expect(events).toContain('current:details'); expect(events).not.toContain('old:details'); expect(rows()[0].props.accessibilityState.selected).toBe(true)
		root.unmount(); vi.runAllTimers(); expect(events.filter((event) => event === 'end:details')).toHaveLength(1)
	} finally { root.unmount(); vi.useRealTimers(); if (previous) Object.defineProperty(globalThis, '__xplatAppKit', previous); else Reflect.deleteProperty(globalThis, '__xplatAppKit') }
})
