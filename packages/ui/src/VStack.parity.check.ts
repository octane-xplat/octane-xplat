import type { ParityCheck } from './parity/check-helpers.ts'
import { near, dims } from './parity/check-helpers.ts'

export const CHECKS: ParityCheck[] = [
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
]
