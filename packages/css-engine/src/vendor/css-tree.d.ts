/**
 * Minimal declarations for `css-tree` 3.x — the package ships no types and
 * upstream NativeScript consumes it untyped. Only `parse` is used.
 */
declare module 'css-tree' {
	export function parse(css: string, options?: any): any;
}
