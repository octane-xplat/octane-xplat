import Gdk from 'gi://Gdk?version=4.0'

/** DOM-style `key` names for the keyvals `Gdk.keyval_to_unicode` cannot
 *  name (non-printable keys). Printable keys resolve through unicode so
 *  shifted punctuation and letters report the character the DOM reports. */
const KEY_NAMES = new Map<number, string>([
	[Gdk.KEY_Return, 'Enter'],
	[Gdk.KEY_KP_Enter, 'Enter'],
	[Gdk.KEY_ISO_Left_Tab, 'Tab'],
	[Gdk.KEY_BackSpace, 'Backspace'],
	[Gdk.KEY_Delete, 'Delete'],
	[Gdk.KEY_KP_Delete, 'Delete'],
	[Gdk.KEY_Insert, 'Insert'],
	[Gdk.KEY_KP_Insert, 'Insert'],
	[Gdk.KEY_Home, 'Home'],
	[Gdk.KEY_KP_Home, 'Home'],
	[Gdk.KEY_End, 'End'],
	[Gdk.KEY_KP_End, 'End'],
	[Gdk.KEY_Page_Up, 'PageUp'],
	[Gdk.KEY_KP_Page_Up, 'PageUp'],
	[Gdk.KEY_Page_Down, 'PageDown'],
	[Gdk.KEY_KP_Page_Down, 'PageDown'],
	[Gdk.KEY_Left, 'ArrowLeft'],
	[Gdk.KEY_KP_Left, 'ArrowLeft'],
	[Gdk.KEY_Right, 'ArrowRight'],
	[Gdk.KEY_KP_Right, 'ArrowRight'],
	[Gdk.KEY_Up, 'ArrowUp'],
	[Gdk.KEY_KP_Up, 'ArrowUp'],
	[Gdk.KEY_Down, 'ArrowDown'],
	[Gdk.KEY_KP_Down, 'ArrowDown'],
	[Gdk.KEY_Shift_L, 'Shift'],
	[Gdk.KEY_Shift_R, 'Shift'],
	[Gdk.KEY_Control_L, 'Control'],
	[Gdk.KEY_Control_R, 'Control'],
	[Gdk.KEY_Alt_L, 'Alt'],
	[Gdk.KEY_Alt_R, 'Alt'],
	[Gdk.KEY_Meta_L, 'Meta'],
	[Gdk.KEY_Meta_R, 'Meta'],
	[Gdk.KEY_Super_L, 'Meta'],
	[Gdk.KEY_Super_R, 'Meta'],
	[Gdk.KEY_Caps_Lock, 'CapsLock'],
	[Gdk.KEY_Num_Lock, 'NumLock'],
	[Gdk.KEY_Scroll_Lock, 'ScrollLock'],
	[Gdk.KEY_Pause, 'Pause'],
	[Gdk.KEY_Print, 'PrintScreen'],
	[Gdk.KEY_Menu, 'ContextMenu'],
])

/** Normalize a GTK `key-pressed`/`key-released` signal into the shared
 *  `KeyboardEvent` contract (packages/ui `use-keyboard.types`). `code`
 *  stays empty — Gdk reports hardware keycodes, not DOM code names, and
 *  the contract permits an empty code when the host cannot supply one.
 *  `repeat` stays false: GTK4 does not expose autorepeat on the key
 *  controller signals. `isComposing` stays false — IME-context tracking
 *  is not wired yet. `preventDefault()` and `stopPropagation()` both set
 *  flags the signal handler reads to return handled=true, which stops
 *  propagation (GTK's single mechanism for both). */
export function normalizeKeyEvent(keyval: number, modifiers: number) {
	const unicode = Gdk.keyval_to_unicode(keyval)
	const key =
		unicode >= 0x20 && unicode !== 0x7f
			? String.fromCharCode(unicode)
			: (KEY_NAMES.get(keyval) ?? Gdk.keyval_name(keyval) ?? '')
	const event = {
		key,
		code: '',
		altKey: (modifiers & Gdk.ModifierType.ALT_MASK) !== 0,
		ctrlKey: (modifiers & Gdk.ModifierType.CONTROL_MASK) !== 0,
		metaKey: (modifiers & (Gdk.ModifierType.META_MASK | Gdk.ModifierType.SUPER_MASK)) !== 0,
		shiftKey: (modifiers & Gdk.ModifierType.SHIFT_MASK) !== 0,
		repeat: false,
		isComposing: false,
		defaultPrevented: false,
		cancelBubble: false,
		preventDefault() {
			event.defaultPrevented = true
		},
		stopPropagation() {
			event.cancelBubble = true
		},
	}
	return event
}
