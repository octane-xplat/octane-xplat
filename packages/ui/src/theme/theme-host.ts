import { cx } from '@octane-xplat/lib'
import { getThemeScheme, onThemeSchemeChange } from './theme-scheme'
import { onThemeScopeChange, themeScopeClasses } from './theme-scope'

/** Host surface the theme scheme classes stamp on — satisfied by DOM
 *  elements and NativeScript views (both carry a string `className`). */
export interface ThemeClassHost {
	/** Class string the theme scheme stamps its scope classes onto. */
	className: string
}

/** Class string to stamp on independently-mounted roots (portal hosts,
 *  overlay/sheet/modal/toast containers): the active root `Theme`'s scope
 *  class when one is mounted (so generated theme tokens reach detached
 *  hosts), plus 'ns-dark dark' when the resolved scheme is dark — both
 *  names because tokens.css publishes both selectors and hosts may render
 *  either vocabulary. */
export function themeSchemeClasses(): string {
	return cx(themeScopeClasses(), getThemeScheme() === 'dark' ? 'ns-dark dark' : '')
}

/** Stamp `base + themeSchemeClasses()` onto an imperative host (NS view or
 *  DOM element) and keep it live — returns an unsubscribe to call when the
 *  host closes. Re-stamps on scheme changes AND root-theme scope changes
 *  so a theme switch reaches already-mounted overlay hosts. Works on both
 *  leaves since both honor `.className`. */
export function applyThemeClasses(view: ThemeClassHost, base = ''): () => void {
	const apply = () => {
		view.className = cx(base, themeSchemeClasses())
	}

	apply()
	const offScheme = onThemeSchemeChange(apply)
	const offScope = onThemeScopeChange(apply)
	return () => {
		offScheme()
		offScope()
	}
}
