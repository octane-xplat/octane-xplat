import { cx } from '@octane-xplat/lib'
import { getThemeScheme, onThemeSchemeChange } from './theme-scheme'

/** Host surface the theme scheme classes stamp on — satisfied by DOM
 *  elements and NativeScript views (both carry a string `className`). */
export interface ThemeClassHost {
	className: string
}

/** Class string to stamp on independently-mounted roots (portal hosts,
 *  overlay/sheet/modal/toast containers): 'ns-dark dark' when the resolved
 *  scheme is dark, '' otherwise. Both names because tokens.css publishes
 *  both selectors and hosts may render either vocabulary. */
export function themeSchemeClasses(): string {
	return getThemeScheme() === 'dark' ? 'ns-dark dark' : ''
}

/** Stamp `base + themeSchemeClasses()` onto an imperative host (NS view or
 *  DOM element) and keep it live — returns an unsubscribe to call when the
 *  host closes. Works on both leaves since both honor `.className`. */
export function applyThemeClasses(view: ThemeClassHost, base = ''): () => void {
	const apply = () => {
		view.className = cx(base, themeSchemeClasses())
	}

	apply()
	return onThemeSchemeChange(apply)
}
