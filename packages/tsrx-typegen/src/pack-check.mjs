import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, extname, isAbsolute, join, relative, resolve, sep } from 'node:path'

const moduleSpecifierNodes = (ts, sourceFile) => {
	const nodes = []
	const visit = (node) => {
		if (
			(ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
			node.moduleSpecifier &&
			ts.isStringLiteralLike(node.moduleSpecifier)
		) {
			nodes.push(node.moduleSpecifier)
		} else if (ts.isImportTypeNode(node)) {
			const argument = node.argument
			if (ts.isLiteralTypeNode(argument) && ts.isStringLiteralLike(argument.literal)) {
				nodes.push(argument.literal)
			}
		} else if (
			ts.isExternalModuleReference(node) &&
			node.expression &&
			ts.isStringLiteral(node.expression)
		) {
			nodes.push(node.expression)
		}

		ts.forEachChild(node, visit)
	}

	visit(sourceFile)
	return nodes
}

const pathInside = (root, file) => {
	const rel = relative(root, file)
	return rel === '' || (rel !== '..' && !rel.startsWith(`..${sep}`) && !isAbsolute(rel))
}

const stringsIn = (value) => {
	if (typeof value === 'string') {
		return [value]
	}

	if (!value || typeof value !== 'object') {
		return []
	}

	return Object.values(value).flatMap(stringsIn)
}

const codeTarget = (target) =>
	/\.(?:[cm]?[jt]sx?|tsrx)$/.test(target) && !/\.d\.[cm]?ts$/.test(target)

function exportBranches(exportsMap, fallbackTypes = []) {
	const branches = []
	for (const [subpath, mapping] of Object.entries(exportsMap ?? {})) {
		const visit = (value, inheritedTypes) => {
			if (typeof value === 'string') {
				if (codeTarget(value)) {
					branches.push({ subpath, runtime: value, types: inheritedTypes })
				}

				return
			}

			if (!value || typeof value !== 'object' || Array.isArray(value)) {
				return
			}

			const types = Object.hasOwn(value, 'types') ? stringsIn(value.types) : inheritedTypes
			for (const [condition, child] of Object.entries(value)) {
				if (condition !== 'types') {
					visit(child, types)
				}
			}
		}

		visit(mapping, fallbackTypes)
	}

	return branches
}

function packageFiles(root) {
	const files = []
	const visit = (dir) => {
		for (const entry of readdirSync(dir, { withFileTypes: true })) {
			if (entry.name === 'node_modules') {
				continue
			}

			const file = join(dir, entry.name)
			if (entry.isDirectory()) {
				visit(file)
			} else {
				files.push(file)
			}
		}
	}

	visit(root)
	return files
}

function expandTarget(target, files, packageRoot) {
	if (!target.includes('*')) {
		return [{ path: target, capture: undefined }]
	}

	if ((target.match(/\*/g) ?? []).length !== 1) {
		throw new Error(`packed export target uses more than one wildcard: ${target}`)
	}

	if (!target.startsWith('./')) {
		throw new Error(`packed export target must be package-relative: ${target}`)
	}

	const pattern = target.slice(2)
	const marker = pattern.indexOf('*')
	const prefix = pattern.slice(0, marker)
	const suffix = pattern.slice(marker + 1)
	const matches = files.flatMap((file) => {
		const path = relative(packageRoot, file).replaceAll('\\', '/')
		if (
			!path.startsWith(prefix) ||
			!path.endsWith(suffix) ||
			path.length < prefix.length + suffix.length
		) {
			return []
		}

		const capture = path.slice(prefix.length, path.length - suffix.length)
		return [{ path: `./${path}`, capture }]
	})

	if (!matches.length) {
		throw new Error(`packed export target matches no files: ${target}`)
	}

	return matches
}

function packedPath(packageRoot, target) {
	if (typeof target !== 'string' || !target.startsWith('./') || target.includes('*')) {
		throw new Error(`packed export target is not a concrete package-relative path: ${target}`)
	}

	const file = resolve(packageRoot, target)
	if (!pathInside(packageRoot, file)) {
		throw new Error(`packed export target escapes the package: ${target}`)
	}

	try {
		if (statSync(file).isFile()) {
			return file
		}
	} catch {}

	throw new Error(`packed export target is missing from the tarball: ${target}`)
}

function sourceFile(ts, file) {
	const extension = extname(file).toLowerCase()
	const scriptKind =
		extension === '.tsx'
			? ts.ScriptKind.TSX
			: extension === '.jsx'
				? ts.ScriptKind.JSX
				: extension === '.tsrx'
					? ts.ScriptKind.Deferred
					: ts.ScriptKind.TS

	return ts.createSourceFile(
		file,
		readFileSync(file, 'utf8'),
		ts.ScriptTarget.Latest,
		true,
		scriptKind,
	)
}

function localSourceModule(file, specifier) {
	if (!specifier.startsWith('.')) {
		return null
	}

	const target = resolve(dirname(file), specifier)
	const extension = extname(target)
	const candidates = [target]
	if (extension === '.js' || extension === '.mjs' || extension === '.cjs') {
		const stem = target.slice(0, -extension.length)
		candidates.push(`${stem}.ts`, `${stem}.tsx`, `${stem}.tsrx`, `${stem}.d.ts`)
	} else if (!['.ts', '.tsx', '.tsrx'].includes(extension)) {
		candidates.push(`${target}.ts`, `${target}.tsx`, `${target}.tsrx`, `${target}.d.ts`)
		candidates.push(
			join(target, 'index.ts'),
			join(target, 'index.tsx'),
			join(target, 'index.tsrx'),
			join(target, 'index.d.ts'),
		)
	}

	for (const candidate of candidates) {
		try {
			if (statSync(candidate).isFile()) {
				return candidate
			}
		} catch {}
	}

	return null
}

function staticRuntimeExports(ts, file, seen = new Set()) {
	const absolute = resolve(file)
	if (seen.has(absolute)) {
		return new Set()
	}

	seen.add(absolute)

	const source = sourceFile(ts, absolute)
	const names = new Set()
	const addBindingName = (name) => {
		if (ts.isIdentifier(name)) {
			names.add(name.text)
		} else if (ts.isObjectBindingPattern(name) || ts.isArrayBindingPattern(name)) {
			for (const element of name.elements) {
				if (element && ts.isBindingElement(element)) {
					addBindingName(element.name)
				}
			}
		}
	}

	for (const statement of source.statements) {
		const modifiers = ts.canHaveModifiers(statement) ? (ts.getModifiers(statement) ?? []) : []
		const exported = modifiers.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword)
		const isDefault = modifiers.some((modifier) => modifier.kind === ts.SyntaxKind.DefaultKeyword)
		if (isDefault) {
			names.add('default')
		}

		if (exported) {
			if (
				ts.isFunctionDeclaration(statement) ||
				ts.isClassDeclaration(statement) ||
				ts.isEnumDeclaration(statement) ||
				ts.isModuleDeclaration(statement)
			) {
				if (statement.name) {
					names.add(statement.name.text)
				}
			}

			if (ts.isVariableStatement(statement)) {
				for (const declaration of statement.declarationList.declarations) {
					addBindingName(declaration.name)
				}
			}
		}

		if (ts.isExportDeclaration(statement) && !statement.isTypeOnly) {
			if (
				!statement.exportClause &&
				statement.moduleSpecifier &&
				ts.isStringLiteralLike(statement.moduleSpecifier)
			) {
				const target = localSourceModule(absolute, statement.moduleSpecifier.text)
				if (target) {
					for (const name of staticRuntimeExports(ts, target, seen)) {
						if (name !== 'default') {
							names.add(name)
						}
					}
				}
			} else if (statement.exportClause && ts.isNamedExports(statement.exportClause)) {
				for (const element of statement.exportClause.elements) {
					if (!element.isTypeOnly) {
						names.add(element.name.text)
					}
				}
			} else if (statement.exportClause && ts.isNamespaceExport(statement.exportClause)) {
				names.add(statement.exportClause.name.text)
			}
		}

		if (ts.isExportAssignment(statement)) {
			names.add('default')
		}
	}

	return names
}

