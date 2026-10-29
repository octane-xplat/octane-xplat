import Gtk from 'gi://Gtk?version=4.0'
import Gdk from 'gi://Gdk?version=4.0'
import GLib from 'gi://GLib'
import type { ShortcutEvent } from './engine/types/public.js'
import { cleanupAll, pathDepth, pathFrom, unwrap, type ShortcutHost } from './host-types.js'
import { gtkCode } from './physical-codes.js'

const named: Record<string, string> = {
	Return: 'Enter',
	KP_Enter: 'Enter',
	ISO_Left_Tab: 'Tab',
	space: ' ',
	BackSpace: 'Backspace',
	Delete: 'Delete',
	Prior: 'PageUp',
	Next: 'PageDown',
	Left: 'ArrowLeft',
	Right: 'ArrowRight',
	Up: 'ArrowUp',
	Down: 'ArrowDown',
	Control_L: 'Ctrl',
	Control_R: 'Ctrl',
	Shift_L: 'Shift',
	Shift_R: 'Shift',
	Alt_L: 'Alt',
	Alt_R: 'Alt',
	Meta_L: 'Meta',
	Meta_R: 'Meta',
	Super_L: 'Meta',
	Super_R: 'Meta',
}

export const host: ShortcutHost = {
	delay(callback, milliseconds) {
		let active = true
		const timer = GLib.timeout_add(GLib.PRIORITY_DEFAULT, Math.max(1, milliseconds), () => {
			active = false
			callback()
			return GLib.SOURCE_REMOVE
		})
		return () => {
			if (active) {
				active = false
				GLib.source_remove(timer)
			}
		}
	},
	platform: () => 'linux',
	boundaryDepth: pathDepth,
	isEditableTarget(target) {
		return pathFrom(target, (node) => node.get_parent?.()).some(
			(node) =>
				node instanceof Gtk.Editable ||
				node instanceof Gtk.TextView ||
				node instanceof Gtk.DropDown,
		)
	},
	subscribe(target, callbacks) {
		const widget = unwrap(target)
		if (typeof widget?.add_controller !== 'function' || !widget.get_root?.()) {
			throw new Error('Shortcuts require an attached GTK4 widget')
		}
		const releases: (() => void)[] = []
		const held = new Set<number>()
		let active = true
		const reset = () => {
			held.clear()
			if (active) {
				callbacks.reset()
			}
		}
		try {
			// Legacy is required for cancellable key-up: EventControllerKey::key-released is void.
			// Bubble after native editors so their IM contexts filter composition first.
			const controller = new Gtk.EventControllerLegacy()
			controller.set_propagation_phase(Gtk.PropagationPhase.BUBBLE)
			widget.add_controller(controller)
			releases.push(() => widget.remove_controller(controller))
			const id = controller.connect('event', (_controller: unknown, raw: any) => {
				if (!active) {
					return false
				}
				const type = raw.get_event_type()
				if (type !== Gdk.EventType.KEY_PRESS && type !== Gdk.EventType.KEY_RELEASE) {
					return false
				}
				const down = type === Gdk.EventType.KEY_PRESS
				const keycode = raw.get_keycode()
				const repeat = down && held.has(keycode)
				if (down) {
					held.add(keycode)
				} else {
					held.delete(keycode)
				}
				const keyval = raw.get_keyval()
				const name = Gdk.keyval_name(keyval) ?? ''
				const unicode = Gdk.keyval_to_unicode(keyval)
				const key =
					named[name] ??
					(name.startsWith('dead_')
						? 'Dead'
						: unicode
							? String.fromCodePoint(unicode)
							: name || 'Unidentified')
				const state = Number(raw.get_modifier_state())
				const mask = Gdk.ModifierType
				const focus = widget.get_root()?.get_focus?.() ?? widget
				const path = pathFrom(focus, (node) => node.get_parent?.())
				let prevented = false,
					stopped = false
				const event: ShortcutEvent = {
					type: down ? 'keydown' : 'keyup',
					key,
					code: gtkCode(keycode),
					target: focus,
					altKey: Boolean(state & mask.ALT_MASK),
					ctrlKey: Boolean(state & mask.CONTROL_MASK),
					metaKey: Boolean(state & (mask.META_MASK | mask.SUPER_MASK)),
					shiftKey: Boolean(state & mask.SHIFT_MASK),
					repeat,
					isComposing: key === 'Dead' || key === 'Multi_key',
					get defaultPrevented() {
						return prevented
					},
					preventDefault: () => {
						prevented = true
					},
					stopPropagation: () => {
						stopped = true
					},
					composedPath: () => [...path],
				}
				if (down) {
					callbacks.capture?.(event)
				}
				callbacks.key(event)
				return prevented || stopped
			})
			releases.push(() => controller.disconnect(id))
			const focusController = new Gtk.EventControllerFocus()
			widget.add_controller(focusController)
			releases.push(() => widget.remove_controller(focusController))
			const leave = focusController.connect('leave', reset)
			releases.push(() => focusController.disconnect(leave))
			const root = widget.get_root()
			const inactive = root.connect('notify::is-active', () => {
				if (!root.is_active) {
					reset()
				}
			})
			releases.push(() => root.disconnect(inactive))
		} catch (error) {
			active = false
			cleanupAll(releases)
			throw error
		}
		return () => {
			if (active) {
				active = false
				held.clear()
				cleanupAll(releases)
			}
		}
	},
}
