/** @jsxImportSource @octane-xplat/jsx */
import { afterEach, expect, it, vi } from 'vitest'
import { createObjectContainer, createObjectDriver, createUniversalRoot, flushUniversalSync } from 'octane/universal/native'
import { Carousel } from './Carousel.macos.tsrx'
afterEach(() => vi.unstubAllGlobals())
function mount(extra: any = {}) {
	const container = createObjectContainer('nativescript'), root = createUniversalRoot(container, createObjectDriver('nativescript'))
	const window = {}, observers = new Map<any, any>(), writes: any[] = [], animated: any[] = [], ref = { current: null as any }
	vi.stubGlobal('NSNotificationCenter', { defaultCenter: {
		addObserverForNameObjectQueueUsingBlock(_: any, __: any, ___: any, callback: any) { const token = {}; observers.set(token, callback); return token }, removeObserver(token: any) { observers.delete(token) },
	} })
	vi.stubGlobal('NSWorkspace', { sharedWorkspace: { accessibilityDisplayShouldReduceMotion: false } })
	function Fixture(props: any) { return <Carousel {...props}>{props.values.map((value: string) => <label key={value} text={value} />)}</Carousel> }
	const base = { id: 'gallery', label: 'Attachments', hasButtons: true, variant: 'proportional', values: ['a', 'b', 'c'], ref, ...extra }
	const all = (): any[] => { const walk = (node: any): any[] => [node, ...(node.children?.flatMap(walk) ?? [])]; return container.children.flatMap(walk) }
	const has = (node: any, name: string) => String(node.props?.className).split(' ').includes(name)
	const one = (name: string) => all().find((node) => has(node, name))
	const slides = () => all().filter((node) => has(node, 'vx-carousel-slide'))
	const clip: any = { bounds: { origin: { x: 0, y: 37 }, size: { width: 100, height: 60 } }, scrollToPoint(point: any) {
		writes.push(point); clip.bounds.origin = point; one('vx-carousel-viewport')?.props.onScroll()
	}, animator() { return { scrollToPoint: (point: any) => { animated.push(point); clip.scrollToPoint(point) } } } }
	const document: any = { frame: { size: { width: 316, height: 97 } }, flipped: false }
	const hydrate = () => {
		for (const node of all()) node.window = window
		const scroll = one('vx-carousel-viewport'); if (!scroll) return
		scroll.contentView = clip; scroll.documentView = document; scroll.reflectScrolledClipView = () => {}
		document.frame.size.width = Math.max(clip.bounds.size.width, slides().length * clip.bounds.size.width + Math.max(0, slides().length - 1) * 8)
		for (const [i, node] of slides().entries()) {
			node.bounds = { size: { width: clip.bounds.size.width } }; node.isDescendantOf = (target: any) => target === document
			node.convertRectToView = () => ({ origin: { x: i * (clip.bounds.size.width + 8) }, size: { width: clip.bounds.size.width } })
		}
	}
	const flush = () => { flushUniversalSync(() => {}); hydrate() }
	const render = (props: any) => { root.render(Fixture, props); flush() }
	const notify = () => { for (const callback of observers.values()) callback({ object: window }); flush() }
	render(base)
	return { root, base, ref, one, slides, clip, document, observers, writes, animated, render, flush, notify }
}
it('delivers the handle and buttons, measures proportional slides, and updates enabled state after native scroll events', async () => {
	const f = mount()
	try {
		await vi.waitFor(() => { f.flush(); expect(f.slides()[0].props.style.width).toBe(100); expect(f.ref.current.canScrollNext()).toBe(true) })
		expect(f.one('vx-carousel').type).toBe('masonview'); expect(f.one('vx-carousel').props.accessibilityLabel).toBe('Attachments')
		expect(f.one('vx-carousel-viewport').props.orientation).toBe('horizontal'); expect(f.one('vx-carousel-track').props.style.width).toBe(316)
		expect(f.one('vx-carousel-prev').props.disabled).toBe(true); f.one('vx-carousel-next').props.onTap(); f.flush()
		expect(f.clip.bounds.origin).toEqual({ x: 100, y: 37 }); expect(f.one('vx-carousel-prev').props.disabled).toBe(false)
		f.ref.current.scrollTo(2); f.flush(); expect(f.clip.bounds.origin.x).toBe(216); expect(f.one('vx-carousel-next').props.disabled).toBe(true)
		expect(f.slides().map((node) => node.props.accessibilityLabel)).toEqual(['Slide 1 of 3', 'Slide 2 of 3', 'Slide 3 of 3'])
	} finally { f.root.unmount() }
})
it('current loop/children metadata controls wrapping and disables navigation when empty', async () => {
	const f = mount({ hasLoop: true })
	try {
		await vi.waitFor(() => { f.flush(); expect(f.one('vx-carousel-prev').props.disabled).toBe(false) })
		f.one('vx-carousel-prev').props.onTap(); f.flush(); expect(f.clip.bounds.origin.x).toBe(216)
		f.one('vx-carousel-next').props.onTap(); f.flush(); expect(f.clip.bounds.origin.x).toBe(0)
		f.render({ ...f.base, values: [] }); await vi.waitFor(() => { f.flush(); expect(f.one('vx-carousel-next').props.disabled).toBe(true) })
		expect(f.ref.current.canScrollNext()).toBe(false); expect(f.slides()).toHaveLength(0)
	} finally { f.root.unmount() }
})
it('resize/ref replacement and reduced-motion requests use current hosts; observer and held handles release on teardown', async () => {
	const f = mount(), next = { current: null as any }
	let held: any
	try {
		await vi.waitFor(() => { f.flush(); expect(f.slides()[0].props.style.width).toBe(100) })
		held = f.ref.current; f.render({ ...f.base, ref: next }); expect(f.ref.current).toBe(null); expect(next.current).toBe(held)
		f.clip.bounds.size.width = 140; f.notify(); await vi.waitFor(() => { f.flush(); expect(f.slides()[0].props.style.width).toBe(140) })
		vi.stubGlobal('NSWorkspace', { sharedWorkspace: { accessibilityDisplayShouldReduceMotion: () => true } })
		const before = f.animated.length; held.scrollNext(); f.flush(); expect(f.animated).toHaveLength(before)
		f.one('vx-carousel-viewport').window = null; expect(held.canScrollNext()).toBe(false)
		f.notify(); expect(f.one('vx-carousel-next').props.disabled).toBe(true)
	} finally { f.root.unmount() }
	const before = f.writes.length; held.scrollNext(); held.scrollPrev(); held.scrollTo(0)
	expect(f.writes).toHaveLength(before); expect(next.current).toBe(null); expect(f.observers.size).toBe(0)
})