function compilerExports(ts, program, file, cache = new Map(), pending = new Set()) {
	const absolute = resolve(file)
	if (cache.has(absolute)) {
		return cache.get(absolute)
	}

	if (pending.has(absolute)) {
		return { all: new Set(), values: new Set() }
	}

	const source = program.getSourceFile(file)
	if (!source) {
		return undefined
	}

	const checker = program.getTypeChecker()
	const module = checker.getSymbolAtLocation(source)
	if (!module) {
		return undefined
	}

	const all = new Set()
	const values = new Set()
	for (const symbol of checker.getExportsOfModule(module)) {
		all.add(symbol.name)
		let resolved = symbol
		if (symbol.flags & ts.SymbolFlags.Alias) {
			try {
				resolved = checker.getAliasedSymbol(symbol)
			} catch {}
		}

		if (resolved.flags & ts.SymbolFlags.Value) {
			values.add(symbol.name)
		}
	}

	// Type-only edges (`export type *`, `export type { X }`) re-list the
	// target's symbols with their original flags — an ambient `declare const`
	// still reads as a value even though no value binding crosses the edge.
	// Subtract names whose only export edges are type-only.
	const typeOnly = new Set()
	for (const statement of source.statements) {
		if (!ts.isExportDeclaration(statement) || !statement.isTypeOnly) {
			continue
		}

		if (
			!statement.exportClause &&
			statement.moduleSpecifier &&
			ts.isStringLiteralLike(statement.moduleSpecifier)
		) {
			pending.add(absolute)
			const target = ts.resolveModuleName(
				statement.moduleSpecifier.text,
				file,
				program.getCompilerOptions(),
				ts.sys,
			).resolvedModule?.resolvedFileName

			const targetExports = target && compilerExports(ts, program, target, cache, pending)

			pending.delete(absolute)
			for (const name of targetExports?.all ?? []) {
				typeOnly.add(name)
			}
		} else if (statement.exportClause && ts.isNamedExports(statement.exportClause)) {
			for (const element of statement.exportClause.elements) {
				typeOnly.add(element.name.text)
			}
		} else if (statement.exportClause && ts.isNamespaceExport(statement.exportClause)) {
			typeOnly.add(statement.exportClause.name.text)
		}
	}

	if (typeOnly.size) {
		const valueEdges = staticRuntimeExports(ts, file)
		for (const name of values) {
			if (typeOnly.has(name) && !valueEdges.has(name)) {
				values.delete(name)
			}
		}
	}

	const result = { all, values }
	cache.set(absolute, result)
	return result
}

