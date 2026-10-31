import Gtk from 'gi://Gtk?version=4.0'
import GLib from 'gi://GLib'

type Options = {
	interactionTarget?: any
	disabled?: boolean
	openDelay?: number
	closeDelay?: number
	placement?: 'top' | 'bottom' | 'left' | 'right'
	onOpen(): void
	onClose(): void
}

/** A noninteractive native tooltip surface. UI content stays in its original
 * universal root through a portal into target; this object owns only GTK. */
function createTooltip(anchor: any, initial: Options) {
	if (!Gtk.AccessibleList) {
		throw new Error('GTK Tooltip requires GTK 4.14 or newer for accessible description references.')
	}
	const interaction = initial.interactionTarget ?? anchor
	let options = initial
	let disposed = false
	let opening: number | null = null
	let closing: number | null = null
	let tick: number | null = null
	let visible = false
	let previousGeometry = ''
	let described: any = null
	const connections: Array<[any, number]> = []
	let scrollConnections: Array<[any, number]> = []
	const target = new Gtk.Box({
		orientation: Gtk.Orientation.VERTICAL,
		accessible_role: Gtk.AccessibleRole.TOOLTIP,
	})
	const popover = new Gtk.Popover({ autohide: false, has_arrow: true })
	popover.set_can_focus(false)
	popover.set_can_target(false)
	popover.set_child(target)
	popover.set_parent(anchor)
	const connect = (object: any, signal: string, handler: (...args: any[]) => unknown) =>
		connections.push([object, object.connect(signal, handler)])
	const clear = (kind: 'open' | 'close') => {
		const source = kind === 'open' ? opening : closing
		if (source !== null) {
			GLib.source_remove(source)
		}
		if (kind === 'open') {
			opening = null
		} else {
			closing = null
		}
	}
	const stopPositioning = () => {
		if (tick !== null) {
			anchor.remove_tick_callback(tick)
		}
		tick = null
		for (const [object, id] of scrollConnections) {
			object.disconnect(id)
		}
		scrollConnections = []
	}
	const hide = () => {
		if (described) {
			described.reset_relation(Gtk.AccessibleRelation.DESCRIBED_BY)
		}
		described = null
		clear('open')
		clear('close')
		visible = false
		stopPositioning()
		popover.popdown()
	}
	const close = () => {
		if (!disposed) {
			hide()
			options.onClose()
		}
	}
	const open = () => {
		clear('open')
		clear('close')
		if (!disposed && !options.disabled) {
			options.onOpen()
		}
	}
	const enter = () => {
		clear('open')
		clear('close')
		if (disposed || options.disabled) {
			return
		}
		opening = GLib.timeout_add(GLib.PRIORITY_DEFAULT, Math.max(0, options.openDelay ?? 500), () => {
			opening = null
			open()
			return false
		})
	}
	const leave = () => {
		clear('open')
		clear('close')
		if (disposed) {
			return
		}
		closing = GLib.timeout_add(
			GLib.PRIORITY_DEFAULT,
			Math.max(0, options.closeDelay ?? 100),
			() => {
				closing = null
				close()
				return false
			},
		)
	}
	const motion = new Gtk.EventControllerMotion()
	connect(motion, 'enter', enter)
	connect(motion, 'leave', leave)
	interaction.add_controller(motion)
	const focus = new Gtk.EventControllerFocus()
	connect(focus, 'enter', open)
	connect(focus, 'leave', close)
	interaction.add_controller(focus)
	connect(anchor, 'unmap', close)
	if (interaction !== anchor) {
		connect(interaction, 'unmap', close)
	}
	connect(popover, 'closed', () => {
		if (!visible || disposed) {
			return
		}
		visible = false
		stopPositioning()
		options.onClose()
	})
	const window = anchor.get_root()
	const keys = new Gtk.EventControllerKey()
	keys.set_propagation_phase(Gtk.PropagationPhase.CAPTURE)
	connect(keys, 'key-pressed', (_controller, key) => {
		if (key !== 65307 || disposed) {
			return false
		}
		const consume = visible
		close()
		return consume
	})
	window?.add_controller(keys)
	const present = () => {
		// Mason's layout manager allocates logical children only; the popup is
		// a native child outside that graph. Invalidate its cached allocation
		// when anchor bounds change before asking GTK to position it.
		const geometry = JSON.stringify(
			anchor.getBounds?.() ?? [anchor.get_width(), anchor.get_height()],
		)
		if (geometry !== previousGeometry) {
			previousGeometry = geometry
			popover.queue_resize()
		}
		popover.present()
	}
	const position = () => {
		const positions = {
			top: Gtk.PositionType.TOP,
			bottom: Gtk.PositionType.BOTTOM,
			left: Gtk.PositionType.LEFT,
			right: Gtk.PositionType.RIGHT,
		}
		popover.set_position(positions[options.placement ?? 'top'])
		if (visible) {
			present()
		}
	}
	return {
		target,
		popover,
		configure(next: Options) {
			if (disposed) {
				return
			}
			options = next
			position()
			if (options.disabled) {
				close()
			}
		},
		show() {
			if (disposed || options.disabled || visible || !anchor.get_mapped()) {
				return
			}
			visible = true
			const recipient = (widget: any): any => {
				if (widget === popover) {
					return null
				}
				if (widget instanceof Gtk.Entry || widget instanceof Gtk.Button || widget.get_focusable()) {
					return widget
				}
				for (let child = widget.get_first_child(); child; child = child.get_next_sibling()) {
					const found = recipient(child)
					if (found) {
						return found
					}
				}
				return null
			}
			described = recipient(interaction) ?? interaction
			described.update_relation(
				[Gtk.AccessibleRelation.DESCRIBED_BY],
				[Gtk.AccessibleList.new_from_list([target])],
			)
			position()
			for (let parent = anchor.get_parent(); parent; parent = parent.get_parent()) {
				if (!(parent instanceof Gtk.ScrolledWindow)) {
					continue
				}
				for (const adjustment of [parent.hadjustment, parent.vadjustment]) {
					scrollConnections.push([adjustment, adjustment.connect('value-changed', close)])
				}
			}
			popover.popup()
			tick = anchor.add_tick_callback(() => {
				if (!visible || disposed) {
					tick = null
					return false
				}
				present()
				return true
			})
		},
		hide: () => {
			if (!disposed) {
				hide()
			}
		},
		dispose() {
			if (disposed) {
				return
			}
			disposed = true
			hide()
			for (const [object, id] of connections) {
				object.disconnect(id)
			}
			interaction.remove_controller(motion)
			interaction.remove_controller(focus)
			window?.remove_controller(keys)
			popover.unparent()
		},
	}
}

export function bindTooltips(view: any): () => void {
	let disposed = false
	const sessions = new Set<ReturnType<typeof createTooltip>>()
	view.createTooltip = (options: Options) => {
		if (disposed) {
			return null
		}
		const session = createTooltip(view, options)
		sessions.add(session)
		const release = session.dispose
		session.dispose = () => {
			release()
			sessions.delete(session)
		}
		return session
	}
	return () => {
		disposed = true
		for (const session of sessions) {
			session.dispose()
		}
		sessions.clear()
	}
}
