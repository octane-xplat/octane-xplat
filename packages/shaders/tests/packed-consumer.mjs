import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import {
	cpSync,
	existsSync,
	mkdirSync,
	mkdtempSync,
	readdirSync,
	readFileSync,
	rmSync,
	symlinkSync,
	writeFileSync,
} from 'node:fs'

import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const repoRoot = resolve(packageRoot, '../..')
const temporary = mkdtempSync(join(tmpdir(), 'octane-xplat-shaders-consumer-'))
const packOutput = join(temporary, 'pack')
const extractedRoot = join(temporary, 'extracted')
mkdirSync(packOutput)
mkdirSync(extractedRoot)

function run(command, args, cwd) {
	const result = spawnSync(command, args, { cwd, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 })
	if (result.stdout) {
		process.stdout.write(result.stdout)
	}

	if (result.stderr) {
		process.stderr.write(result.stderr)
	}

	if (result.error) {
		throw result.error
	}

	if (result.status !== 0) {
		throw new Error(`${command} exited with ${result.status}`)
	}
}

// Deps the consumer needs in scope — the package's declared dependencies and
// peers plus the upstream engine.
const dependencies = [
	'shaders',
	'typegpu',
	'@octane-xplat/canvas',
	'@nativescript-community/octane',
	'@nativescript/core',
	'@nativescript/types',
	'@nativescript/canvas',
	'octane',
]

const consumers = {
	web: `import {
	createShader,
	createSharedDevice,
	getWebGPUSupport,
	isWebGPUSupported,
	prefersReducedMotion,
} from '@octane-xplat/shaders'
import type { CreateShaderOptions, PresetConfig, ShaderInstance } from '@octane-xplat/shaders'
const preset: PresetConfig = {
	components: [{ type: 'SimplexNoise', id: 'bg', props: { seed: 7, speed: 0.5 } }],
}
const options: CreateShaderOptions = { disableTelemetry: true, signal: new AbortController().signal }
async function mount(canvas: HTMLCanvasElement): Promise<ShaderInstance> {
	return createShader(canvas, preset, options)
}
async function release(instance: ShaderInstance) {
	instance.update('bg', { seed: 1 })
	instance.resize()
	instance.pause()
	instance.resume()
	instance.destroy()
}
// @ts-expect-error preset must carry a components array
const badPreset: PresetConfig = { components: 'SimplexNoise' }
void mount
void release
void badPreset
void createSharedDevice
void getWebGPUSupport
void isWebGPUSupported
void prefersReducedMotion
`,
	native: `import {
	createShader,
	createSharedDevice,
	getWebGPUSupport,
	isWebGPUSupported,
	prefersReducedMotion,
} from '@octane-xplat/shaders'
import type { CreateShaderOptions, PresetConfig, ShaderInstance } from '@octane-xplat/shaders'
const preset: PresetConfig = {
	components: [{ type: 'SimplexNoise', id: 'bg', props: { seed: 7, speed: 0.5 } }],
}
const options: CreateShaderOptions = { disableTelemetry: true }
async function mount(surface: unknown): Promise<ShaderInstance> {
	return createShader(surface, preset, options)
}
void mount
void createSharedDevice
void getWebGPUSupport
void isWebGPUSupported
void prefersReducedMotion
`,
	macos: `import {
	createShader,
	createSharedDevice,
	getWebGPUSupport,
	isWebGPUSupported,
	prefersReducedMotion,
} from '@octane-xplat/shaders'
import type { PresetConfig, ShaderInstance } from '@octane-xplat/shaders'
const preset: PresetConfig = { components: [{ type: 'SimplexNoise', id: 'bg' }] }
async function mount(surface: unknown): Promise<ShaderInstance> {
	// Native desktop is explicitly unsupported — the resolved instance is a
	// no-op reporting 'unsupported'.
	const instance = await createShader(surface, preset)
	return instance
}
void mount
void createSharedDevice
void getWebGPUSupport
void isWebGPUSupported
void prefersReducedMotion
`,
}

const extraFiles = {}

// Mirrors the create template's per-target tsconfig: suffix typing selects
// .web/.mobile/.ios/.android/.macos declaration variants, `types` scopes the
// ambient globals, and skipLibCheck stays on — NativeScript's third-party
// ambient declarations carry upstream lib conflicts.
const targetConfig = {
	web: {
		moduleSuffixes: ['.web', ''],
		customConditions: ['web'],
		types: [],
	},
	native: {
		moduleSuffixes: ['.ios', '.android', '.mobile', ''],
		customConditions: ['native'],
		types: ['@nativescript/types'],
	},
	macos: {
		moduleSuffixes: ['.macos', ''],
		customConditions: ['macos'],
		types: [],
	},
}

