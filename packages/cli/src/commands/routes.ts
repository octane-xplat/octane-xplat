// @ts-nocheck — .mjs→.ts port: annotations pending (transitional)
import { command, flag, option, optional, string } from '@alloc/cmd-ts'
import { parseModule } from '@tsrx/core'
import {
	existsSync,
	openSync,
	closeSync,
	readFileSync,
	readdirSync,
	realpathSync,
	mkdirSync,
	renameSync,
	rmSync,
	statSync,
	writeFileSync,
} from 'node:fs'

import { createRequire } from 'node:module'
import { basename, join, relative, sep } from 'node:path'
import { pathToFileURL } from 'node:url'
import * as p from '@clack/prompts'
import { mdToDoc } from '../markdown.ts'
import { assertRouteDataJson } from '../route-data.ts'
import { loadRoutingConfig } from '../route-config.ts'
import { createRouteWatcher } from '../route-watch.ts'
import {
	normalizeRouteSegment as normSegment,
	routeParamName as segmentParam,
} from '@octane-xplat/lib/route-pattern'

// Mirror of packages/ui/src/routing/route-table.ts conventions — the CLI walks the
// route dir off disk (no vite glob), so the derivation is re-implemented
// here. Keep the two in sync: same suffix strip order, same index/_layout
// rules. All platform variants count — the union is cross-platform.
const EXT = /\.(tsrx|tsx|ts|mts|cts|js|mjs|cjs|jsx)$/
const SUFFIX = /\.(web|mobile|ios|android|macos|windows|linux)$/
const PRESENT = /\+(modal|fade|push)$/
// Build-time loader modules — `<route>.loader.ts` pairs with a
// `dataMode: 'baked'` route; runs under vite ssrLoadModule during codegen
// and is never part of the runtime bundle.
const LOADER_FILE = /\.loader\.(ts|mts|cts|js|mjs|cjs)$/
const LOADER_EXTS = ['ts', 'mts', 'cts', 'js', 'mjs', 'cjs']

let generatedSequence = 0
function writeGeneratedFile(file, source) {
	if (existsSync(file) && readFileSync(file, 'utf8') === source) {
		return
	}
	// Rename complete files so a separate compiler never reads a truncated
	// declaration during watch mode. Preserve an existing output symlink.
	const target = existsSync(file) ? realpathSync(file) : file
	const temporary = `${target}.tmp-${process.pid}-${++generatedSequence}`
	const descriptor = openSync(temporary, 'wx')
	try {
		try {
			writeFileSync(descriptor, source)
		} finally {
			closeSync(descriptor)
		}

		renameSync(temporary, target)
	} finally {
		rmSync(temporary, { force: true })
	}
}

/** Inspect source, never imports/effects. Type-only exports and comments do not
 * advertise runtime capabilities. Static build mode must be locally knowable. */
