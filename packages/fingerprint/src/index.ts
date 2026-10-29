import { createHash } from 'node:crypto'
import { existsSync, realpathSync } from 'node:fs'
import { glob, lstat, readFile, readdir, realpath } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path'
import { minimatch } from 'minimatch'
import { parse } from 'yaml'
import { nativeResolutions } from './native-resolutions.ts'
import { configValue, readNativeConfig } from './native-config.ts'
export { captureNativeToolchainAsync } from './toolchain.ts'
export { readNativeConfig as resolveNativeConfigAsync } from './native-config.ts'
export const NATIVE_FINGERPRINT_FORMAT = 'octane-xplat.native-fingerprint.v1'
import type {
	Fingerprint,
	FingerprintDiffItem,
	FingerprintSource,
	HashSource,
	Options,
	Platform,
} from './types.ts'
export type * from './types.ts'
const hash = (bytes: string | Uint8Array) => createHash('sha256').update(bytes).digest('hex')
const slash = (path: string) => path.split(sep).join('/')
const id = (value: FingerprintSource) =>
	value.type === 'file' ? `file:${value.filePath}` : `contents:${value.id}`
function stable(value: unknown): string {
	if (value === null || typeof value !== 'object') {
		return JSON.stringify(value)
	}
	if (Array.isArray(value)) {
		return '[' + value.map(stable).join(',') + ']'
	}
	return (
		'{' +
		Object.entries(value)
			.sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
			.map(([key, value]) => JSON.stringify(key) + ':' + stable(value))
			.join(',') +
		'}'
	)
}
async function json(file: string): Promise<Record<string, any>> {
	return JSON.parse(await readFile(file, 'utf8'))
}
const within = (root: string, file: string) => {
	const path = relative(root, file)
	return path === '' || (!path.startsWith('..' + sep) && path !== '..' && !isAbsolute(path))
}
const ignoredDirectories = new Set([
	'node_modules',
	'.git',
	'.cache',
	'.turbo',
	'build',
	'dist',
	'Pods',
	'.gradle',
	'DerivedData',
])
async function walk(
	root: string,
	path: string,
	action: (path: string) => Promise<void>,
	ancestors = new Set<string>(),
): Promise<void> {
	const actual = await realpath(path)
	if (!within(root, actual)) {
		throw new Error('Fingerprint source symlink escapes its declared root')
	}
	if (ancestors.has(actual)) {
		throw new Error('Fingerprint source has a symlink cycle')
	}
	const stat = await lstat(actual)
	if (stat.isFile()) {
		await action(path)
		return
	}
	if (!stat.isDirectory()) {
		throw new Error('Fingerprint requires ordinary files/directories')
	}
	const next = new Set(ancestors).add(actual)
	for (const entry of (await readdir(path)).sort()) {
		if (!ignoredDirectories.has(entry)) {
			await walk(root, join(path, entry), action, next)
		}
	}
}
function options(value: Options): void {
	if (
		!value ||
		typeof value !== 'object' ||
		Array.isArray(value) ||
		Object.keys(value).some(
			(key) =>
				![
					'platforms',
					'hashAlgorithm',
					'ignorePaths',
					'extraSources',
					'toolchain',
					'nativeConfig',
				].includes(key),
		)
	) {
		throw new Error('Unsupported fingerprint option')
	}
	if (value.hashAlgorithm !== undefined && value.hashAlgorithm !== 'sha256') {
		throw new Error('Native fingerprints require SHA-256')
	}
	if (
		value.platforms !== undefined &&
		(!Array.isArray(value.platforms) ||
			!value.platforms.length ||
			value.platforms.some((p) => !['ios', 'android', 'macos', 'linux', 'windows'].includes(p)))
	) {
		throw new Error('Invalid fingerprint platforms')
	}
	if (
		value.ignorePaths !== undefined &&
		(!Array.isArray(value.ignorePaths) ||
			value.ignorePaths.some((p) => typeof p !== 'string' || !p || isAbsolute(p)))
	) {
		throw new Error('Fingerprint ignores must be relative glob patterns')
	}
	if (
		value.toolchain !== undefined &&
		(!value.toolchain ||
			typeof value.toolchain !== 'object' ||
			Array.isArray(value.toolchain) ||
			Object.values(value.toolchain).some((v) => typeof v !== 'string'))
	) {
		throw new Error('Fingerprint toolchain values must be strings')
	}
	if (value.extraSources !== undefined && !Array.isArray(value.extraSources)) {
		throw new Error('Fingerprint extraSources must be an array')
	}
	if (
		value.nativeConfig !== undefined &&
		(!value.nativeConfig ||
			typeof value.nativeConfig !== 'object' ||
			Array.isArray(value.nativeConfig))
	) {
		throw new Error('Resolved native configuration must be an object')
	}
}
function resolvePackage(name: string, root: string, optional = false): string | null {
	const require = createRequire(join(root, 'package.json'))
	for (const folder of require.resolve.paths(name) ?? []) {
		const manifest = join(folder, name, 'package.json')
		if (existsSync(manifest)) {
			return realpathSync(join(folder, name))
		}
	}
	if (optional) {
		return null
	}
	throw new Error(`Fingerprint dependency ${name} is not installed`)
}
/** Collect installed native inputs and the app's resolved NativeScript configuration. */
export async function createFingerprintAsync(
	projectRoot: string,
	supplied: Options = {},
): Promise<Fingerprint> {
	options(supplied)
	const root = await realpath(projectRoot)
	for (const file of [
		'fingerprint.config.js',
		'fingerprint.config.cjs',
		'fingerprint.config.mjs',
		'fingerprint.config.ts',
	]) {
		if (existsSync(join(root, file))) {
			throw new Error(
				'Use data-only fingerprint.config.json; executable fingerprint config is unsupported',
			)
		}
	}
	const config: Options = existsSync(join(root, 'fingerprint.config.json'))
		? await json(join(root, 'fingerprint.config.json'))
		: {}
	options(config)
	if (config.nativeConfig !== undefined) {
		throw new Error(
			'Resolved nativeConfig must come from the build hook, not fingerprint.config.json',
		)
	}
	const value = {
		...config,
		...supplied,
		toolchain: { ...config.toolchain, ...supplied.toolchain },
	}
	options(value)
	const platforms = [...new Set(value.platforms ?? ['ios', 'android'])].sort() as Platform[]
	const nativeConfig = value.nativeConfig ?? (await readNativeConfig(root))
	const resourcePath = resolve(
		root,
		typeof nativeConfig.appResourcesPath === 'string'
			? nativeConfig.appResourcesPath
			: 'App_Resources',
	)
	const resources = existsSync(resourcePath) ? await realpath(resourcePath) : resourcePath
	const patterns = [...(config.ignorePaths ?? []), ...(supplied.ignorePaths ?? [])]
	if (existsSync(join(root, '.fingerprintignore'))) {
		patterns.push(
			...(await readFile(join(root, '.fingerprintignore'), 'utf8'))
				.split(/\r?\n/)
				.map((v) => v.trim())
				.filter((v) => v && !v.startsWith('#')),
		)
	}
	const excluded = (path: string) => {
		let result = false
		for (const pattern of patterns) {
			if (minimatch(path, pattern.startsWith('!') ? pattern.slice(1) : pattern, { dot: true })) {
				result = !pattern.startsWith('!')
			}
		}
		return result
	}
	const records = new Map<string, FingerprintSource>()
	const add = (source: FingerprintSource) => {
		const key = id(source),
			previous = records.get(key)
		if (previous && previous.hash !== source.hash) {
			throw new Error(`Ambiguous native source ${key}`)
		}
		records.set(
			key,
			previous
				? { ...source, reasons: [...new Set([...previous.reasons, ...source.reasons])].sort() }
				: source,
		)
	}
	const contents = (name: string, bytes: unknown, reason: string) =>
		add({ type: 'contents', id: name, reasons: [reason], hash: hash(stable(bytes)) })
	const file = async (
		path: string,
		name: string,
		reason: string,
		critical = true,
		normalizeConfig = false,
	) => {
		const omit = excluded(name)
		if (omit && critical) {
			throw new Error(`Cannot ignore automatic native input ${name}`)
		}
		add({
			type: 'file',
			filePath: name,
			reasons: [reason],
			hash: omit
				? null
				: hash(
						normalizeConfig
							? (await readFile(path, 'utf8'))
									.replaceAll(resources, '<App_Resources>')
									.replaceAll(root, '<project>')
							: await readFile(path),
					),
		})
	}
	const tree = async (
		base: string,
		path: string,
		prefix: string,
		reason: string,
		critical = true,
		declarationsOnly = false,
	) => {
		if (existsSync(path)) {
			await walk(base, path, async (target) => {
				if (
					reason === 'local native Pod sources' &&
					/\.(?:[cm]?js|jsx|ts|tsx|tsrx|md|mdx|map)$/.test(target)
				) {
					return
				}
				if (declarationsOnly && slash(relative(path, target)).startsWith('types/generated/')) {
					return
				}
				if (!declarationsOnly || /\.d\.(?:ts|mts|cts)$/.test(target)) {
					await file(target, prefix + slash(relative(path, target)), reason, critical)
				}
			})
		}
	}
	const app = await json(join(root, 'package.json'))
	contents('collector', { format: NATIVE_FINGERPRINT_FORMAT, platforms }, 'collector contract')
	contents(
		'app-native-config',
		{
			nativescript: app.nativescript ?? null,
			xplat: app.xplat ?? null,
			packageManager: app.packageManager ?? null,
			toolchain: value.toolchain ?? {},
		},
		'declared native build settings',
	)
	contents(
		'resolved-native-config',
		configValue(nativeConfig, root, resources),
		'evaluated native build configuration',
	)
	for (const name of [
		'nativescript.config.ts',
		'nativescript.config.js',
		'nativescript.config.cjs',
		'native-toolchain.json',
	]) {
		if (existsSync(join(root, name))) {
			await file(join(root, name), name, 'native build configuration', true, true)
		}
	}
	const names: Record<Platform, string> = {
		ios: 'iOS',
		android: 'Android',
		macos: 'macos',
		linux: 'linux',
		windows: 'Windows',
	}
	for (const platform of platforms) {
		await tree(
			resources,
			join(resources, names[platform]),
			`App_Resources/${names[platform]}/`,
			'application native resources',
		)
		if (!['ios', 'android'].includes(platform)) {
			await tree(
				root,
				join(root, 'platforms', platform),
				`platforms/${platform}/`,
				'application desktop native sources',
			)
		}
		const nativeSources = nativeConfig[platform]?.NativeSource
		if (nativeSources !== undefined) {
			if (!Array.isArray(nativeSources)) {
				throw new Error('NativeSource must be a named source array')
			}
			for (const source of nativeSources) {
				if (
					!source ||
					typeof source.name !== 'string' ||
					!source.name ||
					typeof source.path !== 'string' ||
					!source.path
				) {
					throw new Error('Invalid NativeSource declaration')
				}
				const pattern = resolve(root, source.path)
				const prefix = pattern.split(/[*?[\]{}]/, 1)[0]!
				const base = await realpath(prefix.endsWith(sep) ? prefix : dirname(prefix))
				let count = 0
				for await (const match of glob(slash(pattern))) {
					await walk(base, match, async (input) => {
						await file(
							input,
							`native-source/${platform}/${source.name}/${slash(relative(base, input))}`,
							'resolved NativeSource declaration',
						)
						count++
					})
				}
				if (!count) {
					throw new Error(`NativeSource ${source.name} matches no files`)
				}
			}
		}
		await tree(
			root,
			join(root, 'native', platform),
			`native/${platform}/`,
			'application native sources',
		)
	}
	await tree(root, join(root, 'hooks'), 'hooks/', 'application native build hooks')
	let lockRoot = root
	while (!existsSync(join(lockRoot, 'pnpm-lock.yaml')) && dirname(lockRoot) !== lockRoot) {
		lockRoot = dirname(lockRoot)
	}
	const lock = existsSync(join(lockRoot, 'pnpm-lock.yaml'))
		? parse(await readFile(join(lockRoot, 'pnpm-lock.yaml'), 'utf8'))
		: null
	if (!lock?.packages || typeof lock.packages !== 'object') {
		throw new Error('A resolved pnpm lockfile is required for native fingerprints')
	}
	const workspace = existsSync(join(lockRoot, 'pnpm-workspace.yaml'))
		? parse(await readFile(join(lockRoot, 'pnpm-workspace.yaml'), 'utf8'))
		: {}
	const patchMap = {
		...workspace?.patchedDependencies,
		...app.pnpm?.patchedDependencies,
	}
	const visited = new Set<string>()
	const nativeIdentities = new Map<string, string>()
	async function visit(packageRoot: string, requiredName: string): Promise<void> {
		if (visited.has(packageRoot)) {
			return
		}
		visited.add(packageRoot)
		const pkg = await json(join(packageRoot, 'package.json'))
		if (typeof pkg.name !== 'string' || typeof pkg.version !== 'string') {
			throw new Error(`Incomplete dependency metadata for ${requiredName}`)
		}
		const runtimePlatform = /^@nativescript\/(?:types-)?(ios|android)$/.exec(pkg.name)?.[1]
		const native =
			(!runtimePlatform || platforms.includes(runtimePlatform as Platform)) &&
			((platforms.includes('macos') && pkg.xplat?.macos !== undefined) ||
				platforms.some((platform) => existsSync(join(packageRoot, 'platforms', platform))) ||
				existsSync(join(packageRoot, 'native')) ||
				['include.gradle', 'Podfile', 'Package.swift'].some((name) =>
					existsSync(join(packageRoot, name)),
				) ||
				/^@nativescript\/(?:core|ios|android|types(?:-.+)?)$/.test(pkg.name))
		if (native) {
			const identity = `${pkg.name}@${pkg.version}`,
				prefix = `node_modules/${pkg.name}/`
			const lockEntries = Object.entries(lock.packages)
				.filter(([key, raw]) => {
					if (key === identity || key.startsWith(identity + '(')) {
						return true
					}
					const entry = raw as { resolution?: { type?: string; directory?: string } }
					return (
						key.startsWith(pkg.name + '@file:') &&
						entry.resolution?.type === 'directory' &&
						typeof entry.resolution.directory === 'string' &&
						existsSync(resolve(lockRoot, entry.resolution.directory)) &&
						realpathSync(resolve(lockRoot, entry.resolution.directory)) === packageRoot
					)
				})
				.map(([key, raw]) => {
					const entry = raw as { resolution?: { type?: string } }
					return entry.resolution?.type === 'directory'
						? [identity + ':directory', { ...entry, resolution: { type: 'directory' } }]
						: [key, entry]
				})
			if (
				!lockEntries.length &&
				!Object.prototype.hasOwnProperty.call(
					lock.importers ?? {},
					slash(relative(lockRoot, packageRoot)),
				)
			) {
				throw new Error(`Native dependency ${identity} is missing lock metadata`)
			}
			const nativeDescriptor = stable({
				name: pkg.name,
				version: pkg.version,
				nativescript: pkg.nativescript ?? null,
				xplat: pkg.xplat ?? null,
				lock: lockEntries.map(([key, entry]) => [key, entry]),
				patch: lock.patchedDependencies?.[identity] ?? null,
			})
			const old = nativeIdentities.get(identity)
			if (old && old !== nativeDescriptor) {
				throw new Error(`Ambiguous installed native dependency ${identity}`)
			}
			nativeIdentities.set(identity, nativeDescriptor)
			contents(
				`dependency:${identity}`,
				JSON.parse(nativeDescriptor),
				'installed native dependency and lock resolution',
			)
			for (const platform of platforms) {
				await tree(
					packageRoot,
					join(packageRoot, 'platforms', platform),
					prefix + `platforms/${platform}/`,
					'native dependency sources',
				)
			}
			if (/^@nativescript\/(?:ios|android)$/.test(pkg.name)) {
				await tree(packageRoot, packageRoot, prefix, 'native runtime engine files')
			}
			for (const directory of ['libs', 'frameworks', 'jniLibs']) {
				await tree(
					packageRoot,
					join(packageRoot, directory),
					prefix + directory + '/',
					'native dependency libraries',
				)
			}
			await tree(
				packageRoot,
				join(packageRoot, 'native'),
				prefix + 'native/',
				'native bootstrap sources',
			)
			await tree(packageRoot, join(packageRoot, 'hooks'), prefix + 'hooks/', 'native build hooks')
			for (const filename of [
				'nativescript.config.js',
				'nativescript.config.ts',
				'include.gradle',
				'Podfile',
				'Package.swift',
				'prepare.cjs',
			]) {
				if (existsSync(join(packageRoot, filename))) {
					await file(
						join(packageRoot, filename),
						prefix + filename,
						'native dependency build settings',
					)
				}
			}
			await tree(packageRoot, packageRoot, prefix, 'native metadata declarations', true, true)
			const patch = patchMap[identity]
			if (patch) {
				const path = typeof patch === 'string' ? patch : patch.path
				if (typeof path !== 'string' || !within(lockRoot, resolve(lockRoot, path))) {
					throw new Error('Invalid native dependency patch path')
				}
				await file(resolve(lockRoot, path), `patches/${identity}`, 'native dependency patch')
			}
		}
		for (const name of Object.keys({ ...pkg.dependencies, ...pkg.optionalDependencies }).sort()) {
			const dependency = resolvePackage(
				name,
				packageRoot,
				Boolean(pkg.optionalDependencies?.[name] && !pkg.dependencies?.[name]),
			)
			if (dependency) {
				await visit(dependency, name)
			}
		}
	}
	const dependencies = {
		...app.dependencies,
		...app.optionalDependencies,
		...Object.fromEntries(
			Object.entries(app.devDependencies ?? {}).filter(([name]) =>
				name.startsWith('@nativescript/'),
			),
		),
	}
	for (const name of Object.keys(dependencies).sort()) {
		const dependency = resolvePackage(
			name,
			root,
			Boolean(app.optionalDependencies?.[name] && !app.dependencies?.[name]),
		)
		if (dependency) {
			await visit(dependency, name)
		}
	}
	await nativeResolutions(
		root,
		platforms,
		nativeConfig,
		(name, value) => contents(name, value, 'resolved native dependency lock'),
		tree,
	)
	for (const source of [
		...(config.extraSources ?? []),
		...(supplied.extraSources ?? []),
	] as HashSource[]) {
		if (
			!source ||
			!Array.isArray(source.reasons) ||
			source.reasons.some((reason) => typeof reason !== 'string')
		) {
			throw new Error('Invalid extra fingerprint source')
		}
		if (source.type === 'contents') {
			if (typeof source.id !== 'string' || !source.id || typeof source.contents !== 'string') {
				throw new Error('Invalid contents source')
			}
			add({
				type: 'contents',
				id: source.id,
				reasons: source.reasons,
				hash: excluded(source.id) ? null : hash(source.contents),
			})
		} else if (source.type === 'file' || source.type === 'dir') {
			if (typeof source.filePath !== 'string' || isAbsolute(source.filePath)) {
				throw new Error('Extra sources must be relative paths')
			}
			const path = resolve(root, source.filePath),
				actual = await realpath(path)
			if (!within(root, actual)) {
				throw new Error('Extra source escapes the project root')
			}
			if (source.type === 'file') {
				await file(path, slash(relative(root, path)), source.reasons.join('; '), false)
			} else {
				await tree(root, path, slash(relative(root, path)) + '/', source.reasons.join('; '), false)
			}
		} else {
			throw new Error('Unknown fingerprint source type')
		}
	}
	const sources = [...records.values()].sort((a, b) => (id(a) < id(b) ? -1 : id(a) > id(b) ? 1 : 0))
	return {
		sources,
		hash: hash(stable(sources.map((source) => ({ id: id(source), hash: source.hash })))),
	}
}
export async function createProjectHashAsync(root: string, options?: Options): Promise<string> {
	return (await createFingerprintAsync(root, options)).hash
}
export function diffFingerprints(before: Fingerprint, after: Fingerprint): FingerprintDiffItem[] {
	const a = new Map(before.sources.map((source) => [id(source), source])),
		b = new Map(after.sources.map((source) => [id(source), source]))
	return [...new Set([...a.keys(), ...b.keys()])].sort().flatMap<FingerprintDiffItem>((key) => {
		const old = a.get(key),
			next = b.get(key)
		return !old
			? [{ op: 'added', addedSource: next! }]
			: !next
				? [{ op: 'removed', removedSource: old }]
				: old.hash !== next.hash
					? [{ op: 'changed', beforeSource: old, afterSource: next }]
					: []
	})
}
export async function diffFingerprintChangesAsync(
	fingerprint: Fingerprint,
	root: string,
	options?: Options,
): Promise<FingerprintDiffItem[]> {
	return diffFingerprints(fingerprint, await createFingerprintAsync(root, options))
}
