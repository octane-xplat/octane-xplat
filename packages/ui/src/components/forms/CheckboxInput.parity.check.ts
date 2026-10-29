import type { ParityCheck, CheckRow } from '../../parity/check-helpers.ts'
import { near, dims } from '../../parity/check-helpers.ts'

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
		elements: { row: 'vx-checkbox-row', box: 'vx-checkbox' },
		equal: ['box.style.backgroundColor'],
		check: (m, target, dump) => {
			const box = m('box')
			const rows: CheckRow[] = [dims(box, 24, 24)]
			if (target === 'macos') {
				// The macOS leaf still draws the ✓ font glyph; web/iOS/Android
				// share Astryx's drawn check (vx-ind-checkmark).
				return rows
			}

			// The drawn check is not in `elements` so resolve() doesn't fail on
			// macOS; on the shared-geometry targets it must be present.
			const glyph = (dump.cells?.['checkbox-on'] ?? []).find((n) =>
				n.classes?.includes('vx-ind-checkmark'),
			)
			rows.push(
				['drawn check mark present', glyph != null],
				[
					'check mark is 14×14',
					near(glyph?.box?.w, 14, 1) && near(glyph?.box?.h, 14, 1),
					`${glyph?.box?.w}×${glyph?.box?.h}`,
				],
				[
					'check centered in box',
					glyph != null &&
						near(glyph.box.x + glyph.box.w / 2 - box.box.x, 12, 1) &&
						near(glyph.box.y + glyph.box.h / 2 - box.box.y, 12, 1),
				],
			)
			return rows
		},
	},
]
