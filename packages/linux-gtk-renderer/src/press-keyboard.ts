import Gtk from 'gi://Gtk?version=4.0'
import Gdk from 'gi://Gdk?version=4.0'
import type { ElementNode } from './index.js'
import { registerRadioNode, navigateRadio, radioChecked } from './radio-keyboard.js'

/** Keyboard press gestures for semantic Mason buttons, links and toggles. A single native
 * controller sends touch down/up/cancel before tap through the same registered
 * event callbacks as pointer gestures. Native Gtk.Button keeps its own bindings. */
export function bindPressKeys(node: ElementNode) {
	const view = node.view!
	const unregisterRadioNode = registerRadioNode(node)
	const listeners = new Map<string, (action?: string) => void>()
	let held: number | null = null
	let disposed = false
	const connections: Array<[any, number]> = []
	const connect = (object: any, signal: string, fn: (...args: any[]) => unknown) =>
		connections.push([object, object.connect(signal, fn)])
	const eligible = () => !disposed && view.has_focus && view.get_focusable() && view.is_sensitive()
	const accepts = (key: number) => {
		const role = view.get_accessible_role()
		if (role === Gtk.AccessibleRole.LINK) return key === Gdk.KEY_Return || key === Gdk.KEY_KP_Enter
		if (
			[Gtk.AccessibleRole.CHECKBOX, Gtk.AccessibleRole.SWITCH, Gtk.AccessibleRole.RADIO].includes(
				role,
			)
		)
			return key === Gdk.KEY_space
		return (
			role === Gtk.AccessibleRole.BUTTON &&
			[Gdk.KEY_Return, Gdk.KEY_KP_Enter, Gdk.KEY_space].includes(key)
		)
	}
	const cancel = (notify = true) => {
		if (held === null) return
		held = null
		if (notify) listeners.get('touch')?.('cancel')
	}
	const shortcuts =
		Gdk.ModifierType.CONTROL_MASK |
		Gdk.ModifierType.ALT_MASK |
		Gdk.ModifierType.SUPER_MASK |
		Gdk.ModifierType.META_MASK
	let keys: any = null,
		focus: any = null,
		togglePointer: any = null
	const pointerRole = () =>
		[Gtk.AccessibleRole.CHECKBOX, Gtk.AccessibleRole.SWITCH, Gtk.AccessibleRole.RADIO].includes(
			view.get_accessible_role(),
		)
	const ensure = () => {
		if (disposed || !view.get_focusable()) return
		if (!togglePointer && pointerRole()) {
			togglePointer = new Gtk.GestureClick()
			togglePointer.set_button(1)
			connect(togglePointer, 'pressed', () => {
				if (
					!disposed &&
					view.get_focusable() &&
					view.get_focus_on_click() &&
					view.is_sensitive() &&
					pointerRole()
				)
					view.grab_focus()
			})
			view.add_controller(togglePointer)
		}
		if (
			disposed ||
			keys ||
			!view.get_focusable() ||
			(listeners.size === 0 && view.get_accessible_role() !== Gtk.AccessibleRole.RADIO)
		)
			return
		keys = new Gtk.EventControllerKey()
		connect(keys, 'key-pressed', (_controller, key, _code, modifiers) => {
			if (!eligible() || modifiers & shortcuts) return false
			if (navigateRadio(node, key, cancel)) return true
			if (!accepts(key) || listeners.size === 0) return false
			if (held === null) {
				held = key
				listeners.get('touch')?.('down')
			}
			return true
		})
		connect(keys, 'key-released', (_controller, key, _code, modifiers) => {
			if (held !== key) return
			held = null
			if (!eligible() || !accepts(key) || modifiers & shortcuts) {
				listeners.get('touch')?.('cancel')
				return
			}
			listeners.get('touch')?.('up')
			if (
				!disposed &&
				view.is_sensitive() &&
				accepts(key) &&
				(view.get_accessible_role() !== Gtk.AccessibleRole.RADIO || !radioChecked(node))
			)
				listeners.get('tap')?.()
		})
		view.add_controller(keys)
		focus = new Gtk.EventControllerFocus()
		connect(focus, 'leave', () => cancel())
		view.add_controller(focus)
		connect(view, 'unmap', () => cancel())
		connect(view, 'state-flags-changed', () => {
			if (!view.is_sensitive() || !view.has_focus) cancel()
		})
	}

	return {
		activateRadio() {
			if (
				eligible() &&
				view.get_accessible_role() === Gtk.AccessibleRole.RADIO &&
				!radioChecked(node)
			)
				listeners.get('tap')?.()
		},
		set(type: string, listener: ((action?: string) => void) | null) {
			if (disposed || (type !== 'tap' && type !== 'touch')) return
			if (listener) {
				listeners.set(type, listener)
				ensure()
			} else {
				listeners.delete(type)
				if (listeners.size === 0) cancel(false)
			}
		},
		refresh: ensure,
		clear() {
			cancel(false)
			listeners.clear()
		},
		dispose() {
			if (disposed) return
			disposed = true
			unregisterRadioNode()
			cancel(false)
			listeners.clear()
			for (const [object, id] of connections) object.disconnect(id)
			if (keys) view.remove_controller(keys)
			if (focus) view.remove_controller(focus)
			if (togglePointer) view.remove_controller(togglePointer)
		},
	}
}
