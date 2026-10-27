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
	x: number
	y: number
	w: number
	h: number
}

export interface MeasuredNode {
	tag?: string
	id?: string
	classes?: string[]
	box: MeasuredBox
	frameBox?: MeasuredBox
	style: Record<string, string>
	text?: string
	textLineAdvances?: number[]
	textLineCount?: number
	contentBox: MeasuredBox
	resolvedFont: {
		family?: string
		face?: string
		size?: number
		lineHeight?: number
		weight?: number
		lineSpacingExtra?: number
		lineSpacingMultiplier?: number
		layoutLineHeight?: number
		actualLayout?: {
			lineCount?: number
			height?: number
			lines?: { top?: number; bottom?: number }[]
			measuredHeight?: number
			viewHeight?: number
		}
	}
	placeholder?: string
	placeholderBox: MeasuredBox
	placeholderStyle?: { color: string; opacity: string }
}

export interface ParityDump {
	target: string
	cells?: Record<string, MeasuredNode[]>
}

export type CheckRow = [name: string, ok: boolean, detail?: unknown]
export type Resolve = (name: string) => MeasuredNode
export type EqualRule = string | { path: string; tolerance?: number; relativeTolerance?: number }

export interface ParityCheck {
	fixture: string
	elements: Record<string, string>
	equal?: EqualRule[]
	targets?: string[]
	equalTargets?: string[]
	check: (m: Resolve, target: string, dump: ParityDump) => CheckRow[]
}

export const near = (a: number | null | undefined, b: number | null | undefined, tol = 0.51) =>
	a != null && b != null && Math.abs(a - b) <= tol

export const dims = (el: MeasuredNode, w: number, h: number, tol?: number): CheckRow => [
	`${w}×${h}`,
	near(el.box?.w, w, tol) && near(el.box?.h, h, tol),
	`${el.box?.w}×${el.box?.h}`,
]

export const circular = (el: MeasuredNode): CheckRow => {
	const radius = String(el.style?.borderTopLeftRadius ?? '')
	const width = el.box?.w
	const height = el.box?.h
	const round = radius.endsWith('%')
		? near(Number.parseFloat(radius), 50) && near(width, height)
		: Number.parseFloat(radius) >= width / 2 && near(width, height)

	return ['thumb corners form a circle', round, `${radius} on ${width}×${height}`]
}

export const equalPath = (rule: EqualRule) => (typeof rule === 'string' ? rule : rule.path)

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

export const textLongEqual = textEqual.filter((rule) => equalPath(rule) !== 'text.box.h')

export const headingEqual: EqualRule[] = [
	'heading.box.x',
	'heading.box.y',
	'heading.box.w',
	{ path: 'heading.box.h', tolerance: 1 },
	'heading.style.fontSize',
	'heading.style.fontWeight',
	'heading.style.color',
]

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

export const inputNaturalEqual = inputEqual.filter(
	(rule) => !['field.box.h', 'field.contentBox.h'].includes(equalPath(rule)),
)

export const textAreaEqual = inputEqual.map((rule) => {
	const path = equalPath(rule)
	return ['field.box.h', 'field.contentBox.h'].includes(path) ? { path, tolerance: 1 } : rule
})

export const controlEqual: EqualRule[] = [
	'control.box.w',
	'control.box.h',
	'control.style.backgroundColor',
]

export const controlRows = (m: Resolve, width: number, height: number): CheckRow[] => [
	dims(m('control'), width, height, 1),
]

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
