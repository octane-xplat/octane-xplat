import { afterEach, expect, it, vi } from 'vitest'
vi.mock('@nativescript/core', () => ({
	Utils: { layout: { toDeviceIndependentPixels: (value: number) => value } },
}))

vi.mock('@octane-xplat/platform/android', () => ({
	android: {
		os: { Build: { VERSION: { SDK_INT: 35 } } },
		view: {
			View: class {
				parent: any
				setImportantForAccessibility() {}
				setFocusable() {}
				setClickable() {}
				getParent() {
					return this.parent
				}
			},
			ViewGroup: { LayoutParams: class {} },
			ViewTreeObserver: {
				OnGlobalLayoutListener: class {
					constructor(callbacks: any) {
						Object.assign(this, callbacks)
					}
				},
			},
		},
	},
}))

vi.mock('@octane-xplat/ui/nativescript/keyboard', () => ({ observeKeyboardDestination: vi.fn() }))
import { observeKeyboardMotion } from '../src/source.android'
afterEach(() => {
	vi.useRealTimers()
	vi.unstubAllGlobals()
})

const fixture = (attached: boolean) => {
	const insets = { getInsets: (type: number) => ({ bottom: type === 1 ? 300 : 24 }) },
		listeners = new Set<any>()
	const decor: any = {
		attached,
		detaching: false,
		children: [] as any[],
		getContext: () => ({}),
		isAttachedToWindow() {
			return this.attached
		},
		getWidth: () => 400,
		getHeight: () => 800,
		addView(view: any) {
			view.parent = this
			this.children.push(view)
		},
		removeView(view: any) {
			if (this.detaching) {
				throw Error('Native child iteration is active')
			}
			this.children = this.children.filter((child: any) => child !== view)
			view.parent = null
		},
		getViewTreeObserver: () => ({
			isAlive: () => true,
			addOnGlobalLayoutListener: (listener: any) => listeners.add(listener),
			removeOnGlobalLayoutListener: (listener: any) => listeners.delete(listener),
		}),
	}
	vi.stubGlobal('androidx', {
		core: {
			view: {
				WindowInsetsAnimationCompat: {
					Callback: {
						extend(methods: any) {
							class Callback {}
							Object.assign(Callback.prototype, methods)
							return Callback
						},
					},
				},
				WindowInsetsCompat: { Type: { ime: () => 1, systemBars: () => 2 } },
				ViewCompat: {
					getRootWindowInsets: () => insets,
					setWindowInsetsAnimationCallback: (view: any, callback: any) => {
						view.callback = callback
					},
				},
			},
		},
	})
	const publish = vi.fn(),
		stop = observeKeyboardMotion(decor, publish),
		helper = decor.children[0]
	return { decor, publish, stop, helper, listeners, insets }
}

it.each([true, false])(
	'disarms callbacks and defers removal during detach even if attached still reads %s',
	(attached) => {
		vi.useFakeTimers()
		const f = fixture(true),
			callback = f.helper.callback,
			count = f.publish.mock.calls.length
		f.decor.attached = attached
		f.decor.detaching = true
		expect(() => f.stop()).not.toThrow()
		expect(f.listeners.size).toBe(0)
		expect(f.helper.callback).toBe(null)
		callback.onProgress(f.insets)
		expect(f.publish).toHaveBeenCalledTimes(count)
		expect(f.decor.children).toHaveLength(1)
		f.decor.detaching = false
		vi.runAllTimers()
		expect(f.decor.children).toHaveLength(0)
		f.stop()
		expect(vi.getTimerCount()).toBe(0)
	},
)

it('does not remove a helper already released by its native parent', () => {
	vi.useFakeTimers()
	const f = fixture(true)
	f.stop()
	f.decor.children = []
	f.helper.parent = null
	vi.runAllTimers()
	expect(f.decor.children).toHaveLength(0)
	expect(vi.getTimerCount()).toBe(0)
})
