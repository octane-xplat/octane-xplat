// Shared helpers and types for the per-component parity assertions
// (<Component>.parity.check.ts), executed by scripts/parity-check.ts against
// parity-report/<target>.json dumps — never imported by app code.
//
// Per check:
//   fixture  — matches the cell name in the sibling <Component>.parity.tsrx
//   elements — logical name → vx-* class inside the fixture cell
//   check(m) — per-target invariants; m('track') → {box:{x,y,w,h}, style}
//              with box measured relative to the fixture's .parity-box. The
//              macOS dump also includes frameBox (the raw NSView allocation);
//              box uses AppKit's alignment rect to exclude internal control
//              cell padding from the shared content geometry.
//              Return rows [name, ok, detail?].
//   equal    — 'el.box.<f>' | 'el.style.<f>' paths that must
//              agree across applicable targets (skipped with one dump).
//   targets  — optional target allowlist; omitted checks run against every dump.
//   equalTargets — optional allowlist for cross-target equality; defaults to targets.

/** One node in a measured dump. The shape is shared by
 *  packages/app/src/parity/measure.web.ts (DOM leaf) and measure.ts
 *  (NativeScript leaf); fields the dump can't produce for a node stay
 *  undefined at runtime but are declared required where checks rely on them —
 *  resolve() throws for missing nodes, so a check that reads el.box can
 *  assume the cell produced a frame. */
export interface MeasuredBox {
	/** Left edge, relative to the fixture's .parity-box. */
	x: number
	/** Top edge, relative to the fixture's .parity-box. */
	y: number
	/** Width in the dump's logical units. */
	w: number
	/** Height in the dump's logical units. */
	h: number
}

export interface MeasuredNode {
	/** Element tag as the leaf reports it. */
	tag?: string
	/** Element id, when the leaf captured one. */
	id?: string
	/** Resolved class list. */
	classes?: string[]
	/** Shared content geometry — alignment rect on AppKit, border box elsewhere. */
	box: MeasuredBox
	/** Raw platform frame (NSView allocation on macOS); internal padding included. */
	frameBox?: MeasuredBox
	/** Resolved style key/value pairs for the node. */
	style: Record<string, string>
	/** Text content, for leaves that capture it. */
	text?: string
	/** Per-line horizontal advances for shaped text. */
	textLineAdvances?: number[]
	/** Number of laid-out text lines. */
	textLineCount?: number
	/** Content-area geometry inside padding. */
	contentBox: MeasuredBox
	/** Font as the platform resolved it after shaping/fallback. */
	resolvedFont: {
		/** Resolved family name. */
		family?: string
		/** Concrete face/style within the family. */
		face?: string
		/** Point size used for shaping. */
		size?: number
		/** Resolved line height. */
		lineHeight?: number
		/** Resolved numeric weight. */
		weight?: number
		/** Extra spacing added per line (Android-style metrics). */
		lineSpacingExtra?: number
		/** Line-spacing multiplier (Android-style metrics). */
		lineSpacingMultiplier?: number
		/** Line height used by the actual layout pass. */
		layoutLineHeight?: number
		/** Runtime-measured layout details for multi-line text. */
		actualLayout?: {
			/** Lines actually laid out. */
			lineCount?: number
			/** Total laid-out height. */
			height?: number
			/** Per-line vertical extents. */
			lines?: { top?: number; bottom?: number }[]
			/** Measured text height vs the view's allocated height. */
			measuredHeight?: number
			/** View's allocated height. */
			viewHeight?: number
		}
	}
	/** Placeholder text, for input leaves that capture it. */
	placeholder?: string
	/** Placeholder geometry — a zero box when no placeholder renders. */
	placeholderBox: MeasuredBox
	/** Resolved placeholder styling. */
	placeholderStyle?: { color: string; opacity: string }
}

export interface ParityDump {
	/** Target name the dump was produced on (web/ios/android/macos). */
	target: string
	/** Fixture cell name → measured nodes, in fixture order. */
	cells?: Record<string, MeasuredNode[]>
}

/** One assertion row emitted by a check — name, pass flag, optional detail. */
export type CheckRow = [name: string, ok: boolean, detail?: unknown]
/** Resolves a logical element name to its measured node; throws when missing. */
export type Resolve = (name: string) => MeasuredNode
/** A cross-target equality path — 'el.box.<f>'/'el.style.<f>' style selectors,
 *  optionally with absolute/relative tolerances. */
