#!/usr/bin/env node
// Transform the generated macOS SDK ambient decls (packages/macos-renderer/types)
// into module-scoped decls under platform/src/types/macos/. Each ambient file
// becomes a same-named module file: every top-level `declare` gains `export`,
// and identifiers the file uses that another SDK file declares become
// `import`/`import type` statements. Ambient runtime names (interop, objc,
// NativeObject, NativeClass, ...) resolve through src/types/macos/runtime.d.ts,
// generated from @nativescript/objc-node-api's `declare global` blocks.
//
// Output is ambient-free: any program can include it without global collision.
//
// Regenerate: pnpm --filter @octane-xplat/platform generate:native-types

import { createRequire } from 'node:module'
import { basename, dirname, join } from 'node:path'
import { readFileSync, writeFileSync, readdirSync, mkdirSync, rmSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'

const __dirname = dirname(fileURLToPath(import.meta.url))
const pkgDir = join(__dirname, '..')
const sdkSrc = join(pkgDir, '../macos-renderer/types')
const outDir = join(pkgDir, 'src/types/macos')
const require = createRequire(import.meta.url)

const BUILTINS = new Set([
	'string', 'number', 'boolean', 'object', 'symbol', 'bigint', 'unknown', 'any',
	'void', 'never', 'undefined', 'null', 'this', 'true', 'false',
	'Array', 'ArrayBuffer', 'ArrayBufferLike', 'Boolean', 'DataView', 'Date', 'Error',
	'Float32Array', 'Float64Array', 'Function', 'Int8Array', 'Int16Array', 'Int32Array',
	'Iterable', 'IterableIterator', 'Iterator', 'Map', 'Math', 'Number', 'Object',
	'Promise', 'PropertyKey', 'ReadonlyArray', 'Record', 'RegExp', 'Set', 'String',
	'Symbol', 'Uint8Array', 'Uint8ClampedArray', 'Uint16Array', 'Uint32Array',
	'WeakMap', 'WeakSet', 'Partial', 'Required', 'Pick', 'Omit', 'Exclude', 'Extract',
	'NonNullable', 'Parameters', 'ReturnType', 'InstanceType', 'ConstructorParameters',
	'ThisParameterType', 'OmitThisParameter', 'Awaited', 'CallableFunction',
	'NewableFunction', 'Uppercase', 'Lowercase', 'Capitalize', 'Uncapitalize',
	'unique', 'keyof', 'typeof', 'infer', 'extends', 'in', 'as', 'is', 'out', 'const',
	'globalThis', 'arguments', 'new', 'abstract', 'readonly', 'static', 'public',
	'private', 'protected', 'override', 'get', 'set', 'var', 'let', 'enum', 'import',
	'declare', 'namespace', 'module', 'interface', 'class', 'type', 'function',
])

// Ambient runtime globals provided by @nativescript/objc-node-api — emitted as
// `export` decls in runtime.d.ts so module files import them explicitly.
const RUNTIME_NAMES = new Set()

// ---------------------------------------------------------------------------
// 1. Collect top-level declaration names per file.
// ---------------------------------------------------------------------------

const unresolved = new Set()
const files = readdirSync(sdkSrc).filter((f) => f.endsWith('.d.ts'))
const decls = new Map() // file -> Map(name -> {type, value, _class}) — facets merge across statements
const owners = new Map() // name -> canonical owning file
const duplicates = new Map() // name -> [files]
const sources = new Map()

for (const file of files) {
	const text = readFileSync(join(sdkSrc, file), 'utf8')
	sources.set(file, text)
	const sf = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true)
	const names = new Map()
	for (const stmt of sf.statements) {
		for (const [n, kind] of stmtNames(stmt)) {
			const f = names.get(n) ?? { type: false, value: false, _class: false, kinds: new Set() }
			f.type = f.type || kind === 'class' || kind === 'interface' || kind === 'type' || kind === 'enum' || kind === 'module'
			f.value = f.value || kind === 'class' || kind === 'var' || kind === 'function' || kind === 'enum' || kind === 'module'
			f._class = f._class || kind === 'class'
			f.kinds.add(kind)
			names.set(n, f)
		}
	}
	decls.set(file, names)
	for (const name of names.keys()) {
		const prev = owners.get(name)
		if (prev && prev !== file) {
			duplicates.set(name, (duplicates.get(name) ?? [prev]).concat(file))
		}
		else {owners.set(name, file)}
	}
}

