import type { NSView } from '@octane-xplat/platform/macos'
import type { PopoverAlignment, PopoverPlacement } from '../../props'
import { appKitHost } from '../../internal/platform/host-bridge'
import { positionPopover, type PopoverRect } from './popover-position'

export interface AppKitPopoverTarget { token: object; view: NSView }
interface Layer { readonly closed: boolean; show(): void; update(props: object, options?: object): void; close(): void }
interface State {
	open: boolean; anchor: object | null | undefined; placement?: PopoverPlacement
	alignment?: PopoverAlignment; offset?: number | string; lightDismiss: boolean
}
interface Scope {
	token: object; anchor: NSView; window: NonNullable<NSView['window']>; live: boolean
	target: NSView | null; handle: Layer | null; committed: boolean; shown: boolean; released: boolean
	waiters: Array<() => void>
}
const gap = (value: number | string | undefined) => {
	const number = typeof value === 'string' && /^-?(?:\d+(?:\.\d*)?|\.\d+)px$/.test(value.trim()) ? Number.parseFloat(value) : value
	return typeof number === 'number' && Number.isFinite(number) ? number : 8
}
const visible = (view: NSView) => !['hidden', 'hiddenOrHasHiddenAncestor'].some((key) => {
	const value = Reflect.get(view, key); return Boolean(typeof value === 'function' ? value.call(view) : value)
})
/** Source-owned generic popover. The existing renderer layer owns native
 * geometry/monitors; the declaring tree owns portal content and providers. */
