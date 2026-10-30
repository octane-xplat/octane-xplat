import { readFileSync, readdirSync, existsSync, statSync, writeFileSync } from 'node:fs'
import { resolve, dirname, relative, join } from 'node:path'
import { createRequire } from 'node:module'
import { execFileSync } from 'node:child_process'

// Run from the repository root after pnpm install. Static inspection only.
const root = process.cwd()
const require = createRequire(join(root, 'packages/cli/package.json'))
const { parseModule } = await import(require.resolve('@tsrx/core'))
const targets = ['web', 'windows', 'macos', 'gtk']
const conditions = {
	web: ['web', 'import', 'default'],
	windows: ['module', 'react-native', 'import', 'browser', 'default', 'native'],
	macos: ['macos', 'native', 'import', 'default'],
	gtk: ['gtk', 'native', 'import', 'default'],
}

const ext = (t) =>
	t === 'gtk'
		? [
				'.gtk.tsrx',
				'.tsrx',
				'.gtk.tsx',
				'.tsx',
				'.gtk.ts',
				'.gtk.mts',
				'.gtk.mjs',
				'.mjs',
				'.mts',
				'.ts',
				'.jsx',
				'.js',
				'.json',
			]
		: [
				`.${t}.tsrx`,
				'.tsrx',
				`.${t}.tsx`,
				'.tsx',
				`.${t}.ts`,
				'.ts',
				`.${t}.js`,
				'.mts',
				'.mjs',
				'.jsx',
				'.js',
				'.json',
			]

const pkgs = new Map()
for (const dir of readdirSync('packages')) {
	const path = `packages/${dir}/package.json`
	if (!existsSync(path)) {
		continue
	}

	const p = JSON.parse(readFileSync(path, 'utf8'))
	if (p.private && p.name !== '@octane-xplat/linux-gtk') {
		continue
	}

	pkgs.set(p.name, { ...p, dir: `packages/${dir}` })
}

const cache = new Map(),
	exportsCache = new Map(),
	problems = [],
	parserFallbacks = []

const walk = (dir) =>
	!existsSync(dir)
		? []
		: readdirSync(dir, { withFileTypes: true }).flatMap((d) =>
				d.isDirectory() ? walk(join(dir, d.name)) : [join(dir, d.name)],
			)

const file = (p) => existsSync(p) && statSync(p).isFile()
function sourcePath(path) {
	if (path.includes('/dist/')) {
		const base = path.replace('/dist/', '/src/').replace(/\.[cm]?js$/, '')
		for (const suffix of ['.ts', '.tsx', '.tsrx', '.mts', '.mjs', '.js']) {
			if (file(base + suffix)) {
				return base + suffix
			}
		}
	}
	return path
}

function choose(value, t) {
	if (typeof value === 'string' || value === null) {
		return value
	}
	if (Array.isArray(value)) {
		return value.map((x) => choose(x, t)).find((x) => x)
	}
	for (const [k, v] of Object.entries(value ?? {})) {
		if (conditions[t].includes(k)) {
			const r = choose(v, t)
			if (r !== undefined) {
				return r
			}
		}
	}
}

function packageEntry(p, sub, t) {
	let value = p.exports
	if (value && typeof value === 'object' && Object.keys(value).some((k) => k.startsWith('.'))) {
		value = value[sub]
		if (value === undefined) {
			const patterns = Object.keys(p.exports)
				.filter((k) => k.includes('*'))
				.sort((a, b) => b.indexOf('*') - a.indexOf('*') || b.length - a.length)

			for (const pattern of patterns) {
				const [pre, post] = pattern.split('*')
				if (sub.startsWith(pre) && sub.endsWith(post)) {
					const match = sub.slice(pre.length, post ? -post.length : undefined)
					const selected = choose(p.exports[pattern], t)
					return selected ? sourcePath(join(p.dir, selected.replaceAll('*', match))) : null
				}
			}
		}
	}
	const selected = choose(value, t)
	return selected ? sourcePath(join(p.dir, selected)) : null
}

