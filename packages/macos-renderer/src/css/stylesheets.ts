/**
 * Stylesheet registry + cascade environment for the AppKit renderer —
 * AppKit-free so Node tests and the GTK renderer (via
 * `@octane-xplat/macos-renderer/css`) can reuse it.
 *
 * `registerStylesheet(id, css)` parses through the vendored NS selector engine
 * (`populateCssRules`), replaces by id while keeping the id's first-registration
 * position, rebuilds one `StyleSheetSelectorScope` over all sheets in
 * registration order, and notifies the restyle listener.
 *
 * At module init `globalThis.__xplatStylesheets` — the `[id, css]` tuple array
 * the CLI build injects — is drained; afterwards the global is replaced with an
 * object whose `push` registers directly.
 */
import { populateCssRules } from '../vendor/css/rules.ts'
import { StyleSheetSelectorScope } from '../vendor/css/css-selector.ts'
import type { RuleSet } from '../vendor/css/css-selector.ts'
import { setCssMediaQueryEvaluator } from '../vendor/css/media-query.ts'
import type { Keyframes } from '../vendor/css/rules.ts'

export interface StylesheetEntry {
	id: string
	selectors: RuleSet[]
	keyframes: Keyframes[]
}

const sheets = new Map<string, StylesheetEntry>()
/** Registration order of ids — replace-in-place keeps the slot. */
const order: string[] = []

let scope: StyleSheetSelectorScope<any> = new StyleSheetSelectorScope([])
/** True when any registered ruleset is media-gated — gates cheap re-eval. */
let hasMediaRules = false
let restyle: (() => void) | null = null

function rebuild() {
	const all: RuleSet[] = []
	hasMediaRules = false
	for (const id of order) {
		const entry = sheets.get(id)
		if (!entry) {
			continue
		}

		for (const r of entry.selectors) {
			if (r.mediaQueryString) {
				hasMediaRules = true
			}
		}

		all.push(...entry.selectors)
	}
	scope = new StyleSheetSelectorScope(all)
	restyle?.()
}

export function registerStylesheet(id: string, css: string): void {
	const { selectors, keyframes } = populateCssRules(css, id)
	if (!sheets.has(id)) {
		order.push(id)
	}
	sheets.set(id, { id, selectors, keyframes })
	rebuild()
}

export function unregisterStylesheet(id: string): void {
	if (sheets.delete(id)) {
		rebuild()
	}
}

/** The cascade scope covering every registered sheet, in registration order. */
export function stylesheetScope(): StyleSheetSelectorScope<any> {
	return scope
}

export function stylesheetsHaveMediaRules(): boolean {
	return hasMediaRules
}

/** Called after any registration change — the renderer restyles live roots. */
export function onStylesheetsChanged(fn: () => void): void {
	restyle = fn
}

// ---- Media queries --------------------------------------------------------

export interface CssEnvironment {
	width: number
	height: number
	colorScheme: 'light' | 'dark'
	reducedMotion: boolean
}

let environment: () => CssEnvironment = () => ({
	width: 0,
	height: 0,
	colorScheme: 'light',
	reducedMotion: false,
})

/** The renderer injects window size / appearance / a11y state here. */
export function setStyleEnvironment(fn: () => CssEnvironment): void {
	environment = fn
}

function matchFeature(feature: string, raw: string | null, env: CssEnvironment): boolean {
	switch (feature) {
		case 'width':
		case 'min-width':
		case 'max-width':
		case 'device-width':
		case 'min-device-width':
		case 'max-device-width': {
			const basis = env.width
			const target = raw === null ? basis : parseFloat(raw)
			if (!Number.isFinite(target)) {
				return false
			}

			if (feature.startsWith('min')) {
				return basis >= target
			}

			if (feature.startsWith('max')) {
				return basis <= target
			}

			return basis === target
		}
		case 'height':
		case 'min-height':
		case 'max-height':
		case 'device-height':
		case 'min-device-height':
		case 'max-device-height': {
			const basis = env.height
			const target = raw === null ? basis : parseFloat(raw)
			if (!Number.isFinite(target)) {
				return false
			}

			if (feature.startsWith('min')) {
				return basis >= target
			}

			if (feature.startsWith('max')) {
				return basis <= target
			}

			return basis === target
		}
		case 'orientation':
			return raw === (env.width >= env.height ? 'landscape' : 'portrait')
		case 'prefers-color-scheme':
			return raw === env.colorScheme
		case 'prefers-reduced-motion':
			return raw === null ? env.reducedMotion : (raw === 'reduce') === env.reducedMotion
		case 'hover':
			// AppKit pointer input always supports hover.
			return raw === null || raw === 'hover'
		case 'pointer':
			return raw === null || raw === 'fine'
		default:
			return false
	}
}

/** Minimal media-query evaluator covering the features above; `and`, `or`,
 *  comma lists, `not`, and media types screen/all/print. */
export function evalMediaQuery(query: string, env: CssEnvironment = environment()): boolean {
	for (const part of query.split(',')) {
		if (matchQueryPart(part.trim(), env)) {
			return true
		}
	}
	return false
}

function matchQueryPart(part: string, env: CssEnvironment): boolean {
	let negate = false
	let s = part.replace(/^\s*only\s+/i, '')
	const not = s.match(/^not\s+/i)
	if (not) {
		negate = true
		s = s.slice(not[0].length)
	}

	// `or` at top level of a query part is equivalent to a comma.
	const orTerms = s.split(/\bor\b/i)
	const result = orTerms.some((term) => matchAndTerm(term, env))
	return negate ? !result : result
}

function matchAndTerm(term: string, env: CssEnvironment): boolean {
	// Media type (first bare word) — screen/all pass, anything else fails.
	const typeMatch = term.trim().match(/^([a-zA-Z]+)(?=\s+and\b|\s*$)/)
	if (typeMatch && !/^(screen|all)$/i.test(typeMatch[1])) {
		return false
	}

	const features = term.match(/\(([^)]*)\)/g) ?? []
	for (const f of features) {
		const inner = f.slice(1, -1)
		const ci = inner.indexOf(':')
		const feature = (ci === -1 ? inner : inner.slice(0, ci)).trim().toLowerCase()
		const value =
			ci === -1
				? null
				: inner
						.slice(ci + 1)
						.trim()
						.toLowerCase()

		if (!matchFeature(feature, value, env)) {
			return false
		}
	}
	return true
}

setCssMediaQueryEvaluator((q) => evalMediaQuery(q))

// ---- Injected-sheet delivery ----------------------------------------------

declare const globalThis: { __xplatStylesheets?: any }

const queued = globalThis.__xplatStylesheets
globalThis.__xplatStylesheets = {
	push([id, css]: [string, string]) {
		registerStylesheet(id, css)
	},
}

if (Array.isArray(queued)) {
	for (const [id, css] of queued) {
		registerStylesheet(id, css)
	}
}