function stmtNames(stmt) {
	const out = []
	if (ts.isClassDeclaration(stmt) || ts.isInterfaceDeclaration(stmt) ||
		ts.isTypeAliasDeclaration(stmt) || ts.isEnumDeclaration(stmt) ||
		ts.isFunctionDeclaration(stmt)) {
		if (stmt.name) {out.push([stmt.name.text, ts.isClassDeclaration(stmt) ? 'class' : ts.isInterfaceDeclaration(stmt) ? 'interface' : ts.isTypeAliasDeclaration(stmt) ? 'type' : ts.isEnumDeclaration(stmt) ? 'enum' : 'function'])}
	}
	else if (ts.isVariableStatement(stmt)) {
		for (const d of stmt.declarationList.declarations) {
			if (ts.isIdentifier(d.name)) {out.push([d.name.text, 'var'])}
		}
	}
	else if (ts.isModuleDeclaration(stmt) && ts.isIdentifier(stmt.name)) {
		out.push([stmt.name.text, 'module'])
	}
	return out
}

// Cross-file duplicates (libc/gss/IO overlaps): the ambient merges them; a
// module tree can't. The alphabetically-first file keeps the declaration;
// others drop it at emission.
const dropped = new Map() // file -> Set(name)
for (const [name, candidates] of duplicates) {
	const keeper = candidates.sort()[0]
	for (const f of candidates) {
		if (f !== keeper) {
			if (!dropped.has(f)) {dropped.set(f, new Set())}
			dropped.get(f).add(name)
		}
	}
	owners.set(name, keeper)
}
if (duplicates.size) {
	console.warn(`cross-file duplicates (first file wins): ${duplicates.size}`)
}

// Value-facet kinds: a `typeof X` / class-extends use needs the value.
const VALUE_KINDS = new Set(['class', 'var', 'function', 'enum', 'module'])

// ---------------------------------------------------------------------------
// 2. Collect identifier usage per file → cross-file imports.
// ---------------------------------------------------------------------------

function collectUsage(sf) {
	const used = new Map() // name -> 'type' | 'value'
	const add = (name, kind) => {
		const prev = used.get(name)
		if (prev !== 'value') {used.set(name, kind)}
	}
	const local = new Set()
	// Type parameters are local — collect them before walking.
	const gatherLocals = (node) => {
		node.typeParameters?.forEach((p) => local.add(p.name.text))
		ts.forEachChild(node, gatherLocals)
	}
	gatherLocals(sf)

	const visit = (node) => {
		if (ts.isTypeReferenceNode(node)) {
			// Qualified name `interop.Pointer` — the type name is the rightmost
			// identifier; the qualifier root (`interop`) is the external ref.
			const n = node.typeName
			if (ts.isIdentifier(n)) {add(n.text, 'type')}
			else if (ts.isQualifiedName(n) && ts.isIdentifier(n.left)) {add(n.left.text, 'type')}
		}
		else if (ts.isTypeQueryNode(node)) {
			let e = node.exprName
			while (e && !ts.isIdentifier(e)) {e = e.left}
			if (e) {add(e.text, 'value')}
		}
		else if (ts.isExpressionWithTypeArguments(node)) {
			// `extends X` needs the value facet (constructor); `implements`/interface
			// extends are pure type positions.
			const isExtends = node.parent && ts.isHeritageClause(node.parent) && node.parent.token === ts.SyntaxKind.ExtendsKeyword && node.parent.parent && ts.isClassDeclaration(node.parent.parent)
			let e = node.expression
			while (e && !ts.isIdentifier(e)) {e = e.left}
			if (e) {add(e.text, isExtends ? 'value' : 'type')}
		}
		ts.forEachChild(node, visit)
	}
	visit(sf)
	for (const name of local) {used.delete(name)}
	for (const name of BUILTINS) {used.delete(name)}
	return used
}

// ---------------------------------------------------------------------------
// 3. Emit module-scoped runtime.d.ts from objc-node-api's `declare global`.
// ---------------------------------------------------------------------------

const objcApi = require.resolve('@nativescript/objc-node-api/index.d.ts', {
	paths: [join(pkgDir, '../macos-renderer')],
})
const apiText = readFileSync(objcApi, 'utf8')
const apiSf = ts.createSourceFile('index.d.ts', apiText, ts.ScriptTarget.Latest, true)

