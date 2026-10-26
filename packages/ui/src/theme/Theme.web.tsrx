/** Web leaf of the named-theme provider (Astryx `Theme`).
 *
 *  Renders a display:contents scope element stamped with the theme's
 *  `xds-theme-<name>` class — the generated token rules in theme-css.ts
 *  declare `light-dark()` values that resolve per the element's
 *  `color-scheme`, so explicit light/dark scopes nest in either direction.
 *  The outermost Theme additionally mirrors `data-xds-theme` onto <html>
 *  and registers the scope class so detached hosts (portals, toasts,
 *  sheets) stamp it via `themeSchemeClasses()`.
 *
 *  `mode` resolves nearest-first: an omitted prop inherits the parent
 *  Theme's mode, falling back to 'system' at the root. */

import { useContext, useEffect, useMemo } from 'octane'
import type { DefinedTheme, ThemeMode } from './defined-theme'
import { registerTheme } from './defined-theme'
import { ThemeContext, ThemeNestingContext } from './theme-context'

/** Bare Context objects aren't valid JSX element types under the shared
 *  typings (same workaround as SizeProvider in size-context.ts). */
const ThemeProviderEl: any = ThemeContext
const ThemeNestingProviderEl: any = ThemeNestingContext
import { setRootThemeScope } from './theme-scope'
import { ensureThemeCss, syncDocumentRootTheme } from './theme-css-inject'
import { useThemeScheme } from './theme-scheme'

export interface ThemeProps {
	/** Theme built by `defineTheme`. */
	theme: DefinedTheme
	/** Color mode for the scope; inherits the parent Theme when omitted. */
	mode?: ThemeMode
	children?: any
}

export function Theme(props: ThemeProps) @{
	const parent = useContext(ThemeContext)
	const isNested = useContext(ThemeNestingContext)
	const scheme = useThemeScheme()

	const mode: ThemeMode = props.mode ?? parent?.mode ?? 'system'
	const effective = mode === 'system' ? scheme : mode

	useEffect(() => {
		registerTheme(props.theme)
		ensureThemeCss(props.theme)
	}, [props.theme])

	useEffect(() => {
		if (isNested) return
		const unscope = setRootThemeScope(props.theme)
		const unsync = syncDocumentRootTheme(props.theme.name, effective)
		return () => {
			unsync()
			unscope()
		}
	}, [isNested, props.theme, effective])

	const ctx = useMemo(() => ({ theme: props.theme, mode }), [props.theme, mode])

	return (
		<ThemeProviderEl value={ctx}>
			<ThemeNestingProviderEl value={true}>
				<div
					data-xds-theme={props.theme.name}
					className={`xds-theme xds-theme-${props.theme.name} ${effective === 'dark' ? 'dark ns-dark' : 'xds-light'}`}
					style={{ display: 'contents', colorScheme: effective }}
				>
					{props.children}
				</div>
			</ThemeNestingProviderEl>
		</ThemeProviderEl>
	)
}
