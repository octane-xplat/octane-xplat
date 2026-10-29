import type { ParityCheck, CheckRow } from '../../parity/check-helpers.ts'
import { near, controlEqual, controlRows } from '../../parity/check-helpers.ts'

export const CHECKS: ParityCheck[] = [
	{
		fixture: 'input-rating-selected',
		targets: ['web', 'ios', 'android', 'macos'],
		elements: { control: 'parity-rating-root', selected: 'vx-rating-cell--on' },
		// The default star is a font glyph; keep its measured advance explicit per target.
		equal: [...controlEqual, 'selected.box.h'],
		check: (m, target) => {
			const selected = m('selected')
			const expectedWidth = ({ web: 23.88, ios: 24, android: 21.33 } as Record<string, number>)[
				target
			]
			const rows: CheckRow[] = [
				...controlRows(m, 200, 32),
				['selected rating cell has positive bounds', selected.box?.w > 0 && selected.box?.h > 0],
			]

			if (expectedWidth !== undefined) {
				rows.push([
					'selected star cell width matches target font metrics',
					near(selected.box?.w, expectedWidth, 0.75),
					`${selected.box?.w}px; expected ${expectedWidth}px`,
				])
			}

			return rows
		},
	},
]
