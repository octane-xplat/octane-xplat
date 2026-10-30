import { Application, View } from '@nativescript/core'
import { createAppleBackend } from './backend.apple'
import type { CaptureBackend } from './backend-types'
export const backend: CaptureBackend = createAppleBackend({
	resolve(target) {
		const value = target instanceof View ? target.nativeViewProtected : target
		if (!(value instanceof UIView)) {
			throw new TypeError('Capture requires a mounted NativeScript View or UIView')
		}
		return value
	},
	screen() {
		const window = Application.primaryWindow?.ios?.uiWindow
		if (!window) {
			throw new Error('A primary iOS app window is required')
		}
		return window
	},
	renderInContext: true,
})
