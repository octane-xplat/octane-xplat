// Stylesheet engine subpath — the GTK renderer consumes this cascade over
// its own node adapter; keep this module and its imports AppKit-free.
export {
	computeCascade,
	INHERITED_CSS_PROPERTIES,
	type CssHostNode,
	type ComputedCascade,
	type PropBag,
} from './cascade.ts'
export {
	registerStylesheet,
	unregisterStylesheet,
	stylesheetScope,
	onStylesheetsChanged,
	setStyleEnvironment,
	type CssEnvironment,
} from './stylesheets.ts'
