/** Web leaf for theme-CSS delivery: unbuilt themes inject one deduped
 *  <style> per theme name into document head; the root Theme mirrors its
 *  name onto <html data-xds-theme> so detached tooling can recover it.
 *  Generated rules key on `.xds-theme-<name>` (see theme-css.ts). */

import type { DefinedTheme } from './defined-theme'
import { generateThemeCss } from './theme-css'
import { themeScopeClass } from './theme-scope'

const injected = new Set<string>()

/** Inject the theme's scoped token rules once per document. */
export function ensureThemeCss(theme: DefinedTheme): void {
	if (injected.has(theme.name)) {
		return
	}
	const el = document.createElement('style')
	el.setAttribute('data-xds-theme-css', theme.name)
	el.textContent = generateThemeCss(theme, { target: 'web' })
	document.head.appendChild(el)
	injected.add(theme.name)
}

/** Stamp <html> as the outermost theme scope for the root provider's
 *  lifetime — `data-xds-theme` for detached tooling, the `xds-theme-<name>`
 *  + mode classes so the generated token rules (and the scope's text
 *  color/font) cover the whole document including body chrome and hosts
 *  mounted outside the Theme tree, and `color-scheme` so light-dark()
 *  resolves the stamped mode at the root. Mirrors upstream stamping
 *  `data-astryx-theme`/`data-theme` on <html>. Nested providers skip this —
 *  the boundary belongs to the outermost Theme only. Returns a restore. */
export function syncDocumentRootTheme(name: string, mode: 'light' | 'dark'): () => void {
	const root = document.documentElement
	const prev = root.getAttribute('data-xds-theme')
	const prevScheme = root.style.colorScheme
	const scopeClass = themeScopeClass(name)
	const modeClasses = mode === 'dark' ? ['dark', 'ns-dark'] : ['xds-light']
	root.setAttribute('data-xds-theme', name)
	root.classList.add('xds-theme', scopeClass, ...modeClasses)
	root.style.colorScheme = mode
	return () => {
		if (prev == null) {
			root.removeAttribute('data-xds-theme')
		} else {
			root.setAttribute('data-xds-theme', prev)
		}
		root.classList.remove('xds-theme', scopeClass, ...modeClasses)
		root.style.colorScheme = prevScheme
	}
}
