import type { ParityCheck } from './parity/check-helpers.ts'
import { dims } from './parity/check-helpers.ts'

export const CHECKS: ParityCheck[] = [

	{
		fixture: 'avatar-group-overflow',
		targets: ['web', 'ios', 'android', 'macos'],
		elements: { group: 'parity-avatar-group-root', member: 'parity-avatar-group-member' },
		equal: ['group.box.w', 'group.box.h', 'member.box.w', 'member.box.h'],
		check: (m) => [dims(m('group'), 96, 40), dims(m('member'), 32, 32)],
	}
]
