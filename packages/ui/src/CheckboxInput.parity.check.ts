import type { ParityCheck, CheckRow } from './parity/check-helpers.ts'
import { near, dims } from './parity/check-helpers.ts'

export const CHECKS: ParityCheck[] = [

	{
		fixture: 'checkbox-off',
		targets: ['web', 'ios', 'android', 'macos'],
		elements: { row: 'vx-checkbox-row', box: 'vx-checkbox' },
		equal: ['box.style.borderTopColor', 'box.style.borderTopLeftRadius'],
		check: (m) => {
			const box = m('box')
			// Astryx md indicator box is 24px (sm is 20).
			return [dims(box, 24, 24), ['box at row start', near(box.box.x, 0, 1), box.box.x]]
		},
	},

	{
		fixture: 'checkbox-on',
		targets: ['web', 'ios', 'android', 'macos'],
		elements: { row: 'vx-checkbox-row', box: 'vx-checkbox', glyph: 'vx-checkbox-check' },
		equal: [
			'box.style.backgroundColor',
			'glyph.style.fontSize',
			'glyph.style.lineHeight',
			'glyph.style.color',
		],
		check: (m, target) => {
			const box = m('box')
			const glyph = m('glyph')
			const expectedGlyphWidth = ({ web: 11.98, ios: 10.67, android: 11.43 } as Record<string, number>)[target]
			const rows: CheckRow[] = [
				dims(box, 24, 24),
				['check glyph has positive bounds', glyph.box?.w > 0 && glyph.box?.h > 0],
				['glyph centered in box', near(glyph.box.x + glyph.box.w / 2 - box.box.x, 12, 1)],
			]

			if (expectedGlyphWidth !== undefined) {
				// The ✓ advance comes from each target's actual font fallback.
				rows.push([
					'check glyph width matches target font metrics',
					near(glyph.box?.w, expectedGlyphWidth, 0.75),
					`${glyph.box?.w}px; expected ${expectedGlyphWidth}px`,
				])
			}

			return rows
		},
	}
]