function resolveModule(spec, from, t) {
	if (!spec.startsWith('.')) {
		const name = spec.startsWith('@') ? spec.split('/').slice(0, 2).join('/') : spec.split('/')[0]
		const p = pkgs.get(name)
		if (!p) {
			return { external: spec }
		}

		const path = packageEntry(p, spec === name ? '.' : '.' + spec.slice(name.length), t)
		return path ? resolveLocal(path, t) : { missing: spec }
	}
	return resolveLocal(join(dirname(from), spec), t)
}

function resolveLocal(base, t) {
	// Explicit extensions and explicit platform basenames remain explicit.
	if (file(base)) {
		return { file: base }
	}
	if (/\.[cm]?js$/.test(base)) {
		for (const suffix of ['.ts', '.tsx', '.mts']) {
			const candidate = base.replace(/\.[cm]?js$/, suffix)
			if (file(candidate)) {
				return { file: candidate }
			}
		}
	}
	for (const suffix of ext(t)) {
		if (file(base + suffix)) {
			return { file: base + suffix }
		}
	}
	for (const suffix of ext(t)) {
		if (file(join(base, 'index' + suffix))) {
			return { file: join(base, 'index' + suffix) }
		}
	}
	return { missing: base }
}

function names(n) {
	if (!n) {
		return []
	}
	if (n.type === 'Identifier') {
		return [n.name]
	}
	if (n.type === 'ObjectPattern') {
		return n.properties.flatMap((p) => names(p.value ?? p.argument))
	}
	if (n.type === 'ArrayPattern') {
		return n.elements.flatMap(names)
	}
	return names(n.left ?? n.argument)
}

