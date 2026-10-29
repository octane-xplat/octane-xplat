import type { ParityCheck } from '../../parity/check-helpers.ts'
import { dims } from '../../parity/check-helpers.ts'

export const CHECKS: ParityCheck[] = [
	{
		fixture: 'card-with-slots',
		targets: ['web', 'ios', 'android', 'macos'],
		elements: { card: 'parity-card-root', body: 'parity-card-body' },
		equal: ['card.box.w', 'card.box.h', 'card.style.backgroundColor', 'body.box.w', 'body.box.h'],
		check: (m) => [dims(m('card'), 220, 104), dims(m('body'), 180, 32)],
	},
]
