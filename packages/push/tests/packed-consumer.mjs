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
import { build } from 'vite'

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const repoRoot = resolve(packageRoot, '../..')
const temporary = mkdtempSync(join(tmpdir(), 'octane-xplat-push-consumer-'))
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
// peers plus the renderer's jsx-runtime source.
const dependencies = [
	'firebase',
	'@nativescript/firebase-core',
	'@nativescript/firebase-messaging',
	'octane',
	'@nativescript-community/octane',
	'@nativescript/core',
	'@nativescript/types',
]

const consumers = {
	web: `import { push, type PushMessage, type PushPermission } from '@octane-xplat/push'
const configured: Promise<void> = push.configure()
const token: Promise<string | null> = push.getToken()
const unsubscribe: () => void = push.onMessage((message: PushMessage) => void message.title)
const permission: Promise<PushPermission> = push.requestPermission()
void configured
void token
void unsubscribe
void permission
`,
	native: `import { push, type PushMessage, type PushPermission } from '@octane-xplat/push'
const configured: Promise<void> = push.configure()
const token: Promise<string | null> = push.getToken()
const unsubscribe: () => void = push.onMessage((message: PushMessage) => void message.title)
const permission: Promise<PushPermission> = push.requestPermission()
void configured
void token
void unsubscribe
void permission
`,
	macos: `import { push, type Push, type PushConfigureOptions, type PushPermission } from '@octane-xplat/push'
const service: Push = push
const options: PushConfigureOptions = {}
const supported: boolean = service.supported
const configured: boolean = service.configured
const configuration: Promise<void> = service.configure(options)
const permission: Promise<PushPermission> = service.requestPermission()
const token: Promise<string | null> = service.getToken()
const deletion: Promise<void> = service.deleteToken()
const offMessage: () => void = service.onMessage((message) => void message.title)
const offOpen: () => void = service.onNotificationOpen((message) => void message.data)
const offRefresh: () => void = service.onTokenRefresh((value: string) => void value)
void [supported, configured, configuration, permission, token, deletion, offMessage, offOpen, offRefresh]
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
		customConditions: ['macos', 'native'],
		types: [],
	},
}

async function checkMacOSRuntime(packagePath, exportMapIndex) {
	const consumerRoot = join(temporary, `runtime-${exportMapIndex}-macos`)
	const packageLink = join(consumerRoot, 'node_modules/@octane-xplat/push')
	mkdirSync(dirname(packageLink), { recursive: true })
	cpSync(packagePath, packageLink, { recursive: true })
	// No Firebase, NativeScript or renderer dependencies in this consumer.
	writeFileSync(join(consumerRoot, 'package.json'), '{"type":"module"}\n')
	cpSync(join(packageRoot, 'tests/macos-contract.mjs'), join(consumerRoot, 'contract.mjs'))
	const entry = join(consumerRoot, 'consumer.mjs')
	writeFileSync(
		entry,
		`import { push } from '@octane-xplat/push'
export { push }
`,
	)

	const result = await build({
		configFile: false,
		root: consumerRoot,
		logLevel: 'error',
		resolve: { conditions: ['macos', 'native'], extensions: ['.macos.ts', '.ts', '.js'] },
		build: {
			lib: { entry, formats: ['es'], fileName: () => 'consumer.js' },
			minify: false,
		},
	})

	const outputs = (Array.isArray(result) ? result : [result]).flatMap((output) => output.output)
	const modules = outputs
		.filter((item) => item.type === 'chunk')
		.flatMap((item) => Object.keys(item.modules))

	assert.ok(
		modules.some((name) => /(?:index|push)\.macos\.ts$|\/dist\/macos\//.test(name)),
		'macos wins over native in both export maps',
	)

	assert.ok(
		modules.every((name) => !/firebase|\/dist\/native\/|\/src\/push\.ts$/.test(name)),
		'macOS consumer never loads mobile Firebase',
	)

	writeFileSync(
		join(consumerRoot, 'verify.mjs'),
		`import { assertMacOSPush } from './contract.mjs'
const { push } = await import('./dist/consumer.js')
await assertMacOSPush(push)
`,
	)

	run(process.execPath, ['verify.mjs'], consumerRoot)
	// Published ESM must also resolve directly without a bundler or SDK deps.
	const manifest = JSON.parse(readFileSync(join(packageLink, 'package.json'), 'utf8'))
	if (manifest.exports['.'].macos.default.startsWith('./dist/')) {
		writeFileSync(
			join(consumerRoot, 'verify-node.mjs'),
			`import { assertMacOSPush } from './contract.mjs'
import { push } from '@octane-xplat/push'
await assertMacOSPush(push)
`,
		)

		run(
			process.execPath,
			['--conditions=macos', '--conditions=native', 'verify-node.mjs'],
			consumerRoot,
		)
	}
}

function typecheck(packagePath, target, mode, exportMapIndex) {
	const consumerRoot = join(temporary, `map-${exportMapIndex}-${target}-${mode.name}`)
	const modules = join(consumerRoot, 'node_modules')
	const packageLink = join(modules, '@octane-xplat/push')
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

	writeFileSync(join(consumerRoot, 'consumer.ts'), consumers[target])
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
					moduleSuffixes: config.moduleSuffixes,
					customConditions: config.customConditions,
					types: config.types.filter((name) => {
						const segments = name.split('/')
						const pkg = name.startsWith('@') ? segments.slice(0, 2) : segments.slice(0, 1)
						return existsSync(join(modules, ...pkg, 'package.json'))
					}),
					skipLibCheck: true,
				},
				files: ['consumer.ts', ...Object.keys(extraFiles)],
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
		await checkMacOSRuntime(consumerPackage, index)

		for (const target of Object.keys(consumers)) {
			// Subpath exports absent from a map (e.g. ./macos only exists in the
			// workspace map) cannot resolve — skip that lane for that map.
			const targetSubpaths = targetConfig[target].subpaths ?? ['.']
			if (!targetSubpaths.every((subpath) => exportsMap[subpath])) {
				continue
			}

			for (const mode of [
				{
					name: 'bundler',
					module: 'esnext',
					moduleResolution: 'bundler',
				},
				{
					name: 'nodenext',
					module: 'nodenext',
					moduleResolution: 'nodenext',
				},
			]) {
				typecheck(consumerPackage, target, mode, index)
			}
		}
	}

	console.log(
		'push packed consumer: web/native/macos types pass; macOS imports and subscriptions are inert',
	)
} finally {
	rmSync(temporary, { recursive: true, force: true })
}
