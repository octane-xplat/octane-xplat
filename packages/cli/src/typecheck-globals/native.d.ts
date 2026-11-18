// Ambient JS-engine globals for the NativeScript environments (iOS/Android/Windows).
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

// Installed as real globals by every NativeScript runtime (@nativescript/core
// text module; verified on the packaged windows host too). Declared here
// rather than via lib.dom, which native programs must not see. BufferSource
// is DOM-only, so decode takes the concrete array-buffer unions.
declare class TextDecoder {
  readonly encoding: string
  decode(input: ArrayBuffer | ArrayBufferView): string
  toString(): string
}

declare class TextEncoder {
  readonly encoding: string
  encode(input?: string): Uint8Array
  toString(): string
}
