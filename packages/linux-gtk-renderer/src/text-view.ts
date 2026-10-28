import Gtk from 'gi://Gtk?version=4.0'
import type { GtkView } from './index.js'

const viewports = new WeakMap<GtkView, GtkView>()

export function takeTextViewViewport(view: GtkView | null): GtkView | undefined {
	if (!view) return undefined
	const viewport = viewports.get(view)
	viewports.delete(view)
	return viewport
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
	viewports.set(view, viewport)
	return view
}
