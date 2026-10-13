// Ambient JS-engine globals for the macOS AppKit environment. The packaged
// JSC host shim (packages/cli/src/macos/jsc-host/shim.js) installs all of
// these on globalThis; AppKit/ObjC bridge globals are out of scope here —
// leaves that use them declare their own ambient surface.
declare var console: {
	log(...args: unknown[]): void
	info(...args: unknown[]): void
	warn(...args: unknown[]): void
	error(...args: unknown[]): void
	debug(...args: unknown[]): void
}

declare function setTimeout(callback: (...args: unknown[]) => void, delay?: number): number
declare function clearTimeout(handle?: number): void
declare function setInterval(callback: (...args: unknown[]) => void, delay?: number): number
declare function clearInterval(handle?: number): void
declare function queueMicrotask(callback: () => void): void

declare var process: { env: { NODE_ENV?: string } }
