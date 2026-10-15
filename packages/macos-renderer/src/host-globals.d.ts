// Ambient host globals injected by @nativescript/macos-node-api and the
// embedding Node process — runtime loader, the renderer's __xplatAppKit bridge
// channel, and the Node-ish globals the macOS host provides.
// Runtime framework loader injected by the bridge host.
// `declare global` member types resolve ambiently — module imports don't bind
// inside the global block — so AppKit names use inline import() types.
declare global {
	function dlopen(path: string, flags: number): unknown

// Cross-package bridge published by this renderer for AppKit-specific leaves
// (hover, popups, menus, sheets) and the VirtualList offset channel.
var __xplatAppKit: {
	observeHover?: (view: import('@octane-xplat/platform/macos').NSView, handlers: any) => void
	showAnchoredPopup?: (options: any) => void
	showLayer?: (options: any) => any
	attachContextMenu?: (view: import('@octane-xplat/platform/macos').NSView, options: any, onSelect: any) => void
	attachDatePicker?: (view: import('@octane-xplat/platform/macos').NSView, options: any, onChange: any) => void
	presentSheet?: (view: import('@octane-xplat/platform/macos').NSView, options: any) => any
	presentSurface?: (options: any) => any
	setSurfaceAppearance?: (view: import('@octane-xplat/platform/macos').NSView, dark: boolean) => void
	[key: string]: any
}

var __xplatVlistOffsets: { [key: string]: number } | undefined

// Node host globals.
const performance: { now(): number }
function setTimeout(callback: () => void, ms?: number): unknown
function clearTimeout(timer: unknown): void
function queueMicrotask(callback: () => void): void
const console: {
	log(...args: any[]): void
	warn(...args: any[]): void
	error(...args: any[]): void
	[key: string]: any
}

// The macOS host embeds Node — process.env reads and cwd() are real.
// Other programs may declare a narrower process ambient; duplicate ambient
// consts merge loosely under skipLibCheck, so keep both members here.
const process: { env: { [key: string]: string | undefined }; cwd(): string }
}

export {}
