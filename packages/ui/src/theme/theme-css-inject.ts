/** Native leaf for theme-CSS delivery: NativeScript has no runtime
 *  stylesheet injection point in the shared renderer's vocabulary, so theme
 *  rules go through `Application.addCss` — the same class-split grammar the
 *  bundled tokens.css/chrome.css use. Deduped per theme name.
 *
 *  UNVERIFIED: injected custom-property inheritance on NS views is exercised
 *  by tokens.css/chrome.css at bundle time, but runtime addCss delivery of
 *  theme scopes has no actual-host evidence yet — see the sandbox coverage
 *  notes before relying on it for a native surface. */

import { Application } from '@nativescript/core'
import type { DefinedTheme } from './defined-theme'
import { generateThemeCss } from './theme-css'

const injected = new Set<string>()

/** Register the theme's class-split token rules once per app session. */
export function ensureThemeCss(theme: DefinedTheme): void {
	if (injected.has(theme.name)) return
	Application.addCss(generateThemeCss(theme, { target: 'native' }))
	injected.add(theme.name)
}

/** No document root exists on native — the root scope class travels to
 *  detached hosts through `themeSchemeClasses()` instead. */
export function syncDocumentRootTheme(_name: string): () => void {
	return () => {}
}
