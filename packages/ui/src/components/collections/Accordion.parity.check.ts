import type { ParityCheck } from '../../parity/check-helpers.ts'
import { dims } from '../../parity/check-helpers.ts'

export const CHECKS: ParityCheck[] = [
	{
		fixture: 'accordion-one-open',
		targets: ['web', 'ios', 'android', 'macos'],
		elements: { root: 'parity-accordion-root', content: 'parity-accordion-content' },
		equal: [
			'root.box.w',
			'root.box.h',
			'root.style.backgroundColor',
			'content.box.w',
			'content.box.h',
		],
		check: (m) => [dims(m('root'), 180, 88), dims(m('content'), 160, 28)],
	},
]
