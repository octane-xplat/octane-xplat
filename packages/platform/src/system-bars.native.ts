// Status/nav bars — native leaf. iOS status-bar style + Android
// navigation-bar color via the application window.
import { Application, Color } from '@nativescript/core'

export const systemBars = {
	setStatusBarStyle(style: 'light' | 'dark'): void {
		if (Application.ios) {
			const app = Application.ios.nativeApp
			// NS 9: per-page statusBarStyle is the preferred seam; fall back to
			// the app-level setter on older systems.
			;(app as any)?.setStatusBarStyle?.(style === 'light' ? 1 : 0)
		}
	},
	setColor(color: string): void {
		const c = new Color(color)
		if (Application.android?.startActivity) {
			const win = Application.android.startActivity.getWindow()
			win.setStatusBarColor(c.android)
			win.setNavigationBarColor(c.android)
		}
	},
}
