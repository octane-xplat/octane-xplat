import type { ParityCheck, CheckRow } from './parity/check-helpers.ts'
import { near, controlEqual, controlRows } from './parity/check-helpers.ts'

export const CHECKS: ParityCheck[] = [

	{
		fixture: 'segmented-control-selected',
		targets: ['web', 'ios', 'android'],
		elements: { control: 'parity-segmented-root', selected: 'vx-segment--on' },
		// The selected segment's cross-axis box follows each renderer's flex/text layout.
		equal: [...controlEqual, 'selected.style.backgroundColor'],
		check: (m, target) => {
			const selected = m('selected')
			const expected = (
				{
					web: { w: 86, h: 32 },
					ios: { w: 87, h: 34 },
					android: { w: 86.1, h: 31.62 },
				} as Record<string, { w: number; h: number }>
			)[target]

			const rows: CheckRow[] = [
				...controlRows(m, 180, 40),
				['selected segment has positive bounds', selected.box?.w > 0 && selected.box?.h > 0],
			]

			if (expected) {
				rows.push([
					'selected segment bounds match target flex layout',
					near(selected.box?.w, expected.w, 0.75) && near(selected.box?.h, expected.h, 0.75),
					`${selected.box?.w}×${selected.box?.h}; expected ${expected.w}×${expected.h}`,
				])
			}

			return rows
		},
	}
]
