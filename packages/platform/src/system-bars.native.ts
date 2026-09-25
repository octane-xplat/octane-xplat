// Status/nav bars — native leaf. Status-bar icon style on both platforms +
// Android status/nav-bar tint via the application window.
import { Application, Color } from '@nativescript/core'

export const systemBars = {
	setStatusBarStyle(style: 'light' | 'dark'): void {
		// 'light'|'dark' name the icon appearance: 'light' = light content
		// for dark backgrounds. NS View.statusBarStyle uses the same
		// convention on both platforms (Android → APPEARANCE_LIGHT_*).
		const root = Application.getRootView()
		if (root) {
			root.statusBarStyle = style
		}

		if (Application.ios) {
			const app = Application.ios.nativeApp

			// NS 9: per-page statusBarStyle is the preferred seam — the
			// root-view write above drives it; keep the app-level setter as
			// fallback for controllers outside the root's hierarchy.

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
