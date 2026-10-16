import type { ParityCheck } from './parity/check-helpers.ts'
import { near, dims } from './parity/check-helpers.ts'

export const CHECKS: ParityCheck[] = [

	{
		fixture: 'safe-area-layout',
		elements: {
			root: 'parity-safe-area-root',
			content: 'parity-safe-area-content',
			reference: 'parity-safe-area-reference',
			expected: 'parity-safe-area-expected',
		},
		equal: [],
		check: (m) => {
			const root = m('root')
			const content = m('content')
			const reference = m('reference')
			const expected = m('expected')
			return [
				dims(root, 96, 160),
				dims(reference, 96, 160),
				[
					'content matches platform safe-area inset frame',
					near(content.box.x - root.box.x, expected.box.x - reference.box.x, 1) &&
						near(content.box.y - root.box.y, expected.box.y - reference.box.y, 1) &&
						near(content.box.w, expected.box.w, 1) &&
						near(content.box.h, expected.box.h, 1),
				],
			]
		},
	}
]