let globalBlock = null
for (const stmt of apiSf.statements) {
	if (ts.isModuleDeclaration(stmt) && stmt.name.text === 'global') {
		globalBlock = stmt
	}
}
// inline_functions.d.ts may add more globals — same treatment.
const inlineSrc = join(dirname(objcApi), 'inline_functions.d.ts')
const inlineText = readFileSync(inlineSrc, 'utf8')
const inlineSf = ts.createSourceFile('inline.d.ts', inlineText, ts.ScriptTarget.Latest, true)
const globalBlocks = [globalBlock]
for (const stmt of inlineSf.statements) {
	if (ts.isModuleDeclaration(stmt) && stmt.name.text === 'global') {
		globalBlocks.push(stmt)
	}
}

const runtimeLines = [
	'// Generated from @nativescript/objc-node-api ambient globals — module form.',
	'// Regenerate: pnpm --filter @octane-xplat/platform generate:native-types',
	'',
]
const runtimeExported = new Map()
const runtimeNsMembers = new Map() // namespace name -> [member names]
for (const block of globalBlocks) {
	if (!block?.body) {continue}
	const src = block.getSourceFile()
	for (const member of block.body.statements) {
		for (const [n, kind] of stmtNames(member)) {
			RUNTIME_NAMES.add(n)
			runtimeExported.set(n, kind)
			if (kind === 'module' && member.body && ts.isModuleBlock(member.body)) {
				runtimeNsMembers.set(n, member.body.statements.flatMap((m) => {
					const tp = m.typeParameters?.length
						? [
								`<${m.typeParameters.map((p) => p.getText(src)).join(', ')}>`,
								`<${m.typeParameters.map((p) => p.name.text).join(', ')}>`,
							]
						: null
					return stmtNames(m).map(([n2, k2]) => [n2, k2, tp])
				}))
			}
		}
		// `namespace objc` carries `export { importFramework as import }` — a
		// keyword member — which a module namespace can't declare. Emit it as a
		// `const` with an object type instead: `objc.import` stays callable.
		if (ts.isModuleDeclaration(member) && member.name.text === 'objc' && member.body && ts.isModuleBlock(member.body)) {
			const props = []
			for (const stmt of member.body.statements) {
				if (ts.isFunctionDeclaration(stmt) && stmt.name) {
					const tp = stmt.typeParameters?.length ? `<${stmt.typeParameters.map((p) => p.getText(src)).join(', ')}>` : ''
					const params = stmt.parameters.map((p) => p.getText(src)).join(', ')
					const ret = stmt.type ? `: ${stmt.type.getText(src)}` : ': void'
					props.push(`${stmt.name.text}${tp}(${params})${ret}`)
				}
				else if (ts.isExportDeclaration(stmt) && stmt.exportClause && ts.isNamedExports(stmt.exportClause)) {
					for (const el of stmt.exportClause.elements) {
						if (el.propertyName && el.name.text === 'import') {
							const fn = member.body.statements.find(
								(s) => ts.isFunctionDeclaration(s) && s.name?.text === el.propertyName.text,
							)
							if (fn) {
								const params = fn.parameters.map((p) => p.getText(src)).join(', ')
								const ret = fn.type ? `: ${fn.type.getText(src)}` : ': void'
								props.push(`import(${params})${ret}`)
							}
						}
					}
				}
			}
			runtimeLines.push(`export declare const objc: {\n\t${props.join('\n\t')}\n}`)
			continue
		}
		const text = member.getText(src).replace(/^declare\s+/, '')
		// `export {…}` statements inside declare global already carry `export`.
		runtimeLines.push(text.startsWith('export') ? text : `export ${text}`)
	}
}
const runtimeText = runtimeLines.join('\n\n') + '\n'
const runtimeSf = ts.createSourceFile('objc-runtime.d.ts', runtimeText, ts.ScriptTarget.Latest, true)
const runtimeUsed = collectUsage(runtimeSf)
const runtimeImports = []
for (const [name] of runtimeUsed) {
	const owner = owners.get(name)
	if (owner) {runtimeImports.push([owner.replace(/\.d\.ts$/, ''), name])}
}
if (runtimeImports.length) {
	const byFile = new Map()
	for (const [f, n] of runtimeImports) {
		if (!byFile.has(f)) {byFile.set(f, [])}
		byFile.get(f).push(n)
	}
	const header = [...byFile.entries()].sort().map(([f, n]) => `import { ${n.sort().join(', ')} } from './${f}'`)
	runtimeLines.splice(3, 0, ...header, '')
}
mkdirSync(outDir, { recursive: true })
writeFileSync(join(outDir, 'objc-runtime.d.ts'), runtimeLines.join('\n\n') + '\n')

