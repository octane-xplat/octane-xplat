interface Clock { set(callback: () => void, delay: number): unknown; clear(handle: unknown): void }
const clock: Clock = { set: (callback, delay) => setTimeout(callback, delay), clear: (handle) => clearTimeout(handle as ReturnType<typeof setTimeout>) }
type Host = Record<string, any>
/** Per-viewport SDK live-scroll ownership; follows the Carousel quiet-scroll policy. */
export function createAppKitPagerEvents(options: {
	view(): Host | null
	interaction(): void
	settle(): void
	measure(): void
}, native: () => Record<string, any> = () => globalThis, timers = clock) {
	let view: Host | null = null, releases: (() => void)[] = [], timer: unknown = null, generation = 0, binding = 0, observedWindow: unknown = null
	let tracking: { window: object; active: boolean; dirty: boolean } | null = null
	const valid = () => {
		if (!view || options.view() !== view || !view.window) return false
		return !['hidden', 'hiddenOrHasHiddenAncestor'].some((key) => Boolean(typeof view![key] === 'function' ? view![key]() : view![key]))
	}
	const cancel = () => { generation++; if (timer != null) timers.clear(timer); timer = null; if (tracking?.active) tracking.dirty = false; else tracking = null }
	const validate = () => {
		if (!valid() || (tracking && tracking.window !== view?.window)) { cancel(); tracking = null }
		if (view?.window) observedWindow = view.window
	}
	const schedule = () => {
		if (timer != null) timers.clear(timer)
		timer = null
		const request = ++generation, owner = tracking
		if (!owner?.dirty || owner.active) return
		timer = timers.set(() => {
			if (generation !== request) return
			timer = null; validate()
			if (tracking !== owner || !owner.dirty || owner.active) return
			tracking = null
			try { options.settle() } catch (error) { console.warn('[macos-pager] user settlement failed', error) }
			options.measure()
		}, 140)
	}
	const start = () => { cancel(); if (valid()) tracking = { window: view!.window, active: true, dirty: false } }
	const moved = () => {
		validate(); if (!valid()) return
		if (!tracking) tracking = { window: view!.window, active: false, dirty: false }
		tracking.dirty = true; options.interaction()
		if (!tracking.active) schedule()
	}
	const end = () => {
		validate(); if (!tracking) return
		tracking.active = false
		if (tracking.dirty) schedule(); else { tracking = null; options.measure() }
	}
	const bind = (next: Host | null) => {
		if (next === view && releases.length === 5) return
		const instance = ++binding
		view = null; cancel(); tracking = null
		for (const release of releases.splice(0)) { try { release() } catch (error) { console.warn('[macos-pager] observer cleanup failed', error) } }
		view = next; observedWindow = next?.window ?? null; if (!view) return
		const host = native(), center = host.NSNotificationCenter?.defaultCenter
		if (!center?.addObserverForNameObjectQueueUsingBlock || !center?.removeObserver) return
		try {
			for (const [name, object, callback] of [
				['NSScrollViewWillStartLiveScrollNotification', next, start], ['NSScrollViewDidLiveScrollNotification', next, moved],
				['NSScrollViewDidEndLiveScrollNotification', next, end], ['NSViewBoundsDidChangeNotification', next.contentView, options.measure],
				['NSWindowDidUpdateNotification', null, () => { validate(); options.measure() }],
			] as const) {
				const token = center.addObserverForNameObjectQueueUsingBlock(host[name] ?? name, object, null, (note: { object: unknown }) => {
					if (binding !== instance || view !== next || options.view() !== next) return
					if (name === 'NSWindowDidUpdateNotification' ? note.object === next.window || note.object === tracking?.window || note.object === observedWindow : note.object === object) callback()
				})
				if (token == null) throw new Error('AppKit pager observation unavailable')
				releases.push(() => center.removeObserver(token))
			}
		} catch (error) { bind(null); console.warn('[macos-pager] observation unavailable', error) }
	}
	return { bind, cancel, validate, busy: () => Boolean(tracking?.active || timer != null), dispose: () => bind(null) }
}
