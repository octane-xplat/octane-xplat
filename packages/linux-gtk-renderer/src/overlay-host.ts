import Gtk from 'gi://Gtk?version=4.0'

/** Options for an overlay layer mounted on the root's Gtk.Overlay. */
export interface OverlayLayerOptions {
	/** Modal layers claim all pointer input under the scrim so background
	 *  controls do not receive it. */
	modal?: boolean
	/** Show a translucent scrim; a press on it fires `onScrimPress` (the
	 *  dismiss gesture). Defaults to `modal`. */
	scrim?: boolean
	onScrimPress?: () => void
}

/** The layer handle: `target` is the portal container, `setVisible` toggles
 *  presentation, `dispose` removes the layer and restores input/focus. */
export interface OverlayLayer {
	target: any
	setVisible(visible: boolean): void
	dispose(): void
}

interface OverlayContainer {
	host: any
	overlay?: any
	contentHost?: any
	overlayLayers?: Set<any>
	overlayLayerHandles?: Set<any>
}

/** Installs `createOverlayLayer` on a public-instance view. The layer lives
 *  inside the container's renderer-owned `Gtk.Overlay` — the RootLayout
 *  equivalent: a full-window surface stacked above the root content, in the
 *  same window (matching the native `RootLayout` and macOS `presentSurface`
 *  hosting model). */
export function bindOverlayHost(view: any, container: OverlayContainer) {
	const createOverlayLayer = (options: OverlayLayerOptions = {}): OverlayLayer => {
		const overlay = container.overlay
		if (!overlay) {
			throw new Error('linux-gtk overlay layers require a root Gtk.Overlay host.')
		}
		const modal = options.modal === true
		const useScrim = options.scrim ?? modal

		// The layer container — a full-size surface stacked above content.
		const layer = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL })
		layer.set_hexpand(true)
		layer.set_vexpand(true)
		layer.add_css_class('vx-overlay-layer')

		// The modal scrim claims pointer presses (nothing underneath receives
		// input) and forwards the dismiss gesture. Placed as the layer's first
		// child so it sits under the layer's content.
		let scrim: any = null
		if (useScrim) {
			scrim = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL })
			scrim.set_hexpand(true)
			scrim.set_vexpand(true)
			scrim.add_css_class('vx-overlay-scrim')
			if (options.onScrimPress) {
				const press = new Gtk.GestureClick()
				press.connect('pressed', () => options.onScrimPress?.())
				scrim.add_controller(press)
			}
			layer.append(scrim)
		}

		// The portal target — content mounts here.
		const target = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL })
		target.set_halign(Gtk.Align.CENTER)
		target.set_valign(Gtk.Align.CENTER)
		layer.append(target)

		// While a modal layer is open, suppress input on the root content and
		// on lower layers so background controls do not receive it.
		const suppressed: Array<[any, boolean, boolean]> = []
		const suppressLower = () => {
			if (!modal) { return }
			for (const w of [container.contentHost, ...Array.from(container.overlayLayers ?? [])]) {
				if (!w || w === layer) { continue }
				suppressed.push([w, w.can_focus, w.can_target])
				w.can_focus = false
				w.can_target = false
			}
		}
		const restoreLower = () => {
			for (const [w, canFocus, canTarget] of suppressed) {
				try {
					if (!w.destroyed) {
						w.can_focus = canFocus
						w.can_target = canTarget
					}
				} catch { }
			}
			suppressed.length = 0
		}

		const restoreFocus = (() => {
			const owner = view.get_root()
			const initial = owner?.get_focus?.()
			return () => {
				try {
					if (owner?.get_mapped?.() && initial?.get_mapped?.() && initial.get_root?.() === owner) {
						initial.grab_focus()
					}
				} catch { }
			}
		})()

		let disposed = false
		let presented = false
		;(container.overlayLayers ??= new Set()).add(layer)
		overlay.add_overlay(layer)
		// The widget set gates background input; handles are tracked
		// separately so root teardown can dispose live layers.
		const handle = {
			target,
			setVisible(visible: boolean) {
				if (disposed) { return }
				if (visible === presented) { return }
				presented = visible
				layer.set_visible(visible)
				if (visible) {
					suppressLower()
					// Capture focus into the layer so Escape and Tab reach it.
					try { target.grab_focus() } catch { }
				} else {
					restoreLower()
					restoreFocus()
				}
			},
			dispose() {
				if (disposed) { return }
				disposed = true
				restoreLower()
				restoreFocus()
				try { overlay.remove_overlay(layer) } catch { }
				container.overlayLayers?.delete(layer)
				container.overlayLayerHandles?.delete(handle)
			},
		}
		;(container.overlayLayerHandles ??= new Set()).add(handle)
		return handle
	}
	view.createOverlayLayer = createOverlayLayer
	return () => {
		if (view.createOverlayLayer === createOverlayLayer) {
			delete view.createOverlayLayer
		}
	}
}
