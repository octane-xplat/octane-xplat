import type { ParityCheck } from './parity/check-helpers.ts'
import { dims } from './parity/check-helpers.ts'

export const CHECKS: ParityCheck[] = [
	{
		fixture: 'icon-registered-glyph',
		targets: ['web', 'ios', 'android'],
		elements: { icon: 'parity-icon-root' },
		equal: ['icon.box.w', 'icon.box.h'],
		check: (m) => [dims(m('icon'), 24, 24)],
	},
]
