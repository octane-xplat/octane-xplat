import { execFile } from 'node:child_process'
import { createHash } from 'node:crypto'
import fs, { existsSync, readFileSync, readdirSync, realpathSync, statSync } from 'node:fs'
import { mkdir, mkdtemp, readFile, rename, rm, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { basename, dirname, extname, isAbsolute, join, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'
import { macOSExecutable } from './executables.mjs'
import {
	hostBundle,
	hostRoot,
	minimumJscHostSystemVersion,
	prebuiltRoot,
} from './jsc-host/runtime.mjs'

const execute = promisify(execFile)
const hash = (value) => createHash('sha256').update(value).digest('hex')
const compilerExtensions = new Set(['.c', '.m', '.mm', '.swift', '.zig'])
const ownSource = fileURLToPath(import.meta.url)

async function run(command, args, stage, env = process.env) {
	try {
		const result = await execute(command, args, {
			timeout: 180_000,
			maxBuffer: 32 * 1024 * 1024,
			env,
		})

		return result.stdout.trim()
	} catch (error) {
		const diagnostics = (error.stderr ?? error.message)
			.split('\n')
			.filter((line) => /error:|fatal error:|aborted|failed|dyld:/.test(line))

		throw new Error(
			`[macos-native] ${stage}: ${command} exited ${error.code ?? error.signal ?? 'unsuccessfully'}\n${(diagnostics.join('\n') || error.stderr || error.message).slice(-6000)}`,
		)
	}
}

function inside(root, path) {
	const rel = relative(root, path)
	return rel === '' || (!isAbsolute(rel) && rel !== '..' && !rel.startsWith(`..${sep}`))
}

function strings(value, label, fallback = []) {
	if (value === undefined) {
		return fallback
	}

	if (!Array.isArray(value) || value.some((item) => typeof item !== 'string' || !item.trim())) {
		throw new Error(`${label} must be an array of nonempty strings`)
	}

	return value
}

function packageRoot(root, name) {
	// The trailing slash makes builtin-named npm dependencies use node_modules lookup.
	for (const base of createRequire(join(root, 'package.json')).resolve.paths(`${name}/`) ?? []) {
		const candidate = join(base, name, 'package.json')
		if (existsSync(candidate)) {
			return realpathSync(dirname(candidate))
		}
	}

	return null
}

function nodeModulePaths(dir) {
	const paths = []
	let current = dir
	while (true) {
		if (basename(current) !== 'node_modules') {
			paths.push(join(current, 'node_modules'))
		}

		const parent = dirname(current)
		if (parent === current) {
			break
		}

		current = parent
	}

	return paths
}

function nativeFiles(root, dir = root, seen = new Set()) {
	const actual = realpathSync(dir)
	if (!inside(root, actual)) {
		throw new Error(`Native input escapes platforms/macos: ${dir}`)
	}

	if (seen.has(actual)) {
		throw new Error(`Native input contains a symlink cycle: ${dir}`)
	}

	seen.add(actual)
	const files = []
	for (const entry of readdirSync(dir).sort()) {
		const path = join(dir, entry)
		const target = realpathSync(path)
		if (!inside(root, target)) {
			throw new Error(`Native input escapes platforms/macos: ${path}`)
		}

		if (statSync(path).isDirectory()) {
			files.push(...nativeFiles(root, path, seen))
		} else if (statSync(path).isFile()) {
			files.push(path)
		}
	}

	seen.delete(actual)
	return files
}

function select(root, nativeRoot, patterns, label) {
	if (typeof fs.globSync !== 'function') {
		throw new Error('[macos-native] Native source selection requires Node 22.17 or later')
	}

	const files = new Set()
	for (const pattern of patterns) {
		if (isAbsolute(pattern) || pattern.split(/[\\/]/).includes('..')) {
			throw new Error(`${label}: package-relative paths required`)
		}

		const matches = fs.globSync(pattern, { cwd: root }).sort()
		if (!matches.length) {
			throw new Error(`${label}: no files match ${pattern}`)
		}

		for (const match of matches) {
			const path = realpathSync(join(root, match))
			if (!inside(nativeRoot, path) || !statSync(path).isFile()) {
				throw new Error(`${label}: input must be a file inside platforms/macos: ${match}`)
			}

			files.add(path)
		}
	}

	return [...files].sort()
}

function resourceMap(root, nativeRoot, value, label) {
	if (value === undefined) {
		return []
	}

	if (!value || typeof value !== 'object' || Array.isArray(value)) {
		throw new Error(`${label} must map app resource paths to package files`)
	}

	return Object.entries(value)
		.sort(([left], [right]) => left.localeCompare(right))
		.map(([destination, source]) => {
			if (
				!destination.trim() ||
				isAbsolute(destination) ||
				destination.split(/[\\/]/).some((part) => part === '..' || part === '.') ||
				typeof source !== 'string' ||
				!source.trim()
			) {
				throw new Error(`${label} must use safe relative app paths and package files`)
			}

			return { destination, source: select(root, nativeRoot, [source], label)[0] }
		})
}

function noticeFile(root, nativeRoot, value, label) {
	if (value === undefined) {
		return null
	}

	if (typeof value !== 'string' || !value.trim()) {
		throw new Error(`${label} must be a package-relative file inside platforms/macos`)
	}

	return select(root, nativeRoot, [value], label)[0]
}

/** Resolve runtime dependencies in dependency order, including pnpm/workspace links. */
export function discoverMacOSNative(appRoot) {
	const packages = new Map()
	const visiting = new Set()
	const leaves = []
	function visit(root) {
		root = realpathSync(root)
		if (packages.has(root) || visiting.has(root)) {
			return
		}

		visiting.add(root)
		const manifest = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
		const deps = {
			...manifest.peerDependencies,
			...manifest.dependencies,
			...manifest.optionalDependencies,
		}

		const dependencyRoots = []
		for (const name of Object.keys(deps).sort()) {
			const dep = packageRoot(root, name)
			if (!dep) {
				if (
					name in (manifest.optionalDependencies ?? {}) ||
					!(name in (manifest.dependencies ?? {}))
				) {
					continue
				}

				throw new Error(
					`[macos-native] ${manifest.name}: dependency ${name} is not installed; run pnpm install`,
				)
			}

			dependencyRoots.push(dep)
			visit(dep)
		}

		visiting.delete(root)
		const nativeRoot = join(root, 'platforms/macos')
		const config = manifest.xplat?.macos
		let leaf
		if (config !== undefined && (!config || typeof config !== 'object' || Array.isArray(config))) {
			throw new Error(`[macos-native] ${manifest.name}: xplat.macos must be an object`)
		}

		if (config !== undefined || existsSync(nativeRoot)) {
			if (!existsSync(nativeRoot)) {
				throw new Error(`[macos-native] ${manifest.name}: platforms/macos is missing`)
			}

			const allowed = new Set([
				'sources',
				'headers',
				'includePaths',
				'frameworks',
				'libraries',
				'defines',
				'swiftWholeModuleOptimization',
				'swiftHeaderImports',
				'resources',
				'notices',
			])

			for (const key of Object.keys(config ?? {})) {
				if (!allowed.has(key)) {
					throw new Error(`[macos-native] ${manifest.name}: unknown xplat.macos.${key}`)
				}
			}

			const files = nativeFiles(nativeRoot)
			const defaults = files.filter(
				(path) => inside(join(nativeRoot, 'src'), path) && compilerExtensions.has(extname(path)),
			)

			const sources =
				config?.sources === undefined
					? defaults
					: select(
							root,
							nativeRoot,
							strings(config.sources, `${manifest.name} sources`),
							`${manifest.name} sources`,
						)

			if (sources.length || config !== undefined) {
				if (!sources.length) {
					throw new Error(`[macos-native] ${manifest.name}: no native sources`)
				}

				for (const path of sources) {
					if (!compilerExtensions.has(extname(path))) {
						throw new Error(`[macos-native] ${manifest.name}: unsupported source ${path}`)
					}
				}

				const headers =
					config?.headers === undefined
						? files.filter(
								(path) => inside(join(nativeRoot, 'include'), path) && extname(path) === '.h',
							)
						: select(
								root,
								nativeRoot,
								strings(config.headers, `${manifest.name} headers`),
								`${manifest.name} headers`,
							)

				if (!headers.length && !sources.some((path) => extname(path) === '.swift')) {
					throw new Error(`[macos-native] ${manifest.name}: public headers are required`)
				}

				const includePaths = strings(config?.includePaths, `${manifest.name} includePaths`).map(
					(path) => {
						const actual = realpathSync(resolve(root, path))
						if (!inside(nativeRoot, actual) || !statSync(actual).isDirectory()) {
							throw new Error(
								`${manifest.name}: includePaths must be directories inside platforms/macos`,
							)
						}

						return actual
					},
				)

				const frameworks = strings(config?.frameworks, `${manifest.name} frameworks`)
				const libraries = strings(config?.libraries, `${manifest.name} libraries`)
				const defines = strings(config?.defines, `${manifest.name} defines`)
				const swiftHeaderImports = strings(
					config?.swiftHeaderImports,
					`${manifest.name} swiftHeaderImports`,
				)

				for (const header of swiftHeaderImports) {
					if (
						!/^[A-Za-z][A-Za-z0-9_]*\/[A-Za-z0-9_./-]+\.h$/.test(header) ||
						header.split('/').includes('..')
					) {
						throw new Error(`${manifest.name}: invalid Swift Objective-C header import ${header}`)
					}
				}

				const swiftWholeModuleOptimization = config?.swiftWholeModuleOptimization ?? false
				if (typeof swiftWholeModuleOptimization !== 'boolean') {
					throw new Error(`${manifest.name}: swiftWholeModuleOptimization must be boolean`)
				}

				if (swiftHeaderImports.length && !sources.some((path) => extname(path) === '.swift')) {
					throw new Error(`${manifest.name}: swiftHeaderImports require Swift sources`)
				}

				const resources = resourceMap(
					root,
					nativeRoot,
					config?.resources,
					`${manifest.name} resources`,
				)

				const notices = noticeFile(root, nativeRoot, config?.notices, `${manifest.name} notices`)

				for (const name of [...frameworks, ...libraries]) {
					if (!/^[A-Za-z0-9_+-]+$/.test(name)) {
						throw new Error(`${manifest.name}: invalid system framework/library ${name}`)
					}
				}

				for (const define of defines) {
					if (!/^[A-Za-z_][A-Za-z0-9_]*(?:=[^\r\n]+)?$/.test(define)) {
						throw new Error(`${manifest.name}: invalid define ${define}`)
					}
				}

				const id = `Xplat_${(manifest.name ?? 'app').replace(/[^A-Za-z0-9]/g, '_')}_${hash(root).slice(0, 8)}`
				leaf = {
					root,
					name: manifest.name ?? root,
					id,
					nativeRoot,
					sources,
					headers,
					includePaths,
					frameworks,
					libraries,
					defines,
					swiftWholeModuleOptimization,
					swiftHeaderImports,
					resources,
					notices,
					files,
					dependencyRoots,
				}

				leaves.push(leaf)
			}
		}

		packages.set(root, { manifest, dependencyRoots, leaf })
	}

	visit(appRoot)
	const resourceDestinations = new Set()
	for (const leaf of leaves) {
		for (const { destination } of leaf.resources) {
			if (resourceDestinations.has(destination)) {
				throw new Error(
					`[macos-native] Multiple leaves package the same app resource: ${destination}`,
				)
			}

			resourceDestinations.add(destination)
		}
	}

	const defineValues = new Map()
	for (const leaf of leaves) {
		for (const define of leaf.defines) {
			const key = define.split('=')[0]
			if (defineValues.has(key) && defineValues.get(key) !== define) {
				throw new Error(
					`[macos-native] ${leaf.name}: conflicting definition for ${key} across native leaves`,
				)
			}

			defineValues.set(key, define)
		}
	}

	// Resolve all transitive native dependencies through packages that have no native code.
	for (const leaf of leaves) {
		const seen = new Set([leaf.root])
		const deps = new Set()
		function collect(root) {
			if (seen.has(root)) {
				return
			}

			seen.add(root)
			const pkg = packages.get(root)
			if (pkg.leaf) {
				deps.add(pkg.leaf.id)
			}

			for (const dep of pkg.dependencyRoots) {
				collect(dep)
			}
		}

		for (const root of leaf.dependencyRoots) {
			collect(root)
		}

		leaf.dependencies = leaves.filter((dep) => deps.has(dep.id)).map((dep) => dep.id)
		if (
			leaf.dependencies.some(
				(id) => leaves.findIndex((dep) => dep.id === id) >= leaves.indexOf(leaf),
			)
		) {
			throw new Error(`[macos-native] ${leaf.name}: native dependency cycle`)
		}
	}

	const inputs = [...packages.entries()].map(([root, pkg]) => [root, pkg.manifest])
	for (const leaf of leaves) {
		for (const path of leaf.files) {
			inputs.push([path, hash(readFileSync(path))])
		}
	}

	return { leaves, fingerprint: hash(JSON.stringify(inputs)) }
}

/** Validate the toolchain only when the app actually has native leaves. */
export async function inspectMacOSNative(appRoot) {
	const graph = discoverMacOSNative(appRoot)
	if (!graph.leaves.length) {
		return { ...graph, toolchain: null }
	}

	if (process.platform !== 'darwin' || process.arch !== 'arm64') {
		throw new Error('[macos-native] Native leaves require an Apple Silicon Mac')
	}

	const sdk = await run(
		'xcrun',
		['--sdk', 'macosx', '--show-sdk-path'],
		'locate macOS SDK; install/select Xcode',
	)

	const clang = await run('xcrun', ['--find', 'clang'], 'locate Xcode compiler')
	const swift = graph.leaves.some((leaf) => leaf.sources.some((path) => extname(path) === '.swift'))
		? await run('xcrun', ['--find', 'swiftc'], 'locate Swift compiler')
		: null

	const zig = graph.leaves.some((leaf) => leaf.sources.some((path) => extname(path) === '.zig'))
		? await run('zig', ['version'], 'Zig sources require Zig on PATH')
		: null

	const manifest = JSON.parse(readFileSync(join(prebuiltRoot, 'manifest.json'), 'utf8'))
	let generator = join(
		prebuiltRoot,
		manifest.metadataGenerator?.path ?? 'missing-metadata-generator',
	)

	if (
		!manifest.metadataGenerator ||
		!existsSync(generator) ||
		hash(readFileSync(generator)) !== manifest.sha256[manifest.metadataGenerator.path]
	) {
		throw new Error(
			'[macos-native] Metadata generator missing or checksum differs; reinstall @octane-xplat/cli',
		)
	}

	generator = await macOSExecutable(appRoot, manifest.metadataGenerator.path)
	const libclang = await run(
		generator,
		['--xplat-check'],
		'load metadata generator; install compatible Command Line Tools libclang',
	)

	const clangVersion = await run(clang, ['--version'], 'inspect compiler')
	const swiftVersion = swift ? await run(swift, ['--version'], 'inspect Swift compiler') : null
	return {
		...graph,
		toolchain: {
			sdk,
			clang,
			swift,
			zig,
			libclang,
			clangVersion,
			swiftVersion,
			sdkSettings: hash(readFileSync(join(sdk, 'SDKSettings.json'))),
			generator,
			generatorHash: manifest.sha256[manifest.metadataGenerator.path],
		},
	}
}

async function cachedArtifact(dir, key) {
	try {
		const result = JSON.parse(await readFile(join(dir, 'manifest.json'), 'utf8'))
		if (result.key !== key) {
			return null
		}

		for (const [file, expected] of Object.entries(result.sha256)) {
			if (hash(await readFile(join(dir, file))) !== expected) {
				return null
			}
		}

		return { ...result, directory: dir, metadata: join(dir, 'metadata.nsmd'), cached: true }
	} catch {
		return null
	}
}

/** Compile and atomically publish content-addressed native artifacts. */
export async function buildMacOSNative(
	appRoot,
	{ minimumSystemVersion = minimumJscHostSystemVersion } = {},
) {
	appRoot = realpathSync(appRoot)
	const inspection = await inspectMacOSNative(appRoot)
	const { leaves, fingerprint, toolchain } = inspection
	if (!leaves.length) {
		return {
			leaves: [],
			libraries: [],
			metadata: join(hostBundle, 'metadata.nsmd'),
			fingerprint,
			cached: true,
		}
	}

	if (
		!/^\d+\.\d+(?:\.\d+)?$/.test(minimumSystemVersion) ||
		Number(minimumSystemVersion.split('.')[0]) < 13 ||
		(minimumSystemVersion.startsWith('13.') && Number(minimumSystemVersion.split('.')[1]) < 5)
	) {
		throw new Error('[macos-native] minimumSystemVersion must be at least 13.5')
	}

	const key = hash(
		JSON.stringify({
			fingerprint,
			toolchain,
			minimumSystemVersion,
			compiler: hash(readFileSync(ownSource)),
		}),
	)

	const cache = join(appRoot, 'node_modules/.cache/xplat/macos-native')
	await mkdir(cache, { recursive: true })
	const destination = join(cache, key)
	const hit = await cachedArtifact(destination, key)
	if (hit) {
		return hit
	}

	const staging = await mkdtemp(join(cache, '.build-'))
	try {
		const libraries = []
		const headers = []
		const symbols = new Map()
		const target = `arm64-apple-macos${minimumSystemVersion}`
		for (const leaf of leaves) {
			const outputName = `${leaf.id}.dylib`
			const output = join(staging, outputName)
			const objects = []
			const includePaths = [
				...new Set([
					leaf.nativeRoot,
					...leaf.headers.map(dirname),
					...leaf.includePaths,
					...leaves
						.filter((dep) => leaf.dependencies.includes(dep.id))
						.flatMap((dep) => dep.headers.map(dirname)),
				]),
			]

			const common = [
				'-target',
				target,
				'-isysroot',
				toolchain.sdk,
				'-O2',
				'-fPIC',
				...includePaths.flatMap((path) => ['-I', path]),
				...leaf.defines.map((define) => `-D${define}`),
			]

			for (const [index, source] of leaf.sources.entries()) {
				if (extname(source) === '.swift') {
					continue
				}

				const object = join(staging, `${leaf.id}-${index}.o`)
				if (extname(source) === '.zig') {
					await run(
						'zig',
						[
							'build-obj',
							source,
							'-target',
							`aarch64-macos.${minimumSystemVersion}`,
							'-O',
							'ReleaseSafe',
							'-fPIC',
							'--sysroot',
							toolchain.sdk,
							'-lc',
							...includePaths.flatMap((path) => ['-I', path]),
							...leaf.defines.map((define) => `-D${define}`),
							`-femit-bin=${object}`,
						],
						`${leaf.name}: compile ${relative(leaf.root, source)}`,
					)
				} else {
					await run(
						toolchain.clang,
						[
							...common,
							...(extname(source) === '.m' || extname(source) === '.mm' ? ['-fobjc-arc'] : []),
							'-c',
							source,
							'-o',
							object,
						],
						`${leaf.name}: compile ${relative(leaf.root, source)}`,
					)
				}

				objects.push(object)
			}

			const linkage = [
				...leaf.dependencies.map((id) => join(staging, `${id}.dylib`)),
				...leaf.frameworks.flatMap((name) => ['-framework', name]),
				...leaf.libraries.map((name) => `-l${name}`),
				...(leaf.sources.some((path) => extname(path) === '.mm') ? ['-lc++'] : []),
			]

			const swiftSources = leaf.sources.filter((path) => extname(path) === '.swift')
			if (swiftSources.length) {
				const generated = join(staging, `${leaf.id}-Swift.h`)
				const bridging = join(staging, `${leaf.id}-bridging.h`)
				await writeFile(
					bridging,
					leaf.headers.map((path) => `#import ${JSON.stringify(path)}`).join('\n'),
				)

				await run(
					toolchain.swift,
					[
						'-emit-library',
						'-O',
						...(leaf.swiftWholeModuleOptimization ? ['-whole-module-optimization'] : []),
						...(leaf.swiftWholeModuleOptimization
							? ['-emit-module-path', join(staging, `${leaf.id}.swiftmodule`)]
							: []),
						'-target',
						target,
						'-sdk',
						toolchain.sdk,
						'-module-name',
						leaf.id,
						'-emit-objc-header',
						'-emit-objc-header-path',
						generated,
						...(leaf.headers.length ? ['-import-objc-header', bridging] : []),
						...includePaths.flatMap((path) => ['-I', path]),
						...leaf.defines.flatMap((define) => ['-Xcc', `-D${define}`]),
						...swiftSources,
						...objects,
						...linkage,
						'-Xlinker',
						'-install_name',
						'-Xlinker',
						`@rpath/${outputName}`,
						'-Xlinker',
						'-rpath',
						'-Xlinker',
						'@loader_path',
						'-o',
						output,
					],
					`${leaf.name}: link Swift dylib`,
				)

				if (leaf.swiftHeaderImports.length) {
					const validated = join(staging, `${leaf.id}-Swift-validated.h`)
					await writeFile(
						validated,
						leaf.swiftHeaderImports.map((header) => `#import <${header}>`).join('\n') +
							`\n#import ${JSON.stringify(generated)}\n`,
					)

					headers.push(validated)
				} else {
					headers.push(generated)
				}
			} else {
				await run(
					toolchain.clang,
					[
						'-dynamiclib',
						...common,
						...objects,
						...linkage,
						'-Wl,-install_name',
						`-Wl,@rpath/${outputName}`,
						'-Wl,-rpath,@loader_path',
						'-o',
						output,
					],
					`${leaf.name}: link dylib`,
				)
			}

			const exports = await run('nm', ['-gUj', output], `${leaf.name}: inspect exports`)
			for (const symbol of exports
				.split('\n')
				.filter((symbol) => /^_[A-Za-z]/.test(symbol) && !symbol.startsWith('_swift_FORCE_LOAD'))) {
				if (symbols.has(symbol)) {
					throw new Error(
						`[macos-native] duplicate export ${symbol}: ${symbols.get(symbol)} and ${leaf.name}`,
					)
				}

				symbols.set(symbol, leaf.name)
			}

			libraries.push({ name: leaf.name, file: outputName })
			headers.push(...leaf.headers)
		}

		await mkdir(join(staging, 'types'))
		await mkdir(join(staging, 'json'))
		const includeArgs = [
			...new Set([...headers.map(dirname), ...leaves.flatMap((leaf) => leaf.includePaths)]),
		].map((path) => `include=${path}`)

		const clangArgs = [
			'Xclang',
			'-isysroot',
			toolchain.sdk,
			'-target',
			target,
			...leaves.flatMap((leaf) => leaf.defines.map((define) => `-D${define}`)),
			...[...new Set(leaves.flatMap((leaf) => leaf.includePaths))].flatMap((path) => ['-I', path]),
		]

		const generatorEnv = {
			...process.env,
			PATH: `${dirname(toolchain.clang)}:${process.env.PATH ?? ''}`,
		}

		await run(
			toolchain.generator,
			[
				'validate-headers',
				...headers.map((path) => `import=${JSON.stringify(path)}`),
				...includeArgs,
				'-output-umbrella',
				join(staging, 'leaf-umbrella.h'),
				...clangArgs,
			],
			`validate public headers for ${leaves.map((leaf) => leaf.name).join(', ')}`,
			generatorEnv,
		)

		const generatorArgs = [
			`types=${staging}/types`,
			`json=${staging}/json`,
			...headers.map((path) => `leaf-import=${JSON.stringify(path)}`),
			...includeArgs,
			'-output-bin',
			join(staging, 'metadata.nsmd'),
			'-output-umbrella',
			join(staging, 'umbrella.h'),
			...clangArgs,
		]

		await run(
			toolchain.generator,
			generatorArgs,
			'generate combined SDK and leaf metadata',
			generatorEnv,
		)

		if (discoverMacOSNative(appRoot).fingerprint !== fingerprint) {
			throw new Error(
				'[macos-native] Native inputs changed during compilation; retry after edits settle',
			)
		}

		const sha256 = {}
		for (const file of [...libraries.map((lib) => lib.file), 'metadata.nsmd']) {
			sha256[file] = hash(await readFile(join(staging, file)))
		}

		const artifact = {
			key,
			fingerprint,
			libraries,
			leaves: leaves.map((leaf) => leaf.name),
			resources: leaves.flatMap((leaf) =>
				leaf.resources.map(({ destination, source }) => ({
					leaf: leaf.name,
					destination,
					source,
				})),
			),
			notices: leaves.flatMap((leaf) =>
				leaf.notices ? [{ leaf: leaf.name, source: leaf.notices }] : [],
			),
			sha256,
		}

		await writeFile(join(staging, 'manifest.json'), JSON.stringify(artifact, null, 2))
		try {
			await rename(staging, destination)
		} catch (error) {
			if (error.code !== 'EEXIST' && error.code !== 'ENOTEMPTY') {
				throw error
			}

			if (!(await cachedArtifact(destination, key))) {
				throw new Error(
					`[macos-native] corrupt cache at ${destination}; remove this directory and retry`,
				)
			}
		}

		return {
			...artifact,
			directory: destination,
			metadata: join(destination, 'metadata.nsmd'),
			cached: false,
		}
	} finally {
		await rm(staging, { recursive: true, force: true })
	}
}

/** Load native libraries before app JS; packaged paths remain valid after relocation. */
export function nativeLoader(artifact, { packaged = false } = {}) {
	if (!artifact.libraries.length) {
		return ''
	}

	const paths = artifact.libraries.map((lib) =>
		packaged ? lib.file : join(artifact.directory, lib.file),
	)

	return `globalThis.__xplatNativeHandles = ${JSON.stringify(paths)}.map(function(file) {\n  var path = ${packaged ? 'String(NSBundle.mainBundle.privateFrameworksPath) + "/" + file' : 'file'};\n  var handle = dlopen(path, 2 | 8);\n  if (!handle) throw Error("Native library failed to load: " + path + ": " + interop.stringFromCString(dlerror()));\n  return handle;\n});\n`
}

export async function writeNativeBootstrap(artifact, path, options) {
	await writeFile(
		path,
		nativeLoader(artifact, options) + (await readFile(join(hostRoot, 'shim.js'), 'utf8')),
	)
}
