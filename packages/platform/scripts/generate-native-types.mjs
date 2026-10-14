// Generates src/types/{ios,android}.ts + their .decls.d.ts companions by
// walking the ambient declarations shipped in @nativescript/types-ios and
// @nativescript/types-android. The ambient surface is re-exported as module
// members so platform code imports native names explicitly instead of
// relying on globals. Regenerate after bumping the nativescript types deps:
//
//   pnpm --filter @octane-xplat/platform generate:native-types
//
// Shape: `export type N` + `export const N` pairs for classes/enums (type and
// value facets), `export type N` for interfaces, `export const N` for
// vars/functions, and recursive `export namespace` trees for `declare module`
// surfaces (java.*, android.*, interop, …) with both facets per member. The
// .decls.d.ts file holds type intermediates that alias the ambient globals —
// needed because an exported `N` self-shadows the ambient `N` in `typeof`.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'

const require_ = createRequire(import.meta.url)
const pkgRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = join(pkgRoot, 'src/types')

// Walk the /// <reference path/types> closure from a package's typings entry
// and return every ambient .d.ts file, in resolution order.
function ambientFiles(packageName) {
	const entry = require_.resolve(`${packageName}/index.d.ts`, {
		paths: [join(pkgRoot, 'node_modules')],
	})

	const seen = new Set()
	const queue = [entry]
	const files = []
	const requireFor = createRequire(entry)
	while (queue.length) {
		const file = queue.shift()
		if (seen.has(file) || !existsSync(file)) {continue}
		seen.add(file)
		files.push(file)
		const source = readFileSync(file, 'utf8')
		const info = ts.preProcessFile(source, false, true)
		for (const ref of info.referencedFiles) {
			queue.push(resolve(dirname(file), ref.fileName))
		}

		for (const ref of info.typeReferenceDirectives) {
			try {
				queue.push(
					requireFor.resolve(`${ref.fileName}/index.d.ts`, {
						paths: [dirname(file)],
					}),
				)
			} catch {
				// types refs that only resolve in consumer programs are fine to skip
			}
		}
	}

	return files
}

// Collect top-level ambient declarations: classes, interfaces, type aliases,
// enums, vars, functions, and merged `declare module`/namespace surfaces.
// Merge namespace member maps — repeated `declare module` blocks for the same
// name must union their members, not overwrite.
function mergeInto(target, source) {
	for (const [k, v] of source) {
		const existing = target.get(k)
		if (existing?.kind === 'namespace' && v.kind === 'namespace') {
			existing.members = existing.members ?? new Map()
			mergeInto(existing.members, v.members ?? new Map())
		} else if (!existing) {
			target.set(k, v)
		}
	}
}

