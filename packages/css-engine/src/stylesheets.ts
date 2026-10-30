/**
 * Stylesheet registry + cascade environment for the AppKit renderer —
 * platform-free so Node tests and the GTK renderer (via
 * `@octane-xplat/css-engine`) can reuse it.
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
import { populateCssRules } from './vendor/rules.ts'
import { StyleSheetSelectorScope } from './vendor/css-selector.ts'
import type { RuleSet } from './vendor/css-selector.ts'
import { setCssMediaQueryEvaluator } from './vendor/media-query.ts'
import type { Keyframes } from './vendor/rules.ts'

export interface StylesheetEntry {
	id: string
	selectors: RuleSet[]
	keyframes: Keyframes[]
}

// Last evaluated result per distinct media-query string —
// refreshMediaQueries diffs against it.
const mediaResults = new Map<string, boolean>()

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
	// New/changed sheets invalidate the media-result and pseudo-class
	// caches so the next reads start clean.
	mediaResults.clear()
	pseudoClassCache = null
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

/** Every registered sheet's @keyframes records, in registration order. */
export function stylesheetKeyframes(): Keyframes[] {
	const out: Keyframes[] = []
	for (const id of order) {
		const entry = sheets.get(id)
		if (entry) {
			out.push(...entry.keyframes)
		}
	}
	return out
}

/** The cascade scope covering every registered sheet, in registration order. */
export function stylesheetScope(): StyleSheetSelectorScope<any> {
	return scope
}

export function stylesheetsHaveMediaRules(): boolean {
	return hasMediaRules
}

/** Distinct media-query strings across every registered sheet and keyframe —
 *  lets a host diff environments per evaluation context (per-window media on
 *  AppKit) instead of the single process-wide `refreshMediaQueries` result. */
export function stylesheetMediaQueries(): string[] {
	const out = new Set<string>()
	const visit = (raw: string | string[] | undefined) => {
		for (const q of Array.isArray(raw) ? raw : [raw]) {
			if (q) {out.add(q)}
		}
	}
	for (const id of order) {
		const entry = sheets.get(id)
		if (!entry) {
			continue
		}
		for (const r of entry.selectors) {
			visit(r.mediaQueryString)
		}
		for (const k of entry.keyframes) {
			visit(k.mediaQueryString)
		}
	}
	return [...out]
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
 *  comma lists, `not`, and media types screen/all/print. CSS Level 4 range
 *  syntax — what lightningcss minify emits, e.g. `(width>=300px)` — is
 *  normalized back to the min-/max- feature vocabulary first:
 *  `f>=v`/`f>v` → min-, `f<=v`/`f<v` → max-, `f=v` → bare. */
function normalizeMediaRange(query: string): string {
	return query.replace(/\(([^()]*)\)/g, (paren, inner: string) => {
		const range = /^\s*([\w-]+)\s*(>=|<=|=|>|<)\s*([-\w.%]+)\s*$/.exec(inner)
		if (!range) {
			return paren
		}
		const [, feature, op, value] = range
		if (op === '>=' || op === '>') {
			return `(min-${feature}: ${value})`
		}
		if (op === '<=' || op === '<') {
			return `(max-${feature}: ${value})`
		}
		return `(${feature}: ${value})`
	})
}

export function evalMediaQuery(query: string, env: CssEnvironment = environment()): boolean {
	for (const part of normalizeMediaRange(query).split(',')) {
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

// ---- Media re-evaluation + pseudo-class census ------------------------------

/**
 * Re-evaluate every media-gated ruleset and keyframe against the current
 * environment. Returns true when any result moved — callers should restyle
 * only then. Registration resets the cache so the first check always wins.
 */
export function refreshMediaQueries(): boolean {
	let changed = false
	const seen = new Set<string>()
	const visit = (raw: string | string[] | undefined) => {
		if (!raw) {
			return
		}
		for (const q of Array.isArray(raw) ? raw : [raw]) {
			if (!q || seen.has(q)) {
				continue
			}

			seen.add(q)
			const next = evalMediaQuery(q)
			if (mediaResults.get(q) !== next) {
				mediaResults.set(q, next)
				changed = true
			}
		}
	}
	for (const id of order) {
		const entry = sheets.get(id)
		if (!entry) {
			continue
		}

		for (const r of entry.selectors) {
			visit(r.mediaQueryString)
		}

		for (const k of entry.keyframes) {
			visit(k.mediaQueryString)
		}
	}
	// Queries for sheets removed since the last check drop out of the cache.
	for (const q of mediaResults.keys()) {
		if (!seen.has(q)) {
			mediaResults.delete(q)
		}
	}
	return changed
}

/**
 * Pseudo-class names used by any registered selector — renderers wire
 * state tracking only for these (an unused change must not restyle).
 */
let pseudoClassCache: ReadonlySet<string> | null = null

function collectPseudoClasses(sel: any, out: Set<string>) {
	if (typeof sel?.cssPseudoClass === 'string') {
		out.add(sel.cssPseudoClass)
	}
	const inner = sel?.selectors
	if (Array.isArray(inner)) {
		for (const s of inner) {
			collectPseudoClasses(s, out)
		}
	}
}

/** Pseudo-class names used by any registered selector — renderers wire
 *  state tracking only for these (an unused change must not restyle).
 *  Recursively walks the selector graph so compound (`button:hover`),
 *  descendant (`.a:hover .b`) and functional (`:not(:disabled)`) selectors
 *  are all counted. Recomputed on rebuild. */
export function stylesheetPseudoClasses(): ReadonlySet<string> {
	if (pseudoClassCache !== null) {
		return pseudoClassCache
	}
	const out = new Set<string>()
	for (const id of order) {
		const entry = sheets.get(id)
		if (!entry) {
			continue
		}

		for (const r of entry.selectors) {
			for (const sel of (r as any).selectors ?? []) {
				collectPseudoClasses(sel, out)
			}
		}
	}
	pseudoClassCache = out
	return out
}

// ---- Injected-sheet delivery ----------------------------------------------

const queued = (globalThis as any).__xplatStylesheets

;(globalThis as any).__xplatStylesheets = {
	push([id, css]: [string, string]) {
		registerStylesheet(id, css)
	},
}

if (Array.isArray(queued)) {
	for (const [id, css] of queued) {
		registerStylesheet(id, css)
	}
}
