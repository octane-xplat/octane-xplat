import type { ParityCheck } from './parity/check-helpers.ts'
import { dims } from './parity/check-helpers.ts'

export const CHECKS: ParityCheck[] = [
	{
		fixture: 'image-inline-data',
		targets: ['web', 'ios', 'android', 'macos'],
		elements: { image: 'parity-image-root' },
		equal: ['image.box.w', 'image.box.h'],
		check: (m) => [dims(m('image'), 80, 48)],
	},
]
