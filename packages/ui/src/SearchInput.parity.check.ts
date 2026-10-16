import type { ParityCheck } from './parity/check-helpers.ts'
import { dims } from './parity/check-helpers.ts'

export const CHECKS: ParityCheck[] = [

	{
		fixture: 'search-input-basic',
		targets: ['web', 'ios', 'android', 'macos'],
		elements: { search: 'parity-search-input-root' },
		equal: ['search.box.w', 'search.box.h'],
		check: (m) => [dims(m('search'), 220, 40)],
	}
]
