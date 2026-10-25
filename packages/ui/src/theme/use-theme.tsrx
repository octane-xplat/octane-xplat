/** Token-reading hooks for themed subtrees (Astryx `useTheme`/`useThemeName`).
 *
 *  `useTheme` resolves the nearest `Theme`'s token map for the effective
 *  color mode — concrete CSS values for non-CSS consumers (SVG, canvas,
 *  audit tooling), matching upstream's resolveThemeTokens merge of core
 *  defaults + the scoped theme's overrides.
 *
 *  With no `Theme` ancestor the hooks recover the registered root theme
 *  scope (the outermost mounted Theme), so detached consumers — portal
 *  content, imperative hosts — see the same theme the app root does. */

import { useContext, useMemo } from 'octane'
import type { DefinedTheme } from './defined-theme'
import { resolveThemeTokens } from './defined-theme'
import { ThemeContext } from './theme-context'
import { getRootThemeScope } from './theme-scope'
import { useThemeScheme } from './theme-scheme'

/** Resolved theme data returned by `useTheme`. */
export interface UseThemeReturn {
	/** Theme name — 'default' when no theme is reachable. */
	name: string
	/** Effective mode — 'system' is resolved against the app scheme. */
	mode: 'light' | 'dark'
	/** Concrete token value for the effective mode ('' when unknown). */
	token: (name: string) => string
	/** All resolved tokens — defaults merged under the theme's overrides. */
	tokens: Record<string, string>
}

/** Nearest theme definition — context first, then the registered root. */
export function useThemeDefinition(): DefinedTheme | undefined {
	const ctx = useContext(ThemeContext)
	const root = getRootThemeScope()
	return ctx?.theme ?? root ?? undefined
}

/** Nearest active theme name — context first, then the registered root. */
export function useThemeName(): string | null {
	const ctx = useContext(ThemeContext)
	const root = getRootThemeScope()
	return ctx?.theme.name ?? root?.name ?? null
}

export function useTheme(): UseThemeReturn {
	const ctx = useContext(ThemeContext)
	const scheme = useThemeScheme()
	const theme = ctx?.theme ?? getRootThemeScope() ?? undefined
	const declared = ctx?.mode ?? 'system'
	const mode = declared === 'system' ? scheme : declared

	const tokens = useMemo(() => resolveThemeTokens(theme, { mode }), [theme, mode])
	const name = theme?.name ?? 'default'

	return useMemo(
		() => ({
			name,
			mode,
			token: (tokenName: string) => tokens[tokenName] ?? '',
			tokens,
		}),
		[name, mode, tokens],
	)
}
