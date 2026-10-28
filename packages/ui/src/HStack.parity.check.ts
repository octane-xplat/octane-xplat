import type { ParityCheck } from './parity/check-helpers.ts'
import { near, dims } from './parity/check-helpers.ts'

export const CHECKS: ParityCheck[] = [
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
]
