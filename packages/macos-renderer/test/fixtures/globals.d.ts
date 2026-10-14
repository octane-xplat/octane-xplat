// Ambient host globals the packaged AppKit runtime injects, covering the
// consumer's `tsc --noEmit` over main.ts and dev-shell.ts. The SDK surface
// comes from the renderer's generated types.
/// <reference types="@octane-xplat/macos-renderer/types" />

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
