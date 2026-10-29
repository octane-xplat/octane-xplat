import type { ParityCheck } from '../../parity/check-helpers.ts'
import { dims } from '../../parity/check-helpers.ts'

export const CHECKS: ParityCheck[] = [
	{
		fixture: 'separator-horizontal',
		targets: ['web', 'ios', 'android', 'macos'],
		elements: { separator: 'parity-separator-root' },
		equal: ['separator.box.w', 'separator.box.h', 'separator.style.backgroundColor'],
		check: (m) => [dims(m('separator'), 160, 2)],
	},
]
