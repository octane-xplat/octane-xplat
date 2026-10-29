interface State { open: boolean; index: number; count: number; src?: string; image: boolean; zoom: boolean }
const hidden = (view: any) => ['hidden', 'hiddenOrHasHiddenAncestor'].some((name) => {
	const value = view?.[name]; return Boolean(typeof value === 'function' ? value.call(view) : value)
})

/** Native magnification plus an owned recognized-swipe monitor. Scroll-wheel
 * events stay with AppKit; pointer-pan classification enters through swipe(). */
export function createAppKitLightboxGestures(options: {
	state(): State
	stage(): any
	viewport(): any
	select(index: number): void
}, native: () => Record<string, any> = () => globalThis) {
	let disposed = false, token: unknown, events: any, bound: any, version = 0
	let previous: { view: any; src?: string; index: number; enabled: boolean } | undefined
	const release = () => {
		version++; const old = token, source = events; token = undefined; events = undefined; bound = undefined
		if (old != null) { try { source.removeMonitor(old) } catch (error) { console.error('[macos-lightbox] swipe cleanup failed', error) } }
	}
	const scope = () => {
		if (disposed) return null
		const state = options.state(), stage = options.stage()
		return state.open && state.count > 0 && stage?.window && !hidden(stage) ? { state, stage, window: stage.window } : null
	}
	const zoomed = () => Number(options.viewport()?.magnification ?? 1) > 1.01
	const swipe = (direction: number) => {
		const current = scope()
		if (!current || zoomed() || !Number.isInteger(current.state.index) || !Number.isInteger(current.state.count)) return false
		const step = direction === 2 ? 1 : direction === 1 ? -1 : 0
		const next = Math.max(0, Math.min(current.state.count - 1, current.state.index + step))
		if (!step || next === current.state.index) return false
		try { options.select(next) } catch (error) { console.error('[macos-lightbox] selection callback failed', error) }
		return true
	}
	const hit = (window: any, point: any, stage: any) => {
		const root = window.contentView
		if (!root || !point || !Number.isFinite(point.x) || !Number.isFinite(point.y)) return false
		const parent = root.superview
		const target = root.hitTest(parent ? parent.convertPointFromView(point, null) : point)
		return target === stage || (typeof target?.isDescendantOf === 'function' && target.isDescendantOf(stage))
	}
	return {
		swipe,
		toggleZoom() {
			const current = scope()
			if (!current) return false
			const view = options.viewport()
			if (!current.state.image || !current.state.zoom || view?.window !== current.window || hidden(view)) return false
			const bounds = view.contentView?.bounds, x = Number(bounds?.origin?.x), y = Number(bounds?.origin?.y), width = Number(bounds?.size?.width), height = Number(bounds?.size?.height)
			if (![x, y, width, height].every(Number.isFinite) || width <= 0 || height <= 0 || typeof view.setMagnificationCenteredAtPoint !== 'function') return false
			view.setMagnificationCenteredAtPoint(zoomed() ? 1 : 2, { x: x + width / 2, y: y + height / 2 })
			return true
		},
		sync() {
			if (disposed) return
			const state = options.state(), view = options.viewport(), enabled = state.open && state.image && state.zoom
			if (view && (!previous || previous.view !== view || previous.src !== state.src || previous.index !== state.index || previous.enabled !== enabled)) {
				view.minMagnification = 1; view.maxMagnification = 4; view.allowsMagnification = enabled; view.magnification = 1
			}
			previous = view ? { view, src: state.src, index: state.index, enabled } : undefined
			const stage = options.stage()
			if (!state.open || state.count < 2 || !stage) { release(); return }
			if (token != null && stage === bound) return
			release()
			const host = native(), source = host.NSEvent
			if (typeof source?.addLocalMonitorForEventsMatchingMaskHandler !== 'function' || typeof source.removeMonitor !== 'function') return
			bound = stage; events = source; const own = version
			try {
				const installed = source.addLocalMonitorForEventsMatchingMaskHandler(host.NSEventMask?.Swipe ?? 2 ** 31, (event: any) => {
					try {
						const current = scope()
						if (own !== version || bound !== stage || options.stage() !== stage || !current || current.stage !== stage || event.window !== current.window || Number(event.type) !== (host.NSEventType?.Swipe ?? 31) || !hit(current.window, event.locationInWindow, stage)) return event
						const phase = Number(event.phase ?? 0), cancelled = host.NSEventPhase?.Cancelled ?? 16, ended = host.NSEventPhase?.Ended ?? 8
						if ((phase & cancelled) || (phase !== 0 && !(phase & ended))) return event
						const dx = Number(event.deltaX), dy = Number(event.deltaY ?? 0)
						if (!Number.isFinite(dx) || !Number.isFinite(dy) || dx === 0 || Math.abs(dx) <= Math.abs(dy)) return event
						// Recognized NSEvent swipes use +x for left, unlike pointer pans.
						if (!swipe(dx > 0 ? 2 : 1)) return event
						return null
					} catch (error) { console.error('[macos-lightbox] native swipe failed', error); return event }
				})
				if (disposed || own !== version) { if (installed != null) source.removeMonitor(installed) } else token = installed
			} catch (error) { release(); console.error('[macos-lightbox] swipe observation unavailable', error) }
		},
		dispose() { if (disposed) return; disposed = true; previous = undefined; release() },
	}
}
