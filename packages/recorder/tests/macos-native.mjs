import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { cp, mkdir, mkdtemp, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'
import ts from 'typescript'
import { build } from 'vite'
import { buildMacOSNative, writeNativeBootstrap } from '../../cli/src/macos/native.ts'
import { hostBundle } from '../../cli/src/macos/jsc-host/runtime.ts'

/** Packed leaf compilation, metadata and real bridge smoke without mic access.
 * Caller reserves native_builds:1. Real microphone qualification is separate. */
export async function checkMacOSNative(packedRoot) {
	assert.equal(process.platform, 'darwin', 'macOS check requires macOS')
	assert.equal(process.arch, 'arm64', 'macOS check requires Apple Silicon')
	const app = await mkdtemp(join(tmpdir(), 'xplat-recorder-native-'))
	try {
		await mkdir(join(app, 'node_modules/@octane-xplat'), { recursive: true })
		await cp(packedRoot, join(app, 'node_modules/@octane-xplat/recorder'), { recursive: true })
		await symlink(
			fileURLToPath(new URL('../../platform', import.meta.url)),
			join(app, 'node_modules/@octane-xplat/platform'),
		)

		await writeFile(
			join(app, 'package.json'),
			JSON.stringify({
				name: 'recorder-native-consumer',
				type: 'module',
				private: true,
				dependencies: { '@octane-xplat/recorder': '0.0.0' },
			}),
		)

		const fixture = join(app, 'wav-fixture')
		const compiled = spawnSync(
			'xcrun',
			[
				'swiftc',
				fileURLToPath(new URL('./wav-fixture.macos.swift', import.meta.url)),
				'-o',
				fixture,
			],
			{ encoding: 'utf8', timeout: 60_000 },
		)

		assert.equal(compiled.status, 0, `${compiled.stdout}\n${compiled.stderr}`)
		const wavePath = join(app, 'fixture.wav')
		const written = spawnSync(fixture, [wavePath], { encoding: 'utf8', timeout: 10_000 })
		assert.equal(written.status, 0, `${written.stdout}\n${written.stderr}`)
		const sandbox = { exports: {}, Uint8Array }
		vm.runInNewContext(
			ts.transpile(readFileSync(new URL('../src/wav.ts', import.meta.url), 'utf8'), {
				module: ts.ModuleKind.CommonJS,
				target: ts.ScriptTarget.ES2022,
			}),
			sandbox,
		)

		const bytes = new Uint8Array(readFileSync(wavePath))
		const metadata = sandbox.exports.inspectPcmWav(bytes)
		assert.equal(metadata.sampleRate, 16000)
		assert.equal(metadata.channels, 2)
		assert.equal(metadata.durationSeconds, 0.01)
		const dataAt = Buffer.from(bytes).indexOf('data') + 8
		const samples = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
		assert.equal(samples.getInt16(dataAt, true), 8192)
		assert.equal(samples.getInt16(dataAt + 2, true), -8192)
		console.log(
			'macOS AVFoundation finalized WAV: 16000 Hz stereo int16 samples and metadata passed',
		)

		const artifact = await buildMacOSNative(app)
		assert.ok(artifact.leaves.includes('@octane-xplat/recorder'))
		const bootstrap = join(app, 'bootstrap.js')
		await writeNativeBootstrap(artifact, bootstrap)
		const source = join(app, 'consumer.ts')
		await writeFile(
			source,
			`
import { createAudioRecorder } from '@octane-xplat/recorder'
const check = (value, message) => { if (!value) throw Error(message) }
async function run() {
	check(typeof XplatAudioRecorder !== 'undefined', 'Missing recorder metadata')
	const host = XplatAudioRecorder.alloc().init()
	check(host.permissionStatus() === 'undeclared', 'Test host must lack microphone declaration')
	let replied = false
	host.requestPermission((status) => { check(status === 'undeclared', 'Permission callback'); replied = true })
	check(replied, 'Native callback selector')
	check(JSON.parse(host.status()).durationSeconds === 0, 'Bridge status')
	host.installObserver(() => { throw Error('Unexpected native capture event') })
	check(host.startTake('{}').length > 0, 'Guard prevents capture')
	host.pause()
	check(host.resume().length > 0, 'Guard prevents resume')
	host.stop()
	host.cancel()
	host.dispose()
	const recorder = createAudioRecorder()
	check(recorder.capabilities().supported, 'Packed macOS bridge must be used')
	check(recorder.snapshot().state === 'idle', 'Initial state')
	check(await recorder.requestPermission() === 'unsupported', 'Missing usage permission')
	try { await recorder.start(); throw Error('Unexpected start') }
	catch (error) { check(String(error).includes('undeclared'), 'Missing usage start reason') }
	check(recorder.snapshot().state === 'error', 'Start rejection state')
	await recorder.cancel()
	recorder.dispose()
	check(recorder.snapshot().state === 'idle', 'Disposed state')
	console.log('MACOS_RECORDER_PACKED_BRIDGE_OK')
	setTimeout(() => globalThis.__xplatStopHost(), 0)
}
run().catch((error) => { console.error(String(error)); throw error })
`,
		)

		await build({
			configFile: false,
			root: app,
			resolve: { conditions: ['macos'] },
			build: {
				outDir: join(app, 'dist'),
				minify: false,
				lib: { entry: source, formats: ['cjs'], fileName: () => 'consumer.cjs' },
			},
		})

		const result = spawnSync(
			join(hostBundle, 'host'),
			[
				join(hostBundle, 'NativeScript.framework/Versions/A/NativeScript'),
				join(app, 'dist/consumer.cjs'),
				artifact.metadata,
				bootstrap,
			],
			{ encoding: 'utf8', timeout: 15_000 },
		)

		assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`)
		assert.match(`${result.stdout}\n${result.stderr}`, /MACOS_RECORDER_PACKED_BRIDGE_OK/)
		console.log(
			'macOS packed recorder: Swift/metadata/public bridge smoke passed; microphone untouched',
		)
	} finally {
		await rm(app, { recursive: true, force: true })
	}
}
