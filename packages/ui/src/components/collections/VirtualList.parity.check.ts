import type { ParityCheck } from '../../parity/check-helpers.ts'
import { dims } from '../../parity/check-helpers.ts'

export const CHECKS: ParityCheck[] = [
	{
		fixture: 'virtual-list-viewport',
		targets: ['web', 'ios', 'android', 'macos'],
		elements: { list: 'parity-virtual-list-root', item: 'parity-virtual-list-item-content' },
		equal: ['list.box.w', 'list.box.h', 'item.box.w', 'item.box.h'],
		check: (m) => [dims(m('list'), 220, 64), dims(m('item'), 200, 24)],
	},
]
