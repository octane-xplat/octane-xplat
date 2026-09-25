// Status-bar scheme sync — native leaf. Keeps the window status bar's icon
// appearance aligned with the effective theme scheme (override-aware) via
// the root view's public `statusBarStyle` property; NS core maps 'light' →
// light icons on both platforms (Android: APPEARANCE_LIGHT_STATUS_BARS /
// SYSTEM_UI_FLAG_LIGHT_STATUS_BAR; iOS: per-controller appearance
// invalidation). Subscribed for preference + system-appearance changes;
// 'displayed' covers module init before the root view exists.
import { Application } from '@nativescript/core'
import { getThemeScheme, onThemeSchemeChange } from './theme-scheme'

function applyStatusBarScheme(): void {
	const style = getThemeScheme() === 'dark' ? 'light' : 'dark'
	const root = Application.getRootView()
	if (root) {
		root.statusBarStyle = style
	}

	if (Application.ios) {
		// Pushed pages own separate view controllers the root's property
		// doesn't reach — app-level setter as fallback.
		;(Application.ios.nativeApp as any)?.setStatusBarStyle?.(style === 'light' ? 1 : 0)
	}
}

onThemeSchemeChange(applyStatusBarScheme)
Application.on('displayed', applyStatusBarScheme)
applyStatusBarScheme()
