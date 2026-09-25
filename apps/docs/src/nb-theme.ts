import type { ThemeRegistration } from 'shiki'

// Code-slab theme on the nb palette — coral red for language machinery
// (keywords, storage, word operators), highlighter yellow for literal text,
// a red→yellow midpoint for literal values and attributes, lavender for
// names (types, functions, tags, decorators, object keys). fg/bg match the
// .code slab in style.css; the slab is black in both site modes.
export const nbDark: ThemeRegistration = {
	name: 'nb',
	displayName: 'NB',
	type: 'dark',
	fg: '#e8e8e0',
	bg: '#111111',
	colors: {
		'editor.foreground': '#e8e8e0',
		'editor.background': '#111111',
	},
	settings: [
		{
			settings: { foreground: '#e8e8e0', background: '#111111' },
		},
		{
			scope: ['comment', 'punctuation.definition.comment'],
			settings: { foreground: '#74746a', fontStyle: 'italic' },
		},
		{
			scope: ['punctuation', 'meta.brace'],
			settings: { foreground: '#7a7a6d' },
		},
		{
			// symbolic operators (=, =>, +, ?., ...) sit above bracket noise
			scope: 'keyword.operator',
			settings: { foreground: '#9a9a88' },
		},
		{
			scope: [
				'keyword.control',
				'keyword.operator.expression', // new, typeof, instanceof, in, of, as
				'keyword.operator.new',
				'storage',
				'variable.language', // this, super, arguments
			],
			settings: { foreground: '#ff6b6b' },
		},
		{
			scope: [
				'string',
				'punctuation.definition.string',
				'punctuation.definition.template-expression',
				'constant.character',
				'string.regexp',
				'constant.other.regexp',
			],
			settings: { foreground: '#ffd93d' },
		},
		{
			scope: [
				'constant.numeric',
				'constant.language', // true/false/null/undefined
				'constant.other',
				'support.constant',
				'variable.other.constant',
				'keyword.other.unit', // px, em, % in css
				'entity.other.attribute-name', // jsx props, css class/id selectors
			],
			settings: { foreground: '#ffab6b' },
		},
		{
			scope: [
				'entity.name', // types, classes, functions, jsx tags, commands
				'punctuation.decorator',
				'meta.decorator',
				'support.type',
				'support.class',
				'support.function',
				'support.type.property-name', // json keys, css properties
			],
			settings: { foreground: '#c4b5fd' },
		},
		{
			scope: 'invalid',
			settings: { foreground: '#ff6b6b', fontStyle: 'underline' },
		},
	],
}
