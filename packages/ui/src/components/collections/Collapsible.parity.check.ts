import type { ParityCheck } from '../../parity/check-helpers.ts'
import { dims } from '../../parity/check-helpers.ts'

export const CHECKS: ParityCheck[] = [
	{
		fixture: 'collapsible-open',
		targets: ['web', 'ios', 'android', 'macos'],
		elements: { root: 'parity-collapsible-root', content: 'parity-collapsible-content' },
		equal: [
			'root.box.w',
			'root.box.h',
			'root.style.backgroundColor',
			'content.box.w',
			'content.box.h',
		],
		check: (m) => [dims(m('root'), 180, 72), dims(m('content'), 160, 24)],
	},
]
