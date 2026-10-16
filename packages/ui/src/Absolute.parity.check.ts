import type { ParityCheck } from './parity/check-helpers.ts'
import { near, dims } from './parity/check-helpers.ts'

export const CHECKS: ParityCheck[] = [

	{
		fixture: 'absolute-layout',
		elements: {
			root: 'parity-absolute-root',
			first: 'parity-absolute-first',
			second: 'parity-absolute-second',
		},
		equal: [
			'root.box.w',
			'root.box.h',
			'root.style.backgroundColor',
			'first.box.x',
			'first.box.y',
			'first.box.w',
			'first.box.h',
			'second.box.x',
			'second.box.y',
			'second.box.w',
			'second.box.h',
		],
		check: (m) => {
			const root = m('root')
			const first = m('first')
			const second = m('second')
			return [
				dims(root, 96, 48),
				dims(first, 20, 10),
				dims(second, 12, 8),
				[
					'first child uses its left/top offsets',
					near(first.box.x - root.box.x, 8) && near(first.box.y - root.box.y, 6),
				],
				[
					'second child uses its left/top offsets',
					near(second.box.x - root.box.x, 40) && near(second.box.y - root.box.y, 24),
				],
			]
		},
	}
]