function declarationFiles(packageRoot, files) {
	return files.filter((file) => /\.d\.[cm]?ts$/.test(relative(packageRoot, file)))
}

function moduleResolutionOptions(ts) {
	return {
		allowImportingTsExtensions: true,
		module: ts.ModuleKind.NodeNext,
		moduleResolution: ts.ModuleResolutionKind.NodeNext,
		noEmit: true,
		skipLibCheck: true,
		target: ts.ScriptTarget.Latest,
	}
}

function verifyDeclarationClosure(ts, packageRoot, files, manifest, failures) {
	const options = moduleResolutionOptions(ts)
	const host = ts.sys
	const declared = new Set([
		manifest.name,
		...Object.keys(manifest.dependencies ?? {}),
		...Object.keys(manifest.optionalDependencies ?? {}),
		...Object.keys(manifest.peerDependencies ?? {}),
		...(manifest.bundledDependencies ?? []),
	])

	for (const file of declarationFiles(packageRoot, files)) {
		const source = sourceFile(ts, file)
		for (const node of moduleSpecifierNodes(ts, source)) {
			const specifier = node.text
			if (specifier.startsWith('.') || specifier.startsWith('#')) {
				const resolved = ts.resolveModuleName(specifier, file, options, host).resolvedModule
				if (!resolved) {
					failures.push(
						`${relative(packageRoot, file)} has unresolved declaration reference ${specifier}`,
					)
				} else if (!pathInside(packageRoot, resolve(resolved.resolvedFileName))) {
					failures.push(`${relative(packageRoot, file)} resolves ${specifier} outside the package`)
				}

				continue
			}

			if (specifier.startsWith('node:')) {
				if (!declared.has('@types/node')) {
					failures.push(
						`${relative(packageRoot, file)} imports ${specifier}; declare @types/node as a dependency or peer`,
					)
				}

				continue
			}

			if (specifier.startsWith('/')) {
				failures.push(
					`${relative(packageRoot, file)} has absolute declaration reference ${specifier}`,
				)

				continue
			}

			const name = specifier.startsWith('@')
				? specifier.split('/').slice(0, 2).join('/')
				: specifier.split('/')[0]

			if (!declared.has(name)) {
				failures.push(
					`${relative(packageRoot, file)} imports ${specifier}; declare ${name} in dependencies or peerDependencies`,
				)
			}
		}
	}
}

