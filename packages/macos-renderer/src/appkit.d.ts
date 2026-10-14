// Ambient host globals injected by @nativescript/macos-node-api and the
// embedding Node process. The AppKit SDK surface itself is generated — see
// ../types/ (objc-metadata-generator output, installed by the cli's
// jsc-host/build-metadata.sh). This file only carries what the SDK sweep
// cannot declare: host-injected globals and the CG-geometry names the SDK
// aliases to NS-prefixed spellings in documentation but emits canonically.

// Constructor-shaped class reference for AppKit views handed around as
// factories (e.g. layer hosts accepting `View?: NSClass<NSView>`).
type NSClass<T> = {
	new (...args: any[]): T
	alloc(): T
	[key: string]: any
}

// The generator emits only the CoreGraphics spellings; AppKit code and docs
// use the NS aliases for the same structs.
type NSPoint = CGPoint
type NSSize = CGSize
type NSRect = CGRect

// Runtime framework loader injected by the bridge host. The generated SDK
// surface declares it too; loose programs (iOS/Windows sweeps) need this
// ambient copy.
declare function dlopen(path: string, flags: number): unknown

// The node-api runtime attaches extend() to every class constructor for
// method-bag subclassing; the metadata emitter doesn't model it.
declare namespace NSObject {
	function extend(definition: object, options?: object): any
}

// Cross-package bridge published by this renderer for AppKit-specific leaves
// (hover, popups, menus, sheets) and the VirtualList offset channel.
declare var __xplatAppKit: {
	observeHover?: (view: NSView, handlers: any) => void
	showAnchoredPopup?: (options: any) => void
	showLayer?: (options: any) => any
	attachContextMenu?: (view: NSView, options: any, onSelect: any) => void
	attachDatePicker?: (view: NSView, options: any, onChange: any) => void
	presentSheet?: (view: NSView, options: any) => void
	presentSurface?: (options: any) => any
	setSurfaceAppearance?: (view: NSView, dark: boolean) => void
	[key: string]: any
}

declare var __xplatVlistOffsets: { [key: string]: number } | undefined

// Node host globals.
declare const performance: { now(): number }
declare function setTimeout(callback: () => void, ms?: number): unknown
declare function clearTimeout(timer: unknown): void
declare function queueMicrotask(callback: () => void): void
declare const console: {
	log(...args: any[]): void
	warn(...args: any[]): void
	error(...args: any[]): void
	[key: string]: any
}

// The macOS host embeds Node — process.env reads and cwd() are real.
// Other programs may declare a narrower process ambient; duplicate ambient
// consts merge loosely under skipLibCheck, so keep both members here.
declare const process: { env: { [key: string]: string | undefined }; cwd(): string }
