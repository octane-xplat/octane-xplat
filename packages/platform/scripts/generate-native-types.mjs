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
}

mkdirSync(outDir, { recursive: true })
generate('ios', '@nativescript/types-ios')
generate('android', '@nativescript/types-android')
await import('./generate-macos-sdk.mjs')
