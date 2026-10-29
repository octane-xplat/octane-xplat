import type { ParityCheck } from '../../parity/check-helpers.ts'
import { dims } from '../../parity/check-helpers.ts'

export const CHECKS: ParityCheck[] = [
	{
		fixture: 'tree-expanded',
		targets: ['web', 'ios', 'android', 'macos'],
		elements: { tree: 'parity-tree-root', child: 'vx-tree-row--disabled' },
		equal: ['tree.box.w', 'tree.box.h', 'tree.style.backgroundColor', 'child.style.opacity'],
		check: (m) => {
			const child = m('child')
			return [
				dims(m('tree'), 180, 96),
				['expanded child has a visible frame', child.box.w > 0 && child.box.h > 0],
			]
		},
	},
]
