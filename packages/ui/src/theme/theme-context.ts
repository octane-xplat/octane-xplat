import { createContext, type Context } from 'octane'
import type { DefinedTheme, ThemeMode } from './defined-theme'
import { resolveThemeTokens } from './defined-theme'

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

/** Context value the nearest `Theme` provides — the declared theme object,
 *  the mode it was asked for (which may itself be inherited/'system'), and
 *  the `useTheme` result for the effective mode. The provider resolves it
 *  once per scope so token readers need only this context, not their own
 *  scheme subscription. */
export interface ThemeContextValue {
  /** Theme object declared by the nearest `Theme`. */
  theme: DefinedTheme
  /** Mode the `Theme` was asked for — may still be 'system'. */
  mode: ThemeMode
  /** `useTheme` result for this scope's effective mode. */
  resolved: UseThemeReturn
}

export const ThemeContext: Context<ThemeContextValue | null> =
  createContext<ThemeContextValue | null>(null)

/** True inside a `Theme` — lets nested providers skip the root sync
 *  (document attributes, detached-host scope registration) that only the
 *  outermost provider owns. */
export const ThemeNestingContext: Context<boolean> = createContext<boolean>(false)

/** `useTheme` result for a theme (or the core defaults) in a concrete mode. */
export function resolveUseTheme(
  theme: DefinedTheme | undefined,
  mode: 'light' | 'dark',
): UseThemeReturn {
  const tokens = resolveThemeTokens(theme, { mode })

  return {
    name: theme?.name ?? 'default',
    mode,
    token: (tokenName: string) => tokens[tokenName] ?? '',
    tokens,
  }
}

/** Context value for a `Theme` declared with `mode` and rendering `effective`. */
export function themeContextValue(
  theme: DefinedTheme,
  mode: ThemeMode,
  effective: 'light' | 'dark',
): ThemeContextValue {
  return { theme, mode, resolved: resolveUseTheme(theme, effective) }
}
