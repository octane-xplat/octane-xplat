import { describe, expect, it, vi } from 'vitest'

vi.mock('@nativescript/core', () => ({
	Application: {
		android: {
			foregroundActivity: {
				getWindow: () => ({
					getAttributes: () => ({ softInputMode: 0 }),
					getDecorView: () => ({}),
				}),
			},
		},
	},
	Utils: { layout: { toDeviceIndependentPixels: (px: number) => px / 2 } },
}))

import { bindBottomInsetToKeyboard } from './keyboard-inset.mobile'

describe('Android overlay keyboard inset', () => {
	it('converts physical IME pixels to NativeScript transform dips', () => {
		let listener: any
		vi.stubGlobal('android', {
			view: {
				WindowManager: {
					LayoutParams: { SOFT_INPUT_MASK_ADJUST: 240, SOFT_INPUT_ADJUST_RESIZE: 16 },
				},
			},
		})
		vi.stubGlobal('androidx', {
			core: {
				view: {
					ViewCompat: {
						OnApplyWindowInsetsListener: class {
							onApplyWindowInsets: any
							constructor(value: any) {
								this.onApplyWindowInsets = value.onApplyWindowInsets
							}
						},
						setOnApplyWindowInsetsListener: (_view: any, value: any) => {
							listener = value
						},
					},
					WindowInsetsCompat: { Type: { ime: () => 'ime', systemBars: () => 'bars' } },
				},
			},
		})

		try {
			const host = { translateY: 0 }
			const unbind = bindBottomInsetToKeyboard(host)
			const insets = { getInsets: (type: string) => ({ bottom: type === 'ime' ? 600 : 100 }) }
			expect(listener.onApplyWindowInsets({}, insets)).toBe(insets)
			expect(host.translateY).toBe(-250)
			unbind()
			expect(host.translateY).toBe(0)
			expect(listener).toBe(null)
		} finally {
			vi.unstubAllGlobals()
		}
	})
})
