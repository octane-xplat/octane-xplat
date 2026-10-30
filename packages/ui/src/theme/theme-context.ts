import { createContext, type Context } from 'octane'
import type { DefinedTheme, ThemeMode } from './defined-theme'

/** Context value the nearest `Theme` provides — the declared theme object
 *  plus the mode it was asked for (which may itself be inherited/'system';
 *  `useTheme` resolves the effective mode). */
export interface ThemeContextValue {
	theme: DefinedTheme
	mode: ThemeMode
}

export const ThemeContext: Context<ThemeContextValue | null> =
	createContext<ThemeContextValue | null>(null)

/** True inside a `Theme` — lets nested providers skip the root sync
 *  (document attributes, detached-host scope registration) that only the
 *  outermost provider owns. */
export const ThemeNestingContext: Context<boolean> = createContext<boolean>(false)
