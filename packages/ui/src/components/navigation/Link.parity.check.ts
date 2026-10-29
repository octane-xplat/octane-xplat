import type { ParityCheck } from '../../parity/check-helpers.ts'
import { dims } from '../../parity/check-helpers.ts'

export const CHECKS: ParityCheck[] = [
	{
		fixture: 'link-fixed-target',
		targets: ['web', 'ios', 'android', 'macos'],
		elements: { link: 'parity-link-root' },
		equal: ['link.box.w', 'link.box.h', 'link.style.backgroundColor'],
		check: (m) => [dims(m('link'), 160, 32)],
	},
]
