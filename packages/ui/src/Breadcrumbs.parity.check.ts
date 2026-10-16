import type { ParityCheck } from './parity/check-helpers.ts'
import { dims } from './parity/check-helpers.ts'

export const CHECKS: ParityCheck[] = [

	{
		fixture: 'breadcrumb-trail',
		targets: ['web', 'ios', 'android', 'macos'],
		elements: { trail: 'parity-breadcrumb-root' },
		equal: ['trail.box.w', 'trail.box.h', 'trail.style.backgroundColor'],
		check: (m) => [dims(m('trail'), 220, 36)],
	}
]
