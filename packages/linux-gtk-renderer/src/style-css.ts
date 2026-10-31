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

import { cssTransformText, resolveTransform } from './transform-style.ts'

export interface GtkStyleOptions {
	/** `~/foo.png` bundle-relative url() resolver — index.ts supplies the
	 *  app.js dirname. */
	resolveUrl?: (rel: string) => string
	/** Warn-once sink for unsupported url() schemes. */
	onWarn?: (message: string) => void
	/** Emit the NS transform as GTK CSS `transform`, % translates resolved
	 *  against this box. index.ts passes it only outside masonview — Mason
	 *  children carry the transform on their allocation instead. */
	transformBox?: { width: number; height: number }
}

/** camelCase style key → GTK CSS property name. */
export const CSS_PROPS: Record<string, string> = {
	background: 'background',
	backgroundColor: 'background-color',
	backgroundImage: 'background-image',
	backgroundPosition: 'background-position',
	backgroundRepeat: 'background-repeat',
	backgroundSize: 'background-size',
	color: 'color',
	fontSize: 'font-size',
	fontWeight: 'font-weight',
	fontStyle: 'font-style',
	fontFamily: 'font-family',
	fontVariationSettings: 'font-variation-settings',
	letterSpacing: 'letter-spacing',
	lineHeight: 'line-height',
	textDecoration: 'text-decoration',
	textShadow: 'text-shadow',
	textTransform: 'text-transform',
	boxShadow: 'box-shadow',
	borderRadius: 'border-radius',
	borderTopLeftRadius: 'border-top-left-radius',
	borderTopRightRadius: 'border-top-right-radius',
	borderBottomLeftRadius: 'border-bottom-left-radius',
	borderBottomRightRadius: 'border-bottom-right-radius',
	borderColor: 'border-color',
	borderTopColor: 'border-top-color',
	borderRightColor: 'border-right-color',
	borderBottomColor: 'border-bottom-color',
	borderLeftColor: 'border-left-color',
	borderWidth: 'border-width',
	borderTopWidth: 'border-top-width',
	borderRightWidth: 'border-right-width',
	borderBottomWidth: 'border-bottom-width',
	borderLeftWidth: 'border-left-width',
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

// Controls whose color/backgroundColor paint a subnode, not the widget's own
// node — GTK CSS names probed under GJS 1.90 / GTK 4.24: GtkSwitch is
// `switch` + `slider` gizmo (the checked track reads off `switch:checked`),
// GtkScale is `scale` + `trough`/`highlight`/`slider`, GtkProgressBar is
// `progressbar` + `trough`/`progress`. Spinner's `spinner` node takes color
// directly, so activityindicator is absent here.
const CONTROL_SUBNODES: Record<
	string,
	{ color?: [string, string]; backgroundColor?: [string, string] }
> = {
	switch: { color: ['%S slider', 'color'], backgroundColor: ['%S:checked', 'background-color'] },
	slider: {
		color: ['%S slider', 'color'],
		backgroundColor: ['%S trough > highlight', 'background-color'],
	},
	// The fill gizmo paints through its background, not `color`.
	progress: {
		color: ['%S trough > progress', 'background-color'],
		backgroundColor: ['%S trough', 'background-color'],
	},
}

const DIP_RE = /(-?\d*\.?\d+)dip\b/g
const URL_RE = /url\(\s*(['"]?)(.*?)\1\s*\)/g

function cssValue(name: string, value: unknown): string | null {
	if (typeof value === 'number') {
		if (name === 'letterSpacing') {
			// NS letterSpacing numbers are em units.
			return `${value}em`
		}

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

		if (name === 'letterSpacing') {
			// NS parseFloats strings into em as well.
			return `${parseFloat(value)}em`
		}

		// GTK CSS parses the same px/rgb()/named-color vocabulary here.
		if (/^\d+(?:\.\d+)?$/.test(value)) {
			return `${value}px`
		}

		return value.replace(DIP_RE, '$1px')
	}
	return null
}

/** Rewrite url() references: `~/` resolves against the bundle directory via
 *  the caller's resolver, `file://` passes through, anything else warns. */
function resolveBackgroundImage(value: string, options: GtkStyleOptions | undefined): string {
	return value.replace(URL_RE, (match, quote: string, raw: string) => {
		const url = raw.trim()
		if (url.startsWith('~/')) {
			const resolved = options?.resolveUrl?.(url.slice(2))
			return resolved ? `url("${resolved}")` : match
		}
		if (url.startsWith('file://') || url.startsWith('data:')) {
			return match
		}
		options?.onWarn?.(`[linux-gtk-css] ignored unsupported background-image url "${url}"`)
		return 'none'
	})
}

/** NS textStroke "width color" → 8 zero-blur text-shadows at the stroke
 *  width — GTK has no text-stroke; this is the documented approximation. */
function textStrokeShadows(value: unknown): string | null {
	const s = String(value ?? '').trim()
	if (!s) {
		return null
	}
	const space = s.indexOf(' ')
	if (space === -1) {
		return null
	}
	const width = parseFloat(s.slice(0, space))
	const color = s.slice(space + 1).trim()
	if (!(width > 0) || !color) {
		return null
	}
	const dirs = [
		[width, 0],
		[-width, 0],
		[0, width],
		[0, -width],
		[width, width],
		[width, -width],
		[-width, width],
		[-width, -width],
	]
	return dirs.map(([x, y]) => `${x}px ${y}px 0 ${color}`).join(', ')
}

function numericPositive(value: unknown): boolean {
	if (typeof value === 'number') {
		return value > 0
	}
	if (typeof value === 'string') {
		return parseFloat(value) > 0
	}
	return false
}

/** Build the CssProvider rule text for one node's effective style.
 *  `selector` scopes every declaration (the per-node `xplat-n<id>` class);
 *  textfield's placeholderColor lands as a `placeholder` subrule and control
 *  color/backgroundColor land on their subnode selectors in the same
 *  provider. Returns '' when nothing maps. */
export function gtkStyleCss(
	selector: string,
	style: PropBag | null | undefined,
	nodeType: string,
	options?: GtkStyleOptions,
): string {
	const next: [string, string][] = []
	const extra: string[] = []
	const subnodes = CONTROL_SUBNODES[nodeType]

	if (style && typeof style === 'object') {
		for (const name of Object.keys(CSS_PROPS)) {
			const value = style[name]
			if (value == null) {
				continue
			}

			// Control color/backgroundColor paint their subnode instead of
			// the widget node.
			if (subnodes && (name === 'color' || name === 'backgroundColor') && subnodes[name]) {
				const [subSel, cssName] = subnodes[name]!
				extra.push(`${subSel.replace('%S', selector)} { ${cssName}: ${value}; }`)
				continue
			}

			let decl = cssValue(name, value)
			if (decl === null) {
				continue
			}

			if (name === 'backgroundImage') {
				decl = resolveBackgroundImage(decl, options)
			}

			next.push([CSS_PROPS[name], decl])
		}
	}

	// GTK's default border-style is none — a CSS borderWidth alone never
	// draws. NativeScript borders are solid, so emit it when the stylesheet
	// asked for a border without naming a style.
	const hasBorderWidth =
		style != null &&
		(numericPositive(style.borderWidth) ||
			numericPositive(style.borderTopWidth) ||
			numericPositive(style.borderRightWidth) ||
			numericPositive(style.borderBottomWidth) ||
			numericPositive(style.borderLeftWidth))
	if (hasBorderWidth && style!.borderStyle == null) {
		next.push(['border-style', 'solid'])
	}

	// text-stroke approximation rides the same text-shadow declaration,
	// appended after any authored shadows.
	const stroke = textStrokeShadows(style?.textStroke)
	if (stroke) {
		const idx = next.findIndex(([k]) => k === 'text-shadow')
		if (idx === -1) {
			next.push(['text-shadow', stroke])
		} else {
			next[idx] = ['text-shadow', `${next[idx][1]}, ${stroke}`]
		}
	}

	const box = options?.transformBox
	const transform = box ? resolveTransform(style) : null
	if (transform && box) {
		next.push(['transform', cssTransformText(transform, box.width, box.height)])
		next.push(['transform-origin', 'center'])
	}

	const rules: string[] = []
	if (next.length) {
		rules.push(`${selector} { ${next.map(([k, v]) => `${k}: ${v};`).join(' ')} }`)
	}
	rules.push(...extra)
	if (nodeType === 'textfield' && style?.placeholderColor != null) {
		rules.push(`${selector} placeholder { color: ${style.placeholderColor}; }`)
	}
	if (nodeType === 'textview') {
		const font: Record<string, unknown> = {}
		for (const key of [
			'fontSize',
			'fontFamily',
			'fontWeight',
			'fontStyle',
			'fontVariationSettings',
			'letterSpacing',
			'lineHeight',
			'color',
		]) {
			if (style?.[key] != null) {
				font[key] = style[key]
			}
		}
		const layout = selector + '-layout'
		const inherited = gtkStyleCss(layout, font, 'textview-hint-host')
		if (inherited) {
			rules.push(inherited)
		}
		rules.push(
			`${layout} .xplat-text-placeholder { color: ${style?.placeholderColor ?? 'alpha(currentColor, 0.5)'}; }`,
		)
	}
	return rules.join('\n')
}


// ---------------------------------------------------------------------------
// Viewless <span> runs — style-bag → Pango markup for Gtk.Label hosts. GTK
// CSS cannot address sub-fragments of label text; the renderer folds span
// children into the host's label, and styled runs ride Pango attributes in
// `set_markup` instead. Unmapped keys (e.g. textShadow, textStroke) have no
// fragment-level equivalent and stay dropped, as before.
// ---------------------------------------------------------------------------

/** Escapes text for Pango markup (attribute-safe too: ' and " go through). */
export function markupEscape(text: string): string {
	return text
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/'/g, '&apos;')
		.replace(/"/g, '&quot;')
}

/** NS StyleProp → flat bag; arrays merge later-over-earlier, non-objects drop. */
export function normalizeStyleBag(style: unknown): PropBag {
	const out: PropBag = {}
	const walk = (v: unknown) => {
		if (Array.isArray(v)) {
			v.forEach(walk)
		} else if (v !== null && typeof v === 'object') {
			Object.assign(out, v)
		}
	}
	walk(style)
	return out
}

function pangoColor(value: unknown): string | null {
	if (typeof value === 'string' && value.trim() !== '') {
		return value.trim()
	}
	return null
}

/** fontSize → Pango `font_size`: numbers/px/pt become 1024ths of a point;
 *  keyword and % sizes pass through. */
function pangoSize(value: unknown): string | null {
	if (typeof value === 'number' && Number.isFinite(value)) {
		return String(Math.round(value * 1024))
	}
	if (typeof value === 'string') {
		const s = value.trim()
		const n = parseFloat(s)
		if (s.endsWith('px') || s.endsWith('pt')) {
			return Number.isFinite(n) ? String(Math.round(n * 1024)) : null
		}
		return s === '' ? null : s
	}
	return null
}

/** One span's style bag → Pango attribute map for a `<span ...>` run.
 *  Both hyphenated and camel inputs arrive (props.style is camelCase; a
 *  className carries no per-fragment cascade so it is not consulted). */
export function spanPangoAttrs(style: PropBag): Record<string, string> {
	const attrs: Record<string, string> = {}
	const put = (key: string, value: unknown) => {
		if (value !== null && value !== undefined && value !== '') {
			attrs[key] = String(value)
		}
	}

	put('foreground', pangoColor(style.color))
	put('background', pangoColor(style.backgroundColor))
	put('font_weight', style.fontWeight)
	put('font_style', style.fontStyle)
	put('font_family', style.fontFamily)
	put('font_size', pangoSize(style.fontSize))
	put('stretch', style.fontStretch)

	const letterSpacing = Number(style.letterSpacing)
	if (Number.isFinite(letterSpacing) && letterSpacing !== 0) {
		put('letter_spacing', Math.round(letterSpacing * 1024))
	}

	const opacity = Number(style.opacity)
	if (Number.isFinite(opacity)) {
		put('alpha', `${Math.round(Math.min(1, Math.max(0, opacity)) * 100)}%`)
	}

	if (style.fontVariant === 'small-caps' || style.fontVariant === 'smallcaps') {
		put('variant', 'smallcaps')
	} else if (style.fontVariant === 'normal') {
		put('variant', 'normal')
	}

	const deco = `${style.textDecoration ?? ''} ${style.textDecorationLine ?? ''}`.toLowerCase()
	if (deco.includes('underline')) {
		put('underline', style.textDecorationStyle === 'double' ? 'double' : 'single')
	}
	if (deco.includes('line-through') || deco.includes('linethrough')) {
		put('strikethrough', 'true')
	}
	const decoColor = pangoColor(style.textDecorationColor)
	if (decoColor !== null) {
		put('underline_color', decoColor)
		put('strikethrough_color', decoColor)
	}

	return attrs
}

/** textTransform has no Pango fragment attribute — the run text is rewritten
 *  before markup assembly, matching the visual result of the CSS property. */
export function spanTextTransform(style: PropBag): ((text: string) => string) | null {
	switch (style?.textTransform) {
		case 'uppercase':
			return (s) => s.toUpperCase()
		case 'lowercase':
			return (s) => s.toLowerCase()
		case 'capitalize':
			return (s) => s.replace(/(^|\s)(\p{L})/gu, (_m, sp: string, c: string) => sp + c.toUpperCase())
		default:
			return null
	}
}
