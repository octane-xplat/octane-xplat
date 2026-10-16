import type { ParityCheck } from './parity/check-helpers.ts'
import { dims, controlEqual, controlRows } from './parity/check-helpers.ts'

export const CHECKS: ParityCheck[] = [

	{
		fixture: 'checkbox-group-selected',
		targets: ['web', 'ios', 'android', 'macos'],
		elements: { control: 'parity-checkboxgroup-root', selected: 'vx-checkbox' },
		equal: [...controlEqual, 'selected.box.w', 'selected.box.h', 'selected.style.backgroundColor'],
		check: (m) => [...controlRows(m, 180, 56), dims(m('selected'), 24, 24)],
	}
]
