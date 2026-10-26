/**
 * Vendored from @nativescript/core 9.1.3 `css/reworkcss.d.ts`, including the
 * `@layer` additions from packages/cli/patches/@nativescript__core@9.1.3.patch.
 * Type-only module — erased at strip-types.
 */

export interface Position {
	start: { line: number; column: number };
	end: { line: number; column: number };
	content?: string;
	source?: string;
}

export interface Node {
	type: 'rule' | 'keyframes' | 'declaration' | 'import' | 'media' | 'layer' | 'comment' | string;
	position?: Position;
}

export interface Declaration extends Node {
	property: string;
	value: string;
}

export interface Rule extends Node {
	selectors: string[];
	declarations: (Declaration | Node)[];
	values?: string[];
}

export type AtRule = Keyframes | Media | Layer;

export interface Keyframes extends Rule {
	name: string;
	vendor?: string;
	keyframes: Rule[];
}

export interface Media extends Node {
	media: string;
	rules: Array<Rule | AtRule>;
}

export interface Layer extends Node {
	/** Layer-name prelude — '' for an anonymous block. Statement form (`@layer a, b;`) leaves rules undefined. */
	layer: string;
	rules?: Array<Rule | AtRule>;
}

export interface StyleSheet {
	rules: Node[];
	parsingErrors?: unknown[];
}

export interface StylesheetNode extends Node {
	stylesheet: StyleSheet;
}
