/** Shared route-dir manifest — the file-router half of the nav contract
 *  (docs/notes/navigation-notes.md). Apps glob their route dir per platform and
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
 *    app/demo/[[ref]].tsrx  → 'demo/:ref?'    ([[p]] = optional param)
 *    app/docs/[...r].tsrx   → 'docs/*r'       ([...p] = terminal catch-all)
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
	RouteDiagnostic,
	RouteManifest,
	RouteManifestJson,
	RouteMeta,
	RouteSpec,
	RouteSpecSet,
	SpecRouteInfo,
} from './props'

/** Single-line rendering of a RouteDiagnostic — the text console warnings
 *  carry verbatim and `RouteManifestError` aggregates line per issue. */
export function formatRouteDiagnostic(d: RouteDiagnostic): string {
	return (
		`[octane-xplat] ${d.code} ${d.path} — ` +
		(d.detail ? `${d.detail}; ` : '') +
		`expected ${d.expected}. ${d.hint}`
	)
}

function warnDiagnostic(d: RouteDiagnostic): void {
	console.warn(formatRouteDiagnostic(d))
}

/** Thrown when route authoring input violates the manifest contract —
 *  `issues` lists every violation found in one pass, so a `defineRoutes`
 *  call with three bad specs reports all three at once rather than
 *  failing edit-by-edit. */
export class RouteManifestError extends Error {
	readonly issues: readonly RouteDiagnostic[]
	constructor(issues: RouteDiagnostic | readonly RouteDiagnostic[]) {
		const list = Array.isArray(issues) ? issues : [issues]
		super(
			'invalid route definitions:\n' +
				list.map((i) => '  ' + formatRouteDiagnostic(i)).join('\n'),
		)

		this.name = 'RouteManifestError'
		this.issues = list
	}
}

const EXT = /\.(tsrx|tsx|ts|mts|cts|js|mjs|cjs|jsx)$/
const SUFFIX = /\.(web|mobile|ios|android|macos|windows|linux)$/
const PARAM = /^\[(.+)\]$/

/** One route-dir/spec path segment → normalized pattern segment:
 *  `[x]`→`:x` · `[[x]]`/`[x?]`→`:x?` (optional param) · `[...x]`→`*x`
 *  (terminal catch-all). Spec paths may write the normalized forms
 *  directly (`:x`, `:x?`, `*`, `*x`); a bare `*` captures into
 *  `params['*']`, a named `*x`/`[...x]` into `params.x`. */
function normSegment(s: string): string {
	const b = PARAM.exec(s)
	if (!b) {
		return s
	}

	const inner = b[1]
	if (inner.startsWith('[') && inner.endsWith(']')) {
		const core = inner.slice(1, -1)
		return core.startsWith('...') ? '*' + core.slice(3) : ':' + core + '?'
	}

	return inner.startsWith('...') ? '*' + inner.slice(3) : ':' + inner
}

/** Normalized pattern segment → param name: ':x'/':x?' → 'x',
 *  '*'/'*x' → '*'/'x', static segments → undefined. */
function segmentParam(s: string): string | undefined {
	if (s.startsWith(':')) {
		return s.endsWith('?') ? s.slice(1, -1) : s.slice(1)
	}

	if (s.startsWith('*')) {
		return s.slice(1) || '*'
	}

	return undefined
}

function segmentParams(segments: readonly string[]): string[] {
	return segments.flatMap((s) => segmentParam(s) ?? [])
}

/** A catch-all only matches at the end of a pattern — warn that a
 *  mid-path '*' is a literal segment, not a remainder capture. */
function warnOnStraySplat(segments: readonly string[], file: string): void {
	const at = segments.findIndex((s) => s.startsWith('*'))
	if (at !== -1 && at !== segments.length - 1) {
		warnDiagnostic({
			code: 'route/mid-path-catchall',
			path: file,
			detail: `'${segments.join('/')}' has a catch-all segment mid-path`,
			expected: "'*' as the last segment — a mid-path '*' is a literal segment",
			hint: 'move the catch-all to the end of the path or give the segment a param name',
		})
	}
}

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

		throw new RouteManifestError({
			code: 'route/missing-baked-data',
			path: `baked['${name}']`,
			detail: `baked route '${name}' has no baked data`,
			expected: "a baked-map entry for every dataMode: 'baked' route",
			hint: "run `xplat routes` to regenerate, or pass baked data on the manifest",
		})
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
		(k) =>
			typeof mod[k] === 'function' &&
			!['loader', 'beforeLoad', 'head', 'ErrorBoundary'].includes(k),
	)

	if (fns.length === 1) {
		return mod[fns[0]]
	}

	warnDiagnostic({
		code: fns.length ? 'route/ambiguous-screen' : 'route/missing-screen',
		path: file,
		detail: fns.length
			? `${fns.length} component-shaped exports (${fns.join(', ')})`
			: 'no component export found',
		expected: "a default or 'screen' component export",
		hint: fns.length
			? "add a default or 'screen' export naming the component — the file is skipped until then"
			: 'export the screen component — the file is skipped until then',
	})

	return undefined
}

