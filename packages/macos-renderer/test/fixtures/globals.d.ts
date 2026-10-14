// Host globals the packaged AppKit runtime injects. The AppKit class surface
// is module-scoped now — sources import it from @octane-xplat/platform/macos.

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
