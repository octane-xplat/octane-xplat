import type { ParityCheck } from '../../parity/check-helpers.ts'
import { dims } from '../../parity/check-helpers.ts'

export const CHECKS: ParityCheck[] = [
	{
		fixture: 'dropdown-menu-trigger',
		targets: ['web', 'ios', 'android', 'macos'],
		elements: { trigger: 'parity-dropdown-trigger' },
		equal: ['trigger.box.w', 'trigger.box.h', 'trigger.style.backgroundColor'],
		check: (m) => [dims(m('trigger'), 160, 32)],
	},
]
