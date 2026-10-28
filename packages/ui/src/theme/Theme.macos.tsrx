/** @jsxImportSource @octane-xplat/jsx */
/** AppKit named-theme scope; token rules are registered with the CSS engine. */
import { useContext, useEffect, useMemo } from 'octane'
import type { ThemeMode } from './defined-theme'
import { registerTheme } from './defined-theme'
import { ThemeContext, ThemeNestingContext } from './theme-context'

/** Bare Context objects aren't valid JSX element types under the shared
 *  typings (same workaround as SizeProvider in size-context.ts). */
const ThemeProviderEl: any = ThemeContext
const ThemeNestingProviderEl: any = ThemeNestingContext
import { setRootThemeScope } from './theme-scope'
import { ensureThemeCss, syncDocumentRootTheme } from './theme-css-inject'
import { useThemeScheme } from './theme-scheme'
import { View } from '../View'

import type { ThemeProps } from './Theme'
export type { ThemeProps } from './Theme'

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
		if (isNested) {
			return
		}

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
				<View
					className={[
						'xds-theme',
						`xds-theme-${props.theme.name}`,
						effective === 'dark' ? 'dark ns-dark' : 'xds-light',
					]}
				>
					{props.children}
				</View>
			</ThemeNestingProviderEl>
		</ThemeProviderEl>
	)
}
