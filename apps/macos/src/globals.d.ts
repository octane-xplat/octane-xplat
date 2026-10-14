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

// The AppKit/ObjC ambient surface (classes, enums, CoreText, dlopen) is
// generated — packages/macos-renderer/types, wired through this program's
// tsconfig files list. Host-injected globals stay in
// packages/macos-renderer/src/appkit.d.ts.

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
