// NativeScript ships console at runtime but @nativescript/core comments out
// the global declaration (global-types.d.ts). Declare the slice we use so the
// native project keeps DOM lib out of scope (invariant: no DOM globals).
declare const console: {
	log(...args: unknown[]): void;
	info(...args: unknown[]): void;
	warn(...args: unknown[]): void;
	error(...args: unknown[]): void;
};
