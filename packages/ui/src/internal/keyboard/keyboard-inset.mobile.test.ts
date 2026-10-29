import { expect, it, vi } from 'vitest'

const mock = vi.hoisted(() => ({ decor: {} }))
vi.mock('@nativescript/core', () => ({
	Application: {
		android: {
			foregroundActivity: {
				getWindow: () => ({
					getAttributes: () => ({ softInputMode: 16 }),
					getDecorView: () => mock.decor,
				}),
			},
		},
	},
	Utils: { layout: { toDeviceIndependentPixels: (px: number) => px / 2 } },
}))

vi.mock('./keyboard-host-bounds', async () => await import('./keyboard-host-bounds.android'))
vi.mock('@octane-xplat/platform/android', () => ({ android: {} }))

import { keyboardWindows } from '@octane-xplat/platform/keyboard-state'
import { bindBottomInsetToKeyboard } from './keyboard-inset'

it('follows actual Android geometry even with RESIZE set and never replaces a decor callback', () => {
	const create = (Array as any).create
	;(Array as any).create = (_type: string, count: number) => Array.from({ length: count }, () => 0)
	vi.stubGlobal('android', {
		view: {
			WindowManager: {
				LayoutParams: {
					SOFT_INPUT_MASK_ADJUST: 240,
					SOFT_INPUT_ADJUST_RESIZE: 16,
				},
			},
		},
	})
	const replace = vi.fn()
	vi.stubGlobal('androidx', {
		core: { view: { ViewCompat: { setOnApplyWindowInsetsListener: replace } } },
	})
	let publish: any
	const removeSource = keyboardWindows.install((_key, notify) => {
		publish = notify
		return () => {}
	})
	Object.assign(mock.decor, {
		getLocationOnScreen(xy: number[]) {
			xy[0] = 0
			xy[1] = 0
		},
	})
	const host: any = {
		translateY: 0,
		nativeViewProtected: {
			getRootView: () => mock.decor,
			getLocationOnScreen(xy: number[]) {
				xy[0] = 0
				xy[1] = host.translateY * 2
			},
			getWidth: () => 800,
			getHeight: () => 1600,
		},
	}
	const off = bindBottomInsetToKeyboard(host)
	try {
		publish({
			inset: 300,
			source: 'native-frames',
			windowRect: { x: 0, y: 0, width: 400, height: 800 },
			currentFrame: { x: 0, y: 650, width: 400, height: 150 },
			targetFrame: { x: 0, y: 500, width: 400, height: 300 },
		})

		expect(host.translateY).toBe(-150)
		expect(replace).not.toHaveBeenCalled()
		off()
		expect(host.translateY).toBe(0)
	} finally {
		off()
		removeSource()
		vi.unstubAllGlobals()
		if (create === undefined) {
			delete (Array as any).create
		} else {
			;(Array as any).create = create
		}
	}
})
