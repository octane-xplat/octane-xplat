import '@nativescript/macos-node-api'
import { NSFontDescriptor, NSView } from '@octane-xplat/platform/macos'

export * from 'octane/universal/native'
export interface MacOSRootOptions {
	/** Default font family for this root and its renderer-hosted overlays. */
	fontFamily?: string
}

/** Register (or replace, by id) a CSS stylesheet applied through the NS selector engine. */
export declare function registerStylesheet(id: string, css: string): void
/** Map an application-registered family to its weighted native faces. */
export declare function registerFontFamily(
	family: string,
	faces: readonly { weight: number; descriptor: NSFontDescriptor }[],
): void

export declare function createMacOSRoot(
	hostView: NSView,
	options?: MacOSRootOptions,
): import('octane/universal/native').UniversalRoot

/** @internal Compiler ABI for tabviewitem JSX spreads in xplatMacOS builds. */
export declare function __tabItemProps(props: any): any

/** @internal Compiler-owned portal wrapper for raw AppKit tab items. */
export declare function __PortalTabItem(props: any): any
/** @internal Compiler-owned portal wrapper for raw AppKit list cells. */
export declare function __PortalList(props: any): any
export { type LayoutCommit } from './layout-observers'
/** Observe renderer layout batches and visit existing roots immediately. Returns an unsubscribe function. */
export declare function observeLayoutCommits(observer: (commit: import('./layout-observers').LayoutCommit) => void): () => void
