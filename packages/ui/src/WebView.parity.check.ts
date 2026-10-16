import type { ParityCheck } from './parity/check-helpers.ts'
import { dims } from './parity/check-helpers.ts'

export const CHECKS: ParityCheck[] = [

	{
		fixture: 'webview-inline-document',
		targets: ['web', 'ios', 'android'],
		elements: { webview: 'parity-webview-root' },
		equal: ['webview.box.w', 'webview.box.h', 'webview.style.backgroundColor'],
		check: (m) => [dims(m('webview'), 220, 120)],
	}
]
