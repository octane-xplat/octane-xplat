import type { ParityCheck } from './parity/check-helpers.ts'
import { dims } from './parity/check-helpers.ts'

export const CHECKS: ParityCheck[] = [
	{
		fixture: 'overlay-fixed-frame',
		elements: { frame: 'parity-portal--overlay-fixed-frame' },
		equal: ['frame.box.w', 'frame.box.h', 'frame.style.backgroundColor'],
		check: (m) => [dims(m('frame'), 96, 48)],
	},
]
