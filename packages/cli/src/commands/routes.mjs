import { command, option, optional, string } from '@alloc/cmd-ts'
import {
	existsSync,
	readFileSync,
	readdirSync,
	realpathSync,
	statSync,
	writeFileSync,
} from 'node:fs'

import { createRequire } from 'node:module'
import { join, relative, sep } from 'node:path'
import { pathToFileURL } from 'node:url'
import * as p from '@clack/prompts'
import { mdToDoc } from '../markdown.mjs'

// Mirror of packages/ui/src/route-table.ts conventions — the CLI walks the
// route dir off disk (no vite glob), so the derivation is re-implemented
// here. Keep the two in sync: same suffix strip order, same index/_layout
// rules. All platform variants count — the union is cross-platform.
const EXT = /\.(tsrx|tsx|ts|mts|cts|js|mjs|cjs|jsx)$/
const SUFFIX = /\.(web|mobile|ios|android|macos|windows|linux)$/
const PARAM = /^\[(.+)\]$/
const PRESENT = /\+(modal|fade|push)$/
// Build-time loader modules — `<route>.loader.ts` pairs with a
// `dataMode: 'baked'` route; runs under vite ssrLoadModule during codegen
// and is never part of the runtime bundle.
const LOADER_FILE = /\.loader\.(ts|mts|cts|js|mjs|cjs)$/
const LOADER_EXTS = ['ts', 'mts', 'cts', 'js', 'mjs', 'cjs']
const DATAMODE = /export\s+const\s+dataMode\s*=\s*['"](baked|live)['"]/
// Presence greps for the manifest JSON — codegen records which hooks a
// route declares without evaluating its module.
const ROUTE_EXPORTS = /export\s+(?:async\s+)?(?:function|const|let)\s+(loader|beforeLoad|head)\b/g

function walk(dir, out = []) {
	for (const name of readdirSync(dir).sort()) {
		const full = join(dir, name)
		if (statSync(full).isDirectory()) {
			walk(full, out)
		} else if (EXT.test(name) || name.endsWith('.md')) {
			out.push(full)
		}
	}

	return out
}

/** Vite from the consuming app — same createRequire dance as vite.mjs:
 *  under pnpm's isolated linker a bare import here misses the app's copy. */
function appVite(cwd) {
	const req = createRequire(join(cwd, 'package.json'))
	return import(pathToFileURL(realpathSync(req.resolve('vite'))).href)
}

/** Rejects loader output that can't cross the JSON boundary into the
 *  emitted routes.gen.data module — names the route in the error. */
function assertSerializable(data, name) {
	JSON.stringify(data, (key, value) => {
		if (typeof value === 'function' || typeof value === 'symbol' || typeof value === 'bigint') {
			throw new Error(
				`baked route '${name}' returned a non-serializable ${typeof value}` +
					(key ? ` at '${key}'` : '') +
					' — baked data must be JSON',
			)
		}

		return value
	})

	return data
}

/** Runs each baked route's `.loader.ts` under vite ssrLoadModule (Node —
 *  no DOM or native globals, app config not loaded) and returns the
 *  name → serialized-result map. */
async function bakeRouteData(cwd, loaders) {
	const vite = await appVite(cwd)
	const server = await vite.createServer({
		root: cwd,
		configFile: false,
		logLevel: 'silent',
		server: { middlewareMode: true },
		appType: 'custom',
	})

	try {
		const data = {}
		for (const [name, file] of loaders) {
			const mod = await server.ssrLoadModule(file)
			const loader = mod?.loader ?? mod?.default
			if (typeof loader !== 'function') {
				throw new Error(
					`baked route '${name}' — ${relative(cwd, file)} must export a 'loader' function`,
				)
			}

			data[name] = assertSerializable(await loader({}), name)
		}

		return data
	} finally {
		await server.close()
	}
}

function routeFor(rel, extRe = EXT) {
	rel = rel.split(sep).join('/').replace(extRe, '')
	const parts = rel.split('/')
	let base = parts[parts.length - 1]
	const sm = SUFFIX.exec(base)
	if (sm) {
		base = base.slice(0, base.length - sm[0].length)
	}

	const pm = PRESENT.exec(base)
	const presentation = pm ? pm[1] : undefined
	if (pm) {
		base = base.slice(0, base.length - pm[0].length)
	}

	if (base === '_layout') {
		return null
	}

	const segs = parts.slice(0, -1).concat(base)
	if (segs[segs.length - 1] === 'index') {
		segs.pop()
	}

	const segments = segs.map((s) => {
		const m = PARAM.exec(s)
		return m ? ':' + m[1] : s
	})

	return {
		name: segments.join('/') || 'index',
		params: segments.filter((s) => s.startsWith(':')).map((s) => s.slice(1)),
		presentation,
	}
}

/** Generates routes.gen.types.ts + platform manifest glue for a route dir.
 *  Returns the route count; false when no dir was given. A missing or empty
 *  dir still emits a valid (empty) gen — apps with only programmatic routes
 *  can import the stub types.
 *
 *  `opts.bake` (default true): execute `dataMode: 'baked'` routes' sibling
 *  `.loader.ts` modules and emit `<out>.data.ts`. Callers that only need
 *  the types (typecheck) pass false — an existing data module is left
 *  alone, a missing one gets an empty stub so imports resolve. */
export async function generateRoutes(cwd, dir, out, opts = {}) {
	if (!dir) {
		return false
	}

	const bake = opts.bake !== false

	// `out` is the module basename — shared types and target manifests are emitted:
	//   <out>.types.ts    shared types (RouteName/Params/Presentations)
	//   <out>.web.ts      web glob + registerRoutes
	//   <out>.mobile.ts  mobile glob + registerRoutes (Device.os prefer)
	//   <out>.macos.ts   AppKit glob + registerRoutes (macos prefer)
	//   <out>.windows.ts Windows glob + registerRoutes (windows prefer)
	// Importing '<out>' resolves the platform leaf automatically.
	const base = (out ?? join(dir, '..', 'routes.gen')).replace(/\.ts$/, '')

	// name → {params, presentation}; platform variants of one route
	// collapse to a single entry (union across platforms).
	const seen = new Map()
	const routePaths = []
	const layoutDirs = new Set()
	const files = existsSync(join(cwd, dir)) ? walk(join(cwd, dir)) : []
	for (const file of files) {
		const routePath = relative(join(cwd, dir), file).split(sep).join('/')
		if (LOADER_FILE.test(routePath)) {
			continue
		}

		const isMd = routePath.endsWith('.md')
		if (/\.(tsrx|tsx)$/.test(routePath)) {
			routePaths.push(routePath)
		}

		// _layout files aren't routes — record their dir for the manifest.
		const stemBase = routePath
			.replace(isMd ? /\.md$/ : EXT, '')
			.split('/')
			.pop()
			.replace(SUFFIX, '')
			.replace(PRESENT, '')

		if (stemBase === '_layout' && !isMd) {
			layoutDirs.add(routePath.split('/').slice(0, -1).join('/'))
			continue
		}

		const r = routeFor(routePath, isMd ? /\.md$/ : EXT)
		if (!r) {
			continue
		}

		r.file = routePath

		if (isMd) {
			// .md routes are baked by definition — the file's own parse is the
			// loader, run by codegen, not a module in any bundle.
			r.dataMode = 'baked'
			r.md = true
			if (r.params.length) {
				p.log.warn(
					`markdown route '${routePath}' declares a param — .md files bake one document; ` +
						`for param'd content use a [param] route + .loader.ts that bakes a table`,
				)

				continue
			}
		} else {
			// Hook + dataMode exports are source-greped, not evaluated —
			// codegen stays declarative over route modules it doesn't load.
			const src = readFileSync(file, 'utf8')
			const dm = DATAMODE.exec(src)
			if (dm) {
				r.dataMode = dm[1]
			}

			for (const m of src.matchAll(ROUTE_EXPORTS)) {
				r[m[1] === 'beforeLoad' ? 'guard' : m[1]] = true
			}
		}

		const prev = seen.get(r.name)
		if (!prev) {
			seen.set(r.name, r)
		} else if (r.md && !prev.md) {
			p.log.warn(
				`route '${r.name}' has both a component file and ${r.file} — keeping the component`,
			)
		} else if (prev.md && !r.md) {
			p.log.warn(
				`route '${r.name}' has both ${prev.file} and a component file — keeping the component`,
			)

			seen.set(r.name, r)
		} else if (r.dataMode && prev.dataMode && prev.dataMode !== r.dataMode) {
			p.log.warn(
				`route '${r.name}' declares dataMode '${prev.dataMode}' and '${r.dataMode}' in different leaves — keeping '${prev.dataMode}'`,
			)
		} else if (r.dataMode && !prev.dataMode) {
			prev.dataMode = r.dataMode
		}

		// Hook flags union across platform leaves — any variant declaring a
		// loader/guard/head counts for the shared manifest record.
		if (prev) {
			prev.loader ||= r.loader
			prev.guard ||= r.guard
			prev.head ||= r.head
		}
	}

	const list = [...seen.values()].sort((a, b) => a.name.localeCompare(b.name))

	const union = list.length ? list.map((r) => `\n\t| '${r.name}'`).join('') : 'never'

	const params = list.map(
		(r) => `\t'${r.name}': { ${r.params.map((k) => `${k}: string`).join('; ')} }`,
	)

	const presents = list
		.filter((r) => r.presentation)
		.map((r) => `\t'${r.name}': '${r.presentation}'`)

	const src = `// Generated by \`xplat routes\` — do not edit. Re-run after
// touching the route dir (add/remove/rename route files).
export type RouteName =${union}

export interface RouteParams {
${params.length ? params.join('\n') : '\t// no param routes'}
}

export interface RoutePresentations {
${presents.length ? presents.join('\n') : '\t// no +modal/+fade routes'}
}
`

	writeFileSync(join(cwd, base + '.types.ts'), src)

	// Route file minus ext, platform suffix, and +presentation — the stem a
	// `<stem>.loader.*` sibling pairs with.
	const stemFor = (rel) => {
		const parts = rel.replace(EXT, '').split('/')
		let base = parts[parts.length - 1]
		const sm = SUFFIX.exec(base)
		if (sm) {
			base = base.slice(0, base.length - sm[0].length)
		}

		const pm = PRESENT.exec(base)
		if (pm) {
			base = base.slice(0, base.length - pm[0].length)
		}

		parts[parts.length - 1] = base
		return parts.join('/')
	}

	// Baked routes get data at codegen: .md files parse in-process, the rest
	// take a sibling .loader.* run under ssrLoadModule — in both cases the
	// source's imports never enter a runtime bundle.
	const loaderFiles = new Map()
	const mdRoutes = []
	for (const r of list) {
		if (r.dataMode !== 'baked') {
			continue
		}

		if (r.md) {
			mdRoutes.push(r)
			continue
		}

		const stem = stemFor(r.file)
		for (const ext of LOADER_EXTS) {
			const candidate = join(cwd, dir, `${stem}.loader.${ext}`)
			if (existsSync(candidate)) {
				loaderFiles.set(r.name, candidate)
				break
			}
		}

		if (!loaderFiles.has(r.name)) {
			throw new Error(
				`baked route '${r.name}' (${r.file}) has no loader sibling — ` +
					`expected ${dir}/${stem}.loader.{${LOADER_EXTS.join(',')}}`,
			)
		}
	}

	const needsBake = loaderFiles.size > 0 || mdRoutes.length > 0
	const dataFile = join(cwd, base + '.data.ts')
	const dataSrc = (data) => `// Generated by \`xplat routes\` — baked loader results.
// Re-run \`xplat routes\` (or dev/build) after touching *.loader.* or .md routes.
export const bakedRouteData: Record<string, unknown> = ${JSON.stringify(data, null, '\t')}
`

	if (needsBake && bake) {
		const data = {}
		for (const r of mdRoutes) {
			data[r.name] = assertSerializable(
				mdToDoc(readFileSync(join(cwd, dir, r.file), 'utf8')),
				r.name,
			)
		}

		if (loaderFiles.size) {
			Object.assign(data, await bakeRouteData(cwd, loaderFiles))
		}

		writeFileSync(dataFile, dataSrc(data))
	} else if (!needsBake || !existsSync(dataFile)) {
		// No baked routes — drop stale data; or a bake-skipped run
		// (typecheck) writing just the stub so imports resolve.
		writeFileSync(dataFile, dataSrc({}))
	}

	// routes.gen.manifest.json — the normalized route list a host consumes
	// (RouteManifestJson shape; manifestToJson produces it for programmatic
	// manifests). Same fields either way.
	const chainDirs = (name) => {
		const segs = name.split('/')
		const dirs = layoutDirs.has('') ? [''] : []
		for (let i = 1; i < segs.length; i++) {
			const d = segs.slice(0, i).join('/')
			if (layoutDirs.has(d)) {
				dirs.push(d)
			}
		}

		return dirs
	}

	const manifestJson = {
		version: 1,
		layouts: [...layoutDirs].sort(),
		screens: list.map((r) => r.name).sort(),
		routes: list.map((r) => ({
			name: r.name,
			path: r.name === 'index' ? '' : r.name,
			params: r.params,
			...(r.presentation ? { presentation: r.presentation } : {}),
			...(r.dataMode ? { dataMode: r.dataMode } : {}),
			layouts: chainDirs(r.name),
			source: `${dir}/${r.file}`,
			loader: !!(r.loader || r.md || loaderFiles.has(r.name)),
			guard: !!r.guard,
			head: !!r.head,
		})),
	}

	writeFileSync(join(cwd, base + '.manifest.json'), JSON.stringify(manifestJson, null, '\t') + '\n')

	// Platform-suffixed twins carry the actual manifest derivation +
	// registration — routes.gen.web.ts / routes.gen.mobile.ts resolve
	// through the platform extension chain, so importing './routes.gen'
	// gets the right glob for the platform with no app-side leaf file.
	// Types live in '.types.ts' — './routes.gen' inside a .web.ts sibling
	// would self-resolve.
	const outDir = join(cwd, base, '..')
	const rel = relative(outDir, join(cwd, dir)).split(sep).join('/')
	const globDir = rel.startsWith('.') ? rel : './' + rel
	const baseName = base.split('/').pop()
	const typesRef = `export type { RouteName, RouteParams, RoutePresentations } from './${baseName}.types'`
	const platformSuffix = /\.(web|mobile|ios|android|macos|windows|linux)\.(tsrx|tsx)$/
	const specializedPaths = new Map()
	for (const path of routePaths) {
		const match = platformSuffix.exec(path)
		if (!match) {
			continue
		}

		const plainPath = path.slice(0, -match[0].length) + `.${match[2]}`
		const paths = specializedPaths.get(match[1]) ?? new Set()
		paths.add(plainPath)
		specializedPaths.set(match[1], paths)
	}

	const plainPaths = routePaths.filter((path) => !platformSuffix.test(path))
	const globLiteral = (path) => path.replace(/[\\*?{}()!@+[\]]/g, '\\$&')
	const exactExclusions = (suffix) => {
		const specialized = specializedPaths.get(suffix)
		return [...(specialized ?? [])]
			.filter((path) => plainPaths.includes(path))
			.map((path) => `\t\t'!${globDir}/${globLiteral(path)}'`)
	}

	// Markdown routes become baked programmatic specs — the AST rides
	// bakedRouteData, the screen is the shared <MarkdownScreen>. Emitted
	// only when .md files exist so plain apps' gen files don't churn.
	const mdGlue = mdRoutes.length
		? `const mdRoutes = defineRoutes({
	routes: [
${mdRoutes
	.map(
		(s) =>
			`\t\t{ path: '${s.name}', screen: MarkdownScreen, dataMode: 'baked', source: '${dir}/${s.file}' },`,
	)
	.join('\n')}
	],
	baked: bakedRouteData,
})
const manifest = mergeRouteManifests(routes, mdRoutes)
registerRoutes(manifest)
export const screens = manifest.screens
`
		: `registerRoutes(routes)
export const screens = routes.screens
`

	const shared = (prelude, globs, prefer) => `// Generated by \`xplat routes\` — do not edit.
${prelude}import { deriveRouteManifest, registerRoutes } from '@octane-xplat/ui'
import { bakedRouteData } from './${baseName}.data'
${mdRoutes.length ? "import { defineRoutes, mergeRouteManifests, MarkdownScreen } from '@octane-xplat/ui'\n" : ''}${typesRef}

const files = import.meta.glob(
	[
		'${globDir}/**/*.{tsrx,tsx}',
${globs}
	],
	{ eager: true },
)

export const routes = deriveRouteManifest(files, ${prefer})
// Baked loader results ride the manifest — 'baked' route metas resolve
// against it at push time instead of running a loader.
routes.baked = bakedRouteData
${mdGlue}`

	writeFileSync(
		join(cwd, base + '.web.ts'),
		shared(
			'',
			[
				`\t\t'!${globDir}/**/*.mobile.{tsrx,tsx}'`,
				`\t\t'!${globDir}/**/*.ios.{tsrx,tsx}'`,
				`\t\t'!${globDir}/**/*.android.{tsrx,tsx}'`,
				`\t\t'!${globDir}/**/*.macos.{tsrx,tsx}'`,
				`\t\t'!${globDir}/**/*.windows.{tsrx,tsx}'`,
				`\t\t'!${globDir}/**/*.linux.{tsrx,tsx}'`,
				...exactExclusions('web'),
			].join(',\n'),
			`['web']`,
		),
	)

	writeFileSync(
		join(cwd, base + '.mobile.ts'),
		shared(
			`import { Device } from '@nativescript/core'\n`,
			[
				`\t\t'!${globDir}/**/*.web.{tsrx,tsx}'`,
				`\t\t'!${globDir}/**/*.macos.{tsrx,tsx}'`,
				`\t\t'!${globDir}/**/*.windows.{tsrx,tsx}'`,
				`\t\t'!${globDir}/**/*.linux.{tsrx,tsx}'`,
			].join(',\n'),
			`Device.os === 'Android' ? ['android', 'mobile'] : ['ios', 'mobile']`,
		),
	)

	writeFileSync(
		join(cwd, base + '.macos.ts'),
		shared(
			'',
			[
				`\t\t'!${globDir}/**/*.web.{tsrx,tsx}'`,
				`\t\t'!${globDir}/**/*.ios.{tsrx,tsx}'`,
				`\t\t'!${globDir}/**/*.android.{tsrx,tsx}'`,
				`\t\t'!${globDir}/**/*.mobile.{tsrx,tsx}'`,
				`\t\t'!${globDir}/**/*.windows.{tsrx,tsx}'`,
				`\t\t'!${globDir}/**/*.linux.{tsrx,tsx}'`,
				...exactExclusions('macos'),
			].join(',\n'),
			`['macos']`,
		),
	)

	writeFileSync(
		join(cwd, base + '.windows.ts'),
		shared(
			'',
			[
				`\t\t'!${globDir}/**/*.web.{tsrx,tsx}'`,
				`\t\t'!${globDir}/**/*.ios.{tsrx,tsx}'`,
				`\t\t'!${globDir}/**/*.android.{tsrx,tsx}'`,
				`\t\t'!${globDir}/**/*.mobile.{tsrx,tsx}'`,
				`\t\t'!${globDir}/**/*.macos.{tsrx,tsx}'`,
				`\t\t'!${globDir}/**/*.linux.{tsrx,tsx}'`,
				...exactExclusions('windows'),
			].join(',\n'),
			`['windows']`,
		),
	)

	return list.length
}

export const routes = command({
	name: 'routes',
	description: 'Generate routes.gen.ts (typed RouteName/params) from the route dir',
	args: {
		dir: option({
			long: 'dir',
			short: 'd',
			type: optional(string),
			description: 'Route dir — default: first of ./app, ./src/app',
		}),
		out: option({
			long: 'out',
			short: 'o',
			type: optional(string),
			description: 'Output file — default: <route dir>/../routes.gen.ts',
		}),
	},
	handler: async (args) => {
		const cwd = process.cwd()
		const dir = args.dir ?? ['app', 'src/app'].find((d) => existsSync(join(cwd, d)))
		if (!dir) {
			p.log.error('No route dir found — expected ./app or ./src/app (or pass --dir).')
			process.exit(1)
		}

		const count = await generateRoutes(cwd, dir, args.out)
		p.log.success(
			`Wrote routes.gen.{types,data,manifest.json,web,mobile,macos,windows} — ${count} route${count === 1 ? '' : 's'}`,
		)
	},
})
