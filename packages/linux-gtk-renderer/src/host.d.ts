import type Gtk from 'gi://Gtk?version=4.0'
import type { GtkContainer, GtkView } from './index.js'
import type { UniversalRoot } from 'octane/universal/native'

export interface GtkAppOptions {
	/** Reverse-DNS app id, e.g. `dev.xplat.demo`. */
	applicationId: string
	title?: string
	defaultWidth?: number
	defaultHeight?: number
	/** Gio.ApplicationFlags — defaults to FLAGS_NONE. */
	flags?: number
}

export interface GtkAppMount {
	app: Gtk.Application
	window: Gtk.ApplicationWindow
	content: GtkView
	container: GtkContainer
	root: UniversalRoot
}

/** Create the application window, mount a universal root on a vertical
 *  Gtk.Box content widget, and hand both to `mount` before presenting. */
export declare function runGtkApp(
	options: GtkAppOptions,
	mount: (target: GtkAppMount) => void,
): number
