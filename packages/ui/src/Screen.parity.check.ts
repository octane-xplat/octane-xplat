import type { ParityCheck } from './parity/check-helpers.ts'
import { near, dims } from './parity/check-helpers.ts'

export const CHECKS: ParityCheck[] = [

	{
		fixture: 'screen-layout',
		targets: ['web', 'ios', 'android', 'macos'],
		elements: { root: 'parity-screen-root', child: 'parity-screen-child' },
		equal: ['root.box.w', 'root.box.h', 'child.box.x', 'child.box.y', 'child.box.w', 'child.box.h'],
		check: (m) => {
			const root = m('root')
			const child = m('child')
			return [
				dims(root, 220, 64),
				dims(child, 20, 10),
				[
					'child starts at screen content origin',
					near(child.box.x - root.box.x, 0, 1) && near(child.box.y - root.box.y, 0, 1),
				],
			]
		},
	}
]