// ---------------------------------------------------------------------------
// 4. Emit each SDK file as a module.
// ---------------------------------------------------------------------------

let totalImported = 0
for (const file of files) {
	const text = sources.get(file)
	const sf = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true)
	const used = collectUsage(sf)
	const localNames = decls.get(file)

	const typeImports = new Map() // file -> names[]
	const valueImports = new Map()
	const push = (map, file, name) => {
		if (!map.has(file)) {map.set(file, [])}
		map.get(file).push(name)
	}
	for (const [name, kind] of used) {
		if (localNames.has(name) || BUILTINS.has(name)) {continue}
		const owner = owners.get(name)
		if (RUNTIME_NAMES.has(name)) {
			push(kind === 'value' ? valueImports : typeImports, './objc-runtime', name)
		}
		else if (owner && owner !== file) {
			push(kind === 'value' ? valueImports : typeImports, './' + owner.replace(/\.d\.ts$/, ''), name)
		}
		else if (!owner) {
			unresolved.add(name)
		}
	}

	const lines = []
	const emit = (map, keyword) => {
		for (const [from, names] of [...map.entries()].sort()) {
			lines.push(`${keyword} { ${names.sort().join(', ')} } from '${from}'`)
		}
	}
	emit(typeImports, 'import type')
	emit(valueImports, 'import')
	if (lines.length) {
		totalImported += lines.length
		lines.push('')
	}

	const drops = dropped.get(file) ?? new Set()
	for (const stmt of sf.statements) {
		if (stmt.kind === ts.SyntaxKind.NotEmittedStatement || !stmt.getText(sf).trim()) {continue}
		let s = stmt.getText(sf)
		if (s.startsWith('///')) {continue}
		const names = stmtNames(stmt)
		if (names.length && names.every(([n]) => drops.has(n))) {continue}
		// `declare const x` + `declare class x` merges globally but duplicates
		// in module scope — the class/enum/function/module is the real symbol.
		if (ts.isVariableStatement(stmt) && names.length &&
			names.every(([n]) => { const f = localNames.get(n); return f && [...f.kinds].some((k) => k !== 'var' && k !== 'interface' && k !== 'type') })) {continue}
		// The node-api runtime attaches extend() to every class constructor;
		// the metadata emitter doesn't model it.
		if (file === 'Runtime.d.ts' && names.some(([n]) => n === 'NSObject')) {
			s = s.replace(/}\s*$/, '\tstatic extend(definition: object, options?: object): any\n}')
		}
		lines.push(`export ${s}`)
	}
	writeFileSync(join(outDir, file), lines.join('\n\n') + '\n')
}

// ---------------------------------------------------------------------------
// 5. Barrel index + host-extras (NSClass, CG aliases, NSObject.extend).
// ---------------------------------------------------------------------------

const barrel = [
	'// Generated barrel — module-scoped macOS SDK decls.',
	...files.map((f) => `export * from './${f.replace(/\.d\.ts$/, '')}'`),
]
writeFileSync(join(outDir, 'index.d.ts'), barrel.join('\n') + '\n')

console.log(`macos sdk: ${files.length} files, ${owners.size} names, ${totalImported} import statements, ${unresolved.size} unresolved (ambient-tolerated)`)

// ---------------------------------------------------------------------------
// 6. extras.d.ts — helpers the SDK sweep can't express (geometry aliases,
//    NSClass factory shape), plus the runtime extend() static the metadata
//    emitter doesn't model.
// ---------------------------------------------------------------------------

writeFileSync(join(outDir, 'extras.d.ts'), `// Hand-authored additions to the generated SDK surface.
import type { CGPoint, CGSize, CGRect } from './CoreFoundation'
import type { NSObject } from './Runtime'

export type NSClass<T> = {
	new (...args: any[]): T
	alloc(): T
	[key: string]: any
}

// The generator emits only the CoreGraphics spellings; AppKit code and docs
// use the NS aliases for the same structs.
export type NSPoint = CGPoint
export type NSSize = CGSize
export type NSRect = CGRect
`)

