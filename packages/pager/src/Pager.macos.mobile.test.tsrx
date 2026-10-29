/** @jsxImportSource @octane-xplat/jsx */
import { afterEach, expect, it, vi } from 'vitest'
import { createObjectContainer, createObjectDriver, createUniversalRoot, flushUniversalSync } from 'octane/universal/native'
import { InternationalizationProvider } from '../../ui/src/components/forms/InternationalizationProvider.tsrx'
import { Pager } from './Pager.macos.tsrx'
// Exercise the real AppKit viewport without selecting the mobile UI barrel in
// this package's existing native test configuration. Production resolution is a
// separate deferred gate; this mock does not establish it.
vi.mock('@octane-xplat/ui', async () => ({
	ScrollableArea: (await import('../../ui/src/components/layout/ScrollableArea.macos.tsrx')).ScrollableArea,
	useDirection: (await import('../../ui/src/internal/platform/internationalization.tsx')).useDirection,
}))
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals() })
function mount(extra: any = {}) {
	const observers = new Map<object, any>(), writes: any[] = [], animations: any[] = [], changes: number[] = [], window = {}
	vi.stubGlobal('NSNotificationCenter', { defaultCenter: {
		addObserverForNameObjectQueueUsingBlock(name: string, object: any, _: any, callback: any) { const token = {}; observers.set(token, { name, object, callback }); return token },
		removeObserver(token: object) { observers.delete(token) },
	} })
	vi.stubGlobal('NSWorkspace', { sharedWorkspace: { accessibilityDisplayShouldReduceMotion: false } })
	const clip: any = { bounds: { origin: { x: 0, y: 19 }, size: { width: 100, height: 80 } },
		scrollToPoint(point: any) { writes.push(point); clip.bounds.origin = point },
		animator() { return { scrollToPoint(point: any) { animations.push(point); clip.scrollToPoint(point) } } },
	}
	const document = { frame: { size: { width: 300, height: 99 } }, flipped: false }
	const container = createObjectContainer('nativescript'), driver = createObjectDriver('nativescript'), instance = driver.getPublicInstance.bind(driver)
	driver.getPublicInstance = (container, id) => {
		const host: any = instance(container, id)
		if (host.type === 'scrollview') Object.assign(host, { window, contentView: clip, documentView: document, reflectScrolledClipView() {} })
		return host
	}
	const root = createUniversalRoot(container, driver)
	function Fixture(props: any) { return <InternationalizationProvider locale="en" dir={props.dir ?? 'ltr'}><Pager {...props} /></InternationalizationProvider> }
	const base = { id: 'pages', items: ['a', 'b', 'c'], renderItem: (item: string) => <label text={item} />, renderEmpty: () => <label text="No pages" />, onPageChange: (page: number) => changes.push(page), ...extra }
	const all = (): any[] => { const walk = (node: any): any[] => [node, ...(node.children?.flatMap(walk) ?? [])]; return container.children.flatMap(walk) }
	const one = (name: string) => all().find((node) => String(node.props?.className).split(' ').includes(name))
	const pages = () => all().filter((node) => String(node.props?.className).split(' ').includes('vx-pager-page--appkit'))
	const render = (props: any) => flushUniversalSync(() => root.render(Fixture, props))
	const emit = (name: string, object: any) => { for (const o of [...observers.values()]) if (o.name === name) o.callback({ object }); flushUniversalSync(() => {}) }
	const notify = () => emit('NSWindowDidUpdateNotification', window)
	const user = () => { emit('NSScrollViewDidLiveScrollNotification', one('vx-pager-viewport')) }
	render(base)
	return { root, base, render, one, pages, all, clip, document, observers, writes, animations, changes, notify, user }
}
it('composes real AppKit scrolling, full-host pages, metadata and default placement without mobile plugin hosts', async () => {
	const f = mount({ defaultPage: 2, accessibilityLabel: 'Travel guide', style: 'height: 80; width: 100', row: 1 })
	try {
		await vi.waitFor(() => { f.notify(); expect(f.pages()[0].props.style.width).toBe(100); expect(f.clip.bounds.origin.x).toBe(200) })
		expect(f.pages().map((node) => node.props.style.height)).toEqual([80, 80, 80])
		expect(f.one('vx-pager-track--appkit').props.style.width).toBe(300); expect(f.one('vx-pager').props.accessibilityLabel).toBe('Travel guide')
		expect(f.one('vx-pager-viewport').props.orientation).toBe('horizontal'); expect(f.clip.bounds.origin.y).toBe(19)
		expect(f.all().some((node) => String(node.type).includes('Pager'))).toBe(false); expect(f.changes).toEqual([])
	} finally { f.root.unmount() }
	expect(f.observers.size).toBe(0)
})
it('reports settled user changes once, restores rejected controlled pages, and does not echo programmatic writes', async () => {
	const f = mount({ page: 0 })
	try {
		await vi.waitFor(() => { f.notify(); expect(f.pages()[0].props.style.width).toBe(100) }); vi.useFakeTimers()
		f.clip.bounds.origin.x = 170; f.user(); await vi.advanceTimersByTimeAsync(140); f.notify()
		expect(f.changes).toEqual([2]); await vi.advanceTimersByTimeAsync(1); f.notify(); expect(f.clip.bounds.origin.x).toBe(0)
		f.render({ ...f.base, page: 1 }); f.notify(); expect(f.clip.bounds.origin.x).toBe(100); expect(f.changes).toEqual([2])
	} finally { f.root.unmount() }
})
it('current direction, resize and reduced motion update logical placement and empty content releases observers', async () => {
	const f = mount({ page: 0 })
	try {
		await vi.waitFor(() => { f.notify(); expect(f.pages()[0].props.style.width).toBe(100) })
		f.render({ ...f.base, page: 0, dir: 'rtl' }); f.notify(); expect(f.clip.bounds.origin.x).toBe(200)
		vi.stubGlobal('NSWorkspace', { sharedWorkspace: { accessibilityDisplayShouldReduceMotion: () => true } })
		const animated = f.animations.length; f.render({ ...f.base, page: 2, dir: 'rtl' }); f.notify(); expect(f.clip.bounds.origin.x).toBe(0); expect(f.animations.length).toBe(animated)
		f.clip.bounds.size.width = 140; f.document.frame.size.width = 420; f.notify()
		await vi.waitFor(() => { f.notify(); expect(f.pages()[0].props.style.width).toBe(140) })
		f.render({ ...f.base, items: [] }); await vi.waitFor(() => expect(f.observers.size).toBe(0)); expect(f.all().some((node) => node.props?.text === 'No pages')).toBe(true)
	} finally { f.root.unmount() }
})
it('unmount cancels queued user work and old viewport callbacks', async () => {
	const f = mount()
	await vi.waitFor(() => { f.notify(); expect(f.pages()[0].props.style.width).toBe(100) }); vi.useFakeTimers()
	f.clip.bounds.origin.x = 170; f.user(); const callbacks = [...f.observers.values()]
	f.root.unmount(); const writes = f.writes.length
	await vi.advanceTimersByTimeAsync(200); callbacks.forEach((o) => o.callback({ object: o.object })); expect(f.writes.length).toBe(writes); expect(f.changes).toEqual([]); expect(f.observers.size).toBe(0)
})
