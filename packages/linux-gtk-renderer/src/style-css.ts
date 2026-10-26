// Style-bag → GTK CSS translation — GI-free so Node tests can exercise the
// mapping directly. index.ts owns the CssProvider plumbing; this module owns
// the property table and the rule text.
//
// The cascade resolves the renderer vocabulary (numbers are points; strings
// may carry dip/percent/keywords); GTK CSS parses px/rgb()/named colors, so
// `dip` tokens are rewritten to `px` — the px→dip build rewrite means authored
// px arrive here as dip, and multi-token values (box-shadow, text-shadow) keep
// them. Percent strings pass through — GTK supports them.

type PropBag = Record<string, any>

/** camelCase style key → GTK CSS property name. */
export const CSS_PROPS: Record<string, string> = {
	background: 'background',
	backgroundColor: 'background-color',
	color: 'color',
	fontSize: 'font-size',
	fontWeight: 'font-weight',
	fontStyle: 'font-style',
	fontFamily: 'font-family',
	lineHeight: 'line-height',
	textDecoration: 'text-decoration',
	textShadow: 'text-shadow',
	boxShadow: 'box-shadow',
	borderRadius: 'border-radius',
	borderColor: 'border-color',
	borderWidth: 'border-width',
	borderStyle: 'border-style',
	padding: 'padding',
	paddingTop: 'padding-top',
	paddingRight: 'padding-right',
	paddingBottom: 'padding-bottom',
	paddingLeft: 'padding-left',
	margin: 'margin',
	marginTop: 'margin-top',
	marginRight: 'margin-right',
	marginBottom: 'margin-bottom',
	marginLeft: 'margin-left',
	minWidth: 'min-width',
	minHeight: 'min-height',
}

const DIP_RE = /(-?\d*\.?\d+)dip\b/g

function cssValue(name: string, value: unknown): string | null {
	if (typeof value === 'number') {
		// Numeric sizes are logical px; weight/style/family pass through.
		return name === 'fontWeight' || name === 'fontStyle' || name === 'fontFamily'
			? String(value)
			: `${value}px`
	}
	if (typeof value === 'string') {
		if (name === 'fontWeight') {
			return value
		}
		if (name === 'fontFamily') {
			return /[\s,]/.test(value) && !/^['"]/.test(value) ? `"${value}"` : value
		}
		// GTK CSS parses the same px/rgb()/named-color vocabulary here.
		if (/^\d+(?:\.\d+)?$/.test(value)) {
			return `${value}px`
		}
		return value.replace(DIP_RE, '$1px')
	}
	return null
}

/** Build the CssProvider rule text for one node's effective style.
 *  `selector` scopes every declaration (the per-node `xplat-n<id>` class);
 *  textfield's placeholderColor lands as a `placeholder` subrule in the same
 *  provider. Returns '' when nothing maps. */
export function gtkStyleCss(selector: string, style: PropBag | null | undefined, nodeType: string): string {
	const next: [string, string][] = []
	if (style && typeof style === 'object') {
		for (const name of Object.keys(CSS_PROPS)) {
			const decl = cssValue(name, style[name])
			if (decl !== null) {
				next.push([CSS_PROPS[name], decl])
			}
		}
	}

	// GTK's default border-style is none — a CSS borderWidth alone never
	// draws. NativeScript borders are solid, so emit it when the stylesheet
	// asked for a border without naming a style.
	const hasBorderWidth =
		style != null &&
		((typeof style.borderWidth === 'number' && style.borderWidth > 0) ||
			(typeof style.borderWidth === 'string' && parseFloat(style.borderWidth) > 0))
	if (hasBorderWidth && style!.borderStyle == null) {
		next.push(['border-style', 'solid'])
	}

	const rules: string[] = []
	if (next.length) {
		rules.push(`${selector} { ${next.map(([k, v]) => `${k}: ${v};`).join(' ')} }`)
	}
	if (nodeType === 'textfield' && style?.placeholderColor != null) {
		rules.push(`${selector} placeholder { color: ${style.placeholderColor}; }`)
	}
	return rules.join('\n')
}
