// Parity assertions for the fixture stage (packages/app/src/parity/).
// Executed by scripts/parity-check.mjs against parity-report/<target>.json
// dumps — never imported by app code.
//
// Per check:
//   fixture  — matches the cell name from fixtures.tsrx
//   elements — logical name → vx-* class inside the fixture cell
//   check(m) — per-target invariants; m('track') → {box:{x,y,w,h}, style, text}
//              with box measured relative to the fixture's .parity-box.
//              Return rows [name, ok, detail?].
//   equal    — 'el.box.<f>' | 'el.style.<f>' | 'el.text' paths that must
//              agree across every dumped target (skipped with one dump).
const near = (a, b, tol = 0.51) => a != null && b != null && Math.abs(a - b) <= tol
const dims = (el, w, h, tol) => [
	`${w}×${h}`,
	near(el.box?.w, w, tol) && near(el.box?.h, h, tol),
	`${el.box?.w}×${el.box?.h}`,
]

export const CHECKS = [
	{
		fixture: 'switch-off',
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
		elements: { track: 'vx-switch', thumb: 'vx-switch-thumb' },
		equal: ['track.style.backgroundColor', 'thumb.style.backgroundColor'],
		check: (m) => {
			const track = m('track')
			const thumb = m('thumb')
			return [
				dims(track, 48, 28),
				dims(thumb, 22, 22),
				[
					'thumb parked right (3 pad)',
					near(track.box.w - (thumb.box.x - track.box.x) - thumb.box.w, 3),
				],
			]
		},
	},
	{
		fixture: 'slider-0',
		elements: {
			host: 'vx-slider',
			track: 'vx-slider-track',
			fill: 'vx-slider-fill',
			thumb: 'vx-slider-thumb',
		},
		equal: [
			'track.style.backgroundColor',
			'fill.style.backgroundColor',
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
				['empty fill', near(fill.box.w, 0, 1), fill.box.w],
				// Intentional divergence: web centers the thumb ON the track
				// edge (translate(-50%) → overhang -10), native clamps flush
				// inside the track — same clamp semantic as UISlider.
				[
					'thumb at min edge (web overhangs −10, native clamps flush)',
					near(thumb.box.x - track.box.x, target === 'web' ? -10 : 0, 1),
					thumb.box.x - track.box.x,
				],
			]
		},
	},
	{
		fixture: 'slider-50',
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
		// Regression for the @import/css-strip leak: children of a bare
		// gridlayout must place inside their cell — leaked web-only
		// position/transform rules previously offset them by −50 dips.
		fixture: 'grid-probe',
		elements: { cell: 'probe-grid-cell', thumb: 'vx-slider-thumb' },
		equal: [],
		check: (m, target) => [
			dims(m('cell'), 20, 20),
			// Intentional divergence: a fixed-size grid child resolves
			// stretch→start on web but centers in the NS cell. Also,
			// vx-slider-thumb carries web-only absolute+translate css —
			// -10/-10-ish on web, middle-of-cell on native.
			[
				'cell placement (web start 0,0 / native center 100,4)',
				target === 'web'
					? near(m('cell').box.x, 0, 1) && near(m('cell').box.y, 0, 1)
					: near(m('cell').box.x, 100, 1) && near(m('cell').box.y, 4, 1),
			],
			// native-only: if web-only css leaks, the thumb gets a −50dip
			// translate. On web it's abs-positioned relative to a
			// non-positioned ancestor — a meaningless number, so no assert.
			...(target === 'web'
				? []
				: [
						[
							'thumb centers in cell (no leaked translate)',
							near(m('thumb').box.x, 100, 1) && near(m('thumb').box.y, 4, 1),
						],
					]),
		],
	},
	{
		fixture: 'checkbox-off',
		elements: { row: 'vx-checkbox-row', box: 'vx-checkbox' },
		equal: ['box.style.borderTopColor', 'box.style.borderTopLeftRadius'],
		check: (m) => {
			const box = m('box')
			return [dims(box, 20, 20), ['box at row start', near(box.box.x, 0, 1), box.box.x]]
		},
	},
	{
		fixture: 'checkbox-on',
		elements: { row: 'vx-checkbox-row', box: 'vx-checkbox', glyph: 'vx-checkbox-check' },
		equal: ['box.style.backgroundColor'],
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
		equal: ['btn.style.justifyContent', 'btn.style.alignItems'],
		check: (m) => {
			const btn = m('btn')
			const label = m('label')
			return [
				['button fills the stage box', near(btn.box.w, 220, 1), btn.box.w],
				['label child renders', label.text === 'Go', JSON.stringify(label.text)],
				[
					'label centered in button',
					near(label.box.x + label.box.w / 2 - btn.box.x, btn.box.w / 2, 1),
				],
			]
		},
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
				['first child centered vertically', near(first.box.y - root.box.y, 11, 1)],
				['second child centered vertically', near(second.box.y - root.box.y, 11, 1)],
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
]
