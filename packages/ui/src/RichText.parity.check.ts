import type { ParityCheck } from './parity/check-helpers.ts'
import { dims } from './parity/check-helpers.ts'

export const CHECKS: ParityCheck[] = [

	{
		fixture: 'rich-text-fixed-run',
		targets: ['web', 'ios', 'android', 'macos'],
		elements: { text: 'parity-rich-text-root' },
		equal: ['text.box.w', 'text.box.h', 'text.style.backgroundColor'],
		check: (m) => [dims(m('text'), 220, 32)],
	}
]
