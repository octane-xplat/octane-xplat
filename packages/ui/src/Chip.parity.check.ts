import type { ParityCheck } from './parity/check-helpers.ts'
import { dims } from './parity/check-helpers.ts'

export const CHECKS: ParityCheck[] = [

	{
		fixture: 'chip-selected',
		targets: ['web', 'ios', 'android', 'macos'],
		elements: { chip: 'parity-chip-root', selected: 'vx-chip--on' },
		equal: ['chip.box.w', 'chip.box.h', 'selected.style.backgroundColor', 'selected.style.color'],
		check: (m) => [dims(m('chip'), 96, 32)],
	}
]