/** Diagnostic for a route-file export present but the wrong shape —
 *  the contract names the field, the export is ignored until it matches. */
function invalidExport(
	file: string,
	field: string,
	value: unknown,
	expected: string,
): RouteDiagnostic {
	return {
		code: 'route/invalid-export',
		path: `${file}:${field}`,
		detail: `received ${Array.isArray(value) ? 'array' : typeof value}`,
		expected,
		hint: `fix or remove the '${field}' export — it is ignored until it matches`,
	}
}

/**
 * Build a `RouteManifest` from route-dir files or programmatic specs — emits `screens`/`routes`/`layouts` plus diagnostics.
 *
 * @see RouteManifest, RouteMeta, RouteDiagnostic, defineRoutes.
 */
export function deriveRouteManifest(
	files: Record<string, any>,
	prefer: readonly string[],
	dir = 'app',
): RouteManifest {
	const prefix = dir.replace(/^\.?\/?/, '').replace(/\/+$/, '') + '/'
	// name → best candidate so far (lowest rank wins; ties are rejected).
	const seen = new Map<string, { rank: number; meta: RouteMeta; component: any }>()
	const layoutRank = new Map<string, number>()
	const layoutFiles = new Map<string, string>()
	const layouts: Record<string, any> = {}
	const loaders: RouteManifest['loaders'] = {}
	const issues: RouteDiagnostic[] = []
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
				if (prev === rank) {
					issues.push({
						code: 'route/duplicate-name',
						path: key,
						detail: `layouts['${d}'] is also produced by ${layoutFiles.get(d)}`,
						expected: 'one _layout file per directory at the same platform rank',
						hint: 'rename or remove one file, or give one a platform suffix (.web/.ios/...) so `prefer` ranks them',
					})
				}

				continue
			}

			const component = pick(files[key], key)
			if (component) {
				layouts[d] = component
				layoutRank.set(d, rank)
				layoutFiles.set(d, key)
			}

			continue
		}

		const segs = parts.slice(0, -1).concat(base)
		if (segs[segs.length - 1] === 'index') {
			segs.pop()
		}

		const segments = segs.map(normSegment)
		const name = segments.join('/') || 'index'
		const meta: RouteMeta = {
			name,
			segments,
			params: segmentParams(segments),
			file: key,
			presentation,
		}

		warnOnStraySplat(segments, key)

		const mod = files[key]
		const dataMode = mod?.dataMode
		if (dataMode === 'baked' || dataMode === 'live') {
			meta.dataMode = dataMode
		} else if (dataMode !== undefined) {
			warnDiagnostic({
				code: 'route/invalid-export',
				path: `${key}:dataMode`,
				detail: `received ${JSON.stringify(dataMode)}`,
				expected: "'live' | 'baked'",
				hint: "fix or remove the 'dataMode' export — it is ignored until it matches",
			})
		}

		const loader = mod?.loader
		if (meta.dataMode === 'baked') {
			meta.loader = bakedLookup(() => self.m, name)
			if (typeof loader === 'function') {
				warnDiagnostic({
					code: 'route/baked-with-loader',
					path: `${key}:loader`,
					detail: `baked route '${name}' also exports a loader`,
					expected: "build-time data in a '.loader.ts' sibling",
					hint: 'move the loader to a .loader.ts sibling so its imports stay out of the bundle',
				})
			}
		} else if (typeof loader === 'function') {
			meta.loader = loader
		} else if (loader !== undefined) {
			warnDiagnostic(invalidExport(key, 'loader', loader, '(params) => data'))
		}

		const beforeLoad = mod?.beforeLoad
		if (typeof beforeLoad === 'function') {
			meta.beforeLoad = beforeLoad
		} else if (beforeLoad !== undefined) {
			warnDiagnostic(
				invalidExport(key, 'beforeLoad', beforeLoad, '(args) => RouteContext | void'),
			)
		}

		const errorBoundary = mod?.ErrorBoundary
		if (typeof errorBoundary === 'function') {
			meta.errorBoundary = errorBoundary
		} else if (errorBoundary !== undefined) {
			warnDiagnostic(
				invalidExport(
					key,
					'ErrorBoundary',
					errorBoundary,
					'(props: RouteErrorBoundaryProps) => Renderable',
				),
			)
		}

		const head = mod?.head
		if (head && (typeof head === 'object' || typeof head === 'function')) {
			meta.head = head
		} else if (head !== undefined) {
			warnDiagnostic(
				invalidExport(key, 'head', head, 'a RouteHead object or (params) => RouteHead'),
			)
		}

		const prev = seen.get(name)
		if (prev && prev.rank <= rank) {
			if (prev.rank === rank) {
				issues.push({
					code: 'route/duplicate-name',
					path: key,
					detail: `route '${name}' is also produced by ${prev.meta.file}`,
					expected: 'one file per route name at the same platform rank',
					hint: 'rename or remove one file, or give one a platform suffix (.web/.ios/...) so `prefer` ranks them',
				})
			}

			continue
		}

		const component = pick(files[key], key)
		if (component) {
			seen.set(name, { rank, meta, component })
		}
	}

	if (issues.length) {
		throw new RouteManifestError(issues)
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
	warnOnUnmatchedLayouts(layouts, routes)

	const manifest = { screens, routes, layouts, loaders }
	self.m = manifest
	return manifest
}

