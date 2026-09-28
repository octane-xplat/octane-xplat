// Parity assertions for the fixture stage (packages/app/src/parity/).
// Executed by scripts/parity-check.mjs against parity-report/<target>.json
// dumps — never imported by app code.
//
// Per check:
//   fixture  — matches the cell name from fixtures.tsrx
//   elements — logical name → vx-* class inside the fixture cell
//   check(m) — per-target invariants; m('track') → {box:{x,y,w,h}, style, text}
//              with box measured relative to the fixture's .parity-box. The
//              macOS dump also includes frameBox (the raw NSView allocation);
//              box uses AppKit's alignment rect to exclude internal control
//              cell padding from the shared content geometry.
//              Return rows [name, ok, detail?].
//   equal    — 'el.box.<f>' | 'el.style.<f>' | 'el.text' paths that must
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
	'text.style.fontFamily',
	'text.style.fontPostScriptName',
	'text.style.fontWeight',
	'text.style.lineHeight',
	'text.style.color',
	'text.textLineAdvances',
]

const headingEqual = [
	'heading.box.x',
	'heading.box.y',
	'heading.box.w',
	'heading.box.h',
	'heading.style.fontSize',
	'heading.style.fontFamily',
	'heading.style.fontPostScriptName',
	'heading.style.fontWeight',
	'heading.style.color',
	'heading.textLineAdvances',
]

function headingRows(m, content, size) {
	const heading = m('heading')
	return [
		['heading starts at the fixture origin', near(heading.box?.x, 0, 0.5) && near(heading.box?.y, 0, 0.5), `${heading.box?.x},${heading.box?.y}`],
		['heading width is 520px', near(heading.box?.w, 520, 1), heading.box?.w],
		[`heading font size is ${size}px`, near(Number.parseFloat(heading.style?.fontSize), size, 0.05), heading.style?.fontSize],
		['heading weight is bold', Number(heading.style?.fontWeight) === 700, heading.style?.fontWeight],
		['heading content matches', heading.text === content, JSON.stringify(heading.text)],
	]
}

function textClassRows(m, content, size, lineHeight) {
	const text = m('text')
	return [
		[`text font size is ${size}px`, near(Number.parseFloat(text.style?.fontSize), size, 0.05), text.style?.fontSize],
		[`text line height is ${lineHeight}px`, near(Number.parseFloat(text.style?.lineHeight), lineHeight, 0.05), text.style?.lineHeight],
		['text content matches', text.text === content, JSON.stringify(text.text)],
	]
}

