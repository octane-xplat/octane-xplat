/** Astryx-style named themes (F-1): `defineTheme` produces a flat token map
 *  a `Theme` provider stamps on a subtree. Token values are a single string
 *  (both modes) or a `[light, dark]` tuple, matching upstream `TokenValue`.
 *
 *  Scope deliberately covers the exercised contract only: name + `extends`
 *  + `tokens`/`localTokens` custom-property maps. Upstream's generative
 *  inputs (color/radius/motion/type scales, component style overrides,
 *  icon/indicator registries, onMedia axes) are theme-package machinery —
 *  built themes arrive already resolved, which is the shape the six
 *  `theme-*` packages' `built` exports take. See apps/astryx-sandbox
 *  docs/coverage.md finding F-1. */

import { defaultThemeTokens } from './astryx-default-tokens'

/** Theme color mode — 'system' follows the resolved app scheme. */
export type ThemeMode = 'system' | 'light' | 'dark'

/** A token value: one CSS value for both modes, or a [light, dark] pair. */
export type TokenValue = string | [light: string, dark: string]

/** Input to {@link defineTheme}. */
export interface DefineThemeInput {
	/** Theme name — drives the `xds-theme-<name>` scope class. */
	name: string
	/** Base theme to flatten first; this input's tokens win per key. */
	extends?: DefinedTheme
	/** Token overrides keyed by CSS custom-property name. */
	tokens?: Record<string, TokenValue>
	/** Theme-local custom properties — merged over `tokens`, same shape. */
	localTokens?: Record<string, TokenValue>
}

/** A resolved theme: name plus the flat token map a scope stamps. */
export interface DefinedTheme {
	readonly name: string
	readonly tokens: Record<string, TokenValue>
}

export function isDefinedTheme(value: unknown): value is DefinedTheme {
	return (
		typeof value === 'object' &&
		value != null &&
		typeof (value as DefinedTheme).name === 'string' &&
		typeof (value as DefinedTheme).tokens === 'object' &&
		(value as DefinedTheme).tokens != null
	)
}

/** Flatten `extends` chains and merge `tokens` + `localTokens` into one map. */
export function defineTheme(input: DefineThemeInput): DefinedTheme {
	const tokens: Record<string, TokenValue> = {
		...(input.extends?.tokens ?? {}),
		...(input.tokens ?? {}),
		...(input.localTokens ?? {}),
	}
	const theme: DefinedTheme = Object.freeze({ name: input.name, tokens: Object.freeze(tokens) })
	registerTheme(theme)
	return theme
}

// =============================================================================
// Registry — lets detached consumers (portals, imperative hosts) recover the
// root theme when no `ThemeContext` is reachable.
// =============================================================================

const registry = new Map<string, DefinedTheme>()

export function registerTheme(theme: DefinedTheme): void {
	if (!isDefinedTheme(theme)) return
	registry.set(theme.name, theme)
}

export function getRegisteredTheme(name: string | null | undefined): DefinedTheme | undefined {
	return name == null ? undefined : registry.get(name)
}

export function getRegisteredThemes(): readonly DefinedTheme[] {
	return [...registry.values()]
}

/** Test support — clears every registered theme. */
export function resetThemes(): void {
	registry.clear()
}

// =============================================================================
// Token resolution — replay the CSS cascade for non-CSS consumers (SVG,
// canvas, audit tooling): defaults → theme tokens, light/dark selection,
// then single-level var() reference resolution with a cycle guard.
// =============================================================================

export interface ResolveThemeTokensOptions {
	mode: 'light' | 'dark'
}

/** Index of the `)` matching the `(` at `openIndex`, or -1 when unbalanced. */
export function findMatchingParen(input: string, openIndex: number): number {
	let depth = 0
	for (let i = openIndex; i < input.length; i++) {
		if (input[i] === '(') depth++
		else if (input[i] === ')') {
			depth--
			if (depth === 0) return i
		}
	}
	return -1
}

/** Parse a whole-value `light-dark(light, dark)` into its two arms; null when
 *  the value merely embeds light-dark() inside a compound expression. */
export function parseLightDark(value: string): [light: string, dark: string] | null {
	const trimmed = value.trim()
	if (!trimmed.startsWith('light-dark(')) return null
	const open = trimmed.indexOf('(')
	const close = findMatchingParen(trimmed, open)
	if (close !== trimmed.length - 1) return null
	const body = trimmed.slice(open + 1, close)
	let depth = 0
	for (let i = 0; i < body.length; i++) {
		const c = body[i]
		if (c === '(') depth++
		else if (c === ')') depth--
		else if (c === ',' && depth === 0) {
			return [body.slice(0, i).trim(), body.slice(i + 1).trim()]
		}
	}
	return null
}

/** Resolve one raw token value for a mode: tuple pick, whole-value
 *  light-dark() pick, or the string unchanged. */
export function resolveTokenValue(value: TokenValue, mode: 'light' | 'dark'): string {
	if (Array.isArray(value)) return mode === 'dark' ? value[1] : value[0]
	const parsed = parseLightDark(value)
	return parsed == null ? value : mode === 'dark' ? parsed[1] : parsed[0]
}

const VAR_REF = /var\(\s*(--[\w-]+)\s*(?:,[^)]*)?\)/g

/** Follow `var(--x)` references through the resolved map. Unresolved or
 *  cyclic references are left as the original expression. */
function resolveReferences(resolved: Record<string, string>): Record<string, string> {
	for (const key of Object.keys(resolved)) {
		let value = resolved[key]
		for (let i = 0; i < 8; i++) {
			const next = value.replace(VAR_REF, (whole, name: string) => resolved[name] ?? whole)
			if (next === value) break
			value = next
		}
		resolved[key] = value
	}
	return resolved
}

/** Concrete token values for a mode: Astryx defaults under the theme's own
 *  overrides (upstream `resolveThemeTokens`). The Astryx default-theme
 *  fallback is itself a resolved map, so no CSS cascade is needed. */
export function resolveThemeTokens(
	theme: DefinedTheme | null | undefined,
	options: ResolveThemeTokensOptions,
): Record<string, string> {
	const resolved: Record<string, string> = {}
	for (const [key, value] of Object.entries(defaultThemeTokens)) {
		resolved[key] = resolveTokenValue(value, options.mode)
	}
	if (theme != null) {
		for (const [key, value] of Object.entries(theme.tokens)) {
			resolved[key] = resolveTokenValue(value, options.mode)
		}
	}
	return resolveReferences(resolved)
}

/** Single-token convenience wrapper over {@link resolveThemeTokens}. */
export function resolveThemeToken(
	name: string,
	options: { theme?: DefinedTheme | null; mode: 'light' | 'dark' },
): string {
	return resolveThemeTokens(options.theme, { mode: options.mode })[name] ?? ''
}

export { defaultThemeTokens }
