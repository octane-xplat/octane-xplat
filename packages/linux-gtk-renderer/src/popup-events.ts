import Gtk from 'gi://Gtk?version=4.0'
import Gdk from 'gi://Gdk?version=4.0'

export interface PopupEventClaim {
	preventDefault(): void
}

export interface PopupEventOptions {
	isPresent(): boolean
	onEscape(event: PopupEventClaim): void
	onOutside(event: PopupEventClaim): void
}

type Session = { popup: any; options: PopupEventOptions }
type NativeBinding = { users: number; dispose(): void }
type Hub = { sessions: Set<Session>; natives: Map<any, NativeBinding> }
const hubs = new WeakMap<object, Hub>()

/** Native surfaces stop GTK propagation. Share one pair of controllers on the
 * window and every registered popup, including sibling and nested popups.
 * The UI layer stack owns which session may claim an event; this hub owns GTK. */
export function bindPopupEvents(window: any, popup: any, options: PopupEventOptions): () => void {
	if (popup.get_root() !== window)
		{throw new Error('linux-gtk popup events require a popup in the declaring window.')}
	let hub = hubs.get(window)
	if (!hub) {
		hub = { sessions: new Set(), natives: new Map() }
		hubs.set(window, hub)
	}
	const owner = hub
	const dispatch = (kind: 'onEscape' | 'onOutside', surface?: any) => {
		let claimed = false
		const event = {
			preventDefault: () => {
				claimed = true
			},
		}
		for (const session of [...owner.sessions].reverse()) {
			if (!owner.sessions.has(session)) {continue}
			try {
				if (!session.options.isPresent()) {continue}
				if (kind === 'onOutside' && session.popup.get_surface() === surface) {continue}
				session.options[kind](event)
			} catch (error) {
				// Keep a claim made before user code throws. Reporting must not
				// give the same input to a lower layer or background control.
				console.error('[linux-gtk] event handler failed', error)
			}
			if (claimed) {break}
		}
		return claimed
	}
	const addNative = (widget: any) => {
		const existing = owner.natives.get(widget)
		if (existing) {
			existing.users++
			return
		}
		const keys = new Gtk.EventControllerKey()
		// Bubble after the focused editor can consume input (for example IME
		// cancellation). Popup Escape is not a global capture shortcut.
		keys.set_propagation_phase(Gtk.PropagationPhase.BUBBLE)
		const keySignal = keys.connect(
			'key-pressed',
			(_controller: any, key: number) => key === Gdk.KEY_Escape && dispatch('onEscape'),
		)
		widget.add_controller(keys)
		const pointer = new Gtk.EventControllerLegacy()
		pointer.set_propagation_phase(Gtk.PropagationPhase.CAPTURE)
		const pointerSignal = pointer.connect('event', (_controller: any, event: any) => {
			const type = event.get_event_type()
			if (type !== Gdk.EventType.BUTTON_PRESS && type !== Gdk.EventType.TOUCH_BEGIN) {return false}
			return dispatch('onOutside', event.get_surface())
		})
		widget.add_controller(pointer)
		owner.natives.set(widget, {
			users: 1,
			dispose() {
				keys.disconnect(keySignal)
				pointer.disconnect(pointerSignal)
				widget.remove_controller(keys)
				widget.remove_controller(pointer)
			},
		})
	}
	const removeNative = (widget: any) => {
		const binding = owner.natives.get(widget)
		if (!binding || --binding.users > 0) {return}
		binding.dispose()
		owner.natives.delete(widget)
	}
	if (!owner.sessions.size) {addNative(window)}
	addNative(popup)
	const session = { popup, options }
	owner.sessions.add(session)
	let disposed = false
	return () => {
		if (disposed) {return}
		disposed = true
		owner.sessions.delete(session)
		removeNative(popup)
		if (!owner.sessions.size) {
			removeNative(window)
			hubs.delete(window)
		}
	}
}
