import Gtk from 'gi://Gtk?version=4.0'
import Pango from 'gi://Pango'
import type { GtkView } from './index.js'

export interface TextViewControl {
	layoutView: GtkView
	scroller: GtkView
	placeholder: GtkView
	setPlaceholder(value: unknown): void
	dispose(): void
}

const controls = new WeakMap<GtkView, TextViewControl>()

export function takeTextViewControl(view: GtkView | null): TextViewControl | undefined {
	if (!view) return undefined
	const control = controls.get(view)
	controls.delete(view)
	return control
}

/** Keep the public ref on the native TextView. These private editable aliases
 * let single- and multiline editors share the driver's controlled-write path;
 * offsets are Unicode characters, as required by both GTK buffer APIs. */
export function makeTextView(): GtkView {
	const view = new Gtk.TextView({
		wrap_mode: Gtk.WrapMode.WORD_CHAR,
		accepts_tab: false,
	}) as GtkView
	const buffer = view.get_buffer()
	view.get_text = () => buffer.get_text(...buffer.get_bounds(), true)
	view.set_text = (text: string) => buffer.set_text(text, -1)
	view.get_position = () => buffer.get_iter_at_mark(buffer.get_insert()).get_offset()
	view.set_position = (position: number) => buffer.place_cursor(buffer.get_iter_at_offset(position))
	view.get_selection_bounds = () => {
		const [selected, start, end] = buffer.get_selection_bounds()
		return [selected, start.get_offset(), end.get_offset()]
	}
	view.select_region = (anchor: number, cursor: number) =>
		buffer.select_range(buffer.get_iter_at_offset(cursor), buffer.get_iter_at_offset(anchor))
	const viewport = new Gtk.ScrolledWindow({
		hscrollbar_policy: Gtk.PolicyType.NEVER,
		vscrollbar_policy: Gtk.PolicyType.AUTOMATIC,
	}) as GtkView
	viewport.propagate_natural_height = true
	viewport.propagate_natural_width = true
	viewport.set_child(view)
	const overlay = new Gtk.Overlay() as GtkView
	overlay.set_child(viewport)
	const placeholder = new Gtk.Label({ label: '', xalign: 0 }) as GtkView
	placeholder.set_yalign(0)
	placeholder.set_wrap(true)
	placeholder.wrap_mode = Pango.WrapMode.WORD_CHAR
	placeholder.set_can_target(false)
	placeholder.set_focusable(false)
	placeholder.accessible_role = Gtk.AccessibleRole.PRESENTATION
	placeholder.add_css_class('xplat-text-placeholder')
	overlay.add_overlay(placeholder)
	overlay.set_measure_overlay(placeholder, false)
	overlay.set_clip_overlay(placeholder, true)
	let hint = ''
	let disposed = false
	const update = () => placeholder.set_visible(hint !== '' && buffer.get_char_count() === 0)
	const changed = buffer.connect('changed', update)
	const position = overlay.connect(
		'get-child-position',
		(_: unknown, child: unknown, allocation: any) => {
			if (child !== placeholder) return false
			const [ok, bounds] = view.compute_bounds(overlay)
			if (!ok) return false
			const visible = view.get_visible_rect()
			const [x, y] = view.buffer_to_window_coords(Gtk.TextWindowType.WIDGET, visible.x, visible.y)
			allocation.x = Math.round(bounds.origin.x + x)
			allocation.y = Math.round(bounds.origin.y + y)
			allocation.width = Math.max(0, visible.width)
			allocation.height = Math.max(0, visible.height)
			return true
		},
	)
	update()
	controls.set(view, {
		layoutView: overlay,
		scroller: viewport,
		placeholder,
		setPlaceholder(value) {
			if (disposed) return
			hint = String(value ?? '')
			placeholder.set_label(hint)
			if (hint) view.update_property([Gtk.AccessibleProperty.PLACEHOLDER], [hint])
			else view.reset_property(Gtk.AccessibleProperty.PLACEHOLDER)
			update()
		},
		dispose() {
			if (disposed) return
			disposed = true
			buffer.disconnect(changed)
			overlay.disconnect(position)
		},
	})
	return view
}
