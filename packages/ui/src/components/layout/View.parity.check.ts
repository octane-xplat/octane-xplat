import type { ParityCheck } from '../../parity/check-helpers.ts'
import { near, dims } from '../../parity/check-helpers.ts'

export const CHECKS: ParityCheck[] = [
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
		fixture: 'view-padding-layout',
		elements: {
			root: 'parity-padded-view-root',
			first: 'parity-padded-view-first',
			second: 'parity-padded-view-second',
		},
		equal: [
			'root.style.flexDirection',
			'root.style.alignItems',
			'root.style.paddingTop',
			'root.style.paddingRight',
			'root.style.paddingBottom',
			'root.style.paddingLeft',
		],
		check: (m) => {
			const root = m('root')
			const first = m('first')
			const second = m('second')
			return [
				dims(root, 96, 48),
				dims(first, 20, 10),
				dims(second, 20, 10),
				[
					'first child follows 8-dip top and left padding',
					near(first.box.x - root.box.x, 8, 1) && near(first.box.y - root.box.y, 8, 1),
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
		fixture: 'percent-size-layout',
		targets: ['web', 'ios', 'android', 'macos', 'windows'],
		elements: { root: 'parity-percent-root' },
		equal: ['root.box.x', 'root.box.y', 'root.box.w', 'root.box.h'],
		check: (m) => [dims(m('root'), 110, 32, 1)],
	},
]
