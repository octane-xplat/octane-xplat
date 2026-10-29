import type { ParityCheck } from '../../parity/check-helpers.ts'
import { near, dims } from '../../parity/check-helpers.ts'

export const CHECKS: ParityCheck[] = [
	{
		fixture: 'section-column',
		elements: {
			root: 'parity-section-root',
			first: 'parity-section-first',
			second: 'parity-section-second',
		},
		equal: ['first.box.x', 'first.box.y', 'second.box.x', 'second.box.y'],
		check: (m) => {
			const first = m('first')
			const second = m('second')
			return [
				dims(first, 16, 8),
				dims(second, 20, 12),
				[
					'children share the column cross-axis edge',
					near(first.box.x, second.box.x, 1),
					`${first.box.x} vs ${second.box.x}`,
				],
				[
					'second child stacks below the first',
					near(second.box.y - first.box.y - first.box.h, 0, 1),
					second.box.y - first.box.y - first.box.h,
				],
			]
		},
	},
]
