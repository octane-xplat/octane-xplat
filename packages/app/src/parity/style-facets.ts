// Computed-style facets both measureTree leaves report (camelCase keys on
// both sides). Keep the list small — it is the parity vocabulary, and every
// facet is one more place engines legitimately spell things differently.
export const STYLE_FACETS = [
	'backgroundColor',
	'color',
	'borderTopWidth',
	'borderTopColor',
	'borderTopLeftRadius',
	'fontSize',
	'fontWeight',
	'opacity',
	'marginLeft',
	'marginTop',
	'display',
	'flexDirection',
	'justifyContent',
	'alignItems',
] as const