function collect(files) {
	const globals = new Map() // name -> { type: bool, value: bool } — merged across duplicate decls
	const params = new Map() // name -> { decl: '<T = x>', args: '<T>' }
	const namespaces = new Map() // name -> Map<memberName, member>
	const addGlobal = (name, type, value) => {
		const e = globals.get(name) ?? { type: false, value: false }
		e.type ||= type
		e.value ||= value
		globals.set(name, e)
	}

	const membersOf = (block) => {
		const members = new Map()
		const add = (name, kind) => {
			if (!members.has(name)) {members.set(name, { name, kind, members: null })}
		}

		for (const stmt of block.statements) {
			// `export { a as b }` inside a module block — re-exported member
			if (ts.isExportDeclaration(stmt) && stmt.exportClause && ts.isNamedExports(stmt.exportClause)) {
				for (const el of stmt.exportClause.elements) {
					const alias = el.name.text
					const target = el.propertyName?.text ?? alias
					members.set(alias, { name: alias, kind: 'alias', target, members: null })
				}

				continue
			}

			const name = stmt.name?.text
			if (ts.isModuleDeclaration(stmt)) {
				const body = stmt.body
				if (body && ts.isModuleBlock(body)) {
					const nested = members.get(name) ?? {
						name,
						kind: 'namespace',
						members: new Map(),
					}

					nested.kind = 'namespace'
					nested.members = nested.members ?? new Map()
					mergeInto(nested.members, membersOf(body))
					members.set(name, nested)
				}

				continue
			}

			if (ts.isVariableStatement(stmt)) {
				for (const decl of stmt.declarationList.declarations) {
					if (ts.isIdentifier(decl.name)) {add(decl.name.text, 'var')}
				}

				continue
			}

			if (!name) {continue}
			if (ts.isClassDeclaration(stmt)) {add(name, 'class')}
			else if (ts.isInterfaceDeclaration(stmt)) {add(name, 'interface')}
			else if (ts.isTypeAliasDeclaration(stmt)) {add(name, 'type')}
			else if (ts.isEnumDeclaration(stmt)) {add(name, 'enum')}
			else if (ts.isFunctionDeclaration(stmt)) {add(name, 'function')}
		}

		return members
	}

	for (const file of files) {
		const sf = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true)
		for (const stmt of sf.statements) {
			if (ts.isModuleDeclaration(stmt) && stmt.body && ts.isModuleBlock(stmt.body)) {
				const name = stmt.name.text
				if (name === 'global') {
					// `declare global {}` inside a module file (objc-node-api)
					for (const g of stmt.body.statements) {
						if (ts.isModuleDeclaration(g) && g.body && ts.isModuleBlock(g.body)) {
							const ns = namespaces.get(g.name.text) ?? new Map()
							mergeInto(ns, membersOf(g.body))
							namespaces.set(g.name.text, ns)
						} else {
							const gname = g.name?.text
							if (gname) {
								if (ts.isClassDeclaration(g)) {addGlobal(gname, true, true)}
								else if (ts.isInterfaceDeclaration(g) || ts.isTypeAliasDeclaration(g)) {addGlobal(gname, true, false)}
								else if (ts.isEnumDeclaration(g)) {addGlobal(gname, true, true)}
								else if (ts.isFunctionDeclaration(g)) {addGlobal(gname, false, true)}
							}

							if (ts.isVariableStatement(g)) {
								for (const decl of g.declarationList.declarations) {
									if (ts.isIdentifier(decl.name)) {addGlobal(decl.name.text, false, true)}
								}
							}
						}
					}

					continue
				}

				const ns = namespaces.get(name) ?? new Map()
				mergeInto(ns, membersOf(stmt.body))
				namespaces.set(name, ns)
				continue
			}

			const name = stmt.name?.text
			if (name) {
				const kind = ts.isClassDeclaration(stmt)
					? 'class'
					: ts.isInterfaceDeclaration(stmt)
						? 'interface'
						: ts.isTypeAliasDeclaration(stmt)
							? 'type'
							: ts.isEnumDeclaration(stmt)
								? 'enum'
								: ts.isFunctionDeclaration(stmt)
									? 'function'
									: null

				if (kind) {
					addGlobal(name, kind !== 'function', kind !== 'interface' && kind !== 'type')
					if (stmt.typeParameters?.length && !params.has(name)) {
						params.set(name, {
							decl: `<${stmt.typeParameters.map((p) => p.getText(sf)).join(', ')}>`,
							args: `<${stmt.typeParameters.map((p) => p.name.text).join(', ')}>`,
						})
					}

					continue
				}
			}

			if (ts.isVariableStatement(stmt)) {
				for (const decl of stmt.declarationList.declarations) {
					if (ts.isIdentifier(decl.name)) {addGlobal(decl.name.text, false, true)}
				}
			}
		}
	}

	return { globals, namespaces, params }
}

const HEADER = `// Generated by packages/platform/scripts/generate-native-types.mjs — do not edit.
// Regenerate: pnpm --filter @octane-xplat/platform generate:native-types
`

// Exported consts forward to the runtime global at ACCESS time, not bind time —
// framework classes install lazily (post-dlopen) and test fixtures swap globals
// after module load; a Proxy preserves ambient call-time resolution for both.
const LAZY = `const lazyGlobal = (name: string): any => {
	let self: any
	self = new Proxy(function () {} as any, {
		get: (_t, p, receiver) => {
			const target = (globalThis as any)[name]
			const v = Reflect.get(target, p)
			// Bind when read through the proxy itself so calls like X.extend get
			// the real global as receiver — subclass statics keep the subclass.
			return typeof v === 'function' && receiver === self ? v.bind(target) : v
		},

		set: (_t, p, v) => Reflect.set((globalThis as any)[name], p, v),

		construct: (_t, args, newTarget) => Reflect.construct((globalThis as any)[name], args, newTarget),

		apply: (_t, _this, args) => Reflect.apply((globalThis as any)[name], undefined, args),

		has: (_t, p) => p in (globalThis as any)[name],

		getPrototypeOf: () => Object.getPrototypeOf((globalThis as any)[name]),

		getOwnPropertyDescriptor: (_t, p) => Object.getOwnPropertyDescriptor((globalThis as any)[name], p),

		ownKeys: () => Reflect.ownKeys((globalThis as any)[name]),

		defineProperty: (_t, p, d) => Object.defineProperty((globalThis as any)[name], p, d),
	})

	return self
}
`


