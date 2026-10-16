import type { ParityCheck } from './parity/check-helpers.ts'
import { dims } from './parity/check-helpers.ts'

export const CHECKS: ParityCheck[] = [

	{
		fixture: 'table-two-rows',
		targets: ['web', 'ios', 'android', 'macos'],
		elements: { table: 'parity-table-root', cell: 'parity-table-cell-content' },
		equal: [
			'table.box.w',
			'table.box.h',
			'table.style.backgroundColor',
			'cell.box.w',
			'cell.box.h',
		],
		check: (m) => [dims(m('table'), 220, 96), dims(m('cell'), 64, 24)],
	}
]
