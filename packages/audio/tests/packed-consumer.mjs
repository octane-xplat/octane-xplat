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
import { inflateRawSync } from 'node:zlib'

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const repoRoot = resolve(packageRoot, '../..')
const temporary = mkdtempSync(join(tmpdir(), 'octane-xplat-audio-consumer-'))
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

// Inspect the shipped AAR/JAR without requiring an Android SDK or Java tools.
function zipEntry(archive, name) {
	const end = archive.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]))
	assert.ok(end >= 0, 'ZIP central directory exists')
	const count = archive.readUInt16LE(end + 10)
	let offset = archive.readUInt32LE(end + 16)
	for (let index = 0; index < count; index++) {
		assert.equal(archive.readUInt32LE(offset), 0x02014b50, 'valid ZIP directory entry')
		const nameLength = archive.readUInt16LE(offset + 28)
		const extraLength = archive.readUInt16LE(offset + 30)
		const commentLength = archive.readUInt16LE(offset + 32)
		if (archive.toString('utf8', offset + 46, offset + 46 + nameLength) === name) {
			const method = archive.readUInt16LE(offset + 10)
			const size = archive.readUInt32LE(offset + 20)
			const local = archive.readUInt32LE(offset + 42)
			assert.equal(archive.readUInt32LE(local), 0x04034b50, 'valid ZIP local entry')
			const start = local + 30 + archive.readUInt16LE(local + 26) + archive.readUInt16LE(local + 28)
			assert.ok(start + size <= archive.length, 'ZIP entry is complete')
			assert.ok(method === 0 || method === 8, 'ZIP entry uses stored or deflate compression')
			const data = archive.subarray(start, start + size)
			return method === 8 ? inflateRawSync(data) : data
		}

		offset += 46 + nameLength + extraLength + commentLength
	}
	assert.fail(`ZIP entry ${name} is present`)
}

// Deps the consumer needs in scope — the package's declared dependencies and
// peers plus the renderer's jsx-runtime source.
const dependencies = [
	'octane',
	'@nativescript-community/octane',
	'@nativescript/core',
	'@nativescript/types',
]

const consumers = {
	web: `import { createAudioPlayer, type AudioPlayer, type Track } from '@octane-xplat/audio'
const player: AudioPlayer = createAudioPlayer()
const track: Track = { id: 'one', source: 'one.mp3' }
const queued: Promise<void> = player.setQueue([track])
const paused: Promise<void> = player.pause()
const rate: Promise<void> = player.setPlaybackRate(1.5)
const volume: number = player.snapshot().volume
void rate
void volume
// @ts-expect-error Track.source is required
const badTrack: Track = { id: 'two' }
void queued
void paused
void badTrack
`,
	native: `import { createAudioPlayer, type AudioPlayer, type Track } from '@octane-xplat/audio'
const player: AudioPlayer = createAudioPlayer()
const track: Track = { id: 'one', source: 'one.mp3' }
const queued: Promise<void> = player.setQueue([track])
const paused: Promise<void> = player.pause()
const rate: Promise<void> = player.setPlaybackRate(1.5)
const volume: number = player.snapshot().volume
void rate
void volume
// @ts-expect-error Track.source is required
const badTrack: Track = { id: 'two' }
void queued
void paused
void badTrack
`,
}

consumers.macos = consumers.web

const macosGuide = readFileSync(
	new URL('../../../docs/platform/media-services.md', import.meta.url),
	'utf8',
)
	.split('### Playback speed and volume')[1]
	.split('## Recording audio')[0]

const extraFiles = Object.fromEntries(
	[...macosGuide.matchAll(/```ts\n([\s\S]*?)```/g)].map((match, index) => [
		`docs-macos-${index}.ts`,
		match[1],
	]),
)

// Mirrors the create template's per-target tsconfig: suffix typing selects
// .web/.mobile/.ios/.android/.macos declaration variants, `types` scopes the
// ambient globals, and skipLibCheck stays on — NativeScript's third-party
// ambient declarations carry upstream lib conflicts.
const targetConfig = {
	macos: { moduleSuffixes: ['.macos', ''], customConditions: ['macos', 'native'], types: [] },
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
}

function typecheck(packagePath, target, mode, exportMapIndex) {
	const consumerRoot = join(temporary, `map-${exportMapIndex}-${target}-${mode.name}`)
	const modules = join(consumerRoot, 'node_modules')
	const packageLink = join(modules, '@octane-xplat/audio')
	mkdirSync(dirname(packageLink), { recursive: true })
	cpSync(packagePath, packageLink, { recursive: true })
	for (const dependency of target === 'macos' ? [] : dependencies) {
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
	const androidClasses = zipEntry(
		readFileSync(join(packedRoot, 'platforms/android/audio.aar')),
		'classes.jar',
	)

	const bridge = zipEntry(androidClasses, 'com/xplat/audio/AudioBridge.class')
	const service = zipEntry(androidClasses, 'com/xplat/audio/AudioPlaybackService.class')
	for (const method of ['isCommandIntent', 'takeQueue']) {
		assert.ok(
			bridge.includes(Buffer.from(method)),
			`packed AudioBridge declares ${method}; rebuild the Android artifact`,
		)

		assert.ok(
			service.includes(Buffer.from(method)),
			`packed AudioPlaybackService calls ${method}; rebuild the Android artifact`,
		)
	}

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

		const { checkPublicImport } = await import('./verify-macos.mjs')
		await checkPublicImport(consumerPackage, join(temporary, `public-${index}`))

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

	if (process.argv.includes('--macos-runtime')) {
		const { verifyMacOS } = await import('./verify-macos.mjs')
		await verifyMacOS(packedRoot, temporary)
	}

	console.log(
		'audio packed consumer: web/native/macos exports typecheck in Bundler and NodeNext modes',
	)
} finally {
	if (process.env.XPLAT_AUDIO_KEEP_FIXTURE) {
		console.log('Retained audio fixture:', temporary)
	} else {
		rmSync(temporary, { recursive: true, force: true })
	}
}