// ---------------------------------------------------------------------------
// 7. macos.macos.ts — the public module impl: type re-exports from the SDK
//    decls + runtime values bound from globalThis with a lazy fallback.
// ---------------------------------------------------------------------------

const LAZY = `export const lazyGlobal = (name) => {
	let self
	self = new Proxy(function () {}, {
		get: (_t, p, receiver) => {
			const target = globalThis[name]
			const v = Reflect.get(target, p)
			// Bind when read through the proxy itself so calls like X.extend get
			// the real global as receiver — subclass statics keep the subclass.
			return typeof v === 'function' && receiver === self ? v.bind(target) : v
		},

		set: (_t, p, v) => Reflect.set(globalThis[name], p, v),

		construct: (_t, args, newTarget) => Reflect.construct(globalThis[name], args, newTarget),

		apply: (_t, _this, args) => Reflect.apply(globalThis[name], undefined, args),

		has: (_t, p) => p in globalThis[name],

		getPrototypeOf: () => Object.getPrototypeOf(globalThis[name]),

		getOwnPropertyDescriptor: (_t, p) => Object.getOwnPropertyDescriptor(globalThis[name], p),

		ownKeys: () => Reflect.ownKeys(globalThis[name]),

		defineProperty: (_t, p, d) => Object.defineProperty(globalThis[name], p, d),
	})

	return self
}
`

// Per-SDK-file impl modules under src/types/macos-impl/ — a single 78k-export
// module makes rolldown/vite quadratic; per-file modules bundle linearly.
const implDir = join(outDir, '..', 'macos-impl')
rmSync(implDir, { recursive: true, force: true })
mkdirSync(implDir, { recursive: true })

const SKIP_DL = new Set(['runtime', 'objc-runtime', 'extras', 'index'])
const fwList = `[\n\t${files
	.map((f) => basename(f, '.d.ts'))
	.filter((n) => !n.startsWith('_') && !SKIP_DL.has(n))
	.map((n) => `'/System/Library/Frameworks/${n}.framework/${n}'`)
	.join(',\n\t')}\n]`

writeFileSync(join(implDir, '_rt.js'), `// Generated by packages/platform/scripts/generate-macos-sdk.mjs — do not edit.
// Regenerate: pnpm --filter @octane-xplat/platform generate:native-types

// The ObjC bridge registers framework classes/protocols as globals only
// after each framework is loaded, and lazy global getters dereference the
// symbol directly — reading a global for an unloaded framework crashes the
// host. When the runtime is already up, dlopen every SDK framework so the
// bindings below materialize real objects (nativescript APIs like
// extend/protocols/exposedMethods reject proxies).
// In ambient-free processes (unit tests) this is a no-op.
for (const fw of ${fwList}) { globalThis.dlopen?.(fw, 2) }

${LAZY}
// _g forwards every read to globalThis, falling back to a lazy proxy when
// the global is absent — real objects when the runtime is up (identity APIs
// need them), proxies in ambient-free processes (tests, plain node).
export const _g = new Proxy(globalThis, {
	get: (t, p) => {
		// Some SDK names materialize through nativescript lazy getters that
		// throw (or crash) on metadata the host can't resolve — fall back to a
		// lazy proxy so the export still exists.
		try { return t[p] ?? lazyGlobal(p) } catch { return lazyGlobal(p) }
	},
})

// Names declared in the generated SDK whose nativescript lazy getter
// dereferences a bad pointer at materialization (metadata present, symbol
// absent/bogus on this OS image). Reading globalThis[name] for these
// segfaults the host — they bind as lazy proxies instead. Verified by
// reading every emitted name under @nativescript/macos-node-api.
const _crashers = new Set([
	'_cr0',
	'CoreHapticsErrorDomain',
	'kLSSharedFileListItemBeforeFirst',
	'kLSSharedFileListItemLast',
	'ldt_desc',
	'random_seed_prefix',
	'task_gate',
	'tss',
	'unnamed_12832443407998816313',
	'unnamed_17963737212569277895',
	'unnamed_2950695123896367730',
	'unnamed_3081758505577017777',
])

export const _bind = (fw, name) =>
	_crashers.has(name) ? lazyGlobal(name) : _g[name]
`)

writeFileSync(join(implDir, '_rt.d.ts'), `export declare const lazyGlobal: any
export declare const _g: any
export declare const _bind: any
`)

