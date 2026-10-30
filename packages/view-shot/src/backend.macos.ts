import { NSView } from '@octane-xplat/platform/macos'
import { createAppleBackend } from './backend.apple'
import type { CaptureBackend } from './backend-types'
export const backend: CaptureBackend = createAppleBackend({
	resolve(target) {
		if (!(target instanceof NSView)) {
			throw new TypeError('AppKit capture requires a mounted native NSView')
		}
		return target
	},
	renderInContext: false,
})
