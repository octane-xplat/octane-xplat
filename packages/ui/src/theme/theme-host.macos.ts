import { cx } from '@octane-xplat/lib'
import { getThemeScheme, onThemeSchemeChange } from './theme-scheme'

/** Host surface the theme scheme classes stamp on — satisfied by AppKit
 *  host views exposed to the renderer (a string `className`). */
export interface ThemeClassHost {
	className: string
}

export function themeSchemeClasses(): string {
	return getThemeScheme() === 'dark' ? 'ns-dark dark' : ''
}

export function applyThemeClasses(view: ThemeClassHost, base = ''): () => void {
	const apply = () => {
		view.className = cx(base, themeSchemeClasses())
	}

	apply()
	return onThemeSchemeChange(apply)
}
