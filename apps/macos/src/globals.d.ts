interface Console {
	log(...data: unknown[]): void
	info(...data: unknown[]): void
	warn(...data: unknown[]): void
	error(...data: unknown[]): void
	debug(...data: unknown[]): void
}

declare const console: Console
declare function setTimeout(callback: (...args: unknown[]) => void, delay?: number): number
declare function clearTimeout(handle?: number): void
declare function setInterval(callback: (...args: unknown[]) => void, delay?: number): number
declare function clearInterval(handle?: number): void

interface ImportMeta {
	glob<T = unknown>(patterns: string | string[], options?: { eager?: boolean }): Record<string, T>
}

// Ambient AppKit/ObjC globals injected by @nativescript/macos-node-api, in the
// same loose style as packages/macos-renderer/src/appkit.d.ts: the prerelease
// ships no generated AppKit metadata types, so bridged members are `any` while
// the class names stay usable in harness signatures.

type NSClass<T> = {
	new (...args: any[]): T
	alloc(): T
	[key: string]: any
}

declare class NSObject {
	[key: string]: any
	static alloc(): any
	static new(): any
}

interface NSApplication extends NSObject {}
declare const NSApplication: NSClass<NSApplication>

interface NSBundle extends NSObject {}
declare const NSBundle: NSClass<NSBundle>

interface NSPasteboard extends NSObject {}
declare const NSPasteboard: NSPasteboard & NSClass<NSPasteboard>

interface NSScreen extends NSObject {}
declare const NSScreen: NSClass<NSScreen>

interface NSSharingServicePicker extends NSObject {}
declare const NSSharingServicePicker: NSClass<NSSharingServicePicker>

interface NSURL extends NSObject {}
declare const NSURL: NSClass<NSURL>

interface NSUserDefaults extends NSObject {}
declare const NSUserDefaults: NSClass<NSUserDefaults>

interface NSView extends NSObject {}
declare const NSView: NSClass<NSView>

interface NSWindow extends NSView {}
declare const NSWindow: NSClass<NSWindow>

interface NSPanel extends NSWindow {}
declare const NSPanel: NSClass<NSPanel>

interface NSWorkspace extends NSObject {}
declare const NSWorkspace: NSClass<NSWorkspace>

// Enum-like bridge objects.
declare const NSApplicationActivationPolicy: { [key: string]: number }
declare const NSEventMask: { [key: string]: number }
declare const NSRectEdge: { [key: string]: number }
declare const NSWindowOrderingMode: { [key: string]: number }
declare const NSWindowStyleMask: { [key: string]: number }

// Protocol objects (opaque bridge references used in ObjCProtocols arrays).
declare const NSApplicationDelegate: any
declare const NSWindowDelegate: any

// CoreText entry points used by the harness font loader.
declare function CTFontManagerCreateFontDescriptorsFromURL(url: NSURL): any
declare function CTFontDescriptorCopyAttribute(descriptor: any, attribute: any): any
declare const kCTFontURLAttribute: any

// Accessibility announcements.
declare function NSAccessibilityPostNotificationWithUserInfo(
	element: any,
	notification: any,
	userInfo: any,
): void

declare const NSAccessibilityAnnouncementRequestedNotification: any
declare const NSAccessibilityAnnouncementKey: any
declare const NSAccessibilityPriorityKey: any
declare const NSAccessibilityPriorityLevel: { [key: string]: number }

// Vite `define` constants carrying the bundled Geist font (see vite.shared.mjs).
declare const __XPLAT_GEIST_FONT_BASE64__: string
declare const __XPLAT_GEIST_FONT_LICENSE__: string

// Node builtins reached from the packaged harness; the project carries no
// @types/node, so the handful of imports is declared here.
declare const Buffer: {
	from(data: string, encoding: string): Uint8Array
}

declare module 'node:crypto' {
	export function createHash(algorithm: string): {
		update(data: Uint8Array): { digest(encoding: string): string }
	}
}

declare module 'node:fs' {
	export function existsSync(path: string): boolean
	export function mkdirSync(path: string, options?: { recursive?: boolean }): void
	export function readFileSync(path: string, encoding?: string): any
	export function writeFileSync(path: string, data: any, encoding?: string): void
}

declare module 'node:os' {
	export function homedir(): string
}

declare module 'node:path' {
	export function join(...parts: string[]): string
	export function resolve(...parts: string[]): string
}