function verifyExportMap(ts, packageRoot, files, manifest, exportsMap, failures, options) {
	const fallbackTypes = [manifest.types ?? manifest.typings].filter(Boolean)
	const branches = exportBranches(exportsMap, fallbackTypes)
	if (!branches.length) {
		failures.push('package exports contain no runtime entrypoints to verify')
		return
	}

	const pairs = []
	for (const branch of branches) {
		if (!branch.types.length) {
			failures.push(`${branch.subpath} runtime ${branch.runtime} has no types condition`)
			continue
		}

		let runtimeMatches
		try {
			runtimeMatches = expandTarget(branch.runtime, files, packageRoot)
		} catch (error) {
			failures.push(`${branch.subpath}: ${error.message}`)
			continue
		}

		for (const runtimeMatch of runtimeMatches) {
			let runtimeFile
			try {
				runtimeFile = packedPath(packageRoot, runtimeMatch.path)
			} catch (error) {
				failures.push(`${branch.subpath}: ${error.message}`)
				continue
			}

			for (const typeTarget of branch.types) {
				const concreteType =
					typeTarget.includes('*') && runtimeMatch.capture !== undefined
						? typeTarget.replace('*', runtimeMatch.capture)
						: typeTarget

				let typeFile
				try {
					typeFile = packedPath(packageRoot, concreteType)
				} catch (error) {
					failures.push(`${branch.subpath}: ${error.message}`)
					continue
				}

				pairs.push({ branch, runtimeFile, runtimePath: runtimeMatch.path, typeFile, concreteType })
			}
		}
	}

	const programRoots = [
		...new Set(pairs.flatMap(({ runtimeFile, typeFile }) => [runtimeFile, typeFile])),
	].filter((file) => !file.endsWith('.tsrx'))

	const program = ts.createProgram(programRoots, options)
	for (const pair of pairs) {
		const declarationExports = compilerExports(ts, program, pair.typeFile)
		const runtimeExports = compilerExports(ts, program, pair.runtimeFile)
		const declaredValues = declarationExports?.values ?? new Set()
		let runtimeValues
		if (
			pair.runtimeFile.endsWith('.ts') ||
			pair.runtimeFile.endsWith('.tsx') ||
			pair.runtimeFile.endsWith('.tsrx')
		) {
			runtimeValues = staticRuntimeExports(ts, pair.runtimeFile)
			for (const name of declarationExports?.all ?? []) {
				if (!declaredValues.has(name)) {
					runtimeValues.delete(name)
				}
			}
		} else {
			runtimeValues = runtimeExports?.values ?? staticRuntimeExports(ts, pair.runtimeFile)
		}

		const missing = [...runtimeValues].filter((name) => !declaredValues.has(name)).sort()
		const extra = [...declaredValues].filter((name) => !runtimeValues.has(name)).sort()
		if (missing.length || extra.length) {
			failures.push(
				`${pair.branch.subpath} runtime/type value exports differ for ${pair.runtimePath} → ${pair.concreteType}` +
					`${missing.length ? `; missing declarations: ${missing.join(', ')}` : ''}` +
					`${extra.length ? `; declarations without runtime values: ${extra.join(', ')}` : ''}`,
			)
		}
	}
}