/** Match-order comparator: static (3) outranks a required param (2),
 *  which outranks an optional param (1), which outranks a catch-all (0).
 *  Ties break alphabetically so ordering is total and stable across
 *  merges. */
function bySpecificity(a: RouteMeta, b: RouteMeta): number {
	const weight = (s: string) =>
		s.startsWith('*') ? 0 : s.startsWith(':') ? (s.endsWith('?') ? 1 : 2) : 3

	return (
		b.segments.reduce((n, s) => n + weight(s), 0) - a.segments.reduce((n, s) => n + weight(s), 0) ||
		a.name.localeCompare(b.name)
	)
}

/** A layout dir wraps only routes nested beneath it ('' is the app shell
 *  and always applies) — a key no route name falls under is dead config,
 *  usually a mistyped path. */
function warnOnUnmatchedLayouts(
	layouts: Record<string, any>,
	routes: readonly RouteMeta[],
): void {
	for (const dir of Object.keys(layouts)) {
		if (dir && !routes.some((r) => r.name.startsWith(dir + '/'))) {
			warnDiagnostic({
				code: 'route/unmatched-layout',
				path: `layouts['${dir}']`,
				detail: `no route nests under '${dir}/'`,
				expected: 'a layouts key that prefixes at least one route name',
				hint: `fix the key or remove the entry — a layout only wraps routes beneath its directory`,
			})
		}
	}
}

/** Normalize a programmatic `path` into manifest segments using the
 *  route-dir vocabulary: `'docs/[slug]'` and `'docs/:slug'` are the same
 *  pattern, `':slug?'`/`'[slug?]'`/`'[[slug]]'` mark an optional segment,
 *  a terminal `'*'`/`'[...rest]'` is a catch-all, a trailing `index`
 *  drops, `''`/`'index'` name the root route. */
