/** @jsxImportSource @nativescript-community/octane */
import { describe, expect, it, vi } from 'vitest'
import { createObjectContainer, createObjectDriver, createUniversalRoot, flushUniversalSync } from 'octane/universal/native'
import { ScrollableArea } from './ScrollableArea.macos.tsrx'
import { useScrollableArea } from './use-scrollable-area.macos.tsrx'
import { scrollableAreaState } from './scrollable-area-state'
import type { UseScrollableAreaResult } from './props'

function geometry(flipped = false) {
	return {
		contentView: { bounds: { origin: { x: 0, y: 300 }, size: { width: 100, height: 100 } } },
		documentView: { frame: { size: { width: 300, height: 400 } }, isFlipped: () => flipped },
	}
}

function fixture(Component: any, props: any, peer = geometry()) {
	const container = createObjectContainer('nativescript')
	const driver = createObjectDriver('nativescript')
	const instance = driver.getPublicInstance.bind(driver)
	driver.getPublicInstance = (container, id) => {
		const host: any = instance(container, id)
		if (host.type === 'scrollview') Object.assign(host, peer)
		return host
	}

	const root = createUniversalRoot(container, driver)
	const render = (props: any) => flushUniversalSync(() => root.render(Component, props))
	render(props)
	return { root, container, render, peer, host: container.children[0] }
}

describe('AppKit ScrollableArea viewport contract (object driver)', () => {
	it('replaces object and callback refs without replacing the viewport, and clears them', () => {
		const object = { current: null as any }
		const callback = vi.fn()
		const next = { current: null as any }
		const fx = fixture(ScrollableArea, { ref: object })
		try {
			expect(object.current.native).toBe(fx.host)
			expect(fx.host.props.orientation).toBe('vertical')
			fx.render({ ref: callback, axis: 'inline' })
			expect(object.current).toBeNull()
			expect(callback).toHaveBeenCalledTimes(1)
			expect(callback.mock.calls[0][0].native).toBe(fx.host)
			expect(fx.host.props.orientation).toBe('horizontal')
			fx.render({ ref: callback, axis: 'both' })
			expect(callback).toHaveBeenCalledTimes(1)
			expect(fx.host.props.orientation).toBe('both')
			fx.render({ ref: next })
			expect(callback.mock.calls.at(-1)).toEqual([null])
			expect(next.current.native).toBe(fx.host)
		} finally { fx.root.unmount() }

		expect(next.current).toBeNull()
	})

	it('scrolls each axis through the portable handle', () => {
		const handle = { current: null as any }
		const calls: { x: number; y: number }[] = []
		const fx = fixture(ScrollableArea, { ref: handle }, {
			contentView: {
				bounds: { origin: { x: 0, y: 300 }, size: { width: 100, height: 100 } },
				scrollToPoint: (point: { x: number; y: number }) => { calls.push(point) },
			},
			documentView: { frame: { size: { width: 300, height: 400 } }, isFlipped: () => false },
			reflectScrolledClipView: vi.fn(),
		})

		try {
			handle.current.scrollToOffset({ block: 50 })
			expect(calls).toEqual([{ x: 0, y: 250 }])
			// Inline-only: the block offset keeps its clip origin (300 ⇒ top 0).
			handle.current.scrollToOffset({ inline: 40 })
			expect(calls).toEqual([{ x: 0, y: 250 }, { x: 40, y: 300 }])
		} finally { fx.root.unmount() }
	})

	it('honors callback cleanup refs when replaced and unmounted', () => {
		const cleanup = vi.fn()
		const callback = vi.fn(() => cleanup)
		const next = vi.fn()
		const fx = fixture(ScrollableArea, { ref: callback })
		fx.render({ ref: next })
		expect(cleanup).toHaveBeenCalledTimes(1)
		expect(callback).toHaveBeenCalledTimes(1)
		fx.root.unmount()
		expect(next.mock.calls.at(-1)).toEqual([null])
	})
})

let area: UseScrollableAreaResult
let deliveredState: UseScrollableAreaResult["state"]
function Headless(props: any) @{
	area = useScrollableArea({ axis: props.axis })

	<scrollview {...area.getViewportProps({ ref: props.ref, onScroll: props.onScroll, onLayoutChanged: props.onLayoutChanged })}>
		<masonview display="flex" {...area.getContentProps({ onLayoutChanged: props.onContentLayoutChanged })} />
	</scrollview>
}

