import type { ParityCheck } from './parity/check-helpers.ts'
import { dims } from './parity/check-helpers.ts'

export const CHECKS: ParityCheck[] = [
	{
		fixture: 'user-row',
		targets: ['web', 'ios', 'android', 'macos'],
		elements: { user: 'parity-user-root', avatar: 'vx-avatar' },
		equal: [
			'user.box.w',
			'user.box.h',
			'user.style.backgroundColor',
			'avatar.box.w',
			'avatar.box.h',
		],
		check: (m) => [dims(m('user'), 220, 56), dims(m('avatar'), 40, 40)],
	},
]