function routeSourceMetadata(source, file) {
	const ast = parseModule(source, file)
	const bindings = new Map()
	const exported = new Map()
	const declare = (node, isExported) => {
		if (!node || node.declare) {
			return
		}
		if (node.type === 'VariableDeclaration') {
			const names = (pattern) => {
				if (pattern.type === 'Identifier') {
					return [pattern.name]
				}
				if (pattern.type === 'ObjectPattern') {
					return pattern.properties.flatMap((property) =>
						names(property.value ?? property.argument),
					)
				}
				if (pattern.type === 'ArrayPattern') {
					return pattern.elements.filter(Boolean).flatMap(names)
				}
				if (pattern.type === 'AssignmentPattern') {
					return names(pattern.left)
				}
				if (pattern.type === 'RestElement') {
					return names(pattern.argument)
				}
				return []
			}

			for (const entry of node.declarations) {
				for (const name of names(entry.id)) {
					bindings.set(name, {
						value: entry.id.type === 'Identifier' && node.kind === 'const' ? entry.init : undefined,
					})

					if (isExported) {
						exported.set(name, name)
					}
				}
			}
		} else if (node.type === 'FunctionDeclaration' || node.type === 'ClassDeclaration') {
			if (isExported && node.id) {
				exported.set(node.id.name, node.id.name)
			}
		}
	}
	for (const node of ast.body) {
		if (node.type === 'ExportAllDeclaration' && node.exportKind !== 'type') {
			throw new Error(
				`route/source-exports: ${file}: use explicit named exports instead of export * so route capabilities can be discovered without executing modules`,
			)
		}

		if (node.type !== 'ExportNamedDeclaration') {
			declare(node, false)
			continue
		}

		if (node.exportKind === 'type') {
			continue
		}

		declare(node.declaration, true)
		for (const specifier of node.specifiers ?? []) {
			if (specifier.exportKind !== 'type') {
				exported.set(
					specifier.exported.name ?? specifier.exported.value,
					node.source ? undefined : specifier.local.name,
				)
			}
		}
	}
	const result = {}
	for (const [name, flag] of [
		['loader', 'loader'],
		['beforeLoad', 'guard'],
		['group', 'group'],
		['validateSearch', 'validateSearch'],
		['head', 'head'],
		['ErrorBoundary', 'errorBoundary'],
	]) {
		if (exported.has(name)) {
			result[flag] = true
		}
	}
	if (exported.has('dataMode')) {
		let value = bindings.get(exported.get('dataMode'))?.value
		const visited = new Set()
		while (value) {
			if (
				[
					'TSAsExpression',
					'TSSatisfiesExpression',
					'TSTypeAssertion',
					'ParenthesizedExpression',
				].includes(value.type)
			) {
				value = value.expression
			} else if (value.type === 'Identifier' && !visited.has(value.name)) {
				visited.add(value.name)
				value = bindings.get(value.name)?.value
			} else {
				break
			}
		}

		if (value?.type !== 'Literal' || !['baked', 'live'].includes(value.value)) {
			throw new Error(
				`route/invalid-data-mode: ${file}: dataMode must resolve to a local const literal 'baked' or 'live'; declare it in the route module instead of computing or importing it`,
			)
		}

		result.dataMode = value.value
	}
	return result
}

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
		const data = Object.create(null)
		for (const [name, file] of loaders) {
			const mod = await server.ssrLoadModule(file)
			const loader = mod?.loader ?? mod?.default
			if (typeof loader !== 'function') {
				throw new Error(
					`baked route '${name}' — ${relative(cwd, file)} must export a 'loader' function`,
				)
			}

			const value = await loader({})
			assertRouteDataJson(value, name, relative(cwd, file))
			data[name] = value
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
	const presentation = pm ? (pm[1] === 'fade' ? 'push' : pm[1]) : undefined
	const transition = pm?.[1] === 'fade' ? 'fade' : undefined
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

	const segments = segs.map(normSegment)

	return {
		name: segments.join('/') || 'index',
		segments,
		params: segments.flatMap((s) => segmentParam(s) ?? []),
		presentation,
		transition,
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
	opts.signal?.throwIfAborted()
	const outputs = new Map()
	const emit = (file, source) => outputs.set(file, source)
	const config = loadRoutingConfig(cwd)
	dir =
		dir ??
		config?.directory ??
		['app', 'src/app'].find((path) => existsSync(join(cwd, path))) ??
		(config ? 'src/app' : undefined)
	if (!dir) {
		return false
	}
	out = out ?? config?.out

	const bake = opts.bake !== false

	// `out` is the module basename — shared types and target manifests are emitted:
	//   <out>.contracts.ts  local inferred types, without ambient registration
	//   <out>.types.ts      application registration + compatible type re-exports
	//   <out>.web.ts      web client configuration
	//   <out>.ios.ts / .android.ts  OS-specific mobile graphs
	//   <out>.mobile.ts  shared mobile-only graph
	//   <out>.linux.ts   Linux graph with web fallback
	//   <out>.macos.ts   AppKit client configuration
	//   <out>.windows.ts Windows client configuration
	// Importing '<out>' resolves the platform leaf automatically.
	const base = (out ?? join(dir, '..', 'routes.gen')).replace(/\.ts$/, '')
	const outputDirectory = join(cwd, base, '..')
	mkdirSync(outputDirectory, { recursive: true })
	const moduleRef = (file) => {
		const value = relative(outputDirectory, file).split(sep).join('/')
		return value.startsWith('.') ? value : './' + value
	}
	const exportType = (ref) =>
		`typeof import(${JSON.stringify(moduleRef(join(cwd, ref.module)))})[${JSON.stringify(ref.export)}]`
	const contextType = config?.context
		? `RouteRootContext<${exportType(config.context)}>`
		: 'Record<string, unknown>'

	// name → {params, presentation}; platform variants of one route
	// collapse to a single entry (union across platforms).
	const seen = new Map()
	const variants = new Map()
	const routePaths = []
	const layoutDirs = new Set()
	const files = existsSync(join(cwd, dir))
		? walk(join(cwd, dir)).filter(
				(file) => /\.(tsx|tsrx|md)$/.test(file) && !file.startsWith(join(cwd, base) + '.'),
			)
		: []
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
			Object.assign(r, routeSourceMetadata(readFileSync(file, 'utf8'), relative(cwd, file)))
		}

		// Preserve each leaf before merging discovery flags into the canonical
		// record. Contract checking must see every module's own exports.
		if (!r.md) {
			const leaves = variants.get(r.name) ?? []
			leaves.push({ ...r })
			variants.set(r.name, leaves)
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
			prev.errorBoundary ||= r.errorBoundary
		}
	}

	const list = [...seen.values()].sort((a, b) => a.name.localeCompare(b.name))
	const patternNames = new Map()
	for (const route of list) {
		const shape = route.segments
			.map((segment) =>
				segmentParam(segment)
					? segment.startsWith('*')
						? '*'
						: segment.endsWith('?')
							? ':?'
							: ':'
					: segment,
			)
			.join('/')

		const previous = patternNames.get(shape)
		if (previous && previous.name !== route.name) {
			throw new Error(
				`route/incompatible-platform-params: ${previous.file} and ${route.file} describe the same URL pattern with different parameter names; use the same bracket names across platform variants`,
			)
		}

		patternNames.set(shape, route)
	}

	const union = list.length ? list.map((r) => `\n\t| '${r.name}'`).join('') : 'never'

	// Optional params (':x?') and splats ('*', '*x') are `?` keys — a route
	// pushes without them; required params stay required.
	const paramField = (s) => {
		if (s.startsWith('*')) {
			const name = s.slice(1) || '*'
			return `'${name}'?: string`
		}

		const name = s.slice(1)
		return s.endsWith('?') ? `${name.slice(0, -1)}?: string` : `${name}: string`
	}

	const params = list.map(
		(r) =>
			`\t'${r.name}': { ${r.segments
				.filter((s) => s.startsWith(':') || s.startsWith('*'))
				.map(paramField)
				.join('; ')} }`,
	)

	const presents = list
		.filter((r) => r.presentation)
		.map((r) => `\t'${r.name}': '${r.presentation}'`)

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

	const targets = ['web', 'ios', 'android', 'mobile', 'macos', 'windows', 'linux']
	const platforms = new Map(
		list.map((r) => [
			r.name,
			targets.filter(
				(target) =>
					r.md ||
					(variants.get(r.name) ?? []).some((leaf) => {
						const suffix = /\.(web|mobile|ios|android|macos|windows|linux)\.(tsx|tsrx)$/.exec(
							leaf.file,
						)?.[1]
						return (
							!suffix ||
							suffix === target ||
							(suffix === 'web' && target === 'linux') ||
							(suffix === 'mobile' && (target === 'ios' || target === 'android'))
						)
					}),
			),
		]),
	)
	const contractEntries = list.map((r) => {
		const path = '/' + r.segments.join('/')
		const module = r.md
			? "{ dataMode: 'baked' }"
			: `typeof import(${JSON.stringify(moduleRef(join(cwd, dir, r.file)))})`
		const baked = r.md
			? "import('@octane-xplat/ui/markdown').MdDoc"
			: r.dataMode === 'baked'
				? `RouteBakedLoaderData<typeof import(${JSON.stringify(moduleRef(loaderFiles.get(r.name)))})>`
				: 'unknown'
		const platformOnly = platforms.get(r.name).length !== targets.length
		return `\t${JSON.stringify(path)}: FileRouteContract<${JSON.stringify(path)}, ${module}, RootContext${r.dataMode === 'baked' ? `, ${baked}` : ''}>${platformOnly ? ' & { readonly platformOnly: true }' : ''}`
	})
	const availability = list.map((r) => {
		const available = platforms.get(r.name)
		return `\t${JSON.stringify('/' + r.segments.join('/'))}: ${available.map((target) => JSON.stringify(target)).join(' | ')}`
	})
	const variantChecks = list.flatMap((r) =>
		(variants.get(r.name) ?? [])
			.filter((leaf) => leaf.file !== r.file)
			.map((leaf) => {
				const path = '/' + r.segments.join('/')
				const mod = `typeof import(${JSON.stringify(moduleRef(join(cwd, dir, leaf.file)))})`
				const baked =
					r.dataMode === 'baked'
						? `, RouteBakedLoaderData<typeof import(${JSON.stringify(moduleRef(loaderFiles.get(r.name)))})>`
						: ''
				const contract = `FileRouteContract<${JSON.stringify(path)}, ${mod}, RootContext${baked}>`
				return `\t// ${JSON.stringify(path)}: ${r.file} ↔ ${leaf.file}\n\tCheckRouteVariant<FileRouteContracts[${JSON.stringify(path)}], ${contract}>,\n\tCheckRouteVariant<${contract}, FileRouteContracts[${JSON.stringify(path)}]>,`
			}),
	)
	const exportChecks = [...variants.values()].flatMap((leaves) =>
		leaves.flatMap((leaf) =>
			[
				['loader', 'loader'],
				['beforeLoad', 'guard'],
				['group', 'group'],
				['validateSearch', 'validateSearch'],
				['head', 'head'],
				['ErrorBoundary', 'errorBoundary'],
			]
				.filter(([, flag]) => leaf[flag])
				.map(
					([field]) =>
						`\t// ${leaf.file}: ${field}\n\tCheckRouteExport<${JSON.stringify(field)}, typeof import(${JSON.stringify(moduleRef(join(cwd, dir, leaf.file)))})[${JSON.stringify(field)}]${field === 'validateSearch' ? `, import('@octane-xplat/ui/routing/core').RouteSearchValidationCheck<typeof import(${JSON.stringify(moduleRef(join(cwd, dir, leaf.file)))})[${JSON.stringify(field)}]>` : ''}>,`,
				),
		),
	)

	const src = `// Generated by \`xplat routes\` — do not edit. Re-run after
// touching the route dir (add/remove/rename route files).
import type { ContractsOf, FileRouteContract, RouteBakedLoaderData, FileRouteGuardArgs, FileRouteLoaderArgs, RouteScreenProps, RouteRootContext, MergeRouteContracts } from '@octane-xplat/ui/routing/core'

export type RootContext = ${contextType}
export interface FileRouteContracts {
${contractEntries.join('\n')}
}
export interface FileRouteAvailability {
${availability.join('\n')}
}
export type FileRouteContractsFor<Platform extends ${targets.map((target) => JSON.stringify(target)).join(' | ')}> = Pick<FileRouteContracts, {
 [Path in keyof FileRouteContracts]: Platform extends FileRouteAvailability[Path] ? Path : never
}[keyof FileRouteContracts]>
// Check both directions: every selected leaf must preserve the public contract.
${variantChecks.length ? "type CheckRouteVariant<Expected, Actual extends Omit<Expected, 'platformOnly'>> = Actual" : ''}
export type RouteVariantChecks = [
${variantChecks.join('\n')}
]
${
	exportChecks.length
		? `type RouteExportShapes = {
 group: import('@octane-xplat/ui/routing/core').RouteGroup<any, any> | undefined
 loader: ((...args: never[]) => unknown) | undefined
 beforeLoad: ((...args: never[]) => import('@octane-xplat/ui/routing/core').RouteGuardResult | Promise<import('@octane-xplat/ui/routing/core').RouteGuardResult>) | undefined
 validateSearch: (((...args: never[]) => import('@octane-xplat/ui/routing/core').RouteSearchRecord | Promise<import('@octane-xplat/ui/routing/core').RouteSearchRecord>) & { readonly '~standard'?: never }) | import('@octane-xplat/ui/routing/core').RouteSearchSchema<unknown, import('@octane-xplat/ui/routing/core').RouteSearchRecord> | undefined
 head: import('@octane-xplat/ui/routing/core').RouteHeadExport<any, any, any, any> | undefined
 ErrorBoundary: ((...args: never[]) => unknown) | undefined
}
type CheckRouteExport<Field extends keyof RouteExportShapes, Value extends RouteExportShapes[Field], SearchCheck extends true = true> = Value`
		: ''
}
export type RouteExportChecks = [
${exportChecks.join('\n')}
]
export type RouteContracts = MergeRouteContracts<[FileRouteContracts${(config?.manifests ?? []).map((ref) => `, ContractsOf<${exportType(ref)}>`).join('')}]>
export type RouteContractsFor<Platform extends ${targets.map((target) => JSON.stringify(target)).join(' | ')}> = MergeRouteContracts<[FileRouteContractsFor<Platform>${(config?.manifests ?? []).map((ref) => `, ContractsOf<${exportType(ref)}>`).join('')}]>
export type RouteProps<Path extends keyof FileRouteContracts> = RouteScreenProps<FileRouteContracts[Path]>
export type RouteHeadArgs<Path extends keyof FileRouteContracts> = RouteProps<Path>
${list
	.filter((r) => !r.md)
	.map((r) => {
		const path = '/' + r.segments.join('/')
		const mod = `typeof import(${JSON.stringify(moduleRef(join(cwd, dir, r.file)))})`
		return `type Guard_${list.indexOf(r)} = FileRouteGuardArgs<${JSON.stringify(path)}, ${mod}, RootContext>\ntype Loader_${list.indexOf(r)} = FileRouteLoaderArgs<${JSON.stringify(path)}, ${mod}, RootContext>`
	})
	.join('\n')}
export interface RouteGuardInputs {
${list
	.filter((r) => !r.md)
	.map((r) => `\t${JSON.stringify('/' + r.segments.join('/'))}: Guard_${list.indexOf(r)}`)
	.join('\n')}
}
export interface RouteLoaderInputs {
${list
	.filter((r) => !r.md)
	.map((r) => `\t${JSON.stringify('/' + r.segments.join('/'))}: Loader_${list.indexOf(r)}`)
	.join('\n')}
}

export type RouteGuardArgs<Path extends keyof RouteGuardInputs> = RouteGuardInputs[Path]
export type RouteLoaderArgs<Path extends keyof RouteLoaderInputs> = RouteLoaderInputs[Path]

export type RouteName =${union}

export interface RouteParams {
${params.length ? params.join('\n') : '\t// no param routes'}
}

export interface RoutePresentations {
${presents.length ? presents.join('\n') : '\t// no declared presentation defaults'}
}
`

	emit(join(cwd, base + '.contracts.ts'), src)
	const contractsRef = './' + basename(base) + '.contracts'
	const registration = `// Generated by \`xplat routes\` — do not edit.
// Application registration. Import .contracts for isolated/local type use.
import type {} from '@octane-xplat/ui'
import type { RouteContracts } from ${JSON.stringify(contractsRef)}
export type * from ${JSON.stringify(contractsRef)}
${config?.transitions ? `import type { TransitionNames } from '@octane-xplat/ui/routing/core'\ntype CustomTransitions = { [Key in TransitionNames<${exportType(config.transitions)}>]: unknown }\n` : ''}

// A module-local symbol keeps separately generated catalogs from overwriting
// each other's ambient contribution. This declaration has no runtime value.
declare const registration: unique symbol

// File and configured programmatic contracts share the same destination union.
declare module '@octane-xplat/ui' {
	interface AppRouteContracts {
		[registration]: RouteContracts
	}
	interface AppRouteStacks {
${(config?.stacks ?? []).map((stack) => `\t\t${JSON.stringify(stack)}: unknown`).join('\n')}
	}
${config?.transitions ? `\tinterface AppRouteTransitions extends CustomTransitions {}\n` : ''}}
`

	emit(join(cwd, base + '.types.ts'), registration)

	const needsBake = loaderFiles.size > 0 || mdRoutes.length > 0
	const dataFile = join(cwd, base + '.data.ts')
	const dataSrc = (data) => `// Generated by \`xplat routes\` — baked loader results.
// Re-run \`xplat routes\` (or dev/build) after touching *.loader.* or .md routes.
export const bakedRouteData: Record<string, unknown> = JSON.parse(${JSON.stringify(JSON.stringify(data))})
`

	if (needsBake && bake) {
		const data = Object.create(null)
		for (const r of mdRoutes) {
			const value = mdToDoc(readFileSync(join(cwd, dir, r.file), 'utf8'))
			assertRouteDataJson(value, r.name, `${dir}/${r.file}`)
			data[r.name] = value
		}

		if (loaderFiles.size) {
			Object.assign(data, await bakeRouteData(cwd, loaderFiles))
		}

		emit(dataFile, dataSrc(data))
	} else if (!needsBake || !existsSync(dataFile)) {
		// No baked routes — drop stale data; or a bake-skipped run
		// (typecheck) writing just the stub so imports resolve.
		emit(dataFile, dataSrc({}))
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
			platforms: platforms.get(r.name),
			path: r.name === 'index' ? '' : r.name,
			params: r.params,
			...(r.presentation ? { presentation: r.presentation } : {}),
			...(r.transition ? { transition: r.transition } : {}),
			...(r.dataMode ? { dataMode: r.dataMode } : {}),
			layouts: chainDirs(r.name),
			source: `${dir}/${r.file}`,
			loader: !!(r.loader || r.group || r.md || loaderFiles.has(r.name)),
			guard: !!(r.guard || r.group),
			head: !!r.head,
			errorBoundary: !!r.errorBoundary,
		})),
	}

	emit(join(cwd, base + '.manifest.json'), JSON.stringify(manifestJson, null, '\t') + '\n')

	// Platform-suffixed twins carry the actual manifest derivation +
	// registration — routes.gen.web.ts / routes.gen.mobile.ts resolve
	// through the platform extension chain, so importing './routes.gen'
	// gets the right glob for the platform with no app-side leaf file.
	// Local types live in '.contracts.ts' — './routes.gen' inside a .web.ts sibling
	// would self-resolve.
	const outDir = join(cwd, base, '..')
	const rel = relative(outDir, join(cwd, dir)).split(sep).join('/')
	const globDir = rel.startsWith('.') ? rel : './' + rel
	const baseName = basename(base)
	const typesRef = `export type { RouteName, RouteParams, RoutePresentations } from './${baseName}.contracts'`
	const platformSuffix = /\.(web|mobile|ios|android|macos|windows|linux)\.(tsrx|tsx)$/
	const globLiteral = (path) => path.replace(/[\\*?{}()!@+[\]]/g, '\\$&')
	const exactExclusions = (...preferences) => {
		const candidates = routePaths
			.map((path) => {
				const suffix = platformSuffix.exec(path)?.[1]
				const rank = suffix ? preferences.indexOf(suffix) : preferences.length
				const route = routeFor(path)
				const identity = route
					? 'route:' + route.name
					: 'layout:' + path.split('/').slice(0, -1).join('/')
				return { path, rank, identity }
			})
			.filter((file) => file.rank !== -1)
		const best = new Map()
		for (const file of candidates) {
			best.set(file.identity, Math.min(best.get(file.identity) ?? Infinity, file.rank))
		}
		return candidates
			.filter((file) => file.rank > best.get(file.identity))
			.map((file) => `\t\t'!${globDir}/${globLiteral(file.path)}'`)
	}

	// Markdown routes become baked programmatic specs — the AST rides
	// bakedRouteData, the screen is the shared <MarkdownScreen>. Emitted
	// only when .md files exist so plain apps' gen files don't churn.
	const mdGlue = mdRoutes.length
		? `const markdownRoutes = sealGeneratedRouteCatalog<FileRouteContracts>(defineRoutes({
	routes: [
${mdRoutes.map((s) => `\t\t{ path: ${JSON.stringify(s.name)}, screen: MarkdownScreen, dataMode: 'baked', source: ${JSON.stringify(`${dir}/${s.file}`)} },`).join('\n')}
	],
	baked: bakedRouteData,
}))
`
		: ''
	const manifestReferences = config?.manifests ?? []
	const manifestImports = manifestReferences
		.map(
			(ref, i) =>
				`import { ${ref.export} as configured${i} } from ${JSON.stringify(moduleRef(join(cwd, ref.module)))}`,
		)
		.join('\n')
	const catalogParts = [
		'fileRoutes',
		...(mdRoutes.length ? ['markdownRoutes'] : []),
		...manifestReferences.map((_, i) => `configured${i}`),
	]
	const shared = (
		prelude,
		globs,
		prefer,
		target,
	) => `// Generated by \`xplat routes\` — do not edit.
// Reusable definitions: importing this module does not install a default router.
${prelude}import { deriveLazyRouteManifest, defineRoutes, mergeRouteManifests, sealGeneratedRouteCatalog } from '@octane-xplat/ui/routing/core'
import { bakedRouteData } from './${baseName}.data'
import type { RouteCatalog } from '@octane-xplat/ui/routing/core'
import type { RouteContractsFor, FileRouteContractsFor } from './${baseName}.contracts'
type RouteContracts = RouteContractsFor<${JSON.stringify(target)}>
type FileRouteContracts = FileRouteContractsFor<${JSON.stringify(target)}>
${mdRoutes.length ? "import { MarkdownScreen } from '@octane-xplat/ui/markdown'\n" : ''}${manifestImports}
${typesRef}

const files = import.meta.glob(
	[
		'${globDir}/**/*.{tsrx,tsx}',
		'!${globDir}/**/_layout{,+push,+modal,+fade}{,.*}.{tsrx,tsx}',
${globs}
	],
)
const layouts = import.meta.glob(
	[
		'${globDir}/**/_layout{,+push,+modal,+fade}{,.*}.{tsrx,tsx}',
${globs}
	],
	{ eager: true },
)

const fileDefinitions = deriveLazyRouteManifest(files, ${prefer}, ${JSON.stringify(globDir)}, layouts, bakedRouteData)
const fileRoutes = sealGeneratedRouteCatalog<FileRouteContracts>(fileDefinitions, ${JSON.stringify(list.filter((route) => !route.md).map((route) => ({ name: route.name, segments: route.segments, params: route.params, file: `${dir}/${route.file}`, platforms: platforms.get(route.name) })))})
${mdGlue}
export const routes = mergeRouteManifests(${catalogParts.join(', ')}) as RouteCatalog<RouteContracts>
export const screens = routes.screens
`
	const writePlatform = (path, source) => {
		const catalogPath = path.replace(/\.([^.]+)\.ts$/, '.catalog.$1.ts')
		emit(catalogPath, source)
		const catalogRef = './' + catalogPath.split(sep).pop().replace(/\.ts$/, '')
		emit(
			path,
			`// Generated by \`xplat routes\` — do not edit.
import { configureRouter } from '@octane-xplat/ui/routing'
import type {} from './${baseName}.types'
import { routes } from ${JSON.stringify(catalogRef)}
${config?.context ? `import { ${config.context.export} as routeContext } from ${JSON.stringify(moduleRef(join(cwd, config.context.module)))}\n` : ''}${config?.transitions ? `import { ${config.transitions.export} as routeTransitions } from ${JSON.stringify(moduleRef(join(cwd, config.transitions.module)))}\n` : ''}export * from ${JSON.stringify(catalogRef)}
configureRouter({
	catalog: routes,
${config?.context ? '\tcontext: routeContext,\n' : ''}${config?.transitions ? '\ttransitions: routeTransitions,\n' : ''}${config?.stacks?.length ? `\tstacks: ${JSON.stringify(config.stacks)},\n` : ''}${[
				'base',
				'allowedOrigins',
				'allowedSchemes',
			]
				.filter((key) => config?.[key] !== undefined)
				.map((key) => `\t${key}: ${JSON.stringify(config[key])},\n`)
				.join('')}})
// import.meta.env.DEV is statically false in production builds — the
// router dev-actions chunk is never emitted. The cast keeps this file
// typechecking without vite/client ambient types.
if ((import.meta as unknown as { env: { DEV: boolean } }).env.DEV) {
\tvoid import('@octane-xplat/ui/routing/dev').then(({ registerRouterDevActions }) => registerRouterDevActions())
}
`,
		)
	}

	writePlatform(
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
			'web',
		),
	)

	// Separate OS catalogs prevent eager globs from evaluating the other OS's
	// modules before runtime preference filtering. The .mobile leaf is shared only.
	for (const target of ['ios', 'android', 'mobile', 'linux']) {
		const preferences =
			target === 'linux' ? ['linux', 'web'] : target === 'mobile' ? ['mobile'] : [target, 'mobile']

		const excluded = ['web', 'ios', 'android', 'mobile', 'macos', 'windows', 'linux'].filter(
			(suffix) => !preferences.includes(suffix),
		)

		writePlatform(
			join(cwd, base + '.' + target + '.ts'),
			shared(
				'',
				[
					...excluded.map((suffix) => `\t\t'!${globDir}/**/*.${suffix}.{tsrx,tsx}'`),
					...exactExclusions(...preferences),
				].join(',\n'),
				JSON.stringify(preferences),
				target,
			),
		)
	}

	writePlatform(
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
			'macos',
		),
	)

	writePlatform(
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
			'windows',
		),
	)

	opts.signal?.throwIfAborted()
	for (const [file, source] of outputs) {
		writeGeneratedFile(file, source)
	}
	return list.length
}

