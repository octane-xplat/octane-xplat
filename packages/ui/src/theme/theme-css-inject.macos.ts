/** Register named-theme rules with AppKit's stylesheet engine. */
import { registerStylesheet } from '@octane-xplat/macos-renderer'
import type { DefinedTheme } from './defined-theme'
import { generateThemeCss } from './theme-css'

const injected = new Set<string>()

export function ensureThemeCss(theme: DefinedTheme): void {
	if (injected.has(theme.name)) {
		return
	}
	registerStylesheet(`xplat-theme:${theme.name}`, generateThemeCss(theme, { target: 'native' }))
	injected.add(theme.name)
}

// AppKit has no document root; detached hosts use themeSchemeClasses().
export function syncDocumentRootTheme(_name: string, _mode: 'light' | 'dark'): () => void {
	return () => {}
}
