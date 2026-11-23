/**
 * Minimal declarations for `css-tree` 3.x — the package ships no types and
 * upstream NativeScript consumes it untyped.
 */
declare module 'css-tree' {
	export function parse(css: string, options?: any): any;

	interface Node {
		value?: unknown;
		unit?: string;
		loc?: { end: { offset: number } } | null;
	}

	export function walk(
		ast: unknown,
		options: { visit: string; enter(node: Node): void },
	): void;
}
