import Gtk from 'gi://Gtk?version=4.0'

/** Controller handed to openWindow callers and content resolvers — the GTK
 *  counterpart of the AppKit window controller windows.macos wraps. */
export interface GtkWindowServiceController {
	window: Gtk.Window
	/** Resolves when the window closes for any reason. */
	closed: Promise<void>
	/** Read-only for callers; the service flips it on close. */
	isClosed: boolean
	/** App-assigned close veto — returning false cancels a close request. */
	onCloseRequested: (() => boolean) | null
	close(): void
	setTitle(title: string): void
	setSize(size: { width: number; height: number }): void
}

type WindowContentResolver = (
	data: unknown,
	controller: GtkWindowServiceController,
) => unknown

export interface GtkWindowService {
	openWindow(options?: Record<string, any>): GtkWindowServiceController
	setWindowContentResolver(resolve: WindowContentResolver | null): void
}

const KINDS = new Set(['regular', 'dialog', 'popup'])

function normalizeWindowSize(size: any, source: string): { width: number; height: number } {
	if (
		!size ||
		typeof size !== 'object' ||
		!Number.isFinite(size.width) ||
		!Number.isFinite(size.height) ||
		size.width <= 0 ||
		size.height <= 0
	) {
		throw new TypeError(`${source} size must have positive finite width and height`)
	}

	return { width: size.width, height: size.height }
}

/** GTK window service backing `openWindow` from @octane-xplat/ui — each call
 *  opens its own Gtk.Window hosting a fresh universal root (the macOS
 *  openWindow/AppKit-controller equivalent). Kind is a behavior contract:
 *  'dialog' maps to a modal transient window; 'popup' to a transient
 *  non-modal one — GTK4 has no non-activating panel, so it is the closest
 *  honest mapping, not the AppKit child-window semantics. Content resolves
 *  from `options.component` or the app-installed resolver (same seam as
 *  the macOS host's setWindowContentResolver). */
export function createGtkWindowService(deps: {
	/** Mount a fresh universal root on a window's content widget. */
	mount(host: Gtk.Widget): { root: { render(c: any, p: any): void; unmount(): void } }
	/** Default parent for 'dialog'/'popup' kinds — the app's main window. */
	parentWindow(): Gtk.Window | null
}): GtkWindowService {
	let resolver: WindowContentResolver | null = null

	const open = (options: Record<string, any> = {}): GtkWindowServiceController => {
		if (options === null || typeof options !== 'object' || Array.isArray(options)) {
			throw new TypeError('openWindow options must be an object')
		}

		const kind = options.kind ?? 'regular'
		if (!KINDS.has(kind)) {
			throw new RangeError(`Unsupported GTK window kind: ${String(kind)}`)
		}

		const parentOption = options.parent ?? null
		if (parentOption !== null && typeof parentOption !== 'object') {
			throw new TypeError('openWindow parent must be a Gtk.Window or window controller')
		}
		if (parentOption?.isClosed === true) {
			throw new Error('openWindow cannot use a closed parent window')
		}
		const rawParent =
			parentOption && 'window' in parentOption ? parentOption.window : parentOption
		if (rawParent != null && !(rawParent instanceof Gtk.Window)) {
			throw new TypeError('openWindow parent must be a Gtk.Window or window controller')
		}
		const parentWindow = rawParent ?? (kind === 'regular' ? null : deps.parentWindow())
		if (kind !== 'regular' && !parentWindow) {
			throw new Error(`openWindow kind "${kind}" requires a parent window`)
		}

		const size = normalizeWindowSize(
			options.size ??
				(kind === 'regular' ? { width: 480, height: 320 } : { width: 360, height: 200 }),
			'openWindow',
		)

		const win = new Gtk.Window({
			title: String(options.title ?? 'Octane window'),
			default_width: size.width,
			default_height: size.height,
		})
		if (parentWindow) {
			win.set_transient_for(parentWindow)
		}
		if (kind === 'dialog') {
			win.set_modal(true)
		}

		const content = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL })
		win.set_child(content)
		const mounted = deps.mount(content)

		let resolveClosed!: () => void
		const closed = new Promise<void>((resolve) => {
			resolveClosed = resolve
		})
		const controller: GtkWindowServiceController = {
			window: win,
			closed,
			isClosed: false,
			onCloseRequested: null,
			// Explicit close is a command — skips the close-request veto like
			// the macOS controller's NSWindow.close() path.
			close() {
				if (controller.isClosed) {
					return
				}
				finish()
				try {
					win.destroy()
				} catch {}
			},
			setTitle(title: string) {
				win.set_title(String(title))
			},
			setSize(next: { width: number; height: number }) {
				const n = normalizeWindowSize(next, 'setSize')
				win.set_default_size(n.width, n.height)
			},
		}
		const finish = () => {
			if (controller.isClosed) {
				return
			}
			controller.isClosed = true
			try {
				mounted.root.unmount()
			} catch {
				// Teardown is best-effort — the window is going away regardless.
			}
			resolveClosed()
		}
		// User-initiated close requests route through the veto before GTK's
		// default destroys the window; the mounted root unmounts first.
		win.connect('close-request', () => {
			if (controller.onCloseRequested?.() === false) {
				return true
			}
			finish()
			return false
		})

		const component =
			options.component ??
			(typeof resolver === 'function' ? resolver(options.data ?? null, controller) : null)
		if (typeof component !== 'function') {
			try {
				win.destroy()
			} catch {}
			throw new Error(
				options.component == null
					? 'Install a window content resolver before calling openWindow() — the GTK host bridge exposes setWindowContentResolver'
					: 'openWindow component must resolve to a component',
			)
		}
		mounted.root.render(component, options.props ?? { data: options.data ?? null, controller })
		win.present()
		return controller
	}

	return {
		openWindow: open,
		setWindowContentResolver(resolve) {
			if (resolve !== null && typeof resolve !== 'function') {
				throw new TypeError('setWindowContentResolver expects a function or null')
			}
			resolver = resolve
		},
	}
}
