#!/usr/bin/env node
import { createRequire } from 'node:module'
import { spawnSync } from 'node:child_process'
import {
	mkdirSync,
	mkdtempSync,
	readdirSync,
	readFileSync,
	rmSync,
	statSync,
	writeFileSync,
} from 'node:fs'

import { tmpdir } from 'node:os'
import { dirname, extname, isAbsolute, join, normalize, relative, resolve, sep } from 'node:path'
import { checkPackedPackage } from './pack-check.mjs'

const manifestName = '.tsrx-typegen-manifest.json'
const defaultExtensions = {
	'.ts': '.js',
	'.tsx': '.js',
	'.tsrx': '.js',
	'.mts': '.mjs',
	'.cts': '.cjs',
}

function usage() {
	console.log(`Usage: tsrx-typegen --project <tsconfig> [--target <name>] [--check]
       tsrx-typegen --target <name> [--check]
       tsrx-typegen --pack-check [--target <name>]

Generate declarations with the consuming project's TypeScript and tsrx compiler.

Options:
  --project <path>  TypeScript config for declaration generation
  --target <name>   Target in tsrx-typegen.json (selects its project and output)
  --check           Compare generated declarations without writing files
  --pack-check      Check declarations, pack the package, and validate the tarball
  -h, --help        Show this help`)
}

function parseArgs(args) {
	let project
	let target
	let check = false
	let packCheck = false
	for (let index = 0; index < args.length; index += 1) {
		const arg = args[index]
		if (arg === '--help' || arg === '-h') {
			usage()
			process.exit(0)
		} else if (arg === '--check') {
			check = true
		} else if (arg === '--pack-check') {
			packCheck = true
		} else if (arg === '--project') {
			if (!args[index + 1] || args[index + 1].startsWith('--')) {
				throw new Error('Pass a path after --project.')
			}

			project = args[++index]
		} else if (arg === '--target') {
			if (!args[index + 1] || args[index + 1].startsWith('--')) {
				throw new Error('Pass a name after --target.')
			}

			target = args[++index]
		} else {
			throw new Error(`Unknown argument: ${arg}`)
		}
	}

	if (!project && !target && !packCheck) {
		throw new Error('Pass --project <tsconfig>, --target <name>, or --pack-check.')
	}

	if (packCheck && project) {
		throw new Error('--pack-check uses targets from tsrx-typegen.json; do not pass --project.')
	}

	return { project: project ? resolve(project) : undefined, target, check, packCheck }
}

function configuredTargetNames(projectRoot, selectedTarget) {
	const path = join(projectRoot, 'tsrx-typegen.json')
	let config
	try {
		config = JSON.parse(readFileSync(path, 'utf8'))
	} catch (error) {
		throw new Error(`${path}: ${error.message}`)
	}

	const targets = config?.targets
	if (!targets || typeof targets !== 'object' || Array.isArray(targets) || !Object.keys(targets).length) {
		throw new Error(`${path}: --pack-check requires at least one configured target`)
	}

	if (selectedTarget && !Object.hasOwn(targets, selectedTarget)) {
		throw new Error(`${path}: unknown target ${selectedTarget}`)
	}

	return selectedTarget ? [selectedTarget] : Object.keys(targets)
}

function loadProjectModule(projectRoot, specifier) {
	const require = createRequire(join(projectRoot, 'package.json'))
	return require.resolve(specifier)
}

