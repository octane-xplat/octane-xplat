// @vitest-environment jsdom
import { act, createRoot } from 'octane'
import { afterEach, expect, it, vi } from 'vitest'
import { VirtualList } from './VirtualList.web.tsrx'
import { VirtualListSizeIndex } from './virtual-list-layout'
import type { VirtualListHandle } from './props'

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

it('repositions measured cells even when every row remains visible', () => {
	let deliver: ResizeObserverCallback
	vi.stubGlobal('ResizeObserver', class {
		constructor(callback: ResizeObserverCallback) { deliver = callback }
		observe() {}
		unobserve() {}
		disconnect() {}
	})

	const frames: FrameRequestCallback[] = []
	vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => { frames.push(callback); return frames.length })
	vi.stubGlobal('cancelAnimationFrame', () => {})
	vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(() => ({
		x: 0, y: 0, width: 100, height: 32, top: 0, bottom: 32, left: 0, right: 100, toJSON() {},
	}))

	const host = document.createElement('div')
	document.body.append(host)
	const root = createRoot(host)
	roots.push(root)
	act(() => root.render(<VirtualList items={[0, 1, 2]} keyExtractor={i => i} renderItem={i => <div>{i}</div>} />))
	const viewport = host.firstElementChild as HTMLElement
	Object.defineProperties(viewport, { clientWidth: { value: 100 }, clientHeight: { value: 200 } })
	act(() => deliver!([{ target: viewport, contentRect: { width: 100, height: 200 } } as ResizeObserverEntry], {} as ResizeObserver))
	for (let i = 0; i < 4; i++) act(() => {
		for (const callback of frames.splice(0)) callback(0)
	})

	const body = host.querySelector('.vx-virtual-list-body') as HTMLElement
	expect(body.style.height).toBe('96px')
	expect([...host.querySelectorAll<HTMLElement>('.vx-virtual-list-row')].map(node => node.style.top)).toEqual(['0px', '32px', '64px'])
})

it('scrolls to a pixel offset through the imperative handle and clears it on unmount', async () => {
	let deliver: ResizeObserverCallback
	vi.stubGlobal('ResizeObserver', class {
		constructor(callback: ResizeObserverCallback) { deliver = callback }
		observe() {}
		unobserve() {}
		disconnect() {}
	})

	const frames: FrameRequestCallback[] = []
	vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
		frames.push(callback)
		return frames.length
	})

	vi.stubGlobal('cancelAnimationFrame', () => {})
	vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(() => ({
		x: 0, y: 0, width: 100, height: 48, top: 0, bottom: 48, left: 0, right: 100, toJSON() {},
	}))

	const handle: { current: VirtualListHandle | null } = { current: null }
	const host = document.createElement('div')
	document.body.append(host)
	const root = createRoot(host)
	roots.push(root)
	act(() => root.render(<VirtualList ref={handle} items={Array.from({ length: 100 }, (_, i) => i)}
		keyExtractor={(i) => i} renderItem={(i) => <div>{i}</div>} />))

	const viewport = host.firstElementChild as HTMLElement
	Object.defineProperties(viewport, { clientWidth: { value: 100 }, clientHeight: { value: 200 } })
	act(() => deliver!([{ target: viewport, contentRect: { width: 100, height: 200 } } as ResizeObserverEntry], {} as ResizeObserver))

	expect(handle.current).not.toBeNull()
	act(() => handle.current!.scrollToOffset(480))
	expect(viewport.scrollTop).toBe(480)
	for (let i = 0; i < 4; i++) act(() => {
		for (const callback of frames.splice(0)) callback(0)
	})

	const rows = [...host.querySelectorAll('.vx-virtual-list-item')].map((node) => node.textContent)
	expect(rows).toContain('12')
	expect(rows).not.toContain('0')
	act(() => root.unmount())
	expect(handle.current).toBeNull()
})
