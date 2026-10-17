// GJS application host for the GTK renderer — owns the GtkApplication, the
// window, and the content widget a universal root mounts into. The app entry
// bundles this module and calls runGtkApp; `gjs -m` executes the bundle.
import Gtk from 'gi://Gtk?version=4.0'
import Gio from 'gi://Gio'
import { createGtkRoot } from './index.js'
import type { GtkContainer, GtkView } from './index.js'
import type { UniversalRoot } from 'octane/universal/native'

export interface GtkAppOptions {
	/** Reverse-DNS app id, e.g. `dev.xplat.demo`. */
	applicationId: string
	title?: string
	defaultWidth?: number
	defaultHeight?: number
	/** Gio.ApplicationFlags — defaults to FLAGS_NONE (primary-instance
	 *  semantics; a second launch activates the running window). */
	flags?: number
}

export interface GtkAppMount {
	app: Gtk.Application
	window: Gtk.ApplicationWindow
	/** The Gtk.Box the universal root mounts into. */
	content: GtkView
	container: GtkContainer
	root: UniversalRoot
}

/** Create the application window, mount a universal root on a vertical
 *  Gtk.Box content widget, and hand both to `mount` before presenting.
 *  Returns GtkApplication.run's exit status — call it as the app entry's
 *  last expression. */
export function runGtkApp(options: GtkAppOptions, mount: (target: GtkAppMount) => void): number {
	const app = new Gtk.Application({
		application_id: options.applicationId,
		flags: options.flags ?? Gio.ApplicationFlags.FLAGS_NONE,
	})
	app.connect('activate', () => {
		const window = new Gtk.ApplicationWindow({
			application: app,
			title: options.title ?? 'Octane App',
			default_width: options.defaultWidth ?? 560,
			default_height: options.defaultHeight ?? 420,
		})
		const content = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL, spacing: 0 })
		window.set_child(content)
		const { root, container } = createGtkRoot(content)
		mount({ app, window, content, container, root })
		window.present()
	})
	return app.run(null)
}