function readProjectConfig(ts, configPath, projectRoot, target) {
	const configFile = ts.readConfigFile(configPath, ts.sys.readFile)
	if (configFile.error) {
		throw new Error(ts.flattenDiagnosticMessageText(configFile.error.messageText, '\n'))
	}

	const parsed = ts.parseJsonConfigFileContent(
		configFile.config,
		{ ...ts.sys },
		dirname(configPath),
		{},
		configPath,
		undefined,
		[{ extension: '.tsrx', isMixedContent: true, scriptKind: ts.ScriptKind.Deferred }],
	)

	if (!parsed) {throw new Error(`Could not read ${configPath}`)}
	const errors = parsed.errors.map((diagnostic) =>
		ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'),
	)

	if (errors.length) {throw new Error(errors.join('\n'))}
	const options = parsed.options
	const jsxRenderer =
		options.jsxImportSource ??
		(options.jsx === ts.JsxEmit.ReactJSX || options.jsx === ts.JsxEmit.ReactJSXDev ? 'react' : undefined)

	if (target?.renderer && jsxRenderer && target.renderer !== jsxRenderer) {
		throw new Error(
			`target ${target.name} renderer ${target.renderer} does not match compilerOptions.jsxImportSource ${jsxRenderer}`,
		)
	}

	if (!options.declaration || !options.emitDeclarationOnly || options.noEmit) {
		throw new Error(
			`${configPath} must set declaration: true, emitDeclarationOnly: true, and noEmit: false.`,
		)
	}

	const outputDirectory = target?.outDir ?? options.declarationDir ?? options.outDir
	if (!outputDirectory) {
		throw new Error(`${configPath} must set target outDir, compilerOptions.outDir, or declarationDir.`)
	}

	return {
		outDir: target?.outDir
			? resolve(projectRoot, outputDirectory)
			: resolve(dirname(configPath), outputDirectory),
		outputFlag: options.declarationDir ? '--declarationDir' : '--outDir',
		rootDir: options.rootDir ? resolve(options.rootDir) : commonDirectory(parsed.fileNames),
		fileNames: parsed.fileNames,
	}
}

function commonDirectory(paths) {
	if (!paths.length) {throw new Error('TypeScript project has no root files.')}
	const segments = paths.map((path) => resolve(dirname(path)).split(sep))
	const common = []
	for (let index = 0; segments.every((parts) => parts[index] === segments[0][index]); index += 1) {
		common.push(segments[0][index])
	}

	return common.join(sep) || sep
}

function sourceDeclarationMap(rootDir, fileNames, extensions, overrides) {
	const sourceOutputs = new Map()
	const runtimeByDeclaration = new Map()
	for (const source of fileNames) {
		const sourceExtension = extname(source).toLowerCase()
		if (!Object.hasOwn(extensions, sourceExtension) || /\.d\.[cm]?ts$/i.test(source)) {continue}
		const sourcePath = relative(rootDir, source)
		if (!sourcePath || sourcePath.startsWith(`..${sep}`) || isAbsolute(sourcePath)) {
			throw new Error(`Source file is outside compilerOptions.rootDir: ${source}`)
		}

		const declarationExtension =
			sourceExtension === '.mts' ? '.d.mts' : sourceExtension === '.cts' ? '.d.cts' : '.d.ts'

		const declaration = normalize(sourcePath.slice(0, -sourceExtension.length) + declarationExtension)
		const prior = sourceOutputs.get(declaration)
		if (prior && !overrides.has(declaration)) {
			throw new Error(
				`source output collision: ${prior} and ${source} both emit ${declaration}; rename one source or declare an override for ${declaration}`,
			)
		}

		if (!prior) {
			sourceOutputs.set(declaration, source)
			runtimeByDeclaration.set(declaration, extensions[sourceExtension])
		}
	}

	return { sourceOutputs, runtimeByDeclaration }
}

