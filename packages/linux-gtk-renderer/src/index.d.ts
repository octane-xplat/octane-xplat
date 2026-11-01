/// <reference path="./gi.d.ts" />
import type Gtk from 'gi://Gtk?version=4.0'
import type { UniversalHostDriver, UniversalRootOptions } from 'octane/universal/native'

import type { GtkRoot } from './root-types.js'
export type { GtkComponent, GtkRoot } from './root-types.js'

export * from 'octane/universal/native'

export declare const GTK_RENDERER_ID: 'gtk'

/** Register a stylesheet with the shared cascade (replaces by id). */
export declare function registerStylesheet(id: string, css: string): void

/** The GTK object a node owns — the bridged `GtkWidget` the driver hands to
 *  refs and host events. */
export type GtkView = Gtk.Widget & { [key: string]: any }

/** A retained element in the GTK tree — the public instance for viewless
 *  intrinsics (`#text`, `span`, `formattedstring`, `contentview`,
 *  `proxyviewcontainer`, `rootlayout`). */
export interface ElementNode {
	readonly id: number
	readonly type: string
	readonly view: GtkView | null
	[key: string]: any
}

/** Per-root state shared by the driver commands. */
export interface GtkContainer {
	host: GtkView
	nodes: Map<number, ElementNode>
	children: ElementNode[]
	root: GtkRoot | null
}

export interface GtkRootOptions extends UniversalRootOptions<GtkContainer> {}

export declare const gtkDriver: UniversalHostDriver<GtkContainer, GtkView | ElementNode | null>

export declare function createGtkContainer(host: GtkView): GtkContainer

/** Mount a universal root on a GTK widget (typically the window's content
 *  box). GJS supplies no queueMicrotask — the root installs the proven
 *  Promise-based scheduling bridge; pass `scheduleMicrotask` to override. */
export declare function createGtkRoot(
	host: GtkView,
	options?: GtkRootOptions,
): { root: GtkRoot; container: GtkContainer }
