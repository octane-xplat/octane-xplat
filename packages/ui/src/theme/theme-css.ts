/** Generates the scoped token stylesheet for a DefinedTheme.
 *
 *  Web emits one rule per theme with `light-dark(l, d)` tuples intact — the
 *  scope element's `color-scheme` resolves the arm, so explicit-mode scopes
 *  nest correctly in either direction (light-in-dark and dark-in-light)
 *  without descendant-selector tricks.
 *
 *  Native (NativeScript CSS has no `light-dark()`) emits class-split rules:
 *  light defaults, dark under the `.dark`/`.ns-dark` mode markers, then an
 *  explicit-light re-scope so `.xds-light` subtrees flip back. */

import type { DefinedTheme, TokenValue } from './defined-theme'
import { findMatchingParen, resolveThemeTokens } from './defined-theme'
import { themeScopeClass } from './theme-scope'

export interface ThemeCssOptions {
	/** @default 'web' */
	target?: 'web' | 'native'
}

/** Rewrite every top-level `light-dark(a, b)` call inside a compound value
 *  to the arm for `mode` — used for native emission where light-dark()
 *  cannot parse. */
function resolveEmbeddedLightDark(value: string, mode: 'light' | 'dark'): string {
	let out = ''
	let i = 0
	while (i < value.length) {
		const start = value.indexOf('light-dark(', i)
		if (start === -1) return out + value.slice(i)
		out += value.slice(i, start)
		const open = value.indexOf('(', start)
		const close = findMatchingParen(value, open)
		if (close === -1) return out + value.slice(start)
		const body = value.slice(open + 1, close)
		let depth = 0
		let comma = -1
		for (let j = 0; j < body.length; j++) {
			const c = body[j]
			if (c === '(') depth++
			else if (c === ')') depth--
			else if (c === ',' && depth === 0) {
				comma = j
				break
			}
		}
		out += comma === -1 ? body.trim() : (mode === 'dark' ? body.slice(comma + 1) : body.slice(0, comma)).trim()
		i = close + 1
	}
	return out
}

function tokenCss(name: string, value: TokenValue, target: 'web' | 'native', mode: 'light' | 'dark' | null): string {
	if (target === 'web') {
		const v = Array.isArray(value) ? `light-dark(${value[0]}, ${value[1]})` : value
		return `\t${name}: ${v};`
	}
	const arm = mode ?? 'light'
	const raw = Array.isArray(value) ? (arm === 'dark' ? value[1] : value[0]) : value
	return `\t${name}: ${resolveEmbeddedLightDark(raw, arm)};`
}

function declarations(theme: DefinedTheme, target: 'web' | 'native', mode: 'light' | 'dark' | null): string {
	return Object.entries(theme.tokens)
		.map(([name, value]) => tokenCss(name, value, target, mode))
		.join('\n')
}

/** Body text on the scope element itself — upstream stamps
 *  `color: var(--color-text-primary)` + `font-family: var(--font-family-body)`
 *  on the Theme wrapper (and the built theme.css `:scope` rule) so plain
 *  descendants inherit the theme's type and ink instead of the page's. */
const scopeTextCss = '\tcolor: var(--color-text-primary);\n\tfont-family: var(--font-family-body);'

/** Native variant of the scope text declarations: var() inside font-family
 *  is not guaranteed to resolve in NativeScript CSS, so the emitted values
 *  are concrete literals resolved (defaults under theme) per mode block. */
function scopeTextCssNative(theme: DefinedTheme, mode: 'light' | 'dark'): string {
	const resolved = resolveThemeTokens(theme, { mode })
	return `\tcolor: ${resolved['--color-text-primary']};\n\tfont-family: ${resolved['--font-family-body']};`
}

/** Scoped token rules for one theme. Both targets key on the shared
 *  `xds-theme-<name>` class, which the `Theme` scope and detached overlay
 *  hosts (via `themeSchemeClasses`) stamp. */
export function generateThemeCss(theme: DefinedTheme, options: ThemeCssOptions = {}): string {
	const target = options.target ?? 'web'
	const scope = `.${themeScopeClass(theme.name)}`

	if (target === 'web') {
		return `${scope} {\n${declarations(theme, 'web', null)}\n${scopeTextCss}\n}`
	}

	// Ordering matters: later equal-specificity rules win, so the explicit
	// light re-scope must follow the dark-context rules.
	return [
		`${scope} {`,
		declarations(theme, 'native', 'light'),
		scopeTextCssNative(theme, 'light'),
		`}`,
		`.dark ${scope}, .ns-dark ${scope}, ${scope}.dark, ${scope}.ns-dark {`,
		declarations(theme, 'native', 'dark'),
		scopeTextCssNative(theme, 'dark'),
		`}`,
		`.xds-light ${scope}, ${scope}.xds-light {`,
		declarations(theme, 'native', 'light'),
		scopeTextCssNative(theme, 'light'),
		`}`,
		`.xds-light ${scope}.dark, .xds-light ${scope}.ns-dark {`,
		declarations(theme, 'native', 'dark'),
		scopeTextCssNative(theme, 'dark'),
		`}`,
	].join('\n')
}