describe('AppKit headless scroll geometry and event composition', () => {
	it('measures initial layout, viewport/content resizing and axis changes without scroll input', () => {
		const fx = fixture(Headless, {})
		try {
			expect(area.state.inline).toEqual({ isScrollable: false, atStart: true, atEnd: true })
			expect(area.state.block).toEqual({ isScrollable: true, atStart: true, atEnd: false })
			fx.render({ axis: 'both' })
			expect(area.state.inline.isScrollable).toBe(true)
			fx.peer.contentView.bounds.origin = { x: 90, y: 200 }
			flushUniversalSync(() => fx.container.dispatchEvent(fx.host, 'scroll', { verticalOffset: 200, viewportHeight: 100, contentHeight: 400 }))
			expect(area.state.inline.atStart).toBe(false)
			expect(area.state.block.atStart).toBe(false)
			fx.peer.contentView.bounds.size = { width: 500, height: 500 }
			flushUniversalSync(() => fx.container.dispatchEvent(fx.host, 'layoutChanged', { width: 500, height: 500 }))
			expect(area.state.inline).toEqual({ isScrollable: false, atStart: true, atEnd: true })
			expect(area.state.block).toEqual(area.state.inline)
			fx.peer.documentView.frame.size = { width: 800, height: 900 }
			flushUniversalSync(() => fx.container.dispatchEvent(fx.host.children[0], 'layoutChanged', {}))
			expect(area.state.inline.isScrollable).toBe(true)
			expect(area.state.block.isScrollable).toBe(true)
			fx.render({ axis: 'inline' })
			expect(area.state.block).toEqual({ isScrollable: false, atStart: true, atEnd: true })
			fx.render({})
			expect(area.state.inline.isScrollable).toBe(false)
			expect(area.state.block.isScrollable).toBe(true)
		} finally { fx.root.unmount() }
	})

	it('uses the latest caller once, keeps the original event, and updates state first', () => {
		const first = vi.fn()
		const latest = vi.fn(() => { deliveredState = area.state })
		const layout = vi.fn()
		const fx = fixture(Headless, { axis: 'both', onScroll: first })
		try {
			const handler = fx.host.props.onScroll
			fx.render({ axis: 'both', onScroll: latest, onLayoutChanged: layout })
			expect(fx.host.props.onScroll).toBe(handler)
			fx.peer.contentView.bounds.origin = { x: 200, y: 0 }
			const event = { verticalOffset: 0, viewportHeight: 100, contentHeight: 400 }
			flushUniversalSync(() => fx.container.dispatchEvent(fx.host, 'scroll', event))
			expect(first).not.toHaveBeenCalled()
			expect(latest).toHaveBeenCalledExactlyOnceWith(event)
			expect(deliveredState.inline.atEnd).toBe(true)
			expect(deliveredState.block.atEnd).toBe(true)
			expect(area.state.inline.atEnd).toBe(true)
			expect(area.state.block.atEnd).toBe(true)
			flushUniversalSync(() => fx.container.dispatchEvent(fx.host, 'layoutChanged', {}))
			expect(layout).toHaveBeenCalledTimes(1)
			expect(latest).toHaveBeenCalledTimes(1)
			fx.render({ axis: 'both' })
			flushUniversalSync(() => fx.container.dispatchEvent(fx.host, 'scroll', event))
			expect(latest).toHaveBeenCalledTimes(1)
		} finally { fx.root.unmount() }
	})

	it('normalizes flipped documents and elastic offsets in points', () => {
		const peer = geometry(true)
		peer.contentView.bounds.origin = { x: -20, y: -25 }
		const fx = fixture(Headless, { axis: 'both' }, peer)
		try {
			expect(area.state.inline.atStart).toBe(true)
			expect(area.state.block.atStart).toBe(true)
			peer.contentView.bounds.origin = { x: 220, y: 350 }
			flushUniversalSync(() => fx.container.dispatchEvent(fx.host, 'scroll', {}))
			expect(area.state.inline.atEnd).toBe(true)
			expect(area.state.block.atEnd).toBe(true)
		} finally { fx.root.unmount() }
	})

	it('treats empty, fitting, sub-unit and invalid ranges as both edges', () => {
		for (const max of [0, -1, 0.75, Number.NaN, Infinity]) {
			const state = scrollableAreaState('both', max, 20, max, -20)
			expect(state.inline).toEqual({ isScrollable: false, atStart: true, atEnd: true })
			expect(state.block).toEqual(state.inline)
		}
	})
})
