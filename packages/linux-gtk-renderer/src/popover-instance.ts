import Gtk from 'gi://Gtk?version=4.0'
import Gdk from 'gi://Gdk?version=4.0'
import { popupBounds } from './popup-bounds.js'
import { bindPopupEvents, type PopupEventOptions } from './popup-events.js'
import type { GtkBounds } from './public-instance.js'

type Position = { left: number; top: number; placement: 'top' | 'bottom' | 'left' | 'right' }
interface Options extends Omit<PopupEventOptions, 'isPresent'> {
	position(anchor: GtkBounds, panel: { width: number; height: number }, viewport: GtkBounds, rtl: boolean): Position
	onUnavailable(): void
	/** Fires from dispose() — covers external teardown like the anchor's
	 *  public instance releasing every owned session. */
	onDisposed?(): void
}
const displays = new Map<any, { provider: any; users: number }>()
function ownChrome(display: any) {
	let shared = displays.get(display)
	if (!shared) {
		const provider = new Gtk.CssProvider()
		provider.load_from_string('popover.xplat-popover > contents { padding: 0; border: none; border-radius: 0; background: transparent; box-shadow: none; }')
		Gtk.StyleContext.add_provider_for_display(display, provider, Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION)
		shared = { provider, users: 0 }
		displays.set(display, shared)
	}
	const current = shared
	current.users++
	return () => {
		if (--current.users) { return }
		Gtk.StyleContext.remove_provider_for_display(display, current.provider)
		displays.delete(display)
	}
}
/** Qualification aid: shared popover chrome lives once per display; fixture
 * checks prove it survives concurrent popovers and returns to zero. */