function generate(platform, packageName) {
	const files = ambientFiles(packageName)
	const { globals, namespaces, params } = collect(files)

	// .decls.d.ts: type intermediates aliasing the ambient globals. Names are
	// suffixed so an export here never self-shadows its ambient target.
	const decls = [HEADER]
	for (const [name, f] of [...globals.entries()].sort()) {
		const p = params.get(name)
		if (f.type) {decls.push(`export type ${name}_t${p?.decl ?? ''} = ${name}${p?.args ?? ''}`)}
		if (f.value) {decls.push(`export type ${name}_c = typeof ${name}`)}
	}

	writeFileSync(join(outDir, `${platform}.decls.d.ts`), decls.join('\n') + '\n')

	// <platform>.ts: the public module surface.
	const impl = [
		HEADER,
		`/// <reference types="${packageName}" />`,
		`import type * as D from './${platform}.decls'`,
		'',
		LAZY,
		'',
	]

	for (const name of [...namespaces.keys()].sort()) {
		// typeof globalThis carries the namespace's member types verbatim
		impl.push(`export const ${name}: typeof globalThis.${name} = (globalThis as any).${name} ?? lazyGlobal('${name}')`)
	}

	for (const [name, f] of [...globals.entries()].sort()) {
		const p = params.get(name)
		if (f.type) {impl.push(`export type ${name}${p?.decl ?? ''} = D.${name}_t${p?.args ?? ''}`)}
		if (f.value) {impl.push(`export const ${name}: D.${name}_c = (globalThis as any).${name} ?? lazyGlobal('${name}')`)}
	}

	writeFileSync(join(outDir, `${platform}.ts`), impl.join('\n') + '\n')
	console.log(
		`${platform}: ${globals.size} globals, ${namespaces.size} namespaces from ${files.length} files`,
	)
	return globals
}

// Scan a module-form decls file (like macos.decls.d.ts) for exported names
// and their facets: whether each name has a type side and/or a value side.
function collectModuleExports(file) {
	const sf = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true)
	const names = new Map() // name -> { type, value, generic }
	const mark = (name, { type = false, value = false, generic = false }) => {
		const entry = names.get(name) ?? { type: false, value: false, generic: false }
		entry.type ||= type
		entry.value ||= value
		entry.generic ||= generic
		names.set(name, entry)
	}

	for (const stmt of sf.statements) {
		if (ts.isVariableStatement(stmt)) {
			for (const decl of stmt.declarationList.declarations) {
				if (ts.isIdentifier(decl.name)) {mark(decl.name.text, { value: true })}
			}

			continue
		}

		const name = stmt.name?.text
		if (!name) {continue}
		const generic = !!stmt.typeParameters?.length
		if (ts.isClassDeclaration(stmt)) {mark(name, { type: true, value: true, generic })}
		else if (ts.isInterfaceDeclaration(stmt)) {mark(name, { type: true, generic })}
		else if (ts.isTypeAliasDeclaration(stmt)) {mark(name, { type: true, generic })}
		else if (ts.isEnumDeclaration(stmt)) {mark(name, { type: true, value: true })}
		else if (ts.isFunctionDeclaration(stmt)) {mark(name, { value: true })}
	}

	return names
}