function typecheck(packagePath, target, mode, exportMapIndex) {
	const consumerRoot = join(temporary, `map-${exportMapIndex}-${target}-${mode.name}`)
	const modules = join(consumerRoot, 'node_modules')
	const packageLink = join(modules, '@octane-xplat/shaders')
	mkdirSync(dirname(packageLink), { recursive: true })
	cpSync(packagePath, packageLink, { recursive: true })
	for (const dependency of dependencies) {
		const source = join(packageRoot, 'node_modules', dependency)
		const fallback = join(repoRoot, 'node_modules', dependency)
		const resolved = existsSync(source) ? source : existsSync(fallback) ? fallback : null
		if (!resolved) {
			continue
		}

		const targetPath = join(modules, dependency)
		mkdirSync(dirname(targetPath), { recursive: true })
		symlinkSync(resolved, targetPath, 'dir')
	}

	// ESM consumer — NodeNext treats extensionless .tsx as CJS without it,
	// which would let an ESM-only package slip type checks its runtime
	// resolution can't satisfy.
	writeFileSync(
		join(consumerRoot, 'package.json'),
		JSON.stringify({ name: `consumer-${exportMapIndex}-${target}-${mode.name}`, type: 'module' }),
	)

	writeFileSync(join(consumerRoot, 'consumer.tsx'), consumers[target])
	for (const [name, contents] of Object.entries(extraFiles)) {
		writeFileSync(join(consumerRoot, name), contents)
	}

	const config = targetConfig[target]
	const configPath = join(consumerRoot, `tsconfig.${mode.name}.json`)
	writeFileSync(
		configPath,
		JSON.stringify(
			{
				compilerOptions: {
					strict: true,
					noEmit: true,
					module: mode.module,
					moduleResolution: mode.moduleResolution,
					target: 'esnext',
					jsx: 'react-jsx',
					moduleSuffixes: config.moduleSuffixes,
					customConditions: config.customConditions,
					types: config.types.filter((name) => {
						const segments = name.split('/')
						const pkg = name.startsWith('@') ? segments.slice(0, 2) : segments.slice(0, 1)
						return existsSync(join(modules, ...pkg, 'package.json'))
					}),
					skipLibCheck: true,
				},
				files: ['consumer.tsx', ...Object.keys(extraFiles)],
			},
			null,
			2,
		),
	)

	run(
		process.execPath,
		[join(repoRoot, 'node_modules/typescript/bin/tsc'), '--project', configPath],
		consumerRoot,
	)
}

try {
	run('pnpm', ['pack', '--pack-destination', packOutput], packageRoot)
	const tarballs = readdirSync(packOutput).filter((name) => name.endsWith('.tgz'))
	assert.equal(tarballs.length, 1, 'pnpm pack produces one tarball')
	run('tar', ['-xzf', join(packOutput, tarballs[0]), '-C', extractedRoot], temporary)
	const packedRoot = join(extractedRoot, 'package')
	const packedManifest = JSON.parse(readFileSync(join(packedRoot, 'package.json'), 'utf8'))
	const workspaceManifest = JSON.parse(readFileSync(join(packageRoot, 'package.json'), 'utf8'))

	const exportMaps = [
		workspaceManifest.exports,
		workspaceManifest.publishConfig?.exports ?? packedManifest.exports,
	]

	const uniqueExportMaps = exportMaps.filter(
		(exportsMap, index) =>
			exportsMap &&
			exportMaps.findIndex(
				(candidate) => JSON.stringify(candidate) === JSON.stringify(exportsMap),
			) === index,
	)

	for (const [index, exportsMap] of uniqueExportMaps.entries()) {
		const consumerPackage = join(temporary, `package-${index}`)
		cpSync(packedRoot, consumerPackage, { recursive: true })
		const consumerManifestPath = join(consumerPackage, 'package.json')
		const consumerManifest = JSON.parse(readFileSync(consumerManifestPath, 'utf8'))
		consumerManifest.exports = exportsMap
		writeFileSync(consumerManifestPath, `${JSON.stringify(consumerManifest, null, 2)}\n`)

		for (const target of Object.keys(consumers)) {
			// Subpath exports absent from a map (e.g. ./macos only exists in the
			// workspace map) cannot resolve — skip that lane for that map.
			const targetSubpaths = targetConfig[target].subpaths ?? ['.']
			if (!targetSubpaths.every((subpath) => exportsMap[subpath])) {
				continue
			}

			// Bundler only: upstream `shaders` declarations use extensionless
			// relative imports, so they cannot be resolved in NodeNext mode —
			// our re-exported types would collapse there regardless of our own
			// map shape. Documented upstream packaging limitation.
			for (const mode of [
				{
					name: 'bundler',
					module: 'esnext',
					moduleResolution: 'bundler',
				},
			]) {
				typecheck(consumerPackage, target, mode, index)
			}
		}
	}

	console.log('shaders packed consumer: exports typecheck in Bundler mode')
} finally {
	rmSync(temporary, { recursive: true, force: true })
}
