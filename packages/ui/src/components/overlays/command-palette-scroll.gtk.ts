import Gtk from 'gi://Gtk?version=4.0'

/** Scroll the palette's ScrolledWindow so the highlighted row is visible —
 *  walk ancestors for the scrolled window and clamp its vadjustment around
 *  the row's translated y. Mirrors the AppKit `scrollRectToVisible` helper. */
export function scrollCommandPaletteHighlight(row: any): void {
	const widget = row
	for (let cur = widget?.get_parent?.(); cur; cur = cur.get_parent?.()) {
		if (cur instanceof Gtk.ScrolledWindow) {
			const [ok, dx, dy] = widget.translate_coordinates(cur, 0, 0) ?? [false, 0, 0]
			void dx
			if (!ok) {
				return
			}

			const adj = cur.get_vadjustment()
			const top = dy
			const bottom = top + widget.get_height()
			const page = adj.get_page_size()
			let value = adj.get_value()
			if (top < value) {
				value = top
			} else if (bottom > value + page) {
				value = bottom - page
			}

			adj.set_value(
				Math.max(adj.get_lower(), Math.min(value, Math.max(adj.get_lower(), adj.get_upper() - page))),
			)
			return
		}
	}
}
