// @vitest-environment jsdom
import { act, createRoot } from 'octane'
import { afterEach, expect, it, vi } from 'vitest'
import { VirtualList } from './VirtualList.web.tsrx'
import { VirtualListSizeIndex } from './virtual-list-layout'

const roots: ReturnType<typeof createRoot>[] = []
afterEach(() => {
	for (const root of roots.splice(0)) act(() => root.unmount())
	document.body.innerHTML = ''
	vi.restoreAllMocks()
	vi.unstubAllGlobals()
})

it('keeps resize measurements immediate but defers estimate renders beyond microtasks', async () => {
	let deliver: ResizeObserverCallback
	const observed = new Set<Element>()
	vi.stubGlobal('ResizeObserver', class {
		constructor(callback: ResizeObserverCallback) { deliver = callback }
		observe(node: Element) { observed.add(node) }
		unobserve(node: Element) { observed.delete(node) }
		disconnect() { observed.clear() }
	})

	let nextFrame = 0
	const frames = new Map<number, FrameRequestCallback>()
	vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
		frames.set(++nextFrame, callback)
		return nextFrame
	})

	const cancelFrame = vi.fn((id: number) => frames.delete(id))
	vi.stubGlobal('cancelAnimationFrame', cancelFrame)
	vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(() => ({
		x: 0, y: 0, width: 100, height: 60, top: 0, bottom: 60, left: 0, right: 100,
		toJSON() {},
	}))

	const reset = vi.spyOn(VirtualListSizeIndex.prototype, 'reset')
	const set = vi.spyOn(VirtualListSizeIndex.prototype, 'set')
	const host = document.createElement('div')
	document.body.append(host)
	const root = createRoot(host)
	roots.push(root)
	act(() => root.render(<VirtualList items={Array.from({ length: 100 }, (_, i) => i)}
		keyExtractor={(i) => i} renderItem={(i) => <div>{i}</div>} />))

	const flushFrame = () => act(() => {
		const pending = [...frames.values()]
		frames.clear()
		for (const callback of pending) callback(0)
	})

	// Establish the viewport and mounted rows before testing row delivery.
	const viewport = host.firstElementChild as HTMLElement
	Object.defineProperties(viewport, { clientWidth: { value: 100 }, clientHeight: { value: 200 } })
	const record = (target: Element) => ({ target, contentRect: { width: 100, height: 60 } }) as ResizeObserverEntry
	act(() => deliver!([record(viewport)], {} as ResizeObserver))
	flushFrame()
	flushFrame()
	reset.mockClear()
	set.mockClear()
	act(() => deliver!([...observed].filter(node => node !== viewport).map(record), {} as ResizeObserver))
	expect(set).toHaveBeenCalled()
	const before = host.innerHTML
	await Promise.resolve()
	expect(reset).not.toHaveBeenCalled()
	expect(host.innerHTML).toBe(before)
	flushFrame()
	expect(reset).toHaveBeenCalledTimes(1)
	// Disposal must cancel both estimate and window work.
	act(() => deliver!([...observed].filter(node => node !== viewport).map(record), {} as ResizeObserver))
	expect(frames.size).toBeGreaterThan(0)
	act(() => root.unmount())
	await Promise.resolve()
	expect(cancelFrame).toHaveBeenCalled()
	const rebuilds = reset.mock.calls.length
	flushFrame()
	expect(reset).toHaveBeenCalledTimes(rebuilds)
})
