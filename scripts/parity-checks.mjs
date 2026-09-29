// Parity assertions for the fixture stage (packages/app/src/parity/).
// Executed by scripts/parity-check.mjs against parity-report/<target>.json
// dumps — never imported by app code.
//
// Per check:
//   fixture  — matches the cell name from fixtures.tsrx
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
const near = (a, b, tol = 0.51) => a != null && b != null && Math.abs(a - b) <= tol
const dims = (el, w, h, tol) => [
	`${w}×${h}`,
	near(el.box?.w, w, tol) && near(el.box?.h, h, tol),
	`${el.box?.w}×${el.box?.h}`,
]
const circular = (el) => {
	const radius = String(el.style?.borderTopLeftRadius ?? '')
	const width = el.box?.w
	const height = el.box?.h
	const round = radius.endsWith('%')
		? near(Number.parseFloat(radius), 50) && near(width, height)
		: near(Number.parseFloat(radius), width / 2) && near(width, height)
	return ['thumb corners form a circle', round, `${radius} on ${width}×${height}`]
}

const textEqual = [
	'text.box.w',
	'text.box.h',
	'text.style.fontSize',
	'text.style.fontWeight',
	'text.style.lineHeight',
	'text.style.color',
]

const headingEqual = [
	'heading.box.x',
	'heading.box.y',
	'heading.box.w',
	'heading.box.h',
	'heading.style.fontSize',
	'heading.style.fontWeight',
	'heading.style.color',
]

function headingRows(m, size) {
	const heading = m('heading')
	const weight = String(heading.style?.fontWeight ?? '').toLowerCase()
	return [
		['heading starts at the fixture origin', near(heading.box?.x, 0, 0.5) && near(heading.box?.y, 0, 0.5), `${heading.box?.x},${heading.box?.y}`],
		['heading width is 520px', near(heading.box?.w, 520, 1), heading.box?.w],
		[`heading font size is ${size}px`, near(Number.parseFloat(heading.style?.fontSize), size, 0.05), heading.style?.fontSize],
		['heading weight is bold', weight === 'bold' || Number(weight) === 700, heading.style?.fontWeight],
	]
}

function textClassRows(m, size, lineHeight) {
	const text = m('text')
	return [
		[`text font size is ${size}px`, near(Number.parseFloat(text.style?.fontSize), size, 0.05), text.style?.fontSize],
		[`text line height is ${lineHeight}px`, near(Number.parseFloat(text.style?.lineHeight), lineHeight, 0.05), text.style?.lineHeight],
	]
}

function textRows(m, height, width) {
	const text = m('text')
	const rows = [
		[`text height is ${height}px`, near(text.box?.h, height, 1), text.box?.h],
		['text is inside the fixture box', text.box?.x >= 0 && text.box?.y >= 0],
	]
	if (width !== undefined) {
		rows.unshift([`text width is ${width}px`, near(text.box?.w, width, 1), text.box?.w])
	}
	return rows
}

const buttonEqual = [
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
	'label.box.x',
	'label.box.y',
	'label.box.w',
	'label.box.h',
	'label.style.fontSize',
	'label.style.fontWeight',
	'label.style.color',
]