export type EqualRule = string | { path: string; tolerance?: number; relativeTolerance?: number }

export interface ParityCheck {
	/** Cell name in the sibling <Component>.parity.tsrx fixture. */
	fixture: string
	/** Logical element name → vx-* class inside the fixture cell. */
	elements: Record<string, string>
	/** Paths that must agree across applicable targets (skipped with one dump). */
	equal?: EqualRule[]
	/** Target allowlist; omitted checks run against every dump. */
	targets?: string[]
	/** Allowlist for cross-target equality; defaults to `targets`. */
	equalTargets?: string[]
	/** Per-target invariant assertions. */
	check: (m: Resolve, target: string, dump: ParityDump) => CheckRow[]
}

/** Absolute-tolerance numeric comparison — parity checks tolerate sub-pixel drift. */
export const near = (
	a: number | null | undefined,
	b: number | null | undefined,
	tol = 0.51,
): boolean => a != null && b != null && Math.abs(a - b) <= tol

/** CheckRow asserting a node's box is exactly w×h (within tol). */
export const dims = (el: MeasuredNode, w: number, h: number, tol?: number): CheckRow => [
	`${w}×${h}`,
	near(el.box?.w, w, tol) && near(el.box?.h, h, tol),
	`${el.box?.w}×${el.box?.h}`,
]

/** CheckRow asserting a node reads as circular — 50% radius or radius ≥ w/2. */
export const circular = (el: MeasuredNode): CheckRow => {
	const radius = String(el.style?.borderTopLeftRadius ?? '')
	const width = el.box?.w
	const height = el.box?.h
	const round = radius.endsWith('%')
		? near(Number.parseFloat(radius), 50) && near(width, height)
		: Number.parseFloat(radius) >= width / 2 && near(width, height)

	return ['thumb corners form a circle', round, `${radius} on ${width}×${height}`]
}

/** Selector string for an EqualRule — used for reporting/skip lists. */
export const equalPath = (rule: EqualRule): string => (typeof rule === 'string' ? rule : rule.path)

/** Cross-target equality rules for short text fixtures. */
export const textEqual: EqualRule[] = [
	// Font shaping varies slightly by renderer; exact size, weight, line height,
	// and color checks below keep larger typography changes visible.
	{ path: 'text.box.w', relativeTolerance: 0.03 },
	{ path: 'text.box.h', tolerance: 1 },
	'text.style.fontSize',
	'text.style.fontWeight',
	'text.style.lineHeight',
	'text.style.color',
]

/** Equality rules for long/multi-line text — drops rules shaping can't hold. */
export const textLongEqual: EqualRule[] = textEqual.filter(
	(rule) => equalPath(rule) !== 'text.box.h',
)

/** Equality rules for heading fixtures. */
export const headingEqual: EqualRule[] = [
	'heading.box.x',
	'heading.box.y',
	'heading.box.w',
	{ path: 'heading.box.h', tolerance: 1 },
	'heading.style.fontSize',
	'heading.style.fontWeight',
	'heading.style.color',
]

/** Asserts heading metrics for the given font size. */
export function headingRows(m: Resolve, size: number): CheckRow[] {
	const heading = m('heading')
	const weight = String(heading.style?.fontWeight ?? '').toLowerCase()
	return [
		[
			'heading starts at the fixture origin',
			near(heading.box?.x, 0, 0.5) && near(heading.box?.y, 0, 0.5),
			`${heading.box?.x},${heading.box?.y}`,
		],
		['heading width is 520px', near(heading.box?.w, 520, 1), heading.box?.w],
		[
			`heading font size is ${size}px`,
			near(Number.parseFloat(heading.style?.fontSize), size, 0.05),
			heading.style?.fontSize,
		],
		[
			'heading weight is bold',
			weight === 'bold' || Number(weight) === 700,
			heading.style?.fontWeight,
		],
	]
}

/** Asserts class-applied text size and line height. */
export function textClassRows(m: Resolve, size: number, lineHeight: number): CheckRow[] {
	const text = m('text')
	return [
		[
			`text font size is ${size}px`,
			near(Number.parseFloat(text.style?.fontSize), size, 0.05),
			text.style?.fontSize,
		],
		[
			`text line height is ${lineHeight}px`,
			near(Number.parseFloat(text.style?.lineHeight), lineHeight, 0.05),
			text.style?.lineHeight,
		],
	]
}

