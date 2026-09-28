// Status-bar scheme sync — native leaf. Keeps the system bars' icon
// appearance aligned with the effective theme scheme (override-aware).
// Android: NS 9 enables edge-to-edge per activity with icon appearance
// derived from the SYSTEM uiMode — a dark-mode handler substitutes our
// scheme, consulted on every (re)application so config changes can't
// stomp an active override (covers status + nav bars). iOS: the public
// `statusBarStyle` view property routes to per-controller appearance
// invalidation, with the app-level setter as fallback.
import { Application, Utils } from '@nativescript/core'
import { getThemeScheme, onThemeSchemeChange } from './theme-scheme'

function applyStatusBarScheme(): void {
	if (Application.android) {
		// setDarkModeHandler stores the handler once per activity, then
		// re-runs enableEdgeToEdge every call — one call installs + refreshes.
		// 'light'/'dark' icon names invert: dark scheme → light icons.
		// Lives on Utils.android — a bare Utils.setDarkModeHandler is
		// undefined and would no-op silently.
		Utils.android.setDarkModeHandler?.({ handler: () => getThemeScheme() === 'dark' })
		return
	}

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
// 'displayed' covers module init before the activity/root view exists.
Application.on('displayed', applyStatusBarScheme)
applyStatusBarScheme()
