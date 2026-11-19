/** Token-reading hooks for themed subtrees (Astryx `useTheme`/`useThemeName`).
 *
 *  `useTheme` resolves the nearest `Theme`'s token map for the effective
 *  color mode — concrete CSS values for non-CSS consumers (SVG, canvas,
 *  audit tooling), matching upstream's resolveThemeTokens merge of core
 *  defaults + the scoped theme's overrides.
 *
 *  Inside a `Theme` the provider has already resolved the result for its
 *  effective mode, so a reader costs one context lookup and re-renders
 *  through the context when the scheme changes. With no `Theme` ancestor
 *  the hooks recover the registered root theme scope (the outermost
 *  mounted Theme), so detached consumers — portal content, imperative
 *  hosts — see the same theme the app root does; those subscribe to the
 *  app scheme themselves. */

import { useContext, useMemo } from 'octane'
import type { DefinedTheme } from './defined-theme'
import { resolveUseTheme, ThemeContext, type UseThemeReturn } from './theme-context'
import { getRootThemeScope } from './theme-scope'
import { useThemeScheme } from './theme-scheme'

export type { UseThemeReturn } from './theme-context'

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

/** Nearest theme's resolved name, effective mode, and token accessors. */
export function useTheme(): UseThemeReturn {
  const ctx = useContext(ThemeContext)

  if (ctx) {
    return ctx.resolved
  }

  const scheme = useThemeScheme()
  const theme = getRootThemeScope() ?? undefined

  return useMemo(() => resolveUseTheme(theme, scheme), [theme, scheme])
}
