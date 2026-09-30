/** Shared route-dir manifest — the file-router half of the nav contract
 *  (docs/navigation-notes.md). Apps glob their route dir per platform and
 *  pass the module map here; the suffix seam applies to directories the
 *  same way it does to imports:
 *
 *    // route-manifest.web.ts — generated globs also omit a plain route when
 *    // a `.web` twin exists, so native-default modules are never evaluated.
 *    const files = import.meta.glob(
 *      ['./app/**\/*.{tsrx,tsx}', '!./app/**\/*.mobile.{tsrx,tsx}',
 *       '!./app/**\/*.ios.{tsrx,tsx}', '!./app/**\/*.android.{tsrx,tsx}',
 *       '!./app/**\/*.macos.{tsrx,tsx}', '!./app/**\/*.windows.{tsrx,tsx}',
 *       '!./app/**\/*.linux.{tsrx,tsx}'],
 *      { eager: true });
 *    export const routes = deriveRouteManifest(files, ['web']);
 *
 *    // route-manifest.mobile.ts — excludes *.web.tsrx; prefer by running OS
 *    export const routes = deriveRouteManifest(files,
 *      Device.os === 'Android' ? ['android', 'mobile'] : ['ios', 'mobile']);
 *
 *  Conventions (route dir = `dir`, default 'app'):
 *    app/detail.tsrx        → route 'detail'
 *    app/demo/[id].tsrx     → route 'demo/:id'  ([param] → :param)
 *    app/foo/index.tsrx     → 'foo'           (index = the dir's own route)
 *    app/settings.web.tsrx  → 'settings' on web only — `prefer` decides
 *    app/_layout.tsrx       → layouts['']     — a shell, not a route
 *    app/chat/_layout.tsrx  → layouts['chat'] — nested shells cataloged
 *
 *  `prefer` ranks platform suffixes — a suffix absent from it is another
 *  platform's file and is skipped entirely; unsuffixed files are the
 *  fallback (rank = prefer.length). Web callers pass ['web']; mobile
 *  callers pass the running OS first. */

import type {
	Route,
	RouteManifest,
	RouteMeta,
	RouteSpec,
	RouteSpecSet,
	SpecRouteInfo,
} from './props'

const EXT = /\.(tsrx|tsx|ts|mts|cts|js|mjs|cjs|jsx)$/
const SUFFIX = /\.(web|mobile|ios|android|macos|windows|linux)$/
const PARAM = /^\[(.+)\]$/
/** Build-time loader modules — `docs.loader.ts` pairs with route `docs`
 *  for `dataMode: 'baked'`. Never a route itself, never in a runtime glob. */
const LOADER_FILE = /\.loader\.(ts|mts|cts|js|mjs|cjs|jsx)$/
// `settings+modal.tsrx` → route 'settings' presented modally by default.
const PRESENT = /\+(modal|fade|push)$/

/** Loader for a `dataMode: 'baked'` route — resolves the name out of its
 *  owning manifest's `baked` map at push time. The map is assigned after
 *  the manifest is built (generated glue) or passed in (RouteSpecSet), so
 *  the lookup reads it lazily. A missing entry throws, landing as the
 *  screen's `error` prop like a live loader rejection. */
function bakedLookup(manifest: () => RouteManifest | undefined, name: string) {
	return () => {
		const baked = manifest()?.baked
		if (baked && Object.prototype.hasOwnProperty.call(baked, name)) {
			return baked[name]
		}

		throw new Error(
			`[octane-xplat] baked route '${name}' has no baked data — run \`xplat routes\` to regenerate`,
		)
	}
}

/** Internal error carrier used by the public `redirect()` helper. Keeping
 * this in the shared route table gives both platform leaves the same guard
 * behavior without importing a platform runtime. */
export class RouteRedirect extends Error {
	constructor(readonly route: Route) {
		super('route redirect')
		this.name = 'RouteRedirect'
	}
}

/** Component pick rule for route/layout modules: default export, then a
 *  `screen` named export, then a single function export. Route files use
 *  named exports (decision #13) — a lone component is unambiguous.
 *  route-config exports are reserved metadata, never the screen. */
function pick(mod: any, file: string): any {
	if (typeof mod?.default === 'function') {
		return mod.default
	}

	if (typeof mod?.screen === 'function') {
		return mod.screen
	}

	const fns = Object.keys(mod ?? {}).filter(
		(k) => typeof mod[k] === 'function' && !['loader', 'beforeLoad', 'head'].includes(k),
	)

	if (fns.length === 1) {
		return mod[fns[0]]
	}

	console.warn(
		'[octane-xplat] route file ' +
			file +
			(fns.length
				? ` has ${fns.length} component-shaped exports (${fns.join(', ')}) — add a default or 'screen' export`
				: ' has no component export') +
			' — skipped',
	)

	return undefined
}

