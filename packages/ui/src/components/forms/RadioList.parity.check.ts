import type { ParityCheck } from '../../parity/check-helpers.ts'
import { controlEqual, controlRows } from '../../parity/check-helpers.ts'

export const CHECKS: ParityCheck[] = [
	{
		fixture: 'radio-group-selected',
		targets: ['web', 'ios', 'android', 'macos'],
		elements: { control: 'parity-radiogroup-root', selected: 'vx-radio-dot' },
		equal: [...controlEqual, 'selected.box.w', 'selected.box.h', 'selected.style.backgroundColor'],
		check: (m) => {
			const selected = m('selected')
			return [
				...controlRows(m, 180, 56),
				['selected radio dot has positive bounds', selected.box?.w > 0 && selected.box?.h > 0],
			]
		},
	},
]