export function popoverChromeUsers(display: any): number {
	return displays.get(display)?.users ?? 0
}
const boundsIn = (view: any, host: any): GtkBounds | null => {
	const [ok, rect] = view.compute_bounds(host)
	return ok ? { x: rect.origin.x, y: rect.origin.y, width: rect.size.width, height: rect.size.height } : popupBounds(view, host)
}
function createPopover(anchor: any, host: any, initial: Options) {
	const window = anchor.get_root()
	if (!window) { return null }
	const target = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL })
	const popup = new Gtk.Popover({ autohide: false, has_arrow: false })
	popup.add_css_class('xplat-popover')
	popup.set_child(target)
	popup.set_parent(anchor)
	const releaseChrome = ownChrome(anchor.get_display())
	let options = initial
	let disposed = false, wanted = false, visible = false
	let tick: number | null = null
	let events: (() => void) | null = null
	let side: Position['placement'] | null = null
	let rectX: number | null = null, rectY: number | null = null
	const isPresent = () => !disposed && visible && popup.get_mapped()
	const stopPositioning = () => {
		if (tick !== null) { anchor.remove_tick_callback(tick) }
		tick = null
	}
	const hideSurface = () => {
		visible = false
		stopPositioning()
		events?.()
		events = null
		popup.popdown()
	}
	const unavailable = () => {
		if (disposed || !visible) { return }
		hideSurface()
		options.onUnavailable()
	}
	const place = () => {
		if (!isPresent()) { return }
		const anchorBounds = boundsIn(anchor, host)
		const windowBounds = boundsIn(window, host)
		if (!anchorBounds || !windowBounds || target.get_width() <= 0 || target.get_height() <= 0) { return }
		const left = Math.max(0, windowBounds.x), top = Math.max(0, windowBounds.y)
		const viewport = {
			x: left, y: top,
			width: Math.max(0, Math.min(host.get_width(), windowBounds.x + windowBounds.width) - left),
			height: Math.max(0, Math.min(host.get_height(), windowBounds.y + windowBounds.height) - top),
		}
		const position = options.position(anchorBounds, { width: target.get_width(), height: target.get_height() }, viewport, anchor.get_direction() === Gtk.TextDirection.RTL)
		if (![position.left, position.top].every(Number.isFinite)) {
			throw new TypeError('linux-gtk popover position requires finite coordinates.')
		}
		if (side !== position.placement) {
			side = position.placement
			const positions = { top: Gtk.PositionType.TOP, bottom: Gtk.PositionType.BOTTOM, left: Gtk.PositionType.LEFT, right: Gtk.PositionType.RIGHT }
			popup.set_position(positions[side])
		}
		// Point the popup at a zero-size rect (in anchor coordinates) so GTK
		// places the panel's top-left exactly at the wanted position. Measuring
		// back and feeding gtk_popover_set_offset fights GTK's own flip/clamp
		// rules and ratchets the popup off-screen.
		const panelW = target.get_width(), panelH = target.get_height()
		let x: number, y: number
		if (side === 'top') { x = position.left + panelW / 2; y = position.top + panelH }
		else if (side === 'bottom') { x = position.left + panelW / 2; y = position.top }
		else if (side === 'left') { x = position.left + panelW; y = position.top + panelH / 2 }
		else { x = position.left; y = position.top + panelH / 2 }
		x = Math.round(x - anchorBounds.x)
		y = Math.round(y - anchorBounds.y)
		if (x !== rectX || y !== rectY) {
			rectX = x
			rectY = y
			popup.set_pointing_to(new Gdk.Rectangle({ x, y, width: 0, height: 0 }))
			popup.present()
		}
	}
	const show = () => {
		if (disposed) { return }
		wanted = true
		if (visible || !anchor.get_mapped()) { return }
		visible = true
		events = bindPopupEvents(window, popup, {
			isPresent,
			onEscape: event => options.onEscape(event),
			onOutside: event => options.onOutside(event),
		})
		const focused = window.get_focus()
		popup.popup()
		// A nonmodal shared Popover does not move focus merely by opening.
		if (focused?.get_mapped() && focused.get_root() === window) { focused.grab_focus() }
		tick = anchor.add_tick_callback(() => {
			if (!visible || disposed) { tick = null; return false }
			place()
			return true
		})
	}
	const connections = [
		[anchor, anchor.connect('unmap', unavailable)],
		[anchor, anchor.connect('map', () => { if (wanted) { show() } })],
		[popup, popup.connect('closed', unavailable)],
	] as Array<[any, number]>
	return {
		target, popup, isPresent,
		configure(next: Options) { if (!disposed) { options = next; place() } },
		show,
		hide() { if (!disposed) { wanted = false; hideSurface() } },
		dispose() {
			if (disposed) { return }
			disposed = true
			wanted = false
			hideSurface()
			for (const [object, signal] of connections) { object.disconnect(signal) }
			popup.unparent()
			releaseChrome()
			options.onDisposed?.()
		},
	}
}

/** Retained GTK refs create native sessions; portal nodes stay in their original
 * universal root. Disposal of an anchor also releases every owned session. */
export function bindPopovers(view: any, getHost: () => any): () => void {
	let disposed = false
	const sessions = new Set<NonNullable<ReturnType<typeof createPopover>>>()
	view.createPopover = (options: Options) => {
		const host = getHost()
		if (disposed || !host) { return null }
		const session = createPopover(view, host, options)
		if (!session) { return null }
		sessions.add(session)
		const release = session.dispose
		session.dispose = () => { release(); sessions.delete(session) }
		return session
	}
	view.captureLayerFocus = (getTarget?: () => any) => {
		if (disposed) { return () => {} }
		const owner = view.get_root()
		const initial = owner?.get_focus()
		return () => {
			const wanted = getTarget?.() ?? initial
			// Refs on composite controls hand out their handle object.
			const target = wanted?.native ?? wanted
			if (owner?.get_mapped() && target?.get_root?.() === owner && target.get_mapped() && target.get_sensitive()) {
				target.grab_focus()
			}
		}
	}
	return () => {
		disposed = true
		for (const session of sessions) { session.dispose() }
	}
}
