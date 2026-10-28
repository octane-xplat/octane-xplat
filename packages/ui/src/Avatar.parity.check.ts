import type { ParityCheck } from './parity/check-helpers.ts'
import { dims } from './parity/check-helpers.ts'

export const CHECKS: ParityCheck[] = [
	{
		fixture: 'avatar-fallback',
		targets: ['web', 'ios', 'android', 'macos'],
		elements: { avatar: 'parity-avatar-root' },
		equal: ['avatar.box.w', 'avatar.box.h', 'avatar.style.backgroundColor'],
		check: (m) => [dims(m('avatar'), 40, 40)],
	},
]