function configOptions(projectRoot, projectArgument, targetArgument) {
	const path = join(projectRoot, 'tsrx-typegen.json')
	let config
	try {
		config = JSON.parse(readFileSync(path, 'utf8'))
	} catch (error) {
		if (error.code === 'ENOENT') {
			if (targetArgument) {throw new Error(`No tsrx-typegen.json defines target ${targetArgument}.`)}
			return {
				project: projectArgument,
				target: null,
				sourceExtensions: defaultExtensions,
				overrides: {},
			}
		}

		throw new Error(`${path}: ${error.message}`)
	}

	if (!config || typeof config !== 'object' || Array.isArray(config)) {
		throw new Error(`${path}: expected a JSON object`)
	}

	const targets = config.targets ?? {}
	if (!targets || typeof targets !== 'object' || Array.isArray(targets)) {
		throw new Error(`${path}: targets must be an object`)
	}

	const resolveProject = (value) => resolve(projectRoot, value)
	let selectedName = targetArgument
	let selected = selectedName ? targets[selectedName] : undefined
	if (selectedName && !selected) {throw new Error(`${path}: unknown target ${selectedName}`)}
	if (!selected && projectArgument) {
		const matches = Object.entries(targets).filter(
			([, target]) => target?.project && resolveProject(target.project) === projectArgument,
		)

		if (matches.length > 1) {
			throw new Error(`${path}: project matches multiple targets; pass --target <name>`)
		}

		if (matches.length === 1) {[selectedName, selected] = matches[0]}
		else if (Object.keys(targets).length) {
			throw new Error(`${path}: ${projectArgument} is not declared by a target`)
		}
	}

	if (selected) {
		if (typeof selected.project !== 'string' || !selected.project) {
			throw new Error(`${path}: target ${selectedName} must name a project`)
		}

		if (projectArgument && resolveProject(selected.project) !== projectArgument) {
			throw new Error(`${path}: --project does not match target ${selectedName}`)
		}

		if (typeof selected.renderer !== 'string' || !selected.renderer) {
			throw new Error(`${path}: target ${selectedName} must name its renderer`)
		}

		if (
			!selected.entrypoints ||
			typeof selected.entrypoints !== 'object' ||
			Array.isArray(selected.entrypoints) ||
			!Object.keys(selected.entrypoints).length
		) {
			throw new Error(`${path}: target ${selectedName} must declare entrypoints`)
		}

		for (const [subpath, entry] of Object.entries(selected.entrypoints)) {
			if (
				!entry ||
				typeof entry !== 'object' ||
				typeof entry.source !== 'string' ||
			!stringsIn(entry.runtime).length ||
				!stringsIn(entry.types).length
			) {
				throw new Error(`${path}: target ${selectedName} entrypoint ${subpath} needs source, runtime, and types`)
			}

			for (const publishedPath of [...stringsIn(entry.runtime), ...stringsIn(entry.types)]) {
				if (
					!publishedPath.startsWith('./') ||
					!pathInside(projectRoot, resolve(projectRoot, publishedPath))
				) {
					throw new Error(`${path}: ${subpath} mapping escapes the package: ${publishedPath}`)
				}
			}

			const source = resolve(projectRoot, entry.source)
			let isFile = false
			try {
				isFile = statSync(source).isFile()
			} catch {}

			if (!pathInside(projectRoot, source) || !isFile) {
				throw new Error(`${path}: target ${selectedName} entrypoint source is missing: ${entry.source}`)
			}
		}

		if (selected.outDir) {
			if (typeof selected.outDir !== 'string') {
				throw new Error(`${path}: target ${selectedName} outDir must be a package-relative path`)
			}

			const output = resolve(projectRoot, selected.outDir)
			if (!pathInside(projectRoot, output)) {
				throw new Error(`${path}: target ${selectedName} outDir escapes the package`)
			}
		}
	}

	if (!selected && Object.keys(targets).length) {
		throw new Error(`${path}: pass --target <name> or a matching --project`)
	}

	const project = projectArgument ?? resolveProject(selected.project)
	const sourceExtensions = { ...defaultExtensions, ...config.sourceExtensions, ...selected?.sourceExtensions }
	for (const [source, runtime] of Object.entries(sourceExtensions)) {
		if (!source.startsWith('.') || typeof runtime !== 'string' || !runtime.startsWith('.')) {
			throw new Error(`${path}: sourceExtensions must map dot-prefixed extensions to dot-prefixed runtime extensions`)
		}
	}

	const globalOverrides = config.overrides ?? {}
	const targetOverrides = selected?.overrides ?? {}
	for (const overrides of [globalOverrides, targetOverrides]) {
		if (!overrides || typeof overrides !== 'object' || Array.isArray(overrides)) {
			throw new Error(`${path}: overrides must map declaration output paths to source files`)
		}
	}

	return {
		project,
		target: selected ? { name: selectedName, ...selected } : null,
		sourceExtensions,
		overrides: { ...globalOverrides, ...targetOverrides },
	}
}

