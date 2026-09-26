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
		check: (m) => {
			const host = m('host')
			const track = m('track')
			const fill = m('fill')
			const thumb = m('thumb')
			return [
				dims(host, 220, 28, 1),
				dims(track, 220, 4, 1),
				dims(thumb, 20, 20),
				['empty fill', near(fill.box.w, 0, 1), fill.box.w],
				['thumb centered at 0', near(thumb.box.x + thumb.box.w / 2 - track.box.x, 0, 1)],
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
]