/** Asserts body-text height (and width when supplied). */
export function textRows(m: Resolve, height: number, width?: number): CheckRow[] {
	const text = m('text')
	const rows: CheckRow[] = [
		[`text height is ${height}px`, near(text.box?.h, height, 1), text.box?.h],
		['text is inside the fixture box', text.box?.x >= 0 && text.box?.y >= 0],
	]

	if (width !== undefined) {
		rows.unshift([`text width is ${width}px`, near(text.box?.w, width, width * 0.03), text.box?.w])
	}

	return rows
}

/** Asserts multi-line text layout for the target. */
export function textLongRows(m: Resolve, target: string): CheckRow[] {
	const text = m('text')
	const styleLineHeight = Number.parseFloat(text.style?.lineHeight)
	const rows: CheckRow[] = [
		['text line height is 20px', near(styleLineHeight, 20, 0.05), text.style?.lineHeight],
	]

	if (target === 'web' || target === 'macos') {
		rows.push(...textRows(m, 40))
		rows.push(['text wraps to two lines', text.textLineCount === 2, text.textLineCount])
		return rows
	}

	// NativeScript treats CSS lineHeight as spacing between lines; web treats it
	// as each line's full box. Keep the platform-specific expectation here.
	const fontLineHeight = Number(text.resolvedFont?.lineHeight)
	const expectedHeight = fontLineHeight * 2 + styleLineHeight
	rows.push([
		'native multiline height includes additive line spacing',
		Number.isFinite(expectedHeight) && near(text.box?.h, expectedHeight, 1),
		`${text.box?.h}px; expected about ${expectedHeight}px from two font lines plus line spacing`,
	])

	if (target === 'android') {
		rows.unshift([
			'Android lays out two text lines',
			Number(text.resolvedFont?.actualLayout?.lineCount) === 2,
			text.resolvedFont?.actualLayout?.lineCount,
		])
	}

	return rows
}

// Native font engines report different label bounds; buttonRows checks each
// target still lays out a visible, centered label inside the same button box.
/** Equality rules for button fixtures. */
export const buttonEqual: EqualRule[] = [
	'btn.style.justifyContent',
	'btn.style.alignItems',
	'btn.style.backgroundColor',
	'btn.style.borderTopWidth',
	'btn.style.borderTopColor',
	'btn.style.borderTopLeftRadius',
	'btn.style.paddingTop',
	'btn.style.paddingRight',
	'btn.style.paddingBottom',
	'btn.style.paddingLeft',
	'label.style.fontSize',
	'label.style.fontWeight',
	'label.style.color',
]

/** Equality rules for unstyled (natural) button fixtures. */
export const buttonNaturalEqual: EqualRule[] = [
	'btn.box.x',
	'btn.box.y',
	'btn.box.w',
	'btn.box.h',
	'label.box.x',
	'label.box.y',
	'label.box.w',
	'label.box.h',
	'label.style.fontSize',
	'label.style.fontWeight',
	'label.style.color',
]

/** Asserts styled-button geometry. */
export function buttonRows(m: Resolve, width: number, height: number): CheckRow[] {
	const btn = m('btn')
	const label = m('label')
	return [
		dims(btn, width, height, 1),
		[
			'label has positive bounds',
			label.box?.w > 0 && label.box?.h > 0,
			`${label.box?.w}×${label.box?.h}`,
		],
		[
			'label centered horizontally',
			near(label.box.x + label.box.w / 2 - btn.box.x, btn.box.w / 2, 1),
		],
		[
			'label centered vertically',
			near(label.box.y + label.box.h / 2 - btn.box.y, btn.box.h / 2, 1),
		],
	]
}

/** Asserts platform-natural button geometry. */
export function buttonNaturalRows(m: Resolve): CheckRow[] {
	const btn = m('btn')
	const label = m('label')
	return [
		[
			'button has positive dimensions',
			btn.box?.w > 0 && btn.box?.h > 0,
			`${btn.box?.w}×${btn.box?.h}`,
		],
		[
			'label has positive bounds',
			label.box?.w > 0 && label.box?.h > 0,
			`${label.box?.w}×${label.box?.h}`,
		],
		[
			'label centered horizontally',
			near(label.box.x + label.box.w / 2 - btn.box.x, btn.box.w / 2, 1),
		],
		[
			'label centered vertically',
			near(label.box.y + label.box.h / 2 - btn.box.y, btn.box.h / 2, 1),
		],
	]
}

