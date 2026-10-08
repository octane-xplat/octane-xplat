// Ambient host globals the packaged AppKit runtime injects — the same loose
// style as apps/macos/src/globals.d.ts and src/appkit.d.ts. Copied into the
// independent consumer so its `tsc --noEmit` covers main.ts and dev-shell.ts.

type NSClass<T> = {
	new (...args: any[]): T
	alloc(): T
	[key: string]: any
}

declare class NSObject {
	[key: string]: any
	static alloc(): any
}

interface NSApplication extends NSObject {}
declare const NSApplication: NSClass<NSApplication>

interface NSFont extends NSObject {}
declare const NSFont: NSClass<NSFont>

interface NSView extends NSObject {}
declare const NSView: NSClass<NSView>

interface NSWindow extends NSView {}
declare const NSWindow: NSClass<NSWindow>

declare const NSApplicationActivationPolicy: { [key: string]: number }
declare const NSWindowStyleMask: { [key: string]: number }

// Host-injected entry points and globals.
declare function __hostRunFile(path: string): any
declare function __xplatStopHost(): void
declare var __xplatDev: any
declare var __xplatDevModules: any
declare var __xplatOnInput: any

declare const console: {
	log(...args: any[]): void
	warn(...args: any[]): void
	error(...args: any[]): void
}

declare const process: { env: { [key: string]: string | undefined } }
declare function setTimeout(callback: () => void, ms?: number): unknown