function read(path) {
	if (cache.has(path)) {
		return cache.get(path)
	}
	const text = readFileSync(path, 'utf8').replace(/^#![^\n]*/, (m) => ' '.repeat(m.length))
	const info = { path, text, exports: [], locals: new Map(), imports: [], types: [], signals: [] }
	cache.set(path, info)
	if (!/\.(?:[cm]?[jt]s|[jt]sx|tsrx)$/.test(path)) {
		return info
	}
	let ast
	try {
		ast = parseModule(text, path)
	} catch (e) {
		// TSRX can mistake regex '<' tokens for markup in ordinary TS. Use the
		// TypeScript AST to mask regex literals only, preserving source offsets.
		try {
			if (!/\.[cm]?ts$/.test(path)) {
				throw e
			}

			const ts = createRequire(join(root, 'package.json'))('typescript')
			const tree = ts.createSourceFile(path, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
			if (tree.parseDiagnostics.length) {
				throw e
			}

			const spans = []
			const visit = (n) => {
				if (n.kind === ts.SyntaxKind.RegularExpressionLiteral) {
					spans.push([n.getStart(tree), n.end])
				}
				ts.forEachChild(n, visit)
			}

			visit(tree)
			let masked = text
			for (const [start, end] of spans.sort((a, b) => b[0] - a[0])) {
				masked =
					masked.slice(0, start) +
					'0' +
					masked.slice(start + 1, end).replace(/[^\n\r]/g, ' ') +
					masked.slice(end)
			}

			ast = parseModule(masked, path)
			parserFallbacks.push({
				path,
				reason: 'Regex literals masked using TypeScript AST; original source offsets retained',
			})
		} catch {
			problems.push({ path, error: String(e.message).slice(0, 250) })
			return info
		}
	}
	const declare = (n) => {
		if (!n) {
			return
		}
		const typeOnly = n.declare || /^TS(?:Interface|TypeAlias|DeclareFunction)/.test(n.type)
		const ns =
			n.type === 'VariableDeclaration' ? n.declarations.flatMap((d) => names(d.id)) : names(n.id)
		for (const name of ns) {
			info.locals.set(name, {
				name,
				file: path,
				line: n.loc.start.line,
				endLine: n.loc.end.line,
				typeOnly: !!typeOnly,
				kind: n.type,
				code: text.slice(n.start, n.end),
			})
		}
	}
	for (const n of ast.body) {
		if (n.type === 'ImportDeclaration') {
			if (n.importKind === 'type') {
				continue
			}

			const specs = n.specifiers.filter((s) => s.importKind !== 'type')
			if (n.specifiers.length && !specs.length) {
				continue
			}

			info.imports.push({
				spec: n.source.value,
				names: specs.map(
					(s) => s.imported?.name ?? (s.type === 'ImportDefaultSpecifier' ? 'default' : '*'),
				),
				line: n.loc.start.line,
			})

			for (const s of specs) {
				info.locals.set(s.local.name, {
					import: n.source.value,
					local: s.imported?.name ?? (s.type === 'ImportDefaultSpecifier' ? 'default' : '*'),
				})
			}
		} else if (n.type === 'ExportAllDeclaration') {
			info.exports.push({ star: true, spec: n.source.value, typeOnly: n.exportKind === 'type' })
		} else if (n.type === 'ExportNamedDeclaration') {
			if (n.declaration) {
				declare(n.declaration)
				const ns =
					n.declaration.type === 'VariableDeclaration'
						? n.declaration.declarations.flatMap((d) => names(d.id))
						: names(n.declaration.id)

				for (const name of ns) {
					info.exports.push({ name, local: name, typeOnly: n.exportKind === 'type' })
				}
			}

			for (const s of n.specifiers) {
				info.exports.push({
					name: s.exported?.name ?? s.exported?.value,
					local: s.local?.name ?? '*',
					spec: n.source?.value,
					typeOnly: n.exportKind === 'type' || s.exportKind === 'type',
				})
			}
		} else if (n.type === 'ExportDefaultDeclaration') {
			declare(n.declaration)
			info.exports.push({
				name: 'default',
				local: n.declaration.id?.name ?? n.declaration.name ?? 'default',
			})

			if (!info.locals.has('default')) {
				info.locals.set('default', {
					name: 'default',
					file: path,
					line: n.loc.start.line,
					endLine: n.loc.end.line,
					kind: n.declaration.type,
					code: text.slice(n.start, n.end),
				})
			}
		} else {
			declare(n)
		}
	}
	// Evidence candidates, not automatic claims that an entire module is unsupported.
	for (const [i, line] of text.split('\n').entries()) {
		if (
			/unsupported|not supported|not implemented|not wired|no-op|noop|stand-in|TODO|FIXME|isSupported:\s*false|supported:\s*false/.test(
				line,
			)
		) {
			info.signals.push({ line: i + 1, text: line.trim() })
		}
	}
	return info
}

function exportsOf(path, t, stack = new Set()) {
	const key = t + ':' + path
	if (exportsCache.has(key)) {
		return exportsCache.get(key)
	}
	if (stack.has(key)) {
		return new Map()
	}
	const next = new Set([...stack, key]),
		info = read(path),
		result = new Map()
	const follow = (spec, local) => {
		const r = resolveModule(spec, path, t)
		if (!r.file) {
			return { name: local, ...r, via: [path] }
		}
		if (local === '*') {
			return { name: '*', file: r.file, line: 1, kind: 'namespace', via: [path] }
		}
		const v = exportsOf(r.file, t, next).get(local)
		return v
			? { ...v, via: [path, ...(v.via ?? [])] }
			: { name: local, missingExport: local, file: r.file, via: [path] }
	}
	for (const e of info.exports) {
		if (e.typeOnly) {
			info.types.push(e.name ?? `*:${e.spec}`)
			continue
		}

		if (e.star) {
			const r = resolveModule(e.spec, path, t)
			if (r.file) {
				for (const [name, v] of exportsOf(r.file, t, next)) {
					if (name !== 'default' && !result.has(name)) {
						result.set(name, { ...v, via: [path, ...(v.via ?? [])] })
					}
				}
			} else {
				result.set(`*:${e.spec}`, { name: '*', ...r, via: [path] })
			}

			continue
		}

		let v = e.spec ? follow(e.spec, e.local) : info.locals.get(e.local)
		if (v?.import) {
			v = follow(v.import, v.local)
		}

		if (v?.typeOnly) {
			info.types.push(e.name)
			continue
		}

		result.set(e.name, {
			...(v ?? { missingLocal: e.local, file: path }),
			exportName: e.name,
			via: v?.via ?? [path],
		})
	}
	exportsCache.set(key, result)
	return result
}

const packageRows = [],
	rows = [],
	excluded = []

for (const p of pkgs.values()) {
	let entries =
		p.exports && typeof p.exports === 'object'
			? Object.keys(p.exports).filter((k) => k.startsWith('.'))
			: p.exports
				? ['.']
				: []

	if (!entries.length) {
		excluded.push({
			package: p.name,
			reason: 'No package exports map; CLI/bin/package artifact, not an app import surface',
			bin: p.bin ?? null,
		})

		continue
	}

	const patterns = entries.filter((k) => k.includes('*'))
	entries = entries.filter((k) => !k.includes('*'))
	// Wildcard modules are normalized by basename. Explicit platform aliases remain in the file list.
	const wildFiles = patterns.length
		? walk(p.dir + '/src').filter(
				(f) =>
					/\.(?:[cm]?[jt]s|[jt]sx|tsrx)$/.test(f) &&
					!f.includes('/types/') &&
					!/\.(test|spec|stories)\./.test(f) &&
					!f.endsWith('.d.ts'),
			)
		: []

	const wildModules = new Set(
		wildFiles.map(
			(f) =>
				'./' +
				relative(p.dir + '/src', f)
					.replace(/\.(?:[cm]?[jt]s|[jt]sx|tsrx)$/, '')
					.replace(/\.(web|mobile|ios|android|macos|windows|linux|gtk)$/, ''),
		),
	)

	for (const sub of wildModules) {
		if (!entries.includes(sub)) {
			entries.push(sub)
		}
	}

	packageRows.push({
		package: p.name,
		private: !!p.private,
		dir: p.dir,
		patterns,
		wildcardFiles: wildFiles,
		entrypoints: entries,
	})

	for (const sub of entries) {
		const byTarget = {}
		for (const t of targets) {
			const entry = packageEntry(p, sub, t)
			const resolved = entry ? resolveLocal(entry, t) : {}
			byTarget[t] = {
				entry: resolved.file ?? null,
				unresolved: entry && !resolved.file ? entry : null,
				exports: resolved.file
					? p.name === '@octane-xplat/platform' &&
						['./ios', './android', './macos', './windows'].includes(sub)
						? new Map([
								[
									'* (OS SDK bindings)',
									{ file: resolved.file, line: 1, kind: 'generated-sdk', via: [resolved.file] },
								],
							])
						: exportsOf(resolved.file, t)
					: new Map(),
			}
		}

		const symbols = new Set(targets.flatMap((t) => [...byTarget[t].exports.keys()]))
		if (!symbols.size) {
			rows.push({
				package: p.name,
				subpath: sub,
				symbol: null,
				targets: Object.fromEntries(
					targets
						.filter((t) => t !== 'web')
						.map((t) => [
							t,
							{
								entry: byTarget[t].entry,
								unresolved: byTarget[t].unresolved,
								status: byTarget[t].entry ? 'type-or-asset-only' : 'no-entry',
							},
						]),
				),
			})

			continue
		}

		for (const symbol of [...symbols].sort()) {
			const out = { package: p.name, subpath: sub, symbol, targets: {} }
			for (const t of targets.filter((t) => t !== 'web')) {
				const b = byTarget[t],
					e = b.exports.get(symbol)

				if (!e) {
					out.targets[t] = { entry: b.entry, status: b.entry ? 'not-exported' : 'no-entry' }
					continue
				}

				const { code, typeOnly, exportName, name, via, ...rest } = e
				out.targets[t] = {
					entry: b.entry,
					...rest,
					status:
						e.missing || e.missingExport || e.missingLocal
							? 'unresolved-export'
							: e.external
								? 'external-forward'
								: 'source-present',
					via: [...new Set(via ?? [])],
					signature: code?.split('\n')[0],
					propsRead: code
						? [
								...new Set([...code.matchAll(/\bprops\??\.([A-Za-z_$][\w$]*)/g)].map((m) => m[1])),
							].sort()
						: [],
					signals: e.file
						? read(e.file).signals.filter((s) => s.line >= e.line && s.line <= e.endLine)
						: [],
				}
			}

			rows.push(out)
		}
	}
}

// Static dependency inventory. Never import application code or execute a backend.
const dependencyGraphs = {}
for (const t of targets.filter((t) => t !== 'web')) {
	const graph = {}
	function visit(path) {
		if (graph[path]) {
			return
		}
		const info = read(path)
		const edges = [
			...info.imports,
			...info.exports
				.filter((e) => e.spec && !e.typeOnly)
				.map((e) => ({ spec: e.spec, names: e.star ? ['*'] : [e.local] })),
		]
		graph[path] = []
		if (path.includes('/types/')) {
			return
		}
		for (const edge of edges) {
			let r
			if (edge.spec === '@nativescript/core' && t !== 'windows') {
				r = {
					file:
						t === 'macos'
							? 'packages/macos-renderer/src/native-core-shim.ts'
							: 'packages/linux-gtk-renderer/src/native-core-shim.ts',
				}
			} else if (edge.spec === './escape-props' && t !== 'windows') {
				r = { external: `${t}:compat/escape-props` }
			} else if (
				edge.spec === '@nativescript-community/octane' ||
				edge.spec === 'octane' ||
				edge.spec.startsWith('octane/')
			) {
				r = { external: edge.spec }
			} else {
				r = resolveModule(edge.spec, path, t)
			}

			const record = { ...edge, ...r }
			if (r.file) {
				const tag = r.file.match(/\.(web|mobile|ios|android|macos|windows|linux|gtk)\.[^./]+$/)?.[1]
				if (tag && tag !== t) {
					record.foreign = tag
				}

				if (edge.spec === '@nativescript/core' && t !== 'windows') {
					const available = exportsOf(r.file, t)
					const missing = (edge.names ?? []).filter((n) => n !== '*' && !available.has(n))
					if (missing.length) {
						record.missingShimExports = missing
					}
				}

				if (file(r.file)) {
					visit(r.file)
				}
			}

			graph[path].push(record)
		}
	}

	for (const r of rows) {
		const v = r.targets[t]
		for (const f of [v.entry, v.file, ...(v.via ?? [])]) {
			if (f && file(f)) {
				visit(f)
			}
		}
	}

	dependencyGraphs[t] = graph
}

const files = {}
for (const [path, info] of cache) {
	files[path] = {
		exports: [
			...new Set(info.exports.filter((e) => !e.typeOnly).map((e) => e.name ?? `*:${e.spec}`)),
		],
		typeExports: [...new Set(info.types)].sort(),
		imports: info.imports,
		signals: info.signals,
	}
}

const output = {
	revision: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
	conditions,
	packages: packageRows,
	excluded,
	parseErrors: problems,
	parserFallbacks,
	rows,
	files,
	dependencyGraphs,
}

writeFileSync(
	process.argv[2] ?? 'research/desktop-audit/inventory.json',
	JSON.stringify(output, null, 2) + '\n',
)

console.log(
	JSON.stringify(
		{
			packages: packageRows.length,
			entries: packageRows.reduce((n, p) => n + p.entrypoints.length, 0),
			rows: rows.length,
			files: cache.size,
			parseErrors: problems.length,
			statuses: Object.fromEntries(
				['windows', 'macos', 'gtk'].map((t) => [
					t,
					rows.reduce(
						(s, r) => ((s[r.targets[t].status] = (s[r.targets[t].status] ?? 0) + 1), s),
						{},
					),
				]),
			),
		},
		null,
		2,
	),
)
