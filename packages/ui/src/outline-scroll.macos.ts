import type { OutlineProps } from './props'
import { appKitOutlineEntries, appKitOutlineRoot } from './outline-snapshot.macos'
import { appKitHost } from './host-bridge'
import { scrollableAreaMetrics } from './scrollable-area-metrics.macos'
import { scrollableAreaOffset } from './scrollable-area-offset.macos'

interface Clock { set(callback: () => void, delay: number): unknown; clear(timer: unknown): void }
const clock: Clock = { set: (callback, delay) => setTimeout(callback, delay), clear: (timer) => clearTimeout(timer as ReturnType<typeof setTimeout>) }
const hidden = (view: any) => ['hidden', 'hiddenOrHasHiddenAncestor'].some((name) => {
	const value = view?.[name]; return Boolean(typeof value === 'function' ? value.call(view) : value)
})

/** Current native geometry, observer and navigation lifetime. No synthetic key
 * dispatch or handler invocation establishes OS input/scroll/AX behavior. */
export function createAppKitOutlineScroll(options: {
	props(): OutlineProps
	root(): any
	active(): string | undefined
	change(id: string): void
	reducedMotion(): boolean
}, native: () => Record<string, any> = () => globalThis, host = appKitHost, timers = clock) {
	let disposed = false, syncing = false, binding: any, releases: (() => void)[] = [], windowRelease: (() => void) | undefined
	let attempt: { id: string; geometry: any } | undefined, request = 0, timer: unknown, timerRevision = 0
	const report = (error: unknown) => console.error('[macos-outline] callback failed', error)
	const change = (id: string) => { try { options.change(id) } catch (error) { report(error) } }
	const invoke = (callback: ((id: string) => void) | undefined, id: string) => { try { callback?.(id) } catch (error) { report(error) } }
	const stopTimer = () => { timerRevision++; if (timer !== undefined) timers.clear(timer); timer = undefined }
	const finish = () => {
		const previous = attempt; attempt = undefined; stopTimer()
		if (previous) invoke(options.props().onNavigateEnd, previous.id)
	}
	const scroller = (): any => {
		const ref = options.props().scrollContainerRef
		if (ref !== undefined) return appKitOutlineRoot(ref)
		const root = options.root()
		if (root?.enclosingScrollView) return root.enclosingScrollView
		for (let view = root?.superview; view; view = view.superview) if (view.contentView && view.documentView) return view
		return null
	}
	const geometry = () => {
		const view = scroller(), clip = view?.contentView, document = view?.documentView, window = view?.window
		if (!window || !clip || !document || hidden(view)) return null
		const metrics = scrollableAreaMetrics(view), width = Number(clip.bounds?.size?.width), height = Number(clip.bounds?.size?.height), contentHeight = Number(document.frame?.size?.height)
		if (![width, height, contentHeight, metrics.y, metrics.maxY].every(Number.isFinite) || width <= 0 || height <= 0 || contentHeight < 0) return null
		return { view, clip, document, window, contentHeight, y: metrics.y }
	}
	const same = (left: any, right: any) => left && right && left.view === right.view && left.clip === right.clip && left.document === right.document && left.window === right.window
	const headings = (current: NonNullable<ReturnType<typeof geometry>>) => {
		const reader = host()?.readOutlineHeadings
		if (typeof reader !== 'function') return []
		return appKitOutlineEntries(reader(current.document)).flatMap((item) => {
			const view = item.view as any
			if (!view || view.window !== current.window || hidden(view) || typeof view.convertRectToView !== 'function' || typeof view.isDescendantOf !== 'function' || !view.isDescendantOf(current.document)) return []
			if (view.enclosingScrollView && view.enclosingScrollView !== current.view) return []
			const rect = view.convertRectToView(view.bounds, current.document), y = Number(rect?.origin?.y), height = Number(rect?.size?.height)
			if (!Number.isFinite(y) || !Number.isFinite(height) || height <= 0) return []
			return [{ ...item, top: current.document.flipped ? y : current.contentHeight - y - height }]
		})
	}
	const spy = () => {
		if (disposed || attempt || options.props().activeId !== undefined) return
		const current = geometry(); if (!current) return
		const props = options.props(), items = props.items ?? [], targets = new Map(headings(current).map((heading) => [heading.id, heading.top]))
		const edge = current.y + (Number.isFinite(props.offset) ? props.offset! : 0) + 8
		let active = items.find((item) => targets.has(item.id))?.id
		for (const item of items) { const top = targets.get(item.id); if (top !== undefined && top <= edge) active = item.id }
		if (active && active !== options.active()) change(active)
	}
	const settleLater = (owned: NonNullable<typeof attempt>) => {
		stopTimer(); const revision = timerRevision
		timer = timers.set(() => {
			if (disposed || attempt !== owned || timerRevision !== revision) return
			timer = undefined; finish(); if (!disposed) spy()
		}, 150)
	}
	const observe = (name: any, object: any, callback: (note: any) => void) => {
		const center = native().NSNotificationCenter?.defaultCenter
		if (!name || !center?.addObserverForNameObjectQueueUsingBlock || !center.removeObserver) return () => {}
		try {
			const token = center.addObserverForNameObjectQueueUsingBlock(name, object, null, callback)
			return () => { if (token != null) { try { center.removeObserver(token) } catch (error) { report(error) } } }
		} catch (error) { report(error); return () => {} }

	}
	const release = () => { const previous = releases; releases = []; binding = undefined; for (const detach of previous) detach() }
	function sync() {
		if (disposed || syncing) return
		syncing = true
		try {
			const n = native()
			windowRelease ??= observe(n.NSWindowDidUpdateNotification ?? 'NSWindowDidUpdateNotification', null, (note) => {
				if (!disposed && (note.object === binding?.window || note.object === scroller()?.window)) sync()
			})
			let next = geometry()
			if (!same(binding, next)) {
				release(); finish(); if (disposed) return
				next = geometry(); if (!next) return
				binding = next; const owned = binding
				owned.clip.postsBoundsChangedNotifications = true
				const changed = () => {
					if (disposed || binding !== owned) return
					if (!same(owned, geometry())) { sync(); return }
					if (attempt) settleLater(attempt); else spy()
				}
				releases = [
					observe(n.NSViewBoundsDidChangeNotification ?? 'NSViewBoundsDidChangeNotification', owned.clip, changed),
					observe(n.NSViewFrameDidChangeNotification ?? 'NSViewFrameDidChangeNotification', owned.document, changed),
					observe(n.NSViewFrameDidChangeNotification ?? 'NSViewFrameDidChangeNotification', owned.clip, changed),
					observe(n.NSScrollViewWillStartLiveScrollNotification ?? 'NSScrollViewWillStartLiveScrollNotification', owned.view, () => { if (!disposed && binding === owned) { request++; finish(); spy() } }),
				]
			}
			if (attempt && (!same(attempt.geometry, next) || !(options.props().items ?? []).some((item) => item.id === attempt!.id))) finish()
			spy()
		} finally { syncing = false }
	}
	return {
		sync,
		activate(id: string) {
			if (disposed || !(options.props().items ?? []).some((item) => item.id === id)) return
			sync(); const own = ++request; finish()
			if (disposed || own !== request || !(options.props().items ?? []).some((item) => item.id === id)) return
			change(id); if (disposed || own !== request || !(options.props().items ?? []).some((item) => item.id === id)) return
			const current = geometry(), owned = { id, geometry: current }; attempt = owned
			invoke(options.props().onNavigateStart, id)
			if (disposed || attempt !== owned) return
			if (!(options.props().items ?? []).some((item) => item.id === id) || options.props().hasScrollOnClick === false || !current || !same(current, geometry())) { finish(); return }
			const target = headings(current).find((heading) => heading.id === id)
			if (!target) { finish(); return }
			const offset = options.props().offset, block = target.top - (Number.isFinite(offset) ? offset! : 0)
			try { scrollableAreaOffset(current.view, { block }, !options.reducedMotion()) }
			catch (error) { finish(); throw error }
			if (!disposed && attempt === owned) settleLater(owned)
		},
		dispose() { if (disposed) return; disposed = true; request++; release(); windowRelease?.(); windowRelease = undefined; finish() },
	}
}
