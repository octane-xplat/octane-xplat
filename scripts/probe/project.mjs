import { createHash } from 'node:crypto'
import { existsSync } from 'node:fs'
import { cp, mkdir, readFile, readdir, realpath, symlink, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

export const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
export const directory = dirname(fileURLToPath(import.meta.url))
export const appFor = (target) =>
	join(repo, 'apps', ['ios', 'android'].includes(target) ? 'mobile' : target)

export const hash = (value) => createHash('sha256').update(value).digest('hex').slice(0, 16)
export const caseIdentity = (target, caseFile) => hash(repo + '\n' + caseFile + '\n' + target)
export const json = async (path) => JSON.parse(await readFile(path, 'utf8'))
export const importFrom = async (root, specifier) => {
	const loaded = await import(
		pathToFileURL(createRequire(join(root, 'package.json')).resolve(specifier)).href
	)

	return loaded.default && typeof loaded.default === 'object'
		? { ...loaded.default, ...loaded }
		: loaded
}

async function packageRoot(name, roots) {
	for (const root of roots) {
		const candidate = join(root, 'node_modules', name)
		if (existsSync(join(candidate, 'package.json'))) {
			return realpath(candidate)
		}
	}

	for (const entry of await readdir(join(repo, 'packages'))) {
		const root = join(repo, 'packages', entry)
		if (
			existsSync(join(root, 'package.json')) &&
			(await json(join(root, 'package.json'))).name === name
		) {
			return root
		}
	}

	throw new Error(
		`Dependency ${name} is not installed. Install it in a workspace package before probing it.`,
	)
}

export async function filesUnder(root) {
	if (!existsSync(root)) {
		return []
	}

	const files = []
	for (const item of await readdir(root, { withFileTypes: true })) {
		if (item.name.startsWith('.') || item.name === 'node_modules') {
			continue
		}

		const path = join(root, item.name)
		if (item.isDirectory()) {
			files.push(...(await filesUnder(path)))
		} else if (item.isFile()) {
			files.push(path)
		}
	}

	return files
}

export async function dependencies(target, caseFile, extra) {
	const app = appFor(target)
	const pkg = await json(join(app, 'package.json'))
	const names = new Set(['octane', '@octane-xplat/ui', ...extra])
	if (target === 'macos') {
		names.add('@nativescript/macos-node-api')
	}

	if (['ios', 'android'].includes(target)) {
		for (const name of [
			'@nativescript/core',
			'@nativescript-community/octane',
			'@valor/nativescript-websockets',
		]) {
			names.add(name)
		}
	}

	const roots = [dirname(caseFile)]
	while (dirname(roots.at(-1)) !== roots.at(-1)) {
		roots.push(dirname(roots.at(-1)))
	}

	roots.push(
		app,
		...['web', 'mobile', 'macos', 'linux'].map((name) => join(repo, 'apps', name)),
		repo,
	)

	const resolved = new Map()
	for (const name of new Set([...names, ...Object.keys(pkg.devDependencies ?? {})])) {
		resolved.set(name, await packageRoot(name, roots))
	}

	const nativeFiles = []
	const visited = new Set()
	async function visit(root) {
		if (visited.has(root)) {
			return
		}

		visited.add(root)
		const manifest = await json(join(root, 'package.json'))
		nativeFiles.push(join(root, 'package.json'))
		nativeFiles.push(...(await filesUnder(join(root, 'platforms'))))
		for (const name of Object.keys({
			...manifest.dependencies,
			...manifest.optionalDependencies,
		})) {
			const candidate = join(root, 'node_modules', name)
			if (existsSync(join(candidate, 'package.json'))) {
				await visit(await realpath(candidate))
			}
		}
	}

	if (target !== 'web' && target !== 'linux') {
		for (const name of names) {
			await visit(resolved.get(name))
		}
	}

	return { names, resolved, nativeFiles, app, pkg }
}

export async function fingerprint(deps, resources) {
	const files = [
		...deps.nativeFiles,
		join(repo, 'pnpm-lock.yaml'),
		...(await filesUnder(directory)),
	]

	if (resources) {
		files.push(
			...(await filesUnder(resources)).filter((path) => !path.endsWith('google-services.json')),
		)
	}

	const digest = createHash('sha256')
	digest.update(JSON.stringify([...deps.resolved]))
	for (const path of [...new Set(files)].sort()) {
		digest.update(path)
		digest.update(await readFile(path))
	}

	return { key: digest.digest('hex').slice(0, 16), files }
}

export async function prepare(target, caseFile, extra = [], resources) {
	const deps = await dependencies(target, caseFile, extra)
	const native = ['ios', 'android'].includes(target)
	const resourceRoot = native ? (resources ?? join(deps.app, 'App_Resources')) : undefined
	const stamp = await fingerprint(deps, resourceRoot)
	const identity = caseIdentity(target, caseFile)
	const root = join(repo, 'research/probes', identity, 'build-' + stamp.key)
	await mkdir(join(root, 'src'), { recursive: true })
	await mkdir(join(root, 'node_modules'), { recursive: true })
	try {
		await symlink(join(deps.app, 'node_modules/.bin'), join(root, 'node_modules/.bin'))
	} catch (error) {
		if (error.code !== 'EEXIST') {
			throw error
		}
	}

	for (const [name, path] of deps.resolved) {
		const destination = join(root, 'node_modules', name)
		await mkdir(dirname(destination), { recursive: true })
		try {
			await symlink(path, destination)
		} catch (error) {
			if (error.code !== 'EEXIST') {
				throw error
			}
		}
	}

	const pkg = {
		name: 'xplat-isolated-probe',
		version: '0.0.0',
		private: true,
		main: 'src/index.ts',
		dependencies: Object.fromEntries(
			await Promise.all(
				[...deps.names].map(async (name) => [
					name,
					(await json(join(deps.resolved.get(name), 'package.json'))).version,
				]),
			),
		),
		devDependencies: Object.fromEntries(
			await Promise.all(
				[...deps.resolved]
					.filter(([name]) => !deps.names.has(name))
					.map(async ([name, path]) => [name, (await json(join(path, 'package.json'))).version]),
			),
		),
	}

	const appId = 'org.octanexplat.probe.p' + identity + '.p' + stamp.key
	if (target === 'macos') {
		pkg.type = 'module'
		pkg.xplat = {
			targets: {
				macos: {
					runtime: 'appkit-node-api',
					dev: {
						viteConfig: 'vite.case.config.mjs',
						bundleFile: 'dist/case.cjs',
						shellViteConfig: 'vite.shell.config.mjs',
						shellBundleFile: 'dist/shell.cjs',
					},
				},
			},
		}
	}

	await writeFile(join(root, 'package.json'), JSON.stringify(pkg, null, 2))
	if (native) {
		if (!existsSync(join(root, 'App_Resources'))) {
			await cp(resourceRoot, join(root, 'App_Resources'), {
				recursive: true,
				filter: (path) => !path.endsWith('google-services.json'),
			})
		}

		await writeFile(
			join(root, 'src/index.ts'),
			`import ${JSON.stringify(join(directory, 'mobile-host.mobile.mjs'))}\n`,
		)

		await writeFile(
			join(root, 'nativescript.config.ts'),
			`export default ${JSON.stringify({
				id: appId,
				appPath: 'src',
				appResourcesPath: 'App_Resources',
				cli: { packageManager: 'pnpm' },
				bundler: 'vite',
				bundlerConfigPath: 'vite.host.config.mts',
			})}\n`,
		)

		await writeFile(
			join(root, 'vite.host.config.mts'),
			`import { defineConfig } from 'vite'\nimport { xplatNative } from '@octane-xplat/cli/vite'\nimport { scratchResolver } from ${JSON.stringify(join(directory, 'project.mjs'))}\nexport default defineConfig(({mode}) => xplatNative(mode, {rules: [{include: '**/*.{tsx,tsrx}', renderer: 'nativescript'}], extra: {plugins: [scratchResolver(${JSON.stringify(root)})]}}))\n`,
		)
	}

	return { root, identity, appId, deps, stamp, resourceRoot }
}

/** Resolve scratch imports through the isolated project's declared deps. */
export function scratchResolver(project) {
	return {
		name: 'xplat-probe-dependencies',
		async resolveId(source, importer) {
			if (
				!importer ||
				source.startsWith('.') ||
				source.startsWith('/') ||
				source.startsWith('\0') ||
				source.startsWith('node:')
			) {
				return
			}

			const resolved = await this.resolve(source, importer, { skipSelf: true })
			if (resolved) {
				return resolved
			}

			return this.resolve(source, join(project, 'src/index.ts'), { skipSelf: true })
		},
	}
}
