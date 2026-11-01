// Ambient host globals the GJS runtime provides (verified present in GJS
// 1.82.3 by the feasibility proof's globals inventory). Deliberately absent:
// `document`, `navigator`, `queueMicrotask`, `performance`, `process`,
// `fetch`, `MessageChannel` — GJS does not define them, and declaring them
// here would hide real DOM/runtime assumptions from typecheck. Note GJS does
// define `window` as an alias of the global object; it is intentionally left
// undeclared so shared code cannot assume a DOM window.
declare global {
	class TextEncoder {
		encode(value: string): Uint8Array
	}
	class TextDecoder {
		decode(value: Uint8Array): string
	}
	function setTimeout(callback: () => void, ms?: number): number
	function clearTimeout(id: number): void
	function setInterval(callback: () => void, ms?: number): number
	function clearInterval(id: number): void
	function print(...args: any[]): void
	function printerr(...args: any[]): void
	const console: {
		log(...args: any[]): void
		warn(...args: any[]): void
		error(...args: any[]): void
		debug(...args: any[]): void
		[key: string]: any
	}

	/** GJS CJS-style loader — present but unused by bundled ESM entry points. */
	function require(specifier: string): any
	/** Process argv inside `gjs -m` entry points. */
	const ARGV: string[]
}

export {}
