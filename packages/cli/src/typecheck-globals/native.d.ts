// Ambient JS-engine globals for the NativeScript (iOS/Android) environment.
// The runtime provides all of these but @nativescript/core leaves the global
// declarations commented out (global-types.d.ts) — same reasoning and shape
// as apps/mobile/types/globals.d.ts. Platform bridge globals (android,
// UIApplication, …) are NOT declared here: they come from the real
// @nativescript/types packages, which a package must declare when its checked
// sources use them.
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

// The bundler statically replaces process.env.NODE_ENV (vite `define`); tsc
// still needs the name in a program with no Node types. Kept narrow: other
// process.env.FOO reads stay type errors because the define cannot rewrite
// them either.
declare var process: { env: { NODE_ENV?: string } }
