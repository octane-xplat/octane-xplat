// GTK clipboard write — Gdk.Clipboard on the default display owns the X11
// selection; a text/plain;charset=utf-8 content provider is the GTK4 write
// (there is no gdk_clipboard_set_text in GTK 4). Async to match the shared
// signature. The clipboard members are accessed through `any` — typed Gdk
// typelibs in consumer typechecks predate them.
import Gdk from 'gi://Gdk?version=4.0'
import GLib from 'gi://GLib'

/** Write text to the system clipboard. Resolves false on failure. */
export async function copyText(text: string): Promise<boolean> {
	try {
		const Gdk4: any = Gdk
		const clipboard = Gdk4.Display.get_default?.()?.get_clipboard?.()
		if (!clipboard) {
			return false
		}
		const bytes = new GLib.Bytes(new TextEncoder().encode(text))
		return (
			clipboard.set_content(
				Gdk4.ContentProvider.new_for_bytes('text/plain;charset=utf-8', bytes),
			) === true
		)
	} catch {
		return false
	}
}