function applyOverrides(ts, projectRoot, outputDir, generated, overrides) {
	const normalized = new Map()
	for (const [outputPath, sourcePath] of Object.entries(overrides)) {
		if (typeof sourcePath !== 'string' || !sourcePath) {
			throw new Error(`override for ${outputPath} must name a source declaration file`)
		}

		const outputFile = normalize(outputPath)
		const output = resolve(outputDir, outputFile)
		if (!pathInside(outputDir, output) || !/\.d\.[cm]?ts$/.test(outputFile)) {
			throw new Error(`invalid override output path: ${outputPath}`)
		}

		const source = resolve(projectRoot, sourcePath)
		if (!pathInside(projectRoot, source)) {
			throw new Error(`override source escapes the package: ${sourcePath}`)
		}

		let content
		try {
			content = readFileSync(source, 'utf8')
		} catch (error) {
			throw new Error(`override source ${sourcePath}: ${error.message}`)
		}

		assertNoTsrxModuleReferences(ts, source, content)

		normalized.set(outputFile, content)
	}

	for (const [outputPath, content] of normalized) {generated.set(outputPath, content)}
	return new Set(normalized.keys())
}

function collectFiles(root, output = []) {
	if (!statSync(root).isDirectory()) {
		output.push(root)
		return output
	}

	for (const entry of readdirSync(root, { withFileTypes: true })) {
		const path = join(root, entry.name)
		if (entry.isDirectory()) {collectFiles(path, output)}
		else if (entry.isFile()) {output.push(path)}
	}

	return output
}