export const routes = command({
	name: 'routes',
	description: 'Generate routes.gen.ts (typed RouteName/params) from the route dir',
	args: {
		watch: flag({
			long: 'watch',
			short: 'w',
			description: 'Regenerate when route sources or configuration change',
		}),
		dir: option({
			long: 'dir',
			short: 'd',
			type: optional(string),
			description: 'Route dir — xplat.routes.json, otherwise ./app or ./src/app',
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
		if (args.watch) {
			const watcher = createRouteWatcher({
				cwd,
				directory: args.dir,
				out: args.out,
				generate: (signal, inputs) => generateRoutes(cwd, inputs.directory, inputs.out, { signal }),
				onGenerated(count) {
					if (count !== false) {
						process.exitCode = 0
						p.log.success(`Generated route contracts and platform catalogs — ${count} routes`)
					}
				},
				onError(error) {
					process.exitCode = 1
					p.log.error(String(error.message ?? error))
				},
			})

			const interrupt = () => {
				process.exitCode = 130
				void watcher.close()
			}

			const terminate = () => {
				process.exitCode = 143
				void watcher.close()
			}

			process.once('SIGINT', interrupt)
			process.once('SIGTERM', terminate)
			let count
			try {
				count = await watcher.ready
			} catch (error) {
				if (error.name === 'AbortError') {
					return
				}

				throw error
			}

			if (count === false) {
				await watcher.close()
				process.off('SIGINT', interrupt)
				process.off('SIGTERM', terminate)
				p.log.error('No route dir found — configure xplat.routes.json or pass --dir.')
				process.exitCode = 1
			} else {
				p.log.info('Watching route sources and xplat.routes.json — Ctrl+C stops watching')
			}

			return
		}
		const count = await generateRoutes(cwd, args.dir, args.out)
		if (count === false) {
			p.log.error(
				'No route dir found — expected ./app, ./src/app, or xplat.routes.json (or pass --dir).',
			)

			process.exit(1)
		}

		p.log.success(
			`Generated route contracts and platform catalogs — ${count} route${count === 1 ? '' : 's'}`,
		)
	},
})