// macOS: our own decls module + the objc-node-api ambient globals (objc,
// interop, NativeObject, NativeClass) — imported side-effect first so the
// runtime globals exist before the exported consts bind them.
function generateMacos(iosGlobals) {
	const declsPath = join(outDir, 'macos.decls.d.ts')
	const names = collectModuleExports(declsPath)
	const objcApi = require_.resolve('@nativescript/objc-node-api/index.d.ts', {
		paths: [require_.resolve('@nativescript/macos-node-api/package.json', {
			paths: [join(pkgRoot, 'node_modules')],
		})],
	})

	const { globals, namespaces } = collect([objcApi, join(dirname(objcApi), 'inline_functions.d.ts')])

	// The decls module's own intermediates come from itself, so value names
	// alias via `typeof D.X` — no ambient needed, no self-shadow.
	// Ambient intermediates for objc-node-api's `declare global` surface —
	// same dodge as ios/android .decls.d.ts (an exported name self-shadows
	// the ambient it aliases).
	const amb = [HEADER, `import '@nativescript/macos-node-api'`]
	for (const [name, f] of [...globals.entries()].sort()) {
		if (f.type) {amb.push(`export type ${name}_t = ${name}`)}
		if (f.value) {amb.push(`export type ${name}_c = typeof ${name}`)}
	}

	writeFileSync(join(outDir, 'macos.ambient.d.ts'), amb.join('\n') + '\n')

	const impl = [
		HEADER,
		// No direct nativescript import — host entries own runtime load order.
		`import type * as D from './macos.decls'`,
		`import type * as DA from './macos.ambient'`,
		'',
		// The ObjC bridge registers framework classes/protocols as globals only
		// after each framework is loaded. When the host runtime is already up,
		// dlopen the surface's frameworks so the ?? bindings capture real objects
		// — nativescript APIs (extend/protocols/exposedMethods) reject proxies.
		// In ambient-free processes (unit tests) this is a no-op.
		'for (const fw of [',
		`	'/System/Library/Frameworks/Foundation.framework/Foundation',`,
		`	'/System/Library/Frameworks/AppKit.framework/AppKit',`,
		`	'/System/Library/Frameworks/QuartzCore.framework/QuartzCore',`,
		`	'/System/Library/Frameworks/CoreText.framework/CoreText',`,
		`	'/System/Library/Frameworks/WebKit.framework/WebKit',`,
		']) { (globalThis as any).dlopen?.(fw, 2) }',
		'',
		LAZY,
		'',
		'// When the generated SDK ambient is in the program (macOS packages that',
		'// include the renderer types/), names resolve to its strict surface;',
		'// otherwise the loose module decls apply.',
		"// prettier-ignore",
		`type _Sdk<K extends string, F> = K extends keyof typeof globalThis ? (typeof globalThis)[K] extends abstract new (...args: any[]) => infer R ? R : (typeof globalThis)[K] : F`,
		'',
	]

	const reexports = []
	for (const [name, f] of [...names.entries()].sort()) {
		if (f.value) {impl.push(`export const ${name}: typeof D.${name} = (globalThis as any).${name} ?? lazyGlobal('${name}')`)}
		if (f.type) {
			if (f.generic) {reexports.push(name)}
			// Where the strict SDK ambient is loaded (the renderer's own
			// program), resolve to it — shared ObjC names like NSObject/NSArray
			// stay loose since iOS ambient also declares them.
			else if (!iosGlobals.has(name)) {
				impl.push(`export type ${name} = _Sdk<'${name}', D.${name}>`)
			}
			else {impl.push(`export type ${name} = D.${name}`)}
		}
	}

	if (reexports.length) {
		impl.push(`export type { ${reexports.join(', ')} } from './macos.decls'`)
	}

	// objc-node-api ambient globals
	for (const [name, f] of [...globals.entries()].sort()) {
		if (f.type) {impl.push(`export type ${name} = _Sdk<'${name}', DA.${name}_t>`)}
		if (f.value) {impl.push(`export const ${name}: DA.${name}_c = (globalThis as any).${name} ?? lazyGlobal('${name}')`)}
	}

	for (const name of [...namespaces.keys()].sort()) {
		impl.push(`export const ${name}: typeof globalThis.${name} = (globalThis as any).${name}`)
	}

	writeFileSync(join(outDir, 'macos.macos.ts'), impl.join('\n') + '\n')
	console.log(`macos: ${names.size} module exports, ${globals.size} ambient globals, ${namespaces.size} namespaces`)
}

mkdirSync(outDir, { recursive: true })
const iosGlobals = generate('ios', '@nativescript/types-ios')
generate('android', '@nativescript/types-android')
generateMacos(iosGlobals)