function specSegments(path: string): string[] {
	const segs = path.split('/').filter(Boolean).map(normSegment)

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
 *  prefixes playing the `_layout` role. Contract failures are diagnosed
 *  with a stable code, field path, expected shape, and repair hint:
 *  same-name duplicates inside the set and malformed specs throw a
 *  `RouteManifestError` carrying every issue found, while missing
 *  prerequisites (e.g. a baked spec with no `baked` entry) warn. To
 *  override a route from another manifest, use `mergeRouteManifests` —
 *  registration order is precedence there.
 *
 *  The return is branded with the spec-derived route types — read them
 *  with `ManifestRouteParams`/`ManifestRouteNames`/
 *  `ManifestRoutePresentations` to merge programmatic names into the
 *  app's typed navigation surface (`RouteName | …`, `RouteParams & …`). */
export function defineRoutes<const Specs extends readonly RouteSpec[]>(
	input: Specs | (Omit<RouteSpecSet, 'routes'> & { routes: Specs }),
): RouteManifest & SpecRouteInfo<Specs> {
	const raw = Array.isArray(input) ? { routes: input } : input
	const specs =
		raw && typeof raw === 'object' && 'routes' in raw
			? (raw as RouteSpecSet).routes
			: undefined

	const issues: RouteDiagnostic[] = []

	if (!Array.isArray(specs)) {
		throw new RouteManifestError({
			code: 'route/invalid-spec',
			path: 'routes',
			detail: `received ${specs === null ? 'null' : typeof specs}`,
			expected: 'a RouteSpec array — { routes: [...] } or a bare array',
			hint: 'each spec needs at least a path and a screen component',
		})
	}

	const set = raw as RouteSpecSet
	const extra = set.layouts

	const screens: RouteManifest['screens'] = {}
	const layouts: RouteManifest['layouts'] = {}
	const metas = new Map<string, RouteMeta>()
	const firstSpecAt = new Map<string, number>()
	const self: { m?: RouteManifest } = {}

	if (extra !== undefined && (typeof extra !== 'object' || extra === null || Array.isArray(extra))) {
		issues.push({
			code: 'route/invalid-spec',
			path: 'layouts',
			detail: `received ${Array.isArray(extra) ? 'array' : typeof extra}`,
			expected: 'a Record of path-prefix → layout component',
			hint: 'pass layouts: { docs: DocsShell } or remove the field',
		})
	}

	if (
		set.baked !== undefined &&
		(typeof set.baked !== 'object' || set.baked === null || Array.isArray(set.baked))
	) {
		issues.push({
			code: 'route/invalid-spec',
			path: 'baked',
			detail: `received ${Array.isArray(set.baked) ? 'array' : typeof set.baked}`,
			expected: "a Record of route name → baked data, keyed by each dataMode: 'baked' route",
			hint: `pass baked: { '<route-name>': data }`,
		})
	}

	const layoutEntries =
		extra && typeof extra === 'object' && !Array.isArray(extra) ? Object.entries(extra) : []

	for (const [key, layout] of layoutEntries) {
		const dir = key.replace(/^\/+|\/+$/g, '')
		if (dir !== key) {
			warnDiagnostic({
				code: 'route/normalized-layout-key',
				path: `layouts['${key}']`,
				detail: `normalized to '${dir}'`,
				expected: 'a route-dir path without leading or trailing slashes',
				hint: `write the key as '${dir}'`,
			})
		}

		if (typeof layout !== 'function') {
			issues.push({
				code: 'route/invalid-spec',
				path: `layouts['${dir}']`,
				detail: `received ${Array.isArray(layout) ? 'array' : typeof layout}`,
				expected: 'a layout component function',
				hint: 'pass the component itself — layouts: { docs: DocsShell }',
			})

			continue
		}

		layouts[dir] = layout
	}

	for (const [i, spec] of specs.entries()) {
		const at = `routes[${i}]`
		const before = issues.length
		if (!spec || typeof spec !== 'object') {
			issues.push({
				code: 'route/invalid-spec',
				path: at,
				detail: `received ${spec === null ? 'null' : typeof spec}`,
				expected: 'a RouteSpec object',
				hint: 'each spec needs at least a path and a screen component',
			})

			continue
		}

		if (typeof spec.path !== 'string') {
			issues.push({
				code: 'route/invalid-spec',
				path: `${at}.path`,
				detail: `received ${typeof spec.path}`,
				expected: "a string like 'docs/:slug' ('' or 'index' names the root route)",
				hint: 'set path to the route-dir-style path this spec defines',
			})

			continue
		}

		const segments = specSegments(spec.path)
		const name = segments.join('/') || 'index'

		const firstAt = firstSpecAt.get(name)
		if (firstAt !== undefined) {
			issues.push({
				code: 'route/duplicate-name',
				path: `${at}.path`,
				detail: `route '${name}' is already defined by routes[${firstAt}] ('${specs[firstAt]?.path}')`,
				expected: 'a unique route name per defineRoutes call',
				hint: `rename or remove one spec — to override a route from another manifest use mergeRouteManifests, where the later manifest wins`,
			})
		} else {
			firstSpecAt.set(name, i)
		}

		if (typeof spec.screen !== 'function') {
			issues.push({
				code: 'route/missing-screen',
				path: `${at}.screen`,
				detail: `received ${Array.isArray(spec.screen) ? 'array' : typeof spec.screen}`,
				expected: 'a component function',
				hint: 'pass the component itself — screen: MyScreen, not a module or element',
			})
		}

		if (
			spec.presentation !== undefined &&
			!['push', 'modal', 'fade'].includes(spec.presentation)
		) {
			issues.push({
				code: 'route/invalid-spec',
				path: `${at}.presentation`,
				detail: `received ${JSON.stringify(spec.presentation)}`,
				expected: "'push' | 'modal' | 'fade'",
				hint: 'fix the value or remove the field — push is the default',
			})
		}

		if (
			spec.dataMode !== undefined &&
			spec.dataMode !== 'live' &&
			spec.dataMode !== 'baked'
		) {
			issues.push({
				code: 'route/invalid-spec',
				path: `${at}.dataMode`,
				detail: `received ${JSON.stringify(spec.dataMode)}`,
				expected: "'live' | 'baked'",
				hint: 'fix the value or remove the field — live is the default',
			})
		}

		if (spec.loader !== undefined && typeof spec.loader !== 'function') {
			issues.push({
				code: 'route/invalid-spec',
				path: `${at}.loader`,
				detail: `received ${typeof spec.loader}`,
				expected: '(params) => data',
				hint: 'pass a loader function or remove the field',
			})
		}

		if (spec.beforeLoad !== undefined && typeof spec.beforeLoad !== 'function') {
			issues.push({
				code: 'route/invalid-spec',
				path: `${at}.beforeLoad`,
				detail: `received ${typeof spec.beforeLoad}`,
				expected: '(args) => RouteContext | void',
				hint: 'pass a guard function or remove the field',
			})
		}

		if (spec.errorBoundary !== undefined && typeof spec.errorBoundary !== 'function') {
			issues.push({
				code: 'route/invalid-spec',
				path: `${at}.errorBoundary`,
				detail: `received ${typeof spec.errorBoundary}`,
				expected: '(props: RouteErrorBoundaryProps) => Renderable',
				hint: 'pass a boundary component or remove the field',
			})
		}

		if (
			spec.head !== undefined &&
			typeof spec.head !== 'object' &&
			typeof spec.head !== 'function'
		) {
			issues.push({
				code: 'route/invalid-spec',
				path: `${at}.head`,
				detail: `received ${typeof spec.head}`,
				expected: 'a RouteHead object or (params) => RouteHead',
				hint: 'pass { title, meta } or a params function, or remove the field',
			})
		}

		// A spec that failed its contract contributes nothing — keep scanning
		// so one throw reports every bad spec in the set.
		if (issues.length !== before) {
			continue
		}

		const meta: RouteMeta = {
			name,
			segments,
			params: segmentParams(segments),
			file: spec.source ?? `programmatic:${spec.path}`,
			presentation: spec.presentation,
		}

		warnOnStraySplat(segments, `${at}.path`)

		if (spec.dataMode) {
			meta.dataMode = spec.dataMode
		}

		if (spec.dataMode === 'baked') {
			meta.loader = bakedLookup(() => self.m, name)
			if (spec.loader) {
				warnDiagnostic({
					code: 'route/baked-with-loader',
					path: `${at}.loader`,
					detail: `baked route '${name}' also carries a loader`,
					expected: "build-time data passed via the set's 'baked' map",
					hint: 'bake it in the host and pass the result via baked so its code stays out of the bundle',
				})
			}

			if (!set.baked || !Object.prototype.hasOwnProperty.call(set.baked, name)) {
				warnDiagnostic({
					code: 'route/missing-baked-data',
					path: `${at}.dataMode`,
					detail: `baked route '${name}' has no baked data in the set`,
					expected: `a baked['${name}'] entry`,
					hint: `pass baked: { '${name}': ... } on the set, or assign manifest.baked before the route is pushed`,
				})
			}
		} else if (spec.loader) {
			meta.loader = spec.loader
		}

		if (spec.beforeLoad) {
			meta.beforeLoad = spec.beforeLoad
		}

		if (spec.errorBoundary) {
			meta.errorBoundary = spec.errorBoundary
		}

		if (spec.head) {
			meta.head = spec.head
		}

		metas.set(name, meta)
		screens[name] = spec.screen
	}

	if (issues.length) {
		throw new RouteManifestError(issues)
	}

	const routes = [...metas.values()].sort(bySpecificity)
	const loaders: RouteManifest['loaders'] = {}
	for (const meta of routes) {
		if (meta.loader) {
			loaders[meta.name] = meta.loader
		}
	}

	warnOnUnmatchedLayouts(layouts, routes)

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
				warnDiagnostic({
					code: 'route/shadowed-name',
					path: meta.name,
					detail: `route '${meta.name}' is defined by both ${prev.file} and ${meta.file} — keeping ${meta.file}`,
					expected: 'unique names, or deliberate precedence by registration order',
					hint: `rename one route if both should exist; to keep the earlier one, reorder the merge`,
				})
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

/** Serialize a manifest to the normalized `RouteManifestJson` shape — the
 *  same list `xplat routes` emits for file routes, produced here for
 *  programmatic/merged manifests so hosts consume one schema. */
export function manifestToJson(manifest: RouteManifest): RouteManifestJson {
	return {
		version: 1,
		layouts: Object.keys(manifest.layouts).sort(),
		screens: Object.keys(manifest.screens).sort(),
		routes: manifest.routes.map((meta) => {
			const segs = meta.name.split('/')
			const layoutDirs: string[] = manifest.layouts[''] ? [''] : []
			for (let i = 1; i < segs.length; i++) {
				const d = segs.slice(0, i).join('/')
				if (manifest.layouts[d]) {
					layoutDirs.push(d)
				}
			}

			return {
				name: meta.name,
				path: meta.name === 'index' ? '' : meta.segments.join('/'),
				params: [...meta.params],
				...(meta.presentation ? { presentation: meta.presentation } : {}),
				...(meta.dataMode ? { dataMode: meta.dataMode } : {}),
				layouts: layoutDirs,
				source: meta.file,
				loader: !!meta.loader,
				guard: !!meta.beforeLoad,
				head: !!meta.head,
				errorBoundary: !!meta.errorBoundary,
			}
		}),
	}
}

/** Match URL path segments against a manifest — returns the winning meta
 *  plus extracted params, or null. First hit wins (routes are pre-sorted
 *  by specificity). A `:param?` segment matches zero or one segment —
 *  the matcher consumes greedily and backtracks to the absent case so a
 *  later static can still align; a terminal `*` captures the remaining
 *  segments `/`-joined into `params['*']` (a named `*rest` into 'rest'). */
export function matchRoute(
	routes: readonly RouteMeta[],
	segs: string[],
): { meta: RouteMeta; params: Record<string, unknown> } | null {
	for (const meta of routes) {
		const params = matchSegments(meta.segments, segs)
		if (params) {
			return { meta, params }
		}
	}

	return null
}

/** Variable-length pattern match — optional segments try consuming a
 *  segment first and fall back to absent, so the more specific reading
 *  wins; a backtracking miss deletes the tentative param before the
 *  absent retry. */
function matchSegments(pattern: readonly string[], segs: string[]): Record<string, unknown> | null {
	const params: Record<string, unknown> = {}

	const walk = (pi: number, si: number): boolean => {
		if (pi === pattern.length) {
			return si === segs.length
		}

		const p = pattern[pi]
		if (p.startsWith('*')) {
			// Non-terminal '*' (warned about at manifest build) is a literal.
			if (pi !== pattern.length - 1) {
				return p === segs[si] && walk(pi + 1, si + 1)
			}

			params[segmentParam(p)!] = segs
				.slice(si)
				.map((s) => decodeURIComponent(s))
				.join('/')

			return true
		}

		if (p.startsWith(':') && p.endsWith('?')) {
			const name = p.slice(1, -1)
			if (si < segs.length) {
				params[name] = decodeRouteParam(decodeURIComponent(segs[si]))
				if (walk(pi + 1, si + 1)) {
					return true
				}

				delete params[name]
			}

			return walk(pi + 1, si)
		}

		if (si >= segs.length) {
			return false
		}

		if (p.startsWith(':')) {
			params[p.slice(1)] = decodeRouteParam(decodeURIComponent(segs[si]))
			return walk(pi + 1, si + 1)
		}

		return p === segs[si] && walk(pi + 1, si + 1)
	}

	return walk(0, 0) ? params : null
}

/** Serialize a Route to a URL path (no origin): manifest routes substitute
 *  `:param` segments from params (leftover params → query string); a
 *  `:param?` segment with no value drops out of the path entirely, and a
 *  terminal `*`/`*rest` splices in its `/`-joined param value.
 *  non-manifest names keep the legacy `/<stack>/<name>?params` shape. */
export function buildRoutePath(routes: readonly RouteMeta[], r: Route): string {
	const meta = routes.find((m) => m.name === r.name)
	let segs: string[]
	let rest: Record<string, unknown> = r.params
	if (meta) {
		segs = meta.segments.flatMap((s, i) => {
			// A mid-path '*' is a literal segment (manifest build warns).
			const p = s.startsWith('*') && i !== meta.segments.length - 1 ? undefined : segmentParam(s)
			if (p === undefined) {
				return [s]
			}

			const v = r.params[p]
			if (s.startsWith('*')) {
				if (v === undefined || v === null || v === '') {
					return []
				}

				const enc = encodeRouteParam(v, r.name, p)
				// '/' in a splat value is a segment boundary; a JSON-encoded
				// non-scalar stays one encoded segment instead.
				return enc.startsWith(JSON_PARAM_PREFIX)
					? [encodeURIComponent(enc)]
					: enc.split('/').map(encodeURIComponent)
			}

			if (s.endsWith('?') && (v === undefined || v === null || v === '')) {
				return [] // optional segment absent — drop it from the path
			}

			if (v === undefined) {
				warnDiagnostic({
					code: 'route/missing-param',
					path: `params.${p}`,
					detail: `route '${r.name}' was pushed without a value for '${s}'`,
					expected: `a string/number/boolean at params.${p}`,
					hint: `pass params: { ${p}: ... } — without it the URL keeps the literal '${s}' segment`,
				})
			}

			return [encodeURIComponent(encodeRouteParam(v, r.name, p))]
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
	return (path.replace(/\/+$/, '') || '/') + (q ? '?' + q : '') + (r.hash ? '#' + r.hash : '')
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

	warnDiagnostic({
		code: 'route/non-scalar-param',
		path: `params.${key}`,
		detail: `route '${routeName}' param '${key}' is non-scalar; JSON-encoding it for the URL`,
		expected: 'a string, number, or boolean param value',
		hint: 'pass a scalar or accept the JSON round-trip — generated route types keep callers on scalars',
	})

	try {
		return JSON_PARAM_PREFIX + JSON.stringify(value)
	} catch {
		warnDiagnostic({
			code: 'route/non-scalar-param',
			path: `params.${key}`,
			detail: `route '${routeName}' param '${key}' could not be JSON-encoded; using an empty value`,
			expected: 'a JSON-serializable param value',
			hint: 'pass a scalar — cyclic or opaque values cannot cross the URL',
		})

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
 *  is the stack prefix ('/demos/demo/x' → stack 'demos'). Whole-path
 *  includes catch-alls: a root `*` claims every URL, including
 *  stack-prefixed ones — apps needing named-stack links scope their
 *  splats under a prefix. Unmatched names fall through as literal
 *  routes for pre-manifest callers. */
export function matchUrl(routes: readonly RouteMeta[], url: string): Route | null {
	// The fragment isn't a route param — it rides the Route's `hash` field so
	// web can restore scroll to the element it names. Split only the first
	// query delimiter; a later '?' belongs to its value. Reject malformed
	// percent encoding at this external-input boundary instead of crashing
	// the mounted app.
	const hashAt = url.indexOf('#')
	const hash = hashAt === -1 ? undefined : url.slice(hashAt + 1)
	url = hashAt === -1 ? url : url.slice(0, hashAt)
	const at = url.indexOf('?')
	const p = at === -1 ? url : url.slice(0, at)
	const qs = at === -1 ? undefined : url.slice(at + 1)
	const segs = p.split('/').filter(Boolean)
	let query: Record<string, unknown>
	try {
		// Use the decoded value: production optimizers can drop an unused
		// builtin call even though malformed input makes it throw.
		if (!decodeURIComponent(p)) {
			return null
		}

		query = parseQueryString(qs)
	} catch (error) {
		if (error instanceof URIError) {
			return null
		}

		throw error
	}

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
		hash,
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

/** Fire a route's `loader` without committing navigation — the opt-in
 *  prefetch primitive, for warming a `query$` cache ahead of a push an
 *  app expects to make. This is NOT the navigation loader path: a push
 *  awaits the loader itself (`commitRoute`) and hands its result to the
 *  screen as `data`/`error`; the value fired here is discarded. Sync
 *  throws and async rejections warn rather than break navigation. */
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