/** Equality rules for text-input fixtures. */
export const inputEqual: EqualRule[] = [
	'field.box.x',
	'field.box.y',
	'field.box.w',
	'field.box.h',
	'field.contentBox.x',
	'field.contentBox.y',
	'field.contentBox.w',
	'field.contentBox.h',
	'field.placeholderStyle.color',
	'field.placeholderStyle.opacity',
	'field.style.fontSize',
	'field.style.fontWeight',
	'field.style.color',
]

/** Equality rules for platform-natural inputs — drops style-driven rules. */
export const inputNaturalEqual: EqualRule[] = inputEqual.filter(
	(rule) => !['field.box.h', 'field.contentBox.h'].includes(equalPath(rule)),
)

/** Equality rules for textarea fixtures, derived from the input set. */
export const textAreaEqual: EqualRule[] = inputEqual.map((rule) => {
	const path = equalPath(rule)
	return ['field.box.h', 'field.contentBox.h'].includes(path) ? { path, tolerance: 1 } : rule
})

/** Equality rules shared by small controls (checkbox/switch/radio). */
export const controlEqual: EqualRule[] = [
	'control.box.w',
	'control.box.h',
	'control.style.backgroundColor',
]

/** Asserts small-control geometry. */
export const controlRows = (m: Resolve, width: number, height: number): CheckRow[] => [
	dims(m('control'), width, height, 1),
]

/** Asserts styled-input geometry and placeholder placement. */
export function inputRows(m: Resolve): CheckRow[] {
	const field = m('field')
	const rows: CheckRow[] = [
		dims(field, 180, 32, 1),
		[
			'input content area is measured',
			field.contentBox?.w > 0 && field.contentBox?.h > 0,
			JSON.stringify(field.contentBox),
		],
	]

	return rows
}

/** Asserts platform-natural input geometry for the target. */
export function inputNaturalRows(m: Resolve, target: string): CheckRow[] {
	const field = m('field')
	// Since the field-chrome rework the input carries Astryx's 14px/20px text
	// metrics everywhere, so the natural line box is 20 on every host rather
	// than each platform's own text-field metric.
	const expectedHeight = 20
	const rows: CheckRow[] = [
		[
			'input has positive intrinsic dimensions',
			field.box?.w > 0 && field.box?.h > 0,
			`${field.box?.w}×${field.box?.h}`,
		],
		[
			'input content area is measured',
			field.contentBox?.w > 0 && field.contentBox?.h > 0,
			JSON.stringify(field.contentBox),
		],
	]

	if (expectedHeight !== undefined) {
		// With no explicit height, each host supplies its natural text-field line box.
		rows.push([
			'natural input height matches the target text-field metric',
			near(field.box?.h, expectedHeight, 0.75) && near(field.contentBox?.h, expectedHeight, 0.75),
			`field=${field.box?.h}px content=${field.contentBox?.h}px expected=${expectedHeight}px`,
		])
	}

	return rows
}

/** Asserts textarea geometry for the target. */
export function textAreaRows(m: Resolve, target: string): CheckRow[] {
	const field = m('field')
	const rows: CheckRow[] = [
		dims(field, 180, 48, 1),
		[
			'textarea content area is measured',
			field.contentBox?.w > 0 && field.contentBox?.h > 0,
			JSON.stringify(field.contentBox),
		],
	]

	if (target === 'macos') {
		rows.push([
			'placeholder aligns to the textarea content origin',
			near(field.placeholderBox?.x, field.contentBox?.x, 1) &&
				near(field.placeholderBox?.y, field.contentBox?.y, 1),
			JSON.stringify(field.placeholderBox),
		])
	}

	return rows
}

/** Asserts intrinsic textarea height for the target. */
export function textAreaRowsIntrinsic(m: Resolve, target: string, height: number): CheckRow[] {
	const field = m('field')
	const rows: CheckRow[] = [
		dims(field, 180, height, 1),
		[
			'textarea content area is measured',
			field.contentBox?.w > 0 && field.contentBox?.h > 0,
			JSON.stringify(field.contentBox),
		],
	]

	if (target === 'macos') {
		rows.push([
			'placeholder aligns to the textarea content origin',
			near(field.placeholderBox?.x, field.contentBox?.x, 1) &&
				near(field.placeholderBox?.y, field.contentBox?.y, 1),
			JSON.stringify(field.placeholderBox),
		])
	}

	return rows
}
