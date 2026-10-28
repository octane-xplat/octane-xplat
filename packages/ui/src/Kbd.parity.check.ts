import type { ParityCheck } from './parity/check-helpers.ts'
import { dims } from './parity/check-helpers.ts'

export const CHECKS: ParityCheck[] = [
	{
		fixture: 'kbd-shortcut',
		targets: ['web', 'ios', 'android', 'macos'],
		elements: { key: 'parity-kbd-root' },
		equal: ['key.box.w', 'key.box.h', 'key.style.backgroundColor'],
		check: (m) => [dims(m('key'), 52, 32)],
	},
]