function moduleSpecifierNodes(ts, sourceFile) {
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

function assertNoTsrxModuleReferences(ts, path, text) {
	const source = ts.createSourceFile(path, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
	const unresolved = moduleSpecifierNodes(ts, source).find((node) => /\.tsrx(?:$|[?#])/.test(node.text))
	if (unresolved) {
		throw new Error(`${path}: unresolved .tsrx module specifier ${unresolved.text}`)
	}
}

function rewriteDeclaration(ts, path, outputDir, extensions, generatedFiles, runtimeByDeclaration) {
	const text = readFileSync(path, 'utf8')
	const source = ts.createSourceFile(path, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
	const edits = []
	for (const node of moduleSpecifierNodes(ts, source)) {
		const specifier = node.text
		if (!specifier.startsWith('.')) {continue}
		if (/\.d\.[cm]?ts$/i.test(specifier)) {continue}
		const extension = Object.keys(extensions).find(
			(candidate) => !candidate.startsWith('.d.') && specifier.endsWith(candidate),
		)

		let replacement
		if (extension) {
			replacement = specifier.slice(0, -extension.length) + extensions[extension]
		} else if (!/\.[cm]?[jt]sx?$/.test(specifier)) {
			const targetStem = resolve(dirname(path), specifier)
			const candidates = [
				`${targetStem}.d.ts`,
				`${targetStem}.d.mts`,
				`${targetStem}.d.cts`,
				join(targetStem, 'index.d.ts'),
				join(targetStem, 'index.d.mts'),
				join(targetStem, 'index.d.cts'),
			]

			const target = candidates.find((candidate) =>
				generatedFiles.has(relative(outputDir, candidate)),
			)

			if (!target) {continue}
			const declaration = relative(outputDir, target)
			const runtimeExtension = runtimeByDeclaration.get(declaration) ?? '.js'
			const isIndex = /[\\/]index\.d\.[cm]?ts$/.test(target)
			const baseSpecifier = specifier.endsWith('/') ? specifier.slice(0, -1) : specifier
			replacement = isIndex
				? `${baseSpecifier}/index${runtimeExtension}`
				: `${specifier}${runtimeExtension}`
		} else {
			continue
		}

		edits.push({
			start: node.getStart(source),
			end: node.end,
			replacement: `${text[node.getStart(source)]}${replacement}${text[node.end - 1]}`,
		})
	}

	let result = text
	for (const edit of edits.sort((a, b) => b.start - a.start)) {
		result = result.slice(0, edit.start) + edit.replacement + result.slice(edit.end)
	}

	assertNoTsrxModuleReferences(ts, path, result)

	return result
}

function normalizeOutput(ts, outputDir, extensions, runtimeByDeclaration) {
	const files = collectFiles(outputDir)
		.filter((path) => /\.d\.[cm]?ts$/.test(path))
		.sort()

	if (!files.length) {throw new Error('TypeScript emitted no declaration files.')}
	const generatedFiles = new Set(files.map((path) => relative(outputDir, path)))
	return new Map(
		files.map((path) => [
			relative(outputDir, path),
			rewriteDeclaration(
				ts,
				path,
				outputDir,
				extensions,
				generatedFiles,
				runtimeByDeclaration,
			),
		]),
	)
}

function verifySourceDeclarations(generated, sourceOutputs) {
	const missing = [...sourceOutputs.keys()].filter((declaration) => !generated.has(declaration))
	if (missing.length) {
		throw new Error(`TypeScript emitted no declarations for source file(s): ${missing.join(', ')}`)
	}
}

function previousManifest(outputDir) {
	const path = join(outputDir, manifestName)
	try {
		const manifest = JSON.parse(readFileSync(path, 'utf8'))
		if (manifest.version !== 1 || !Array.isArray(manifest.files)) {
			throw new Error('unsupported manifest format')
		}

		return new Set(manifest.files)
	} catch (error) {
		if (error.code === 'ENOENT') {return null}
		throw new Error(`${path}: ${error.message}`)
	}
}

function pathInside(root, file) {
	const relativePath = relative(root, file)
	return (
		relativePath &&
		!relativePath.startsWith(`..${sep}`) &&
		relativePath !== '..' &&
		!isAbsolute(relativePath)
	)
}

function writeOutput(outputDir, generated, oldFiles, overrideFiles) {
	for (const file of generated.keys()) {
		if (oldFiles?.has(file) || overrideFiles.has(file)) {continue}
		try {
			statSync(join(outputDir, file))
			throw new Error(`refusing to overwrite unmanaged declaration: ${file}`)
		} catch (error) {
			if (error.code !== 'ENOENT') {throw error}
		}
	}

	for (const file of oldFiles ?? []) {
		const path = resolve(outputDir, file)
		if (!pathInside(outputDir, path)) {throw new Error(`Invalid generated path in manifest: ${file}`)}
		if (!generated.has(file)) {rmSync(path, { force: true })}
	}

	for (const [file, content] of generated) {
		const path = join(outputDir, file)
		mkdirSync(dirname(path), { recursive: true })
		writeFileSync(path, content)
	}

	mkdirSync(outputDir, { recursive: true })
	writeFileSync(
		join(outputDir, manifestName),
		JSON.stringify({ version: 1, files: [...generated.keys()] }, null, 2) + '\n',
	)
}

function compareOutput(outputDir, generated, oldFiles, overrideFiles) {
	const errors = []
	if (!oldFiles) {errors.push(`missing ${manifestName}; run tsrx-typegen --project <tsconfig> first`)}
	for (const file of generated.keys()) {
		if (!oldFiles?.has(file) && !overrideFiles.has(file)) {
			try {
				statSync(join(outputDir, file))
				errors.push(`${file} conflicts with unmanaged output`)
			} catch (error) {
				if (error.code !== 'ENOENT') {throw error}
			}
		}

		try {
			if (readFileSync(join(outputDir, file), 'utf8') !== generated.get(file))
				{errors.push(`${file} is stale`)}
		} catch {
			errors.push(`${file} is missing`)
		}
	}

	for (const file of oldFiles ?? []) {
		if (!generated.has(file)) {errors.push(`${file} is stale`)}
	}

	return errors
}

function stringsIn(value) {
	if (typeof value === 'string') {return [value]}
	if (!value || typeof value !== 'object') {return []}
	return Object.values(value).flatMap(stringsIn)
}

function typeTargets(value) {
	if (!value || typeof value !== 'object' || Array.isArray(value)) {return []}
	return [
		...(Object.hasOwn(value, 'types') ? stringsIn(value.types) : []),
		...Object.entries(value)
			.filter(([key]) => key !== 'types' && key !== 'default')
			.flatMap(([, child]) => typeTargets(child)),
	]
}

function verifyPublicTypes(projectRoot, generated, outDir, target, sourceOutputs) {
	const manifestPath = join(projectRoot, 'package.json')
	let manifest
	try {
		manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
	} catch (error) {
		throw new Error(`${manifestPath}: ${error.message}`)
	}

	const exportsMap = manifest.publishConfig?.exports ?? manifest.exports
	const failures = []
	if (target && exportsMap && typeof exportsMap === 'object') {
		const configuredSubpaths = new Set(Object.keys(target.entrypoints))
		for (const [subpath, mapping] of Object.entries(exportsMap)) {
			const runtimeTargets = stringsIn(mapping).filter((entry) =>
				/\.(?:[cm]?[jt]sx?|tsrx)$/.test(entry),
			)

			if (runtimeTargets.length && !configuredSubpaths.has(subpath)) {
				failures.push(`${subpath} has code exports but no ${target.name} entrypoint config`)
			}
		}

		for (const [subpath, entry] of Object.entries(target.entrypoints)) {
			const mapping = exportsMap[subpath]
			if (!mapping) {
				failures.push(`${subpath} is configured for ${target.name} but missing from effective package exports`)
				continue
			}

			const source = resolve(projectRoot, entry.source)
			if (![...sourceOutputs.values()].includes(source)) {
				failures.push(`${subpath} source is not included by its TypeScript project: ${entry.source}`)
			}

			const declaredRuntime = stringsIn(entry.runtime)
			const publishedRuntime = stringsIn(mapping)
			for (const runtime of declaredRuntime) {
				if (!publishedRuntime.includes(runtime)) {
					failures.push(`${subpath} runtime mapping is not present in package exports: ${runtime}`)
				}
			}

			const declaredTypes = stringsIn(entry.types)
			const publishedTypes = typeTargets(mapping)
			for (const typePath of declaredTypes) {
				if (!publishedTypes.includes(typePath)) {
					failures.push(`${subpath} types mapping is not present in package exports: ${typePath}`)
				}
			}
		}
	}

	if (exportsMap && typeof exportsMap === 'object') {
		for (const [subpath, mapping] of Object.entries(exportsMap)) {
			const runtimeTargets = stringsIn(mapping).filter((target) =>
				/\.(?:[cm]?[jt]sx?|tsrx)$/.test(target),
			)

			if (!runtimeTargets.length) {continue}
			const targets = typeTargets(mapping)
			if (!targets.length) {
				failures.push(`${subpath} has code exports but no types condition`)
				continue
			}

			for (const target of targets) {
				if (!target.startsWith('./') || target.includes('*')) {continue}
				const absolute = resolve(projectRoot, target)
				if (!pathInside(projectRoot, absolute)) {
					failures.push(`${subpath} types target escapes the package: ${target}`)
					continue
				}

				const generatedPath = relative(outDir, absolute)
				if (pathInside(outDir, absolute) && generated.has(generatedPath)) {continue}
				try {
					if (!statSync(absolute).isFile())
						{failures.push(`${subpath} types target is not a file: ${target}`)}
				} catch {
					failures.push(`${subpath} types target is missing: ${target}`)
				}
			}
		}
	} else if (manifest.types ?? manifest.typings) {
		const targetPath = manifest.types ?? manifest.typings
		const target = resolve(projectRoot, targetPath)
		if (!pathInside(projectRoot, target)) {
			failures.push(`package types target escapes the package: ${targetPath}`)
		} else if (!(pathInside(outDir, target) && generated.has(relative(outDir, target)))) {
			try {
				if (!statSync(target).isFile()) {failures.push(`package types target is not a file: ${targetPath}`)}
			} catch {
				failures.push(`package types target is missing: ${targetPath}`)
			}
		}
	}

	if (failures.length) {throw new Error(failures.join('\n'))}
}

function runTarget(projectRoot, args) {
	const { project, target, sourceExtensions, overrides } = configOptions(
		projectRoot,
		args.project,
		args.target,
	)

	const tsPath = loadProjectModule(projectRoot, 'typescript')
	const ts = createRequire(import.meta.url)(tsPath)
	const { outDir, outputFlag, rootDir, fileNames } = readProjectConfig(
		ts,
		project,
		projectRoot,
		target,
	)

	const overrideFiles = new Set(Object.keys(overrides).map(normalize))
	const { sourceOutputs, runtimeByDeclaration } = sourceDeclarationMap(
		rootDir,
		fileNames,
		sourceExtensions,
		overrideFiles,
	)

	const compilerPath = loadProjectModule(projectRoot, '@tsrx/typescript-plugin/dist/tsc.js')
	const temporaryRoot = mkdtempSync(join(tmpdir(), 'tsrx-typegen-'))
	const temporaryOut = join(temporaryRoot, 'types')
	const outputDir = temporaryOut
	try {
		const compilerArgs = [compilerPath, '--pretty', 'false', '--project', project, outputFlag, temporaryOut]
		const result = spawnSync(process.execPath, compilerArgs, {
			cwd: projectRoot,
			encoding: 'utf8',
			maxBuffer: 32 * 1024 * 1024,
		})

		if (result.stdout) {process.stdout.write(result.stdout)}
		if (result.stderr) {process.stderr.write(result.stderr)}
		if (result.error) {throw result.error}
		if (/\[tsrx-tsc\]/.test(result.stderr ?? '')) {
			throw new Error(
				'tsrx compiler reported transform diagnostics; declarations were not written. Fix the source or configure an explicit declaration override.',
			)
		}

		if (result.status !== 0) {
			console.error(
				'tsrx-typegen: declaration emit failed; generated files were not changed. Fix compiler diagnostics or configure an explicit declaration override for an unsupported public signature.',
			)

			return false
		}

		const generated = normalizeOutput(ts, outputDir, sourceExtensions, runtimeByDeclaration)
		const managedOverrides = applyOverrides(ts, projectRoot, outDir, generated, overrides)
		verifySourceDeclarations(generated, sourceOutputs)
		const oldFiles = previousManifest(outDir)
		verifyPublicTypes(projectRoot, generated, outDir, target, sourceOutputs)
		if (args.check) {
			const errors = compareOutput(outDir, generated, oldFiles, managedOverrides)
			if (errors.length) {
				for (const error of errors) {console.error(`tsrx-typegen: ${error}`)}
				return false
			}

			console.log(`tsrx-typegen: ${generated.size} declaration file(s) are current`)
		} else {
			writeOutput(outDir, generated, oldFiles, managedOverrides)
			console.log(
				`tsrx-typegen: wrote ${generated.size} declaration file(s) to ${relative(projectRoot, outDir) || outDir}`,
			)
		}

		return true
	} finally {
		rmSync(temporaryRoot, { recursive: true, force: true })
	}
}

function run() {
	const args = parseArgs(process.argv.slice(2))
	const projectRoot = process.cwd()
	if (!args.packCheck) {
		if (!runTarget(projectRoot, args)) {process.exitCode = 1}
		return
	}

	const targets = configuredTargetNames(projectRoot, args.target)
	for (const target of targets) {
		if (!runTarget(projectRoot, { ...args, target, check: true })) {
			process.exitCode = 1
			return
		}
	}

	const tsPath = loadProjectModule(projectRoot, 'typescript')
	const ts = createRequire(import.meta.url)(tsPath)
	checkPackedPackage(projectRoot, ts)
}

try {
	run()
} catch (error) {
	console.error(`tsrx-typegen: ${error.message}`)
	process.exitCode = 1
}