export function createAppKitPopoverOwner(options: {
	state(): State; publish(target: AppKitPopoverTarget | null, retired?: object): void
	dismiss(): void; canDismiss(): boolean
}, bridge = appKitHost, native: () => Record<string, any> = () => globalThis) {
	let current: Scope | null = null, disposed = false, canceled = false, updating = false, queued = false
	let observer: { live: boolean; stop?: () => void } | null = null
	const owns = (scope: Scope) => !disposed && current === scope && scope.live
	const valid = (scope: Scope) => owns(scope) && !scope.released && !scope.handle?.closed && options.state().open &&
		options.state().anchor === scope.anchor && scope.anchor.window === scope.window && visible(scope.anchor)
	const stop = () => {
		const previous = observer; observer = null
		if (!previous) return
		previous.live = false
		try { previous.stop?.() } catch { console.warn('[macos-popover] observer removal failed') }
	}
	const retire = (scope = current) => {
		if (!scope) return
		if (current === scope) current = null
		scope.live = false; scope.waiters = []
		try { scope.handle?.close() } finally { if (!disposed) options.publish(null, scope.token) }
	}
	const observe = () => {
		if (observer || disposed) return
		const host = native(), center = host.NSNotificationCenter?.defaultCenter
		const add = center?.addObserverForNameObjectQueueUsingBlock, remove = center?.removeObserver
		if (typeof add !== 'function' || typeof remove !== 'function') return
		const owned = { live: true, stop: undefined as (() => void) | undefined }; observer = owned
		try {
			const token = add.call(center, host.NSWindowDidUpdateNotification ?? 'NSWindowDidUpdateNotification', null, null, (note: { object: unknown }) => {
				if (disposed || observer !== owned || !owned.live) return
				const anchor = options.state().anchor as NSView | null | undefined
				if (note.object === anchor?.window || note.object === current?.window) update()
			})
			if (token == null) { if (observer === owned) observer = null; owned.live = false; return }
			let active = true
			const release = () => { if (active) { active = false; remove.call(center, token) } }
			if (disposed || observer !== owned || !owned.live) release(); else owned.stop = release
		} catch (error) { if (observer === owned) observer = null; owned.live = false; throw error }
	}
	const refresh = () => {
		const state = options.state()
		if (!state.open) { canceled = false; try { retire() } finally { stop() }; return }
		if (canceled) return
		observe()
		if (disposed) return
		if (current && (current.released || current.handle?.closed || current.anchor.window !== current.window || !visible(current.anchor))) {
			canceled = true; try { retire() } finally { stop() }; options.dismiss(); return
		}
		const anchor = state.anchor
		if (!anchor || !('window' in anchor) || typeof Reflect.get(anchor, 'convertRectToView') !== 'function') { retire(); return }
		const view = anchor as NSView
		if (!view.window || !visible(view)) { retire(); return }
		if (current && current.anchor !== view) retire()
		if (disposed || !options.state().open || options.state().anchor !== view) return
		if (current) { current.handle?.update({}, { lightDismiss: state.lightDismiss }); return }
		const host = bridge(), show = host?.showLayer
		if (typeof show !== 'function') throw new Error('AppKit Popover requires the source-owned window-layer host')
		const scope: Scope = { token: {}, anchor: view, window: view.window, live: true, target: null, handle: null, committed: false, shown: false, released: false, waiters: [] }
		current = scope // Claim before native acquisition or source publication.
		try {
			const handle: Layer | null = show.call(host, { anchor: view, deferPresentation: true,
				lightDismiss: state.lightDismiss, excludeAnchorFromDismiss: true,
				position: (bounds: PopoverRect, panel: { width: number; height: number }, viewport: PopoverRect) => {
					if (!valid(scope)) return { left: 0, top: 0 }
					const latest = options.state(), placement = latest.placement ?? 'bottom'
					return positionPopover(bounds, panel, viewport, placement, gap(latest.offset), latest.alignment ?? 'start')
				},
				createContentRoot: (target: NSView) => {
					scope.target = target
					if (valid(scope)) options.publish({ token: scope.token, view: target })
					return { render() {}, whenCommitted(ready: () => void) { if (!valid(scope)) return; if (scope.committed) ready(); else scope.waiters.push(ready) },
						unmount() { if (scope.released) return; scope.released = true; scope.waiters = []; if (owns(scope)) options.publish(null, scope.token) },
					}
				},
				onClose: () => {
					if (!owns(scope)) return
					if (scope.released || scope.handle?.closed) { canceled = true; try { retire(scope) } finally { stop() }; options.dismiss() }
					else if (valid(scope) && options.canDismiss() && valid(scope)) options.dismiss()
				},
			}) ?? null
			scope.handle = handle
			if (owns(scope) && (!handle || handle.closed || scope.released || view.window !== scope.window)) {
				canceled = true; try { retire(scope) } finally { stop() }; options.dismiss(); return
			}
			if (!valid(scope)) { if (current === scope) retire(scope); else handle?.close(); return }
			if (!scope.target || typeof handle.show !== 'function' || typeof handle.update !== 'function' || typeof handle.close !== 'function') {
				throw new TypeError('AppKit Popover requires a source outlet and staged window-layer handle')
			}
			if (scope.committed) { handle.update({}); if (valid(scope)) { handle.show(); scope.shown = true } }
		} catch (error) { try { retire(scope) } catch {}; throw error }
	}
	const update = () => {
		if (disposed) return
		if (updating) { if (!queued) { queued = true; void Promise.resolve().then(() => { queued = false; update() }) }; return }
		updating = true
		try { refresh() } catch (error) { try { retire() } finally { stop() }; throw error }
		finally { updating = false }
	}
	return { update, isPresent: () => !!current?.handle && valid(current) && current.shown,
		committed(token: object) {
			const scope = current
			if (!scope || scope.token !== token || !valid(scope)) return
			scope.committed = true
			const waiting = scope.waiters.splice(0)
			for (const ready of waiting) { if (!valid(scope)) return; ready() }
			if (!valid(scope) || !scope.handle) return
			if (!waiting.length) scope.handle.update({})
			if (valid(scope) && !scope.shown) { scope.handle.show(); scope.shown = true }
		},
		dispose() { if (disposed) return; disposed = true; try { retire() } finally { stop() } },
	}
}
