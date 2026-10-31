import Gtk from 'gi://Gtk?version=4.0'
import Gdk from 'gi://Gdk?version=4.0'

/** Scope palette key handling to the search entry: navigation keys reach the
 *  controller in the capture phase, everything else types through. `input`
 *  is the ref — on GTK, refs are the real Gtk widgets (the Gtk.Entry here).
 *  Mirrors `bindCommandPaletteKeys` in the macOS leaf. */
export function bindCommandPaletteKeys(
	input: any,
	keyDown: (event: any) => void,
	autoFocus: boolean,
	queryChanged: (query: string) => void,
): () => void {
	const entry = input
	if (!entry?.add_controller) {
		return () => { }
	}

	const grab = () => {
		try {
			entry.grab_focus?.()
		} catch { }
	}
	// Focus may fail while the freshly created layer is still unmapped — grab
	// now, and again when the entry maps.
	const mapId = entry.connect?.('map', grab) ?? 0
	if (autoFocus) {
		grab()
	}

	const keys: Record<number, string> = {
		[Gdk.KEY_Return]: 'Enter',
		[Gdk.KEY_KP_Enter]: 'Enter',
		[Gdk.KEY_Down]: 'ArrowDown',
		[Gdk.KEY_Up]: 'ArrowUp',
		[Gdk.KEY_Page_Up]: 'PageUp',
		[Gdk.KEY_Page_Down]: 'PageDown',
	}

	const controller = new Gtk.EventControllerKey()
	controller.set_propagation_phase(Gtk.PropagationPhase.CAPTURE)
	entry.add_controller(controller)
	const keyId = controller.connect('key-pressed', (_c: any, keyval: number) => {
		const key = keys[keyval]
		if (!key) {
			return false
		}

		let prevented = false
		keyDown({
			key,
			preventDefault: () => {
				prevented = true
			},
		})
		return prevented
	})

	const changeId =
		typeof entry.connect === 'function'
			? entry.connect('changed', () => queryChanged(String(entry.get_text?.() ?? '')))
			: 0

	return () => {
		try {
			if (keyId) {
				controller.disconnect(keyId)
			}

			if (mapId) {
				entry.disconnect(mapId)
			}

			entry.remove_controller?.(controller)
			if (changeId) {
				entry.disconnect(changeId)
			}
		} catch { }
	}
}
