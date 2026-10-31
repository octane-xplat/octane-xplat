/** GTK leaf for theme-CSS delivery: token rules register with the shared
 *  css-engine through the renderer's `__octaneGtkHost` bridge — the same
 *  registration a bundled stylesheet gets, so `.xds-theme-<name>` scopes
 *  match through the same cascade as every other rule. Skipped when no
 *  root is live yet (the bridge is published with the first container);
 *  the next `Theme` mount retries. */

import { hostGlobal } from '../internal/platform/host-bridge'
import type { DefinedTheme } from './defined-theme'
import { generateThemeCss } from './theme-css'

const injected = new Set<string>()

/** Register the theme's class-split token rules once per app session. */
export function ensureThemeCss(theme: DefinedTheme): void {
	if (injected.has(theme.name)) {
		return
	}
	const host = hostGlobal<Record<string, any>>('__octaneGtkHost')
	if (typeof host?.registerStylesheet !== 'function') {
		return
	}
	if (
		host.registerStylesheet(
			`xplat-theme:${theme.name}`,
			generateThemeCss(theme, { target: 'native' }),
		) !== true
	) {
		return
	}
	injected.add(theme.name)
}

/** No document root exists on GTK — the root scope class travels to
 *  detached hosts through `themeSchemeClasses()` instead. */
export function syncDocumentRootTheme(_name: string, _mode: 'light' | 'dark'): () => void {
	return () => {}
}