const buttonNaturalEqual = [
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

function buttonRows(m, width, height) {
	const btn = m('btn')
	const label = m('label')
	return [
		dims(btn, width, height, 1),
		['label has positive bounds', label.box?.w > 0 && label.box?.h > 0, `${label.box?.w}×${label.box?.h}`],
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

function buttonNaturalRows(m) {
	const btn = m('btn')
	const label = m('label')
	return [
		['button has positive dimensions', btn.box?.w > 0 && btn.box?.h > 0, `${btn.box?.w}×${btn.box?.h}`],
		['label has positive bounds', label.box?.w > 0 && label.box?.h > 0, `${label.box?.w}×${label.box?.h}`],
		['label centered horizontally', near(label.box.x + label.box.w / 2 - btn.box.x, btn.box.w / 2, 1)],
		['label centered vertically', near(label.box.y + label.box.h / 2 - btn.box.y, btn.box.h / 2, 1)],
	]
}

const inputEqual = [
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

const controlEqual = [
	'control.box.w',
	'control.box.h',
	'control.style.backgroundColor',
]

const controlRows = (m, width, height) => [dims(m('control'), width, height, 1)]

function inputRows(m) {
	const field = m('field')
	const rows = [
		dims(field, 180, 32, 1),
		['input content area is measured', field.contentBox?.w > 0 && field.contentBox?.h > 0, JSON.stringify(field.contentBox)],
	]

	return rows
}

function inputNaturalRows(m) {
	const field = m('field')
	return [
		['input has positive intrinsic dimensions', field.box?.w > 0 && field.box?.h > 0, `${field.box?.w}×${field.box?.h}`],
		['input content area is measured', field.contentBox?.w > 0 && field.contentBox?.h > 0, JSON.stringify(field.contentBox)],
	]
}

function textAreaRows(m, target) {
	const field = m('field')
	const rows = [
		dims(field, 180, 48, 1),
		['textarea content area is measured', field.contentBox?.w > 0 && field.contentBox?.h > 0, JSON.stringify(field.contentBox)],
	]

	if (target === 'macos') {
		rows.push([
			'placeholder aligns to the textarea content origin',
			near(field.placeholderBox?.x, field.box.x, 1) &&
				near(field.placeholderBox?.y, field.box.y, 1),
			JSON.stringify(field.placeholderBox),
		])
	}

	return rows
}

function textAreaRowsIntrinsic(m, target, height) {
	const field = m('field')
	const rows = [
		dims(field, 180, height, 1),
		['textarea content area is measured', field.contentBox?.w > 0 && field.contentBox?.h > 0, JSON.stringify(field.contentBox)],
	]

	if (target === 'macos') {
		rows.push([
			'placeholder aligns to the textarea content origin',
			near(field.placeholderBox?.x, field.box.x, 1) && near(field.placeholderBox?.y, field.box.y, 1),
			JSON.stringify(field.placeholderBox),
		])
	}

	return rows
}

export const CHECKS = [
	{
		fixture: 'heading-level-1',
		targets: ['web', 'ios', 'android', 'macos'],
		elements: { heading: 'parity-heading' },
		equal: headingEqual,
		check: (m) => headingRows(m, 32),
	},
	{
		fixture: 'heading-level-2',
		targets: ['web', 'ios', 'android', 'macos'],
		elements: { heading: 'parity-heading' },
		equal: headingEqual,
		check: (m) => headingRows(m, 24),
	},
	{
		fixture: 'heading-level-3',
		targets: ['web', 'ios', 'android', 'macos'],
		elements: { heading: 'parity-heading' },
		equal: headingEqual,
		check: (m) => headingRows(m, 18.72),
	},
	{
		fixture: 'heading-level-4',
		targets: ['web', 'ios', 'android', 'macos'],
		elements: { heading: 'parity-heading' },
		equal: headingEqual,
		check: (m) => headingRows(m, 16),
	},
	{
		fixture: 'heading-level-5',
		targets: ['web', 'ios', 'android', 'macos'],
		elements: { heading: 'parity-heading' },
		equal: headingEqual,
		check: (m) => headingRows(m, 13.28),
	},
	{
		fixture: 'heading-level-6',
		targets: ['web', 'ios', 'android', 'macos'],
		elements: { heading: 'parity-heading' },
		equal: headingEqual,
		check: (m) => headingRows(m, 10.72),
	},
	{
		fixture: 'heading-custom-size',
		targets: ['web', 'ios', 'android', 'macos'],
		elements: { heading: 'parity-heading' },
		equal: headingEqual,
		check: (m) => headingRows(m, 20),
	},
	{
		fixture: 'text-class-sm',
		targets: ['web', 'ios', 'android', 'macos'],
		elements: { text: 'parity-text' },
		equal: textEqual,
		check: (m) => textClassRows(m, 13, 20),
	},
	{
		fixture: 'text-class-lg',
		targets: ['web', 'ios', 'android', 'macos'],
		elements: { text: 'parity-text' },
		equal: textEqual,
		check: (m) => textClassRows(m, 18, 28),
	},
	{
		fixture: 'text-class-xl',
		targets: ['web', 'ios', 'android', 'macos'],
		elements: { text: 'parity-text' },
		equal: textEqual,
		check: (m) => textClassRows(m, 20, 28),
	},
	{
		fixture: 'text-class-2xl',
		targets: ['web', 'ios', 'android', 'macos'],
		equal: textEqual,
		elements: { text: 'parity-text' },
		check: (m) => textClassRows(m, 28, 36),
	},
	{
		fixture: 'text-basic',
		targets: ['web', 'ios', 'android', 'macos'],
		elements: { text: 'parity-text' },
		equal: textEqual,
		check: (m) => textRows(m, 20, 84.17),
	},
	{
		fixture: 'text-bold',
		targets: ['web', 'ios', 'android', 'macos'],
		elements: { text: 'parity-text' },
		equal: textEqual,
		check: (m) => textRows(m, 20),
	},
	{
		fixture: 'text-regular',
		targets: ['web', 'ios', 'android', 'macos'],
		elements: { text: 'parity-text' },
		equal: textEqual,
		check: (m) => textRows(m, 20),
	},
	{
		fixture: 'text-small',
		targets: ['web', 'ios', 'android', 'macos'],
		elements: { text: 'parity-text' },
		equal: textEqual,
		check: (m) => textRows(m, 16),
	},
	{
		fixture: 'text-display',
		targets: ['web', 'ios', 'android', 'macos'],
		elements: { text: 'parity-text' },
		equal: textEqual,
		check: (m) => textRows(m, 24),
	},
	{
		fixture: 'text-long',
		targets: ['web', 'ios', 'android', 'macos'],
		elements: { text: 'parity-text' },
		equal: textEqual,
		check: (m) => textRows(m, 40),
	},
	{
		fixture: 'text-advance',
		targets: ['web', 'ios', 'android', 'macos'],
		elements: { text: 'parity-text' },
		equal: textEqual,
		check: (m) => textRows(m, 20),
	},
	{
		fixture: 'switch-off',
		targets: ['web', 'ios', 'android', 'macos'],
		elements: { track: 'vx-switch', thumb: 'vx-switch-thumb' },
		equal: [
			'track.style.backgroundColor',
			'thumb.style.backgroundColor',
			'track.style.borderTopLeftRadius',
		],
		check: (m) => {
			const track = m('track')
			const thumb = m('thumb')
			return [
				dims(track, 48, 28),
				dims(thumb, 22, 22),
				circular(thumb),
				[
					'thumb parked left (3 pad)',
					near(thumb.box.x - track.box.x, 3),
					thumb.box.x - track.box.x,
				],
				[
					'thumb centered vertically',
					near(thumb.box.y - track.box.y, 3),
					thumb.box.y - track.box.y,
				],
			]
		},
	},
	{
		fixture: 'switch-on',
		targets: ['web', 'ios', 'android', 'macos'],
		elements: { track: 'vx-switch', thumb: 'vx-switch-thumb' },
		equal: ['track.style.backgroundColor', 'thumb.style.backgroundColor'],
		check: (m) => {
			const track = m('track')
			const thumb = m('thumb')
			return [
				dims(track, 48, 28),
				dims(thumb, 22, 22),
				circular(thumb),
				[
					'thumb parked right (3 pad)',
					near(track.box.w - (thumb.box.x - track.box.x) - thumb.box.w, 3),
				],
			]
		},
	},
	{
		fixture: 'slider-0',
		targets: ['web', 'ios', 'android', 'macos'],
		equalTargets: ['web', 'ios', 'android', 'macos'],
		elements: {
			host: 'vx-slider',
			track: 'vx-slider-track',
			fill: 'vx-slider-fill',
			thumb: 'vx-slider-thumb',
		},
		equal: [
			'track.style.backgroundColor',
			'track.style.borderTopLeftRadius',
			'fill.style.backgroundColor',
			'fill.style.borderTopLeftRadius',
			'thumb.style.backgroundColor',
		],
		check: (m, target) => {
			const host = m('host')
			const track = m('track')
			const fill = m('fill')
			const thumb = m('thumb')
			return [
				dims(host, 220, 28, 1),
				dims(track, 220, 4, 1),
				dims(thumb, 20, 20),
				circular(thumb),
				['track vertically centered', near(track.box.y - host.box.y, 12, 1), track.box.y - host.box.y],
				['thumb vertically centered', near(thumb.box.y - host.box.y, 4, 1), thumb.box.y - host.box.y],
				['empty fill', near(fill.box.w, 0, 1), fill.box.w],
				// Web and macOS center the thumb on each end value; iOS and
				// Android keep it inside the track.
				[
					'thumb at min edge (web and macOS overhang −10, iOS and Android clamp flush)',
					near(thumb.box.x - track.box.x, target === 'web' || target === 'macos' ? -10 : 0, 1),
					thumb.box.x - track.box.x,
				],
			]
		},
	},
	{
		fixture: 'slider-50',
		targets: ['web', 'ios', 'android', 'macos'],
		equalTargets: ['web', 'ios', 'android', 'macos'],
		elements: {
			host: 'vx-slider',
			track: 'vx-slider-track',
			fill: 'vx-slider-fill',
			thumb: 'vx-slider-thumb',
		},
		equal: ['fill.style.backgroundColor'],
		check: (m) => {
			const track = m('track')
			const fill = m('fill')
			const thumb = m('thumb')
			return [
				dims(track, 220, 4, 1),
				['fill is half the track', near(fill.box.w, 110, 1), fill.box.w],
				['thumb centered at 50%', near(thumb.box.x + thumb.box.w / 2 - track.box.x, 110, 1)],
			]
		},
	},
	{
		fixture: 'checkbox-off',
		targets: ['web', 'ios', 'android', 'macos'],
		elements: { row: 'vx-checkbox-row', box: 'vx-checkbox' },
		equal: ['box.style.borderTopColor', 'box.style.borderTopLeftRadius'],
		check: (m) => {
			const box = m('box')
			return [dims(box, 20, 20), ['box at row start', near(box.box.x, 0, 1), box.box.x]]
		},
	},
	{
		fixture: 'checkbox-on',
		targets: ['web', 'ios', 'android', 'macos'],
		elements: { row: 'vx-checkbox-row', box: 'vx-checkbox', glyph: 'vx-checkbox-check' },
		equal: [
			'box.style.backgroundColor',
			'glyph.box.w',
			'glyph.style.fontSize',
			'glyph.style.lineHeight',
			'glyph.style.color',
		],
		check: (m) => {
			const box = m('box')
			const glyph = m('glyph')
			return [
				dims(box, 20, 20),
				['check glyph has positive bounds', glyph.box?.w > 0 && glyph.box?.h > 0],
				['glyph centered in box', near(glyph.box.x + glyph.box.w / 2 - box.box.x, 10, 1)],
			]
		},
	},
	{
		fixture: 'button-basic',
		elements: { btn: 'vx-button', label: 'parity-txt' },
		equal: buttonEqual,
		check: (m) => buttonRows(m, 220, 32),
	},
	{
		fixture: 'pressable-basic',
		elements: { btn: 'parity-pressable', label: 'parity-txt' },
		equal: buttonEqual,
		check: (m) => buttonRows(m, 220, 32),
	},
	{
		fixture: 'button-compact',
		elements: { btn: 'vx-button', label: 'parity-txt' },
		equal: buttonEqual,
		check: (m) => buttonRows(m, 96, 28),
	},
	{
		fixture: 'button-long-label',
		elements: { btn: 'vx-button', label: 'parity-txt' },
		equal: buttonEqual,
		check: (m) => buttonRows(m, 160, 36),
	},
	{
		fixture: 'button-natural',
		targets: ['web', 'ios', 'android', 'macos'],
		elements: { btn: 'parity-button-natural', label: 'parity-txt' },
		equal: buttonNaturalEqual,
		check: (m) => buttonNaturalRows(m),
	},
	{
		fixture: 'text-input',
		targets: ['web', 'ios', 'android', 'macos'],
		elements: { field: 'parity-textinput' },
		equal: inputEqual,
		check: (m) => inputRows(m),
	},
	{
		fixture: 'text-input-filled',
		targets: ['web', 'ios', 'android', 'macos'],
		elements: { field: 'parity-textinput' },
		equal: inputEqual,
		check: (m) => inputRows(m),
	},
	{
		fixture: 'text-input-natural',
		targets: ['web', 'ios', 'android', 'macos'],
		elements: { field: 'parity-textinput' },
		equal: inputEqual,
		check: (m) => inputNaturalRows(m),
	},
	{
		fixture: 'text-area',
		targets: ['web', 'ios', 'android', 'macos'],
		elements: { field: 'parity-textarea' },
		equal: inputEqual,
		check: (m, target) => textAreaRows(m, target),
	},
	{
		fixture: 'text-area-filled',
		targets: ['web', 'ios', 'android', 'macos'],
		elements: { field: 'parity-textarea' },
		equal: inputEqual,
		check: (m, target) => textAreaRows(m, target),
	},
	{
		fixture: 'text-area-rows-2',
		targets: ['web', 'ios', 'android', 'macos'],
		elements: { field: 'parity-textarea' },
		equal: inputEqual,
		check: (m, target) => textAreaRowsIntrinsic(m, target, 36),
	},
	{
		fixture: 'text-area-rows-default',
		targets: ['web', 'ios', 'android', 'macos'],
		elements: { field: 'parity-textarea' },
		equal: inputEqual,
		check: (m, target) => textAreaRowsIntrinsic(m, target, 54),
	},
	{
		fixture: 'view-layout',
		elements: {
			root: 'parity-view-root',
			first: 'parity-view-first',
			second: 'parity-view-second',
		},
		equal: ['root.style.flexDirection', 'root.style.alignItems'],
		check: (m) => {
			const root = m('root')
			const first = m('first')
			const second = m('second')
			return [
				dims(root, 96, 48),
				dims(first, 20, 10),
				dims(second, 20, 10),
				[
					'first child starts at root origin',
					near(first.box.x - root.box.x, 0, 1) && near(first.box.y - root.box.y, 0, 1),
				],
				[
					'second child follows with a 6-dip gap',
					near(second.box.y - first.box.y - first.box.h, 6, 1),
					second.box.y - first.box.y - first.box.h,
				],
			]
		},
	},
	{
		fixture: 'view-padding-layout',
		elements: {
			root: 'parity-padded-view-root',
			first: 'parity-padded-view-first',
			second: 'parity-padded-view-second',
		},
		equal: [
			'root.style.flexDirection',
			'root.style.alignItems',
			'root.style.paddingTop',
			'root.style.paddingRight',
			'root.style.paddingBottom',
			'root.style.paddingLeft',
		],
		check: (m) => {
			const root = m('root')
			const first = m('first')
			const second = m('second')
			return [
				dims(root, 96, 48),
				dims(first, 20, 10),
				dims(second, 20, 10),
				[
					'first child follows 8-dip top and left padding',
					near(first.box.x - root.box.x, 8, 1) && near(first.box.y - root.box.y, 8, 1),
				],
				[
					'second child follows with a 6-dip gap',
					near(second.box.y - first.box.y - first.box.h, 6, 1),
					second.box.y - first.box.y - first.box.h,
				],
			]
		},
	},
	{
		fixture: 'grid-layout',
		targets: ['web', 'ios', 'android', 'macos'],
		elements: {
			root: 'parity-grid-root',
			fixed: 'parity-grid-fixed',
			weighted: 'parity-grid-weighted',
			auto: 'parity-grid-auto',
			fill: 'parity-grid-fill',
			automatic: 'parity-grid-automatic',
			colSpan: 'parity-grid-col-span',
			rowSpan: 'parity-grid-row-span',
		},
		equal: [
			'root.box.w',
			'root.box.h',
			'fixed.box.x',
			'fixed.box.y',
			'fixed.box.w',
			'fixed.box.h',
			'weighted.box.x',
			'weighted.box.y',
			'weighted.box.w',
			'weighted.box.h',
			'auto.box.x',
			'auto.box.y',
			'auto.box.w',
			'auto.box.h',
			'fill.box.x',
			'fill.box.y',
			'fill.box.w',
			'fill.box.h',
			'automatic.box.x',
			'automatic.box.y',
			'automatic.box.w',
			'automatic.box.h',
			'colSpan.box.x',
			'colSpan.box.y',
			'colSpan.box.w',
			'colSpan.box.h',
			'rowSpan.box.x',
			'rowSpan.box.y',
			'rowSpan.box.w',
			'rowSpan.box.h',
		],
		check: (m) => {
			const root = m('root')
			const fixed = m('fixed')
			const weighted = m('weighted')
			const auto = m('auto')
			const fill = m('fill')
			const automatic = m('automatic')
			const colSpan = m('colSpan')
			const rowSpan = m('rowSpan')
			return [
				dims(root, 96, 48, 1),
				dims(fixed, 30, 12, 1),
				['fixed cell starts at grid origin', near(fixed.box.x, 0, 1) && near(fixed.box.y, 0, 1)],
				dims(weighted, 44, 12, 1),
				['weighted column starts after the fixed 30-dip column', near(weighted.box.x, 30, 1)],
				dims(auto, 30, 10, 1),
				['auto row follows the fixed 12-dip row', near(auto.box.y, 12, 1)],
				dims(fill, 22, 13, 1),
				['second fraction row follows the first', near(fill.box.y, 35, 1)],
				['fill cell starts at the final column', near(fill.box.x, 74, 1)],
				dims(automatic, 22, 12, 1),
				['unplaced child flows to the first free cell', near(automatic.box.x, 74, 1) && near(automatic.box.y, 0, 1)],
				dims(colSpan, 66, 10, 1),
				['column span starts at the weighted columns', near(colSpan.box.x, 30, 1) && near(colSpan.box.y, 12, 1)],
				dims(rowSpan, 30, 26, 1),
				['row span covers both fraction rows', near(rowSpan.box.y, 22, 1)],
			]
		},
	},
	{
		fixture: 'stack-overlay-layout',
		targets: ['web', 'ios', 'android', 'macos'],
		elements: {
			root: 'parity-stack-root',
			base: 'parity-stack-base',
			overlay: 'parity-stack-overlay',
		},
		equal: [
			'root.box.w',
			'root.box.h',
			'base.box.x',
			'base.box.y',
			'base.box.w',
			'base.box.h',
			'overlay.box.x',
			'overlay.box.y',
			'overlay.box.w',
			'overlay.box.h',
		],
		check: (m) => {
			const root = m('root')
			const base = m('base')
			const overlay = m('overlay')
			return [
				dims(root, 96, 48, 1),
				dims(base, 48, 32, 1),
				dims(overlay, 20, 10, 1),
				[
					'children share the Stack origin',
					near(base.box.x - root.box.x, 0, 1) &&
						near(base.box.y - root.box.y, 0, 1) &&
						near(overlay.box.x - root.box.x, 0, 1) &&
						near(overlay.box.y - root.box.y, 0, 1),
				],
			]
		},
	},
	{
		fixture: 'column-layout',
		elements: {
			root: 'parity-column-root',
			first: 'parity-column-first',
			second: 'parity-column-second',
		},
		equal: ['root.style.flexDirection', 'root.style.alignItems'],
		check: (m) => {
			const root = m('root')
			const first = m('first')
			const second = m('second')
			return [
				dims(root, 96, 48),
				dims(first, 16, 8),
				dims(second, 20, 12),
				['first child centered horizontally', near(first.box.x - root.box.x, 40, 1)],
				['second child centered horizontally', near(second.box.x - root.box.x, 38, 1)],
				[
					'second child follows with a 4-dip gap',
					near(second.box.y - first.box.y - first.box.h, 4, 1),
					second.box.y - first.box.y - first.box.h,
				],
			]
		},
	},
	{
		fixture: 'row-layout',
		elements: { root: 'parity-row-root', first: 'parity-row-first', second: 'parity-row-second' },
		equal: ['root.style.flexDirection', 'root.style.alignItems'],
		check: (m) => {
			const root = m('root')
			const first = m('first')
			const second = m('second')
			return [
				dims(root, 96, 32),
				dims(first, 20, 10),
				dims(second, 12, 10),
				['first child starts at the row cross-axis origin', near(first.box.y - root.box.y, 0, 1)],
				['second child starts at the row cross-axis origin', near(second.box.y - root.box.y, 0, 1)],
				[
					'second child follows with an 8-dip gap',
					near(second.box.x - first.box.x - first.box.w, 8, 1),
					second.box.x - first.box.x - first.box.w,
				],
			]
		},
	},
	{
		fixture: 'spacer-layout',
		elements: {
			root: 'parity-spacer-root',
			leading: 'parity-spacer-leading',
			spacer: 'parity-spacer',
			trailing: 'parity-spacer-trailing',
		},
		equal: ['root.style.flexDirection', 'root.style.alignItems'],
		check: (m) => {
			const root = m('root')
			const leading = m('leading')
			const spacer = m('spacer')
			const trailing = m('trailing')
			return [
				dims(root, 96, 24),
				dims(leading, 20, 10),
				dims(spacer, 48, 24),
				dims(trailing, 20, 10),
				['leading child starts at the row origin', near(leading.box.x - root.box.x, 0, 1)],
				['spacer follows the leading child and gap', near(spacer.box.x - leading.box.x - leading.box.w, 4, 1)],
				['trailing child follows the expanded spacer and gap', near(trailing.box.x - spacer.box.x - spacer.box.w, 4, 1)],
			]
		},
	},
	{
		fixture: 'scroll-view-layout',
		elements: {
			scroll: 'parity-scroll-root',
			content: 'parity-scroll-content',
			first: 'parity-scroll-first',
			second: 'parity-scroll-second',
		},
		equal: ['content.style.flexDirection', 'content.style.alignItems'],
		check: (m) => {
			const scroll = m('scroll')
			const content = m('content')
			const first = m('first')
			const second = m('second')
			return [
				dims(scroll, 96, 32),
				dims(content, 96, 64),
				dims(first, 24, 12),
				dims(second, 24, 12),
				[
					'first content child starts at content origin',
					near(first.box.x - content.box.x, 0, 1) && near(first.box.y - content.box.y, 0, 1),
				],
				[
					'second content child follows with a 4-dip gap',
					near(second.box.y - first.box.y - first.box.h, 4, 1),
					second.box.y - first.box.y - first.box.h,
				],
			]
		},
	},
	{
		fixture: 'absolute-layout',
		elements: {
			root: 'parity-absolute-root',
			first: 'parity-absolute-first',
			second: 'parity-absolute-second',
		},
		equal: [
			'root.box.w',
			'root.box.h',
			'root.style.backgroundColor',
			'first.box.x',
			'first.box.y',
			'first.box.w',
			'first.box.h',
			'second.box.x',
			'second.box.y',
			'second.box.w',
			'second.box.h',
		],
		check: (m) => {
			const root = m('root')
			const first = m('first')
			const second = m('second')
			return [
				dims(root, 96, 48),
				dims(first, 20, 10),
				dims(second, 12, 8),
				[
					'first child uses its left/top offsets',
					near(first.box.x - root.box.x, 8) && near(first.box.y - root.box.y, 6),
				],
				[
					'second child uses its left/top offsets',
					near(second.box.x - root.box.x, 40) && near(second.box.y - root.box.y, 24),
				],
			]
		},
	},
	{
		fixture: 'scroll-box-layout',
		elements: {
			root: 'parity-scrollbox-root',
			content: 'parity-scrollbox-content',
			first: 'parity-scrollbox-first',
			second: 'parity-scrollbox-second',
		},
		equal: [
			'root.box.w',
			'root.box.h',
			'root.style.backgroundColor',
			'content.box.w',
			'content.box.h',
			'first.box.w',
			'first.box.h',
			'second.box.w',
			'second.box.h',
		],
		check: (m) => {
			const root = m('root')
			const content = m('content')
			const first = m('first')
			const second = m('second')
			return [
				dims(root, 96, 48),
				dims(content, 96, 64),
				dims(first, 24, 12),
				dims(second, 24, 12),
				['content extends below the viewport', content.box.h > root.box.h],
				[
					'second child follows with a 4-dip gap',
					near(second.box.y - first.box.y - first.box.h, 4, 1),
				],
			]
		},
	},
	{
		fixture: 'drawer-open-frame',
	targets: ['web', 'ios', 'android', 'macos'],
		elements: {
			root: 'parity-drawer-root',
			main: 'vx-drawer-main',
			backdrop: 'vx-drawer-backdrop',
			panel: 'vx-drawer-panel',
		},
		equal: [
			'root.box.w',
			'root.box.h',
			'root.style.backgroundColor',
			'main.box.w',
			'main.box.h',
			'backdrop.box.w',
			'backdrop.box.h',
			'panel.box.x',
			'panel.box.y',
			'panel.box.w',
			'panel.box.h',
		],
		check: (m) => {
			const root = m('root')
			const main = m('main')
			const backdrop = m('backdrop')
			const panel = m('panel')
			return [
				dims(root, 96, 48),
				dims(main, 96, 48),
				dims(backdrop, 96, 48),
				['drawer panel is 280 dip wide', near(panel.box.w, 280, 1), panel.box.w],
				[
					'drawer panel starts at the root origin',
					near(panel.box.x - root.box.x, 0, 1) && near(panel.box.y - root.box.y, 0, 1),
				],
			]
		},
	},
	{
		fixture: 'overlay-fixed-frame',
		elements: { frame: 'parity-portal--overlay-fixed-frame' },
		equal: ['frame.box.w', 'frame.box.h', 'frame.style.backgroundColor'],
		check: (m) => [dims(m('frame'), 96, 48)],
	},
	{
		fixture: 'popover-bottom-frame',
		targets: ['web', 'ios', 'android'],
		elements: { anchor: 'parity-popover-anchor', panel: 'vx-popover' },
		equal: ['panel.box.w', 'panel.box.h'],
		check: (m) => {
			const anchor = m('anchor')
			const panel = m('panel')
			return [
				dims(anchor, 24, 20),
				dims(panel, 48, 32),
				['panel aligns with anchor left edge', near(panel.box.x, anchor.box.x, 1)],
				[
					'panel follows anchor with an 8-dip gap',
					near(panel.box.y - anchor.box.y - anchor.box.h, 8, 1),
				],
			]
		},
	},
	{
		fixture: 'sheet-fixed-frame',
		elements: { frame: 'parity-portal--sheet-fixed-frame' },
		equal: ['frame.box.w', 'frame.box.h', 'frame.style.backgroundColor'],
		// height 80 so the sheet's own chrome (padding 48 + border 2) fits
		// inside the declared box — at 48 the web border-box clamps to 50.
		check: (m) => [dims(m('frame'), 96, 80)],
	},
	{
		fixture: 'form-field-basic',
	targets: ['web', 'ios', 'android', 'macos'],
		elements: { control: 'parity-formfield-root' },
		equal: controlEqual,
		check: (m) => controlRows(m, 180, 64),
	},
	{
		fixture: 'field-group-basic',
	targets: ['web', 'ios', 'android', 'macos'],
		elements: { control: 'parity-fieldgroup-root' },
		equal: controlEqual,
		check: (m) => controlRows(m, 180, 64),
	},
	{
		fixture: 'input-number-value',
	targets: ['web', 'ios', 'android', 'macos'],
		elements: { control: 'parity-inputnumber-root' },
		equal: controlEqual,
		check: (m) => controlRows(m, 160, 40),
	},
	{
		fixture: 'pin-input-filled',
	targets: ['web', 'ios', 'android', 'macos'],
		elements: { control: 'parity-pininput-root' },
		equal: controlEqual,
		check: (m) => controlRows(m, 200, 44),
	},
	{
		fixture: 'select-value',
	targets: ['web', 'ios', 'android', 'macos'],
		elements: { control: 'parity-select-root' },
		equal: controlEqual,
		check: (m) => controlRows(m, 160, 40),
	},
	{
		fixture: 'select-menu-value',
	targets: ['web', 'ios', 'android', 'macos'],
		elements: { control: 'parity-selectmenu-root' },
		equal: controlEqual,
		check: (m) => controlRows(m, 160, 40),
	},
	{
		fixture: 'combobox-value',
	targets: ['web', 'ios', 'android', 'macos'],
		elements: { control: 'parity-combobox-root' },
		equal: controlEqual,
		check: (m) => controlRows(m, 160, 40),
	},
	{
		fixture: 'input-menu-value',
	targets: ['web', 'ios', 'android', 'macos'],
		elements: { control: 'parity-inputmenu-root' },
		equal: controlEqual,
		check: (m) => controlRows(m, 160, 40),
	},
	{
		fixture: 'input-tags-values',
	targets: ['web', 'ios', 'android', 'macos'],
		elements: { control: 'parity-inputtags-root' },
		equal: controlEqual,
		check: (m) => controlRows(m, 220, 44),
	},
	{
		fixture: 'input-rating-selected',
	targets: ['web', 'ios', 'android', 'macos'],
		elements: { control: 'parity-rating-root', selected: 'vx-rating-cell--on' },
		equal: [...controlEqual, 'selected.box.w', 'selected.box.h'],
		check: (m) => {
			const selected = m('selected')
			return [
				...controlRows(m, 200, 32),
				['selected rating cell has positive bounds', selected.box?.w > 0 && selected.box?.h > 0],
			]
		},
	},
	{
		fixture: 'checkbox-group-selected',
	targets: ['web', 'ios', 'android', 'macos'],
		elements: { control: 'parity-checkboxgroup-root', selected: 'vx-checkbox' },
		equal: [...controlEqual, 'selected.box.w', 'selected.box.h', 'selected.style.backgroundColor'],
		check: (m) => [
			...controlRows(m, 180, 56),
			dims(m('selected'), 20, 20),
		],
	},
	{
		fixture: 'radio-group-selected',
	targets: ['web', 'ios', 'android', 'macos'],
		elements: { control: 'parity-radiogroup-root', selected: 'vx-radio-dot' },
		equal: [...controlEqual, 'selected.box.w', 'selected.box.h', 'selected.style.backgroundColor'],
		check: (m) => {
			const selected = m('selected')
			return [
				...controlRows(m, 180, 56),
				['selected radio dot has positive bounds', selected.box?.w > 0 && selected.box?.h > 0],
			]
		},
	},
	{
		fixture: 'segmented-control-selected',
		targets: ['web', 'ios', 'android'],
		elements: { control: 'parity-segmented-root', selected: 'vx-segment--on' },
		equal: [...controlEqual, 'selected.box.w', 'selected.box.h', 'selected.style.backgroundColor'],
		check: (m) => {
			const selected = m('selected')
			return [
				...controlRows(m, 180, 40),
				['selected segment has positive bounds', selected.box?.w > 0 && selected.box?.h > 0],
			]
		},
	},
	{
		fixture: 'collapsible-open',
	targets: ['web', 'ios', 'android', 'macos'],
		elements: { root: 'parity-collapsible-root', content: 'parity-collapsible-content' },
		equal: ['root.box.w', 'root.box.h', 'root.style.backgroundColor', 'content.box.w', 'content.box.h'],
		check: (m) => [dims(m('root'), 180, 72), dims(m('content'), 160, 24)],
	},
	{
		fixture: 'accordion-one-open',
	targets: ['web', 'ios', 'android', 'macos'],
		elements: { root: 'parity-accordion-root', content: 'parity-accordion-content' },
		equal: ['root.box.w', 'root.box.h', 'root.style.backgroundColor', 'content.box.w', 'content.box.h'],
		check: (m) => [dims(m('root'), 180, 88), dims(m('content'), 160, 28)],
	},
	{
		fixture: 'dropdown-menu-trigger',
	targets: ['web', 'ios', 'android', 'macos'],
		elements: { trigger: 'parity-dropdown-trigger' },
		equal: ['trigger.box.w', 'trigger.box.h', 'trigger.style.backgroundColor'],
		check: (m) => [dims(m('trigger'), 160, 32)],
	},
	{
		fixture: 'context-menu-target',
	targets: ['web', 'ios', 'android', 'macos'],
		elements: { root: 'parity-contextmenu-root', target: 'parity-contextmenu-target' },
		equal: ['root.box.w', 'root.box.h', 'root.style.backgroundColor', 'target.box.w', 'target.box.h'],
		check: (m) => [dims(m('root'), 180, 56), dims(m('target'), 144, 28)],
	},
	{
		fixture: 'stepper-middle-active',
	targets: ['web', 'ios', 'android', 'macos'],
	equalTargets: ['web', 'ios', 'android'],
		elements: { root: 'parity-stepper-root', active: 'vx-step--on' },
		equal: ['root.box.w', 'root.box.h', 'root.style.backgroundColor', 'active.box.w', 'active.box.h'],
		check: (m) => {
			const active = m('active')
			return [dims(m('root'), 220, 40), ['active step has a visible frame', active.box.w > 0 && active.box.h > 0]]
		},
	},
	{
		fixture: 'navigation-menu-active',
	targets: ['web', 'ios', 'android', 'macos'],
	equalTargets: ['web', 'ios', 'android'],
		elements: { root: 'parity-navmenu-root', active: 'vx-navmenu-item--on' },
		equal: [
			'root.box.w',
			'root.box.h',
			'root.style.backgroundColor',
			'active.box.w',
			'active.box.h',
			'active.style.backgroundColor',
		],
		check: (m) => {
			const active = m('active')
			return [dims(m('root'), 220, 40), ['active item has a visible frame', active.box.w > 0 && active.box.h > 0]]
		},
	},
	{
		fixture: 'command-palette-open',
	targets: ['web', 'ios', 'android', 'macos'],
	equalTargets: ['web', 'ios', 'android'],
		elements: { panel: 'parity-portal--command-palette-open', list: 'vx-cmdk-list' },
		equal: ['panel.box.w', 'panel.box.h', 'panel.style.backgroundColor', 'list.box.w'],
		check: (m) => [
			dims(m('panel'), 200, 96),
			['command list has a visible frame', m('list').box.w > 0 && m('list').box.h > 0],
		],
	},
	{
		fixture: 'tabs-second-selected',
	targets: ['web', 'ios', 'android', 'macos'],
		elements: {
			root: 'parity-tabs-root',
			tabbar: 'vx-tabbar',
			pane: 'vx-tabpane',
			content: 'parity-tabs-pane-child',
		},
		equal: [
			'root.box.w',
			'root.box.h',
			'root.style.backgroundColor',
			'tabbar.box.w',
			'pane.box.w',
			'content.box.w',
			'content.box.h',
		],
		check: (m) => [dims(m('root'), 200, 104), dims(m('content'), 200, 48)],
	},
	{
		fixture: 'meter-progress',
	targets: ['web', 'ios', 'android', 'macos'],
		elements: { meter: 'parity-meter-root' },
		equal: ['meter.box.w', 'meter.box.h', 'meter.style.backgroundColor'],
		check: (m) => [dims(m('meter'), 48, 48)],
	},
	{
		fixture: 'activity-indicator-busy',
	targets: ['web', 'ios', 'android', 'macos'],
		elements: { spinner: 'parity-activity-indicator-root' },
		equal: [
			'spinner.box.w',
			'spinner.box.h',
			'spinner.style.borderTopWidth',
			'spinner.style.borderTopColor',
		],
		check: (m) => [dims(m('spinner'), 24, 24)],
	},
	{
		fixture: 'rich-text-fixed-run',
		targets: ['web', 'ios', 'android', 'macos'],
		elements: { text: 'parity-rich-text-root' },
		equal: ['text.box.w', 'text.box.h', 'text.style.backgroundColor'],
		check: (m) => [dims(m('text'), 220, 32)],
	},
	{
		fixture: 'badge-basic',
	targets: ['web', 'ios', 'android', 'macos'],
		elements: { badge: 'parity-badge-root' },
		equal: ['badge.box.w', 'badge.box.h', 'badge.style.backgroundColor'],
		check: (m) => [dims(m('badge'), 120, 32)],
	},
	{
		fixture: 'avatar-fallback',
	targets: ['web', 'ios', 'android', 'macos'],
		elements: { avatar: 'parity-avatar-root' },
		equal: ['avatar.box.w', 'avatar.box.h', 'avatar.style.backgroundColor'],
		check: (m) => [dims(m('avatar'), 40, 40)],
	},
	{
		fixture: 'avatar-group-overflow',
	targets: ['web', 'ios', 'android', 'macos'],
		elements: { group: 'parity-avatar-group-root', member: 'parity-avatar-group-member' },
		equal: ['group.box.w', 'group.box.h', 'member.box.w', 'member.box.h'],
		check: (m) => [dims(m('group'), 96, 40), dims(m('member'), 32, 32)],
	},
	{
		fixture: 'user-row',
	targets: ['web', 'ios', 'android', 'macos'],
		elements: { user: 'parity-user-root', avatar: 'vx-avatar' },
		equal: [
			'user.box.w',
			'user.box.h',
			'user.style.backgroundColor',
			'avatar.box.w',
			'avatar.box.h',
		],
		check: (m) => [dims(m('user'), 220, 56), dims(m('avatar'), 40, 40)],
	},
	{
		fixture: 'kbd-shortcut',
	targets: ['web', 'ios', 'android', 'macos'],
		elements: { key: 'parity-kbd-root' },
		equal: ['key.box.w', 'key.box.h', 'key.style.backgroundColor'],
		check: (m) => [dims(m('key'), 52, 32)],
	},
	{
		fixture: 'link-fixed-target',
	targets: ['web', 'ios', 'android', 'macos'],
		elements: { link: 'parity-link-root' },
		equal: ['link.box.w', 'link.box.h', 'link.style.backgroundColor'],
		check: (m) => [dims(m('link'), 160, 32)],
	},
	{
		fixture: 'nav-link-active',
	targets: ['web', 'ios', 'android', 'macos'],
		elements: { link: 'parity-navlink-active' },
		equal: ['link.box.w', 'link.box.h', 'link.style.backgroundColor'],
		check: (m) => [dims(m('link'), 160, 32)],
	},
	{
		fixture: 'icon-registered-glyph',
		targets: ['web', 'ios', 'android'],
		elements: { icon: 'parity-icon-root' },
		equal: ['icon.box.w', 'icon.box.h'],
		check: (m) => [dims(m('icon'), 24, 24)],
	},
	{
		fixture: 'separator-horizontal',
	targets: ['web', 'ios', 'android', 'macos'],
		elements: { separator: 'parity-separator-root' },
		equal: ['separator.box.w', 'separator.box.h', 'separator.style.backgroundColor'],
		check: (m) => [dims(m('separator'), 160, 2)],
	},
	{
		fixture: 'skeleton-basic',
	targets: ['web', 'ios', 'android', 'macos'],
		elements: { skeleton: 'parity-skeleton-root' },
		equal: ['skeleton.box.w', 'skeleton.box.h', 'skeleton.style.backgroundColor'],
		check: (m) => [dims(m('skeleton'), 140, 18)],
	},
	{
		fixture: 'empty-state',
	targets: ['web', 'ios', 'android', 'macos'],
		elements: { empty: 'parity-empty-root', icon: 'vx-empty-icon' },
		equal: [
			'empty.box.w',
			'empty.box.h',
			'empty.style.backgroundColor',
			'icon.box.w',
			'icon.box.h',
		],
		check: (m) => [dims(m('empty'), 220, 120), dims(m('icon'), 24, 24)],
	},
	{
		fixture: 'breadcrumb-trail',
	targets: ['web', 'ios', 'android', 'macos'],
		elements: { trail: 'parity-breadcrumb-root' },
		equal: ['trail.box.w', 'trail.box.h', 'trail.style.backgroundColor'],
		check: (m) => [dims(m('trail'), 220, 36)],
	},
	{
		fixture: 'pagination-window',
	targets: ['web', 'ios', 'android', 'macos'],
		elements: { pages: 'parity-pagination-root', active: 'vx-page-btn--on' },
		equal: [
			'pages.box.w',
			'pages.box.h',
			'pages.style.backgroundColor',
			'active.box.w',
			'active.box.h',
		],
		check: (m) => {
			const active = m('active')
			return [
				dims(m('pages'), 220, 36),
				['active page has a visible frame', active.box.w > 0 && active.box.h > 0],
			]
		},
	},
	{
		fixture: 'table-two-rows',
	targets: ['web', 'ios', 'android', 'macos'],
		elements: { table: 'parity-table-root', cell: 'parity-table-cell-content' },
		equal: ['table.box.w', 'table.box.h', 'table.style.backgroundColor', 'cell.box.w', 'cell.box.h'],
		check: (m) => [dims(m('table'), 220, 96), dims(m('cell'), 64, 24)],
	},
	{
		fixture: 'virtual-list-viewport',
		targets: ['web', 'ios', 'android', 'macos'],
		elements: { list: 'parity-virtual-list-root', item: 'parity-virtual-list-item-content' },
		equal: ['list.box.w', 'list.box.h', 'item.box.w', 'item.box.h'],
		check: (m) => [dims(m('list'), 220, 64), dims(m('item'), 200, 24)],
	},
	{
		fixture: 'timeline-two-events',
	targets: ['web', 'ios', 'android', 'macos'],
		elements: { timeline: 'parity-timeline-root', dot: 'vx-timeline-dot' },
		equal: [
			'timeline.box.w',
			'timeline.box.h',
			'timeline.style.backgroundColor',
			'dot.box.w',
			'dot.box.h',
		],
		check: (m) => [dims(m('timeline'), 200, 112), dims(m('dot'), 10, 10)],
	},
	{
		fixture: 'tree-expanded',
	targets: ['web', 'ios', 'android', 'macos'],
		elements: { tree: 'parity-tree-root', child: 'vx-tree-row--disabled' },
		equal: ['tree.box.w', 'tree.box.h', 'tree.style.backgroundColor', 'child.style.opacity'],
		check: (m) => {
			const child = m('child')
			return [
				dims(m('tree'), 180, 96),
				['expanded child has a visible frame', child.box.w > 0 && child.box.h > 0],
			]
		},
	},
	{
		fixture: 'alert-warning',
	targets: ['web', 'ios', 'android', 'macos'],
		elements: { alert: 'parity-alert-root', icon: 'vx-alert-icon' },
		equal: [
			'alert.box.w',
			'alert.box.h',
			'alert.style.backgroundColor',
			'alert.style.borderTopColor',
			'icon.box.w',
			'icon.box.h',
		],
		check: (m) => [dims(m('alert'), 220, 64), dims(m('icon'), 24, 24)],
	},
	{
		fixture: 'card-with-slots',
	targets: ['web', 'ios', 'android', 'macos'],
		elements: { card: 'parity-card-root', body: 'parity-card-body' },
		equal: ['card.box.w', 'card.box.h', 'card.style.backgroundColor', 'body.box.w', 'body.box.h'],
		check: (m) => [dims(m('card'), 220, 104), dims(m('body'), 180, 32)],
	},
	{
		fixture: 'chip-selected',
	targets: ['web', 'ios', 'android', 'macos'],
		elements: { chip: 'parity-chip-root', selected: 'vx-chip--on' },
		equal: ['chip.box.w', 'chip.box.h', 'selected.style.backgroundColor', 'selected.style.color'],
		check: (m) => [dims(m('chip'), 96, 32)],
	},
	{
		fixture: 'banner-dismissible',
	targets: ['web', 'ios', 'android', 'macos'],
		elements: { banner: 'parity-banner-root', icon: 'vx-banner-icon', dismiss: 'vx-banner-dismiss' },
		equal: [
			'banner.box.w',
			'banner.box.h',
			'banner.style.backgroundColor',
			'icon.box.w',
			'icon.box.h',
			'dismiss.style.marginLeft',
		],
		check: (m) => {
			const dismiss = m('dismiss')
			return [
				dims(m('banner'), 220, 48),
				dims(m('icon'), 24, 24),
				['dismiss affordance has a visible frame', dismiss.box.w > 0 && dismiss.box.h > 0],
			]
		},
	},
	{
		fixture: 'progress-group-two-items',
	targets: ['web', 'ios', 'android', 'macos'],
		elements: { group: 'parity-progress-group-root', meter: 'vx-meter' },
		equal: ['group.box.w', 'group.box.h', 'group.style.backgroundColor', 'meter.box.w', 'meter.box.h'],
		check: (m) => [dims(m('group'), 220, 88), dims(m('meter'), 24, 24)],
	},
	{
		fixture: 'search-input-basic',
		targets: ['web', 'ios', 'android', 'macos'],
		elements: { search: 'parity-search-input-root' },
		equal: ['search.box.w', 'search.box.h'],
		check: (m) => [dims(m('search'), 220, 40)],
	},
	{
		fixture: 'image-inline-data',
		targets: ['web', 'ios', 'android', 'macos'],
		elements: { image: 'parity-image-root' },
		equal: ['image.box.w', 'image.box.h'],
		check: (m) => [dims(m('image'), 80, 48)],
	},
	{
		fixture: 'webview-inline-document',
		targets: ['web', 'ios', 'android'],
		elements: { webview: 'parity-webview-root' },
		equal: ['webview.box.w', 'webview.box.h', 'webview.style.backgroundColor'],
		check: (m) => [dims(m('webview'), 220, 120)],
	},
	{
		fixture: 'pager-two-pages',
		targets: ['web', 'ios', 'android'],
		elements: { pager: 'parity-pager-root', page: 'parity-pager-page' },
		equal: ['pager.box.w', 'pager.box.h', 'pager.style.backgroundColor', 'page.box.w', 'page.box.h'],
		check: (m) => [dims(m('pager'), 220, 96), dims(m('page'), 220, 96)],
	},
	{
		fixture: 'video-hosted-frame',
		targets: ['web', 'ios', 'android'],
		elements: { video: 'parity-video-root', play: 'vx-video-centerbtn' },
		equal: [
			'video.box.w',
			'video.box.h',
			'video.style.backgroundColor',
			'play.box.w',
			'play.box.h',
			'play.style.backgroundColor',
		],
		check: (m) => [dims(m('video'), 220, 124), dims(m('play'), 56, 56)],
	},
	{
		fixture: 'screen-layout',
		targets: ['web', 'ios', 'android', 'macos'],
		elements: { root: 'parity-screen-root', child: 'parity-screen-child' },
		equal: ['root.box.w', 'root.box.h', 'child.box.x', 'child.box.y', 'child.box.w', 'child.box.h'],
		check: (m) => {
			const root = m('root')
			const child = m('child')
			return [
				dims(root, 220, 64),
				dims(child, 20, 10),
				[
					'child starts at screen content origin',
					near(child.box.x - root.box.x, 0, 1) && near(child.box.y - root.box.y, 0, 1),
				],
			]
		},
	},
	{
		fixture: 'percent-size-layout',
		targets: ['web', 'ios', 'android', 'macos'],
		elements: { root: 'parity-percent-root' },
		equal: ['root.box.x', 'root.box.y', 'root.box.w', 'root.box.h'],
		check: (m) => [dims(m('root'), 110, 32, 1)],
	},
	{
		fixture: 'safe-area-layout',
		elements: {
			root: 'parity-safe-area-root',
			content: 'parity-safe-area-content',
			reference: 'parity-safe-area-reference',
			expected: 'parity-safe-area-expected',
		},
		equal: [],
		check: (m) => {
			const root = m('root')
			const content = m('content')
			const reference = m('reference')
			const expected = m('expected')
			return [
				dims(root, 96, 160),
				dims(reference, 96, 160),
				[
					'content matches platform safe-area inset frame',
					near(content.box.x - root.box.x, expected.box.x - reference.box.x, 1) &&
						near(content.box.y - root.box.y, expected.box.y - reference.box.y, 1) &&
						near(content.box.w, expected.box.w, 1) &&
						near(content.box.h, expected.box.h, 1),
				],
			]
		},
	},
]