function textRows(m, content, height, width) {
	const text = m('text')
	const rows = [
		[`text height is ${height}px`, near(text.box?.h, height, 1), text.box?.h],
		['text content matches', text.text === content, JSON.stringify(text.text)],
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
	'label.style.fontFamily',
	'label.style.fontPostScriptName',
	'label.style.fontWeight',
	'label.style.color',
	'label.textLineAdvances',
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
	'label.style.fontFamily',
	'label.style.fontPostScriptName',
	'label.style.fontWeight',
	'label.style.color',
	'label.textLineAdvances',
]

function buttonRows(m, width, height, labelText) {
	const btn = m('btn')
	const label = m('label')
	return [
		dims(btn, width, height, 1),
		['label child renders', label.text === labelText, JSON.stringify(label.text)],
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

function buttonNaturalRows(m, labelText) {
	const btn = m('btn')
	const label = m('label')
	return [
		['button has positive dimensions', btn.box?.w > 0 && btn.box?.h > 0, `${btn.box?.w}×${btn.box?.h}`],
		['label child renders', label.text === labelText, JSON.stringify(label.text)],
		['label centered horizontally', near(label.box.x + label.box.w / 2 - btn.box.x, btn.box.w / 2, 1)],
		['label centered vertically', near(label.box.y + label.box.h / 2 - btn.box.y, btn.box.h / 2, 1)],
	]
}

const inputEqual = [
	'field.box.x',
	'field.box.y',
	'field.box.w',
	'field.box.h',
	'field.placeholder',
	'field.placeholderStyle.color',
	'field.placeholderStyle.opacity',
	'field.style.fontSize',
	'field.style.fontFamily',
	'field.style.fontPostScriptName',
	'field.style.fontWeight',
	'field.style.color',
]

function inputRows(m, value) {
	const field = m('field')
	const rows = [
		dims(field, 180, 32, 1),
		['placeholder is set', field.placeholder === 'Name', field.placeholder],
	]
	if (value !== undefined) {
		rows.push(['input value matches', field.text === value, JSON.stringify(field.text)])
	}
	return rows
}

function inputNaturalRows(m, value) {
	const field = m('field')
	return [
		['input has positive intrinsic dimensions', field.box?.w > 0 && field.box?.h > 0, `${field.box?.w}×${field.box?.h}`],
		['placeholder is set', field.placeholder === 'Name', field.placeholder],
		['input value matches', field.text === value, JSON.stringify(field.text)],
	]
}

function textAreaRows(m, target, value) {
	const field = m('field')
	const rows = [
		dims(field, 180, 48, 1),
		['placeholder is set', field.placeholder === 'Notes', field.placeholder],
	]
	if (value !== undefined) {
		rows.push(['textarea value matches', field.text === value, JSON.stringify(field.text)])
	}
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

function textAreaRowsIntrinsic(m, target, value, height) {
	const field = m('field')
	const rows = [
		dims(field, 180, height, 1),
		['placeholder is set', field.placeholder === 'Notes', field.placeholder],
		['textarea value matches', field.text === value, JSON.stringify(field.text)],
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
		targets: ['web', 'macos'],
		elements: { heading: 'parity-heading' },
		equal: headingEqual,
		check: (m) => headingRows(m, 'Shared heading', 32),
	},
	{
		fixture: 'heading-level-2',
		targets: ['web', 'macos'],
		elements: { heading: 'parity-heading' },
		equal: headingEqual,
		check: (m) => headingRows(m, 'Shared heading', 24),
	},
	{
		fixture: 'heading-level-3',
		targets: ['web', 'macos'],
		elements: { heading: 'parity-heading' },
		equal: headingEqual,
		check: (m) => headingRows(m, 'Shared heading', 18.72),
	},
	{
		fixture: 'heading-level-4',
		targets: ['web', 'macos'],
		elements: { heading: 'parity-heading' },
		equal: headingEqual,
		check: (m) => headingRows(m, 'Shared heading', 16),
	},
	{
		fixture: 'heading-level-5',
		targets: ['web', 'macos'],
		elements: { heading: 'parity-heading' },
		equal: headingEqual,
		check: (m) => headingRows(m, 'Shared heading', 13.28),
	},
	{
		fixture: 'heading-level-6',
		targets: ['web', 'macos'],
		elements: { heading: 'parity-heading' },
		equal: headingEqual,
		check: (m) => headingRows(m, 'Shared heading', 10.72),
	},
	{
		fixture: 'heading-custom-size',
		targets: ['web', 'macos'],
		elements: { heading: 'parity-heading' },
		equal: headingEqual,
		check: (m) => headingRows(m, 'Shared heading', 20),
	},
	{
		fixture: 'text-class-sm',
		targets: ['web', 'macos'],
		elements: { text: 'parity-text' },
		equal: textEqual,
		check: (m) => textClassRows(m, 'Shared label', 13, 20),
	},
	{
		fixture: 'text-class-lg',
		targets: ['web', 'macos'],
		elements: { text: 'parity-text' },
		equal: textEqual,
		check: (m) => textClassRows(m, 'Shared label', 18, 28),
	},
	{
		fixture: 'text-class-xl',
		targets: ['web', 'macos'],
		elements: { text: 'parity-text' },
		equal: textEqual,
		check: (m) => textClassRows(m, 'Shared label', 20, 28),
	},
	{
		fixture: 'text-class-2xl',
		targets: ['web', 'macos'],
		equal: textEqual,
		elements: { text: 'parity-text' },
		check: (m) => textClassRows(m, 'Shared label', 28, 36),
	},
	{
		fixture: 'text-basic',
		targets: ['web', 'macos'],
		elements: { text: 'parity-text' },
		equal: textEqual,
		check: (m) => textRows(m, 'Shared label', 20, 84.17),
	},
	{
		fixture: 'text-bold',
		targets: ['web', 'macos'],
		elements: { text: 'parity-text' },
		equal: textEqual,
		check: (m) => textRows(m, 'Shared label', 20),
	},
	{
		fixture: 'text-regular',
		targets: ['web', 'macos'],
		elements: { text: 'parity-text' },
		equal: textEqual,
		check: (m) => textRows(m, 'Shared label', 20),
	},
	{
		fixture: 'text-small',
		targets: ['web', 'macos'],
		elements: { text: 'parity-text' },
		equal: textEqual,
		check: (m) => textRows(m, 'Shared label', 16),
	},
	{
		fixture: 'text-display',
		targets: ['web', 'macos'],
		elements: { text: 'parity-text' },
		equal: textEqual,
		check: (m) => textRows(m, 'Shared label', 24),
	},
	{
		fixture: 'text-long',
		targets: ['web', 'macos'],
		elements: { text: 'parity-text' },
		equal: textEqual,
		check: (m) => textRows(m, 'Shared typography should render the same glyph advances', 40),
	},
	{
		fixture: 'text-advance',
		targets: ['web', 'macos'],
		elements: { text: 'parity-text' },
		equal: textEqual,
		check: (m) => textRows(m, 'The same type should use the same width across targets.', 20),
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
			'glyph.textLineAdvances',
		],
		check: (m) => {
			const box = m('box')
			const glyph = m('glyph')
			return [
				dims(box, 20, 20),
				['check glyph renders', glyph.text === '✓', JSON.stringify(glyph.text)],
				['glyph centered in box', near(glyph.box.x + glyph.box.w / 2 - box.box.x, 10, 1)],
			]
		},
	},
	{
		fixture: 'button-basic',
		elements: { btn: 'vx-button', label: 'parity-txt' },
		equal: buttonEqual,
		check: (m) => buttonRows(m, 220, 32, 'Go'),
	},
	{
		fixture: 'button-compact',
		elements: { btn: 'vx-button', label: 'parity-txt' },
		equal: buttonEqual,
		check: (m) => buttonRows(m, 96, 28, 'Save'),
	},
	{
		fixture: 'button-long-label',
		elements: { btn: 'vx-button', label: 'parity-txt' },
		equal: buttonEqual,
		check: (m) => buttonRows(m, 160, 36, 'Continue'),
	},
	{
		fixture: 'button-natural',
		targets: ['web', 'macos'],
		elements: { btn: 'parity-button-natural', label: 'parity-txt' },
		equal: buttonNaturalEqual,
		check: (m) => buttonNaturalRows(m, 'Go'),
	},
	{
		fixture: 'text-input',
		targets: ['web', 'macos'],
		elements: { field: 'parity-textinput' },
		equal: inputEqual,
		check: (m) => inputRows(m),
	},
	{
		fixture: 'text-input-filled',
		targets: ['web', 'macos'],
		elements: { field: 'parity-textinput' },
		equal: [...inputEqual, 'field.text', 'field.textLineAdvances'],
		check: (m) => inputRows(m, 'alec@example.com'),
	},
	{
		fixture: 'text-input-natural',
		targets: ['web', 'macos'],
		elements: { field: 'parity-textinput' },
		equal: [...inputEqual, 'field.text', 'field.textLineAdvances'],
		check: (m) => inputNaturalRows(m, 'alec@example.com'),
	},
	{
		fixture: 'text-area',
		targets: ['web', 'macos'],
		elements: { field: 'parity-textarea' },
		equal: inputEqual,
		check: (m, target) => textAreaRows(m, target),
	},
	{
		fixture: 'text-area-filled',
		targets: ['web', 'macos'],
		elements: { field: 'parity-textarea' },
		// CDP doesn't expose the active font face inside a populated textarea;
		// the empty textarea case checks family and PostScript name.
		equal: inputEqual
			.filter(
				(facet) => !['field.style.fontFamily', 'field.style.fontPostScriptName'].includes(facet),
			)
			.concat('field.text', 'field.textLineAdvances'),
		check: (m, target) => textAreaRows(m, target, 'First line\nSecond line'),
	},
	{
		fixture: 'text-area-rows-2',
		targets: ['web', 'macos'],
		elements: { field: 'parity-textarea' },
		equal: inputEqual
			.filter(
				(facet) => !['field.style.fontFamily', 'field.style.fontPostScriptName'].includes(facet),
			)
			.concat('field.text', 'field.textLineAdvances'),
		check: (m, target) => textAreaRowsIntrinsic(m, target, 'First line\nSecond line', 36),
	},
	{
		fixture: 'text-area-rows-default',
		targets: ['web', 'macos'],
		elements: { field: 'parity-textarea' },
		equal: inputEqual
			.filter(
				(facet) => !['field.style.fontFamily', 'field.style.fontPostScriptName'].includes(facet),
			)
			.concat('field.text', 'field.textLineAdvances'),
		check: (m, target) => textAreaRowsIntrinsic(m, target, 'First line\nSecond line', 54),
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
		targets: ['web', 'macos'],
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
		targets: ['web', 'macos'],
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
		targets: ['web', 'macos'],
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
