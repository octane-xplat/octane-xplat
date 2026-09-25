/** @jsxImportSource @nativescript-community/octane */
// Safe-area insets — native leaf. iOS reads UIView.safeAreaInsets; Android
// reads the foreground activity's root WindowInsets in device-independent px.
import { useEffect, useState } from 'octane'
import { Application, Screen } from '@nativescript/core'
import type { Insets } from './types'

const zeroInsets = (): Insets => ({ top: 0, bottom: 0, left: 0, right: 0 })

function androidActivity(): any {
	return Application.android?.foregroundActivity ?? Application.android?.startActivity
}

function readAndroidInsets(windowInsets?: any): Insets {
	const activity = androidActivity()
	const decorView = activity?.getWindow?.()?.getDecorView?.()
	const insets = windowInsets ?? decorView?.getRootWindowInsets?.()
	if (!insets) return zeroInsets()

	const scale = Screen.mainScreen.scale || 1
	if (android.os.Build.VERSION.SDK_INT >= 30) {
		const systemBars =
			android.view.WindowInsets.Type.systemBars() | android.view.WindowInsets.Type.displayCutout()

		const i = insets.getInsets(systemBars)
		return {
			top: i.top / scale,
			bottom: i.bottom / scale,
			left: i.left / scale,
			right: i.right / scale,
		}
	}

	return {
		top: insets.getSystemWindowInsetTop() / scale,
		bottom: insets.getSystemWindowInsetBottom() / scale,
		left: insets.getSystemWindowInsetLeft() / scale,
		right: insets.getSystemWindowInsetRight() / scale,
	}
}

function readInsets(): Insets {
	if (Application.ios) {
		const i = Application.ios.rootController?.view?.safeAreaInsets
		if (i) return { top: i.top, bottom: i.bottom, left: i.left, right: i.right }
	}

	if (Application.android) return readAndroidInsets()
	return zeroInsets()
}

function watchAndroidInsets(update: (insets: Insets) => void): () => void {
	const decorView = androidActivity()?.getWindow?.()?.getDecorView?.()
	if (!decorView) return () => {}

	const listener = new android.view.View.OnApplyWindowInsetsListener({
		onApplyWindowInsets(_view: any, insets: any) {
			update(readAndroidInsets(insets))
			return insets
		},
	})

	decorView.setOnApplyWindowInsetsListener(listener)
	decorView.requestApplyInsets?.()

	return () => decorView.setOnApplyWindowInsetsListener(null)
}

export function useSafeAreaInsets(): Insets {
	const [insets, setInsets] = useState<Insets>(readInsets)
	useEffect(() => {
		const update = () => setInsets(readInsets())
		Application.on(Application.orientationChangedEvent, update)
		Application.on(Application.resumeEvent, update)
		const stopWatchingAndroid = Application.android ? watchAndroidInsets(setInsets) : () => {}
		update()

		return () => {
			Application.off(Application.orientationChangedEvent, update)
			Application.off(Application.resumeEvent, update)
			stopWatchingAndroid()
		}
	}, [])

	return insets
}
