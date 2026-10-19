import { Utils } from '@nativescript/core'
import { android } from '@octane-xplat/platform/android'
import type { KeyboardWindowSource } from '@octane-xplat/platform/keyboard-registry'
import type { KeyboardWindowState } from '@octane-xplat/platform/keyboard-state'
import { observeKeyboardDestination } from '@octane-xplat/ui/nativescript/keyboard'
import { createKeyboardMotion } from './motion'
import { keyboardNativeScope } from './native-scope'

let AnimationCallback: any
const callbackClass = (core: any) => {
	if (!AnimationCallback) {
		AnimationCallback = core.WindowInsetsAnimationCompat.Callback.extend({
			onPrepare(this: any, animation: any) {
				this.handlers?.prepare(animation)
			},
			onStart(this: any, animation: any, bounds: any) {
				this.handlers?.start(animation)
				return bounds
			},
			onProgress(this: any, insets: any) {
				this.handlers?.progress(insets)
				return insets
			},
			onEnd(this: any, animation: any) {
				this.handlers?.end(animation)
			},
		})
	}
	return AnimationCallback
}

/** Callback lives only on our helper; decor/foreign callbacks remain untouched. */
export const observeKeyboardMotion: KeyboardWindowSource<KeyboardWindowState> = (key, publish) => {
	const decor = key as any
	const core = (globalThis as any).androidx?.core?.view
	if (
		!core?.WindowInsetsAnimationCompat ||
		android.os.Build.VERSION.SDK_INT < 30 ||
		!decor.addView
	) {
		return observeKeyboardDestination(key, publish)
	}
	const scope = keyboardNativeScope()
	try {
		const helper = new android.view.View(decor.getContext())
		helper.setImportantForAccessibility(2)
		helper.setFocusable(false)
		helper.setClickable(false)
		decor.addView(helper, new android.view.ViewGroup.LayoutParams(0, 0))
		scope.defer(() => {
			const remove = () => {
				if (helper.getParent() === decor) {
					decor.removeView(helper)
				}
			}
			// A reader may release from a child's native detach callback. Android
			// is still iterating decor children then; removing one corrupts that walk.
			setTimeout(remove, 0)
		})

		const type = core.WindowInsetsCompat.Type
		const dip = Utils.layout.toDeviceIndependentPixels
		let targetInset = 0
		const motion = createKeyboardMotion((state) => publish({ ...state, inset: targetInset }), {
			interactive: false,
			floating: false,
		})

		let active = true
		scope.defer(() => {
			active = false
		})

		let animation: any
		let target: any
		const geometry = (insets: any) => {
			const width = dip(decor.getWidth()),
				height = dip(decor.getHeight())
			const ime = dip(insets?.getInsets(type.ime()).bottom ?? 0)
			return {
				window: { x: 0, y: 0, width, height },
				frame: { x: 0, y: height - ime, width, height: ime },
			}
		}

		const read = () => core.ViewCompat.getRootWindowInsets(decor)
		const destination = () => {
			const insets = read()
			if (!insets) {
				return
			}
			target = geometry(insets).frame
			targetInset = dip(
				Math.max(
					0,
					insets.getInsets(type.ime()).bottom - insets.getInsets(type.systemBars()).bottom,
				),
			)
		}

		const measure = (insets: any) => {
			if (!active || !insets) {
				return
			}
			const value = geometry(insets)
			if (value.window.width > 0 && value.window.height > 0) {
				motion.measure(value.window, value.frame, target ?? value.frame)
			}
		}

		const callback = new (callbackClass(core))(1)
		callback.handlers = {
			prepare(next: any) {
				if (!active || !(next.getTypeMask() & type.ime())) {
					return
				}
				// Replacing a running animation cancels it before the new start.
				if (animation) {
					motion.cancel()
				}
				animation = next
			},
			start(next: any) {
				if (!active || next !== animation) {
					return
				}
				destination()
				motion.begin(target, Number(next.getDurationMillis()))
			},
			progress(insets: any) {
				measure(insets)
			},
			end(next: any) {
				if (!active || next !== animation) {
					return
				}
				measure(read())
				motion.end()
				animation = undefined
			},
		}

		scope.defer(() => {
			callback.handlers = undefined
			core.ViewCompat.setWindowInsetsAnimationCallback(helper, null)
		})

		core.ViewCompat.setWindowInsetsAnimationCallback(helper, callback)
		const layoutListener = new android.view.ViewTreeObserver.OnGlobalLayoutListener({
			onGlobalLayout() {
				if (!active || animation) {
					return
				}
				destination()
				measure(read())
			},
		})

		scope.defer(() => {
			const tree = decor.getViewTreeObserver()
			if (tree.isAlive()) {
				tree.removeOnGlobalLayoutListener(layoutListener)
			}
		})

		decor.getViewTreeObserver().addOnGlobalLayoutListener(layoutListener)
		destination()
		measure(read())
		return () => scope.release()
	} catch (error) {
		try {
			scope.release()
		} catch (cleanup) {
			throw new AggregateError([error, cleanup], 'Keyboard native attachment failed')
		}

		throw error
	}
}