export function verifyPackedPackage(ts, packageRoot) {
	const failures = []
	const manifestPath = join(packageRoot, 'package.json')
	let manifest
	try {
		manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
	} catch (error) {
		throw new Error(`packed package.json: ${error.message}`)
	}

	const files = packageFiles(packageRoot)
	const maps = [manifest.exports, manifest.publishConfig?.exports].filter(
		(value, index, all) => value && all.indexOf(value) === index,
	)

	if (maps.length) {
		for (const exportsMap of maps) {
			verifyExportMap(
				ts,
				packageRoot,
				files,
				manifest,
				exportsMap,
				failures,
				moduleResolutionOptions(ts),
			)
		}
	} else if (manifest.main || manifest.module) {
		verifyExportMap(
			ts,
			packageRoot,
			files,
			manifest,
			{ '.': manifest.module ?? manifest.main },
			failures,
			moduleResolutionOptions(ts),
		)
	} else {
		failures.push('package has no exports, main, or module entrypoint')
	}

	verifyDeclarationClosure(ts, packageRoot, files, manifest, failures)
	if (failures.length) {
		throw new Error(failures.join('\n'))
	}
}

export function checkPackedPackage(projectRoot, ts) {
	const temporary = mkdtempSync(join(tmpdir(), 'tsrx-typegen-pack-'))
	const packOutput = join(temporary, 'pack')
	const extractedRoot = join(temporary, 'extracted')
	mkdirSync(packOutput)
	mkdirSync(extractedRoot)
	try {
		const packed = spawnSync(
			'pnpm',
			['--config.ignore-scripts=true', 'pack', '--pack-destination', packOutput],
			{ cwd: projectRoot, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 },
		)

		if (packed.stdout) {
			process.stdout.write(packed.stdout)
		}

		if (packed.stderr) {
			process.stderr.write(packed.stderr)
		}

		if (packed.error) {
			throw packed.error
		}

		if (packed.status !== 0) {
			throw new Error(`pnpm pack exited with ${packed.status}`)
		}

		const tarballs = readdirSync(packOutput).filter((name) => name.endsWith('.tgz'))
		if (tarballs.length !== 1) {
			throw new Error(`expected one package tarball; found ${tarballs.length}`)
		}

		const extracted = spawnSync(
			'tar',
			['-xzf', join(packOutput, tarballs[0]), '-C', extractedRoot],
			{
				encoding: 'utf8',
				maxBuffer: 16 * 1024 * 1024,
			},
		)

		if (extracted.stdout) {
			process.stdout.write(extracted.stdout)
		}

		if (extracted.stderr) {
			process.stderr.write(extracted.stderr)
		}

		if (extracted.error) {
			throw extracted.error
		}

		if (extracted.status !== 0) {
			throw new Error(`tar extraction exited with ${extracted.status}`)
		}

		verifyPackedPackage(ts, join(extractedRoot, 'package'))
		console.log('tsrx-typegen: packed exports and declaration graph are valid')
	} finally {
		rmSync(temporary, { recursive: true, force: true })
	}
}