export function deriveRouteManifest(
	files: Record<string, any>,
	prefer: readonly string[],
	dir = 'app',
): RouteManifest {
	const prefix = dir.replace(/^\.?\/?/, '').replace(/\/+$/, '') + '/'
	// name → best candidate so far (lowest rank wins; ties warn).
	const seen = new Map<string, { rank: number; meta: RouteMeta; component: any }>()
	const layoutRank = new Map<string, number>()
	const layouts: Record<string, any> = {}
	const loaders: RouteManifest['loaders'] = {}
	const warned = new Set<string>()
	const self: { m?: RouteManifest } = {}

	for (const key of Object.keys(files).sort()) {
		if (LOADER_FILE.test(key)) {
			continue
		}

		let rel = key.replace(/^\.?\//, '')
		if (rel.startsWith(prefix)) {
			rel = rel.slice(prefix.length)
		}

		rel = rel.replace(EXT, '')
		const parts = rel.split('/')
		let base = parts[parts.length - 1]
		const sm = SUFFIX.exec(base)
		const suffix = sm?.[1]
		if (sm) {
			base = base.slice(0, base.length - sm[0].length)
		}

		if (suffix && !prefer.includes(suffix)) {
			continue
		}

		const rank = suffix ? prefer.indexOf(suffix) : prefer.length
		const pm = PRESENT.exec(base)
		const presentation = pm?.[1] as RouteMeta['presentation']
		if (pm) {
			base = base.slice(0, base.length - pm[0].length)
		}

		if (base === '_layout') {
			const d = parts.slice(0, -1).join('/')
			const prev = layoutRank.get(d)
			if (prev !== undefined && prev <= rank) {
				continue
			}

			const component = pick(files[key], key)
			if (component) {
				layouts[d] = component
				layoutRank.set(d, rank)
			}

			continue
		}

		const segs = parts.slice(0, -1).concat(base)
		if (segs[segs.length - 1] === 'index') {
			segs.pop()
		}

		const segments = segs.map((s) => {
			const p = PARAM.exec(s)
			return p ? ':' + p[1] : s
		})

		const name = segments.join('/') || 'index'
		const meta: RouteMeta = {
			name,
			segments,
			params: segments.filter((s) => s.startsWith(':')).map((s) => s.slice(1)),
			file: key,
			presentation,
		}

		const dataMode = files[key]?.dataMode
		if (dataMode === 'baked' || dataMode === 'live') {
			meta.dataMode = dataMode
		}

		const loader = files[key]?.loader
		if (meta.dataMode === 'baked') {
			meta.loader = bakedLookup(() => self.m, name)
			if (typeof loader === 'function') {
				console.warn(
					`[octane-xplat] baked route '${name}' also exports a loader — move it to a .loader.ts sibling so its imports stay out of the bundle`,
				)
			}
		} else if (typeof loader === 'function') {
			meta.loader = loader
		}

		const beforeLoad = files[key]?.beforeLoad
		if (typeof beforeLoad === 'function') {
			meta.beforeLoad = beforeLoad
		}

		if (
			files[key]?.head &&
			(typeof files[key].head === 'object' || typeof files[key].head === 'function')
		) {
			meta.head = files[key].head
		}

		const prev = seen.get(name)
		if (prev && prev.rank <= rank) {
			if (prev.rank === rank && !warned.has(name)) {
				warned.add(name)
				console.warn(
					`[octane-xplat] route '${name}' is defined by both ${prev.meta.file} and ${key} — keeping ${prev.meta.file}`,
				)
			}

			continue
		}

		const component = pick(files[key], key)
		if (component) {
			seen.set(name, { rank, meta, component })
		}
	}

	const screens: RouteManifest['screens'] = {}
	const routes: RouteMeta[] = []
	for (const { meta, component } of seen.values()) {
		screens[meta.name] = component
		routes.push(meta)
		if (meta.loader) {
			loaders[meta.name] = meta.loader
		}
	}

	// Most-specific patterns first — 'demo/new' must beat 'demo/:id'.
	routes.sort(bySpecificity)

	const manifest = { screens, routes, layouts, loaders }
	self.m = manifest
	return manifest
}

/** Match-order comparator: static segments (2) outrank params (1), ties
 *  break alphabetically so ordering is total and stable across merges. */
function bySpecificity(a: RouteMeta, b: RouteMeta): number {
	return (
		b.segments.reduce((n, s) => n + (s.startsWith(':') ? 1 : 2), 0) -
			a.segments.reduce((n, s) => n + (s.startsWith(':') ? 1 : 2), 0) ||
		a.name.localeCompare(b.name)
	)
}

/** Normalize a programmatic `path` into manifest segments using the
 *  route-dir vocabulary: `'docs/[slug]'` and `'docs/:slug'` are the same
 *  pattern, a trailing `index` drops, `''`/`'index'` name the root route. */
function specSegments(path: string): string[] {
	const segs = path
		.split('/')
		.filter(Boolean)
		.map((s) => {
			const p = PARAM.exec(s)
			return p ? ':' + p[1] : s
		})

	if (segs[segs.length - 1] === 'index') {
		segs.pop()
	}

	return segs
}

const mergeWarned = new Set<string>()

/** Build a manifest from app data rather than the route dir — the
 *  programmatic half of the route contract (host frameworks derive specs
 *  from their own sources, e.g. `readdirSync` over a content dir). Each
 *  spec's `path` uses the route-dir vocabulary; `layouts` keys are path
 *  prefixes playing the `_layout` role. Same-name duplicates inside the
 *  set keep the later entry with a warn, matching merge precedence.
 *
 *  The return is branded with the spec-derived route types — read them
 *  with `ManifestRouteParams`/`ManifestRouteNames`/
 *  `ManifestRoutePresentations` to merge programmatic names into the
 *  app's typed navigation surface (`RouteName | …`, `RouteParams & …`). */
export function defineRoutes<const Specs extends readonly RouteSpec[]>(
	input: Specs | (Omit<RouteSpecSet, 'routes'> & { routes: Specs }),
): RouteManifest & SpecRouteInfo<Specs> {
	const set = (Array.isArray(input) ? { routes: input } : input) as RouteSpecSet
	const specs = set.routes
	const extra = set.layouts

	const screens: RouteManifest['screens'] = {}
	const layouts: RouteManifest['layouts'] = {}
	const metas = new Map<string, RouteMeta>()
	const warned = new Set<string>()
	const self: { m?: RouteManifest } = {}

	for (const [key, layout] of Object.entries(extra ?? {})) {
		const dir = key.replace(/^\/+|\/+$/g, '')
		if (dir !== key) {
			console.warn(`[octane-xplat] layout key '${key}' normalized to '${dir}'`)
		}

		layouts[dir] = layout
	}

	for (const spec of specs) {
		const segments = specSegments(spec.path)
		const name = segments.join('/') || 'index'
		const meta: RouteMeta = {
			name,
			segments,
			params: segments.filter((s) => s.startsWith(':')).map((s) => s.slice(1)),
			file: spec.source ?? `programmatic:${spec.path}`,
			presentation: spec.presentation,
		}

		if (spec.dataMode) {
			meta.dataMode = spec.dataMode
		}

		if (spec.dataMode === 'baked') {
			meta.loader = bakedLookup(() => self.m, name)
			if (spec.loader) {
				console.warn(
					`[octane-xplat] baked route '${name}' also carries a loader — bake it in the host and pass the result via 'baked' so its code stays out of the bundle`,
				)
			}
		} else if (spec.loader) {
			meta.loader = spec.loader
		}

		if (spec.beforeLoad) {
			meta.beforeLoad = spec.beforeLoad
		}

		if (spec.head) {
			meta.head = spec.head
		}

		if (metas.has(name) && !warned.has(name)) {
			warned.add(name)
			console.warn(
				`[octane-xplat] route '${name}' is defined twice — keeping the later spec (${meta.file})`,
			)
		}

		if (typeof spec.screen !== 'function') {
			console.warn(
				`[octane-xplat] route '${name}' has no component — 'screen' must be a component function, not a module`,
			)

			continue
		}

		metas.set(name, meta)
		screens[name] = spec.screen
	}

	const routes = [...metas.values()].sort(bySpecificity)
	const loaders: RouteManifest['loaders'] = {}
	for (const meta of routes) {
		if (meta.loader) {
			loaders[meta.name] = meta.loader
		}
	}

	const manifest = { screens, routes, layouts, loaders, baked: set.baked }
	self.m = manifest
	return manifest as RouteManifest & SpecRouteInfo<Specs>
}

/** Compose manifests into one — file-derived base plus any number of
 *  programmatic sets (`registerRoutes(mergeRouteManifests(fromDir, dynamic))`).
 *  Registration order is precedence: on a same-name collision the later
 *  manifest's route wins and the loser's loader/beforeLoad/head go with it —
 *  a warn fires once per colliding name. `layouts` merge key-wise the same
 *  way. `matchRoute` order is rebuilt by specificity after the merge. */
export function mergeRouteManifests(...manifests: RouteManifest[]): RouteManifest {
	const screens: RouteManifest['screens'] = {}
	const layouts: RouteManifest['layouts'] = {}
	const baked: NonNullable<RouteManifest['baked']> = {}
	const winners = new Map<string, RouteMeta>()

	for (const m of manifests) {
		Object.assign(layouts, m.layouts)
		Object.assign(baked, m.baked)
		// Screen-table entries without a RouteMeta still register — a screen
		// is pushable by name even without a URL pattern.
		Object.assign(screens, m.screens)
		for (const meta of m.routes) {
			const prev = winners.get(meta.name)
			if (prev && !mergeWarned.has(meta.name)) {
				mergeWarned.add(meta.name)
				console.warn(
					`[octane-xplat] route '${meta.name}' is defined by both ${prev.file} and ${meta.file} — keeping ${meta.file}`,
				)
			}

			winners.set(meta.name, meta)
		}
	}

	const routes = [...winners.values()].sort(bySpecificity)
	const loaders: RouteManifest['loaders'] = {}
	for (const meta of routes) {
		if (meta.loader) {
			loaders[meta.name] = meta.loader
		}
	}

	return { screens, routes, layouts, loaders, baked }
}

/** Match URL path segments against a manifest — returns the winning meta
 *  plus extracted params, or null. First hit wins (routes are pre-sorted
 *  by specificity). */
export function matchRoute(
	routes: readonly RouteMeta[],
	segs: string[],
): { meta: RouteMeta; params: Record<string, unknown> } | null {
	for (const meta of routes) {
		if (meta.segments.length !== segs.length) {
			continue
		}

		const params: Record<string, unknown> = {}
		let ok = true
		for (let i = 0; i < segs.length; i++) {
			const p = meta.segments[i]
			if (p.startsWith(':')) {
				params[p.slice(1)] = decodeRouteParam(decodeURIComponent(segs[i]))
			} else if (p !== segs[i]) {
				ok = false
				break
			}
		}

		if (ok) {
			return { meta, params }
		}
	}

	return null
}

/** Serialize a Route to a URL path (no origin): manifest routes substitute
 *  `:param` segments from params (leftover params → query string);
 *  non-manifest names keep the legacy `/<stack>/<name>?params` shape. */
export function buildRoutePath(routes: readonly RouteMeta[], r: Route): string {
	const meta = routes.find((m) => m.name === r.name)
	let segs: string[]
	let rest: Record<string, unknown> = r.params
	if (meta) {
		segs = meta.segments.map((s) => {
			if (!s.startsWith(':')) {
				return s
			}

			const v = r.params[s.slice(1)]
			if (v === undefined) {
				console.warn(`[octane-xplat] route '${r.name}' pushed without path param ${s}`)
			}

			return encodeURIComponent(encodeRouteParam(v, r.name, s.slice(1)))
		})

		rest = Object.fromEntries(Object.entries(r.params).filter(([k]) => !meta.params.includes(k)))
	} else {
		segs = [r.name]
	}

	// No URLSearchParams — shared code carries no DOM globals (invariant 4).
	const q = Object.entries(rest)
		.map(
			([k, v]) => encodeURIComponent(k) + '=' + encodeURIComponent(encodeRouteParam(v, r.name, k)),
		)
		.join('&')

	const path = (r.stack === 'root' ? '' : '/' + r.stack) + '/' + segs.join('/')
	return (path.replace(/\/+$/, '') || '/') + (q ? '?' + q : '')
}

const JSON_PARAM_PREFIX = 'json:'

/** Route codegen exposes string params, but the low-level Route shape remains
 * open for compatibility. Preserve accidental object params on web instead
 * of silently turning them into `[object Object]`; generated APIs still keep
 * callers on scalar strings. */
function encodeRouteParam(value: unknown, routeName: string, key: string): string {
	if (
		value === undefined ||
		value === null ||
		['string', 'number', 'boolean'].includes(typeof value)
	) {
		return String(value ?? '')
	}

	console.warn(
		`[octane-xplat] route '${routeName}' param '${key}' is non-scalar; JSON-encoding it for the URL`,
	)

	try {
		return JSON_PARAM_PREFIX + JSON.stringify(value)
	} catch {
		console.warn(
			`[octane-xplat] route '${routeName}' param '${key}' could not be JSON-encoded; using an empty value`,
		)

		return ''
	}
}

function decodeRouteParam(value: string): unknown {
	if (!value.startsWith(JSON_PARAM_PREFIX)) {
		return value
	}

	try {
		return JSON.parse(value.slice(JSON_PARAM_PREFIX.length))
	} catch {
		return value
	}
}

/** `?a=1&b=2` → params — shared code carries no URLSearchParams
 *  (invariant 4: no DOM globals on the native path). */
export function parseQueryString(qs: string | undefined): Record<string, unknown> {
	const params: Record<string, unknown> = {}
	if (!qs) {
		return params
	}

	for (const pair of qs.split('&')) {
		if (!pair) {
			continue
		}

		const eq = pair.indexOf('=')
		const k = eq === -1 ? pair : pair.slice(0, eq)
		const v = eq === -1 ? '' : pair.slice(eq + 1)
		params[decodeURIComponent(k)] = decodeRouteParam(decodeURIComponent(v))
	}

	return params
}

/** Full URL or path → canonical path for matching. `https://x/a/b?y` →
 *  `/a/b?y`; custom-scheme links keep their host as the first segment —
 *  `textcoral://post/5` → `/post/5` (the common app-scheme convention). */
export function linkPath(url: string): string {
	const m = /^[a-z][a-z0-9+.-]*:(\/\/)?/i.exec(url)
	let rest = m ? url.slice(m[0].length) : url
	// http(s) URLs carry a real authority to strip; custom app schemes use
	// the host slot as the first path segment (textcoral://post/5 → /post/5).
	if (m?.[1] && /^https?:\/\//i.test(m[0])) {
		rest = rest.replace(/^[^/?#]*/, '')
	}

	return '/' + rest.replace(/^\/+/, '')
}

/** Match a URL path+query against the manifest into a Route — the shared
 *  half of web's URL parse and native's deep-link handling. Whole-path
 *  match wins ('/demo/x' → root 'demo/:id'); a non-matching first segment
 *  is the stack prefix ('/demos/demo/x' → stack 'demos'). Unmatched names
 *  fall through as literal routes for pre-manifest callers. */
export function matchUrl(routes: readonly RouteMeta[], url: string): Route | null {
	const [p, qs] = url.split('?')
	const segs = p.split('/').filter(Boolean)
	const query = parseQueryString(qs)
	if (!segs.length) {
		return null
	}

	const finish = (
		stack: string,
		m: { meta: RouteMeta; params: Record<string, unknown> } | null,
		fallbackName: string,
	): Route => ({
		stack,
		name: m ? m.meta.name : fallbackName,
		params: { ...query, ...m?.params },
		presentation: m?.meta.presentation,
	})

	const root = matchRoute(routes, segs)
	if (root) {
		return finish('root', root, segs.join('/'))
	}

	if (segs.length > 1) {
		const named = matchRoute(routes, segs.slice(1))
		if (named) {
			return finish(segs[0], named, segs[1])
		}

		return finish(segs[0], null, segs[1])
	}

	return finish('root', null, segs[0])
}

/** Fire a route's `loader` export — prefetch, not a data layer: the
 *  screen's own `query$` reads still own the data, this just warms the
 *  cache before mount. Sync throws and async rejections warn rather
 *  than break navigation. */
export function runLoader(routes: readonly RouteMeta[], r: Route): void {
	const loader = routes.find((m) => m.name === r.name)?.loader
	if (!loader) {
		return
	}

	try {
		const out = loader(r.params)
		if (out && typeof (out as PromiseLike<unknown>).then === 'function') {
			;(out as PromiseLike<unknown>).then(undefined, (e) =>
				console.warn(`[octane-xplat] loader('${r.name}') rejected: ${e}`),
			)
		}
	} catch (e) {
		console.warn(`[octane-xplat] loader('${r.name}') threw: ${(e as Error)?.message}`)
	}
}

/** Layout components wrapping a route name, outermost → innermost —
 *  'chat/room' picks up `app/chat/_layout.tsrx`, 'a/b/c' chains 'a' then
 *  'a/b'. The '' root layout is the app's own shell (entry renders it)
 *  and never joins a chain. Leaves apply the chain at render: native
 *  wraps each pushed Page's component, web wraps the outlet's resolved
 *  element. */
export function layoutChain(layouts: Record<string, any>, name: string): any[] {
	const segs = name.split('/')
	const chain: any[] = []
	for (let i = 1; i < segs.length; i++) {
		const L = layouts[segs.slice(0, i).join('/')]
		if (L) {
			chain.push(L)
		}
	}

	return chain
}
