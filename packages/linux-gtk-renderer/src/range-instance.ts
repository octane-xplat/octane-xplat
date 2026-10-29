import Gtk from 'gi://Gtk?version=4.0'
import Gdk from 'gi://Gdk?version=4.0'
import GObject from 'gi://GObject'

/** Native ref events for self-drawn adjustable controls. */
export function bindRangeInstance(
	view: any,
	emit: (
		name: 'accessibilityIncrement' | 'accessibilityDecrement',
		detail: Record<string, unknown>,
	) => void,
	hasListener: (name: string) => boolean,
) {
	let disposed = false
	let keys: any = null,
		pointer: any = null
	const connections: Array<[any, number]> = []
	const connect = (object: any, name: string, listener: (...args: any[]) => unknown) =>
		connections.push([object, object.connect(name, listener)])
	const role = () => view.get_accessible_role() === Gtk.AccessibleRole.SLIDER
	const shortcuts =
		Gdk.ModifierType.CONTROL_MASK |
		Gdk.ModifierType.ALT_MASK |
		Gdk.ModifierType.SUPER_MASK |
		Gdk.ModifierType.META_MASK
	const double = (value: number) => {
		const boxed = new GObject.Value()
		boxed.init(GObject.TYPE_DOUBLE)
		boxed.set_double(value)
		return boxed
	}
	view.setAccessibilityRange = (range: {
		min: number
		max: number
		value: number
		text: string
	}) => {
		if (disposed) return
		if (![range.min, range.max, range.value].every(Number.isFinite) || range.max < range.min)
			throw new TypeError('linux-gtk accessibility range requires finite ordered bounds')
		view.update_property(
			[
				Gtk.AccessibleProperty.VALUE_MIN,
				Gtk.AccessibleProperty.VALUE_MAX,
				Gtk.AccessibleProperty.VALUE_NOW,
				Gtk.AccessibleProperty.VALUE_TEXT,
			],
			[
				double(range.min),
				double(range.max),
				double(Math.min(range.max, Math.max(range.min, range.value))),
				range.text,
			],
		)
	}
	return {
		refresh() {
			if (disposed || keys) return
			keys = new Gtk.EventControllerKey()
			connect(keys, 'key-pressed', (_: unknown, key: number, _code: number, modifiers: number) => {
				if (
					disposed ||
					!role() ||
					!view.has_focus ||
					!view.get_focusable() ||
					!view.is_sensitive() ||
					modifiers & shortcuts
				)
					return false
				let direction: 'accessibilityIncrement' | 'accessibilityDecrement',
					action: string | undefined
				switch (key) {
					case Gdk.KEY_Right:
					case Gdk.KEY_Up:
						direction = 'accessibilityIncrement'
						break
					case Gdk.KEY_Left:
					case Gdk.KEY_Down:
						direction = 'accessibilityDecrement'
						break
					case Gdk.KEY_Home:
						direction = 'accessibilityDecrement'
						action = 'minimum'
						break
					case Gdk.KEY_End:
						direction = 'accessibilityIncrement'
						action = 'maximum'
						break
					default:
						return false
				}
				if (!hasListener(direction)) return false
				emit(direction, { action })
				return true
			})
			view.add_controller(keys)
			pointer = new Gtk.GestureClick()
			pointer.set_button(1)
			connect(pointer, 'pressed', () => {
				if (
					!disposed &&
					role() &&
					view.get_focusable() &&
					view.get_focus_on_click() &&
					view.is_sensitive()
				)
					view.grab_focus()
			})
			view.add_controller(pointer)
		},
		dispose() {
			if (disposed) return
			disposed = true
			for (const [object, id] of connections) object.disconnect(id)
			if (keys) view.remove_controller(keys)
			if (pointer) view.remove_controller(pointer)
		},
	}
}
