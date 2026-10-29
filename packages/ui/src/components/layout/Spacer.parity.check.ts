import type { ParityCheck } from '../../parity/check-helpers.ts'
import { near, dims } from '../../parity/check-helpers.ts'

export const CHECKS: ParityCheck[] = [
	{
		fixture: 'spacer-layout',
		elements: {
			root: 'parity-spacer-root',
			leading: 'parity-spacer-leading',
			spacer: 'parity-spacer',
			trailing: 'parity-spacer-trailing',
		},
		equal: ['root.style.flexDirection', 'root.style.alignItems'],
		check: (m) => {
			const root = m('root')
			const leading = m('leading')
			const spacer = m('spacer')
			const trailing = m('trailing')
			return [
				dims(root, 96, 24),
				dims(leading, 16, 10),
				dims(spacer, 48, 24),
				dims(trailing, 16, 10),
				['leading child starts at the row origin', near(leading.box.x - root.box.x, 0, 1)],
				[
					'spacer follows the leading child and gap',
					near(spacer.box.x - leading.box.x - leading.box.w, 8, 1),
				],
				[
					'trailing child follows the expanded spacer and gap',
					near(trailing.box.x - spacer.box.x - spacer.box.w, 8, 1),
				],
			]
		},
	},
]
