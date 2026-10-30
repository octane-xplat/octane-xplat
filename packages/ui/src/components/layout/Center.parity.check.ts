import type { ParityCheck } from '../../parity/check-helpers.ts'
import { near, dims } from '../../parity/check-helpers.ts'

export const CHECKS: ParityCheck[] = [
	{
		fixture: 'center-fixed-child',
		targets: ['web', 'ios', 'android', 'macos', 'windows'],
		elements: {
			root: 'parity-center-root',
			child: 'parity-center-child',
		},
		equal: ['root.box.w', 'root.box.h', 'child.box.w', 'child.box.h'],
		check: (m) => {
			const root = m('root')
			const child = m('child')
			return [
				dims(root, 96, 48, 1),
				dims(child, 20, 10, 1),
				[
					'child is horizontally centered',
					near(child.box.x - root.box.x, (96 - 20) / 2, 1),
					child.box.x - root.box.x,
				],
				[
					'child is vertically centered',
					near(child.box.y - root.box.y, (48 - 10) / 2, 1),
					child.box.y - root.box.y,
				],
			]
		},
	},
]
