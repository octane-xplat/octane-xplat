/** Web leaf for theme-CSS delivery: unbuilt themes inject one deduped
 *  <style> per theme name into document head; the root Theme mirrors its
 *  name onto <html data-xds-theme> so detached tooling can recover it.
 *  Generated rules key on `.xds-theme-<name>` (see theme-css.ts). */

import type { DefinedTheme } from './defined-theme'
import { generateThemeCss } from './theme-css'

const injected = new Set<string>()

/** Inject the theme's scoped token rules once per document. */
export function ensureThemeCss(theme: DefinedTheme): void {
	if (injected.has(theme.name)) return
	const el = document.createElement('style')
	el.setAttribute('data-xds-theme-css', theme.name)
	el.textContent = generateThemeCss(theme, { target: 'web' })
	document.head.appendChild(el)
	injected.add(theme.name)
}

/** Stamp <html data-xds-theme> for the root provider's lifetime; returns a
 *  restore that puts the previous value back. Nested providers skip this —
 *  the boundary belongs to the outermost Theme only. */
export function syncDocumentRootTheme(name: string): () => void {
	const prev = document.documentElement.getAttribute('data-xds-theme')
	document.documentElement.setAttribute('data-xds-theme', name)
	return () => {
		if (prev == null) {
			document.documentElement.removeAttribute('data-xds-theme')
		} else {
			document.documentElement.setAttribute('data-xds-theme', prev)
		}
	}
}