// Type facets — `export type X = _ns.X` aliases merge with the same-named
// value exports below (re-export `export type {X}` would collide).
const typeParams = new Map() // name -> [decl, args]
for (const file of files) {
	const sf = ts.createSourceFile(file, sources.get(file), ts.ScriptTarget.Latest, true)
	for (const stmt of sf.statements) {
		const tps = stmt.typeParameters
		for (const [n] of stmtNames(stmt)) {
			if (tps?.length) {
				typeParams.set(n, [
					`<${tps.map((p) => p.getText(sf)).join(', ')}>`,
					`<${tps.map((p) => p.name.text).join(', ')}>`,
				])
			}
		}
	}
}

const impl = []
for (const file of files) {
	const local = decls.get(file)
	const drops = dropped.get(file) ?? new Set()
	const base = file.replace(/\.d\.ts$/, '')
	const owned = [...owners.entries()].filter(([n, f]) => f === file && !drops.has(n)).map(([n]) => n).sort()
	if (!owned.length) {continue}
	const needsRuntime = owned.some((n) => {
		const p = typeParams.get(n)
		return p && /\b(interop|objc|NativeObject|NativeClass)\./.test(p[0])
	})
	const fwBase = SKIP_DL.has(base) || base.startsWith('_') ? '' : `/System/Library/Frameworks/${base}.framework/${base}`
	// Impl files are .js + .d.ts (not .ts): Node strip-types resolves './x.js'
	// directly, and tsc maps it to the sibling declaration — unlike '.ts'
	// specifiers, which require allowImportingTsExtensions in every consumer.
	const jsLines = [
		`import { _bind } from './_rt.js'`,
		`const FW = '${fwBase}'`,
	]
	for (const name of owned) {
		const f = local.get(name)
		if (f.value) {
			// The binding call must stay marked pure so unused names drop out of
			// consumer bundles — eagerly materializing all ~78k lazy globals at
			// module init costs ~30s in the packed runtime (and would hit the
			// nativescript lazy-getter crashers that are never imported anyway).
			jsLines.push(`export const ${name} = /* @__PURE__ */ _bind(FW, '${name}')`)
		}
	}
	writeFileSync(join(implDir, `${base}.js`), jsLines.join('\n') + '\n')
	writeFileSync(join(implDir, `${base}.d.ts`), `export * from '../macos/${base}.d.ts'\n`)
	impl.push(`export * from './macos-impl/${base}.js'`)
}
impl.push(`export type { NSClass, NSPoint, NSSize, NSRect } from './macos/extras'`)

// Runtime globals (interop, objc, NativeClass, NativeObject, ...) — declared
// by objc-runtime.d.ts. Emitted directly in the barrel (only 12 names).
const runtimeImpl = [
	`import { _g, lazyGlobal } from './macos-impl/_rt.js'`,
]
for (const [name, kind] of [...runtimeExported.entries()].sort()) {
	if (VALUE_KINDS.has(kind) || kind === 'module') {
		runtimeImpl.push(`export const ${name}: typeof import('./macos/objc-runtime').${name} = _g.${name}`)
	}
	if (kind === 'module') {
		// Namespaces carry member types (`interop.Pointer`); a `declare
		// namespace` merges them onto the value const — ambient, strip-safe.
		const members = (runtimeNsMembers.get(name) ?? []).filter(([, mk]) => !VALUE_KINDS.has(mk) || mk === 'class' || mk === 'interface' || mk === 'type' || mk === 'enum' || mk === 'module')
		if (members.length) {
			runtimeImpl.push(`export declare namespace ${name} {`)
			for (const [m, , tp] of members) {
				runtimeImpl.push(`\texport type ${m}${tp?.[0] ?? ''} = import('./macos/objc-runtime').${name}.${m}${tp?.[1] ?? ''}`)
			}
			runtimeImpl.push('}')
		}
	}
	else if (kind === 'interface' || kind === 'type' || kind === 'class') {
		runtimeImpl.push(`export type ${name} = import('./macos/objc-runtime').${name}`)
	}
}
impl.push(...runtimeImpl)

writeFileSync(join(outDir, '..', 'macos.macos.ts'), impl.join('\n') + '\n')
console.log(`macos impl: ${owners.size} sdk names, ${runtimeExported.size} runtime globals`)
