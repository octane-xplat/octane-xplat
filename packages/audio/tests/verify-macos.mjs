// Public packed import checks and a nonvisual, silent AVPlayer target check.
// This never establishes audible output, system controls, or interruption recovery.
import assert from 'node:assert/strict'
import { spawn, spawnSync } from 'node:child_process'
import { cp, mkdir, symlink, writeFile } from 'node:fs/promises'
import { createServer } from 'node:http'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { build } from 'vite'
import { buildMacOSNative, writeNativeBootstrap } from '../../cli/src/macos/native.ts'
import { hostBundle } from '../../cli/src/macos/jsc-host/runtime.ts'

async function consumer(packed, app, source) {
	const installed = join(app, 'node_modules/@octane-xplat/audio')
	await mkdir(installed, { recursive: true })
	await cp(packed, installed, { recursive: true })
	await writeFile(
		join(app, 'package.json'),
		JSON.stringify({
			name: 'audio-fixture',
			type: 'module',
			dependencies: { '@octane-xplat/audio': '0.14.0' },
		}),
	)

	await writeFile(join(app, 'fixture.mjs'), source)
	await build({
		configFile: false,
		root: app,
		logLevel: 'error',
		resolve: { conditions: ['macos', 'native'] },
		build: {
			minify: false,
			lib: { entry: join(app, 'fixture.mjs'), formats: ['cjs'], fileName: () => 'fixture.cjs' },
		},
	})

	return join(app, 'dist/fixture.cjs')
}

export async function checkPublicImport(packed, app) {
	const script = await consumer(
		packed,
		app,
		`
import { createAudioPlayer } from '@octane-xplat/audio'
const unsupported = createAudioPlayer()
if (unsupported.capabilities().supported) throw Error('Missing bridge must be explicit')
unsupported.dispose()
let disposed = false
let state = 'idle'
globalThis.XplatAudioPlayer = { new: () => ({
  snapshot: () => JSON.stringify({ state, currentTime: 1.25, duration: 3.5 }),
  clear() { state = 'idle' },
  setSource(source) { if (source !== '/test.wav') throw Error('source differs'); state = 'paused' },
  play() { state = 'playing' }, pause() { state = 'paused' }, seekSeconds() {},
  dispose() { disposed = true }
}) }
async function check() {
  const player = createAudioPlayer()
  if (!player.capabilities().supported || player.capabilities().systemControls || player.capabilities().interruptions) throw Error('capabilities differ')
  await player.setQueue([{ id: 'one', source: '/test.wav' }])
  await player.play()
  if (player.snapshot().currentTime !== 1.25 || player.snapshot().duration !== 3.5) throw Error('seconds differ')
  await player.pause()
  await player.seek(0.5)
  player.dispose()
  if (!disposed) throw Error('dispose missing')
  console.log('PUBLIC_MACOS_AUDIO_IMPORT_OK')
}
check().catch(error => { console.error(error); process.exitCode = 1 })
`,
	)

	const result = spawnSync(process.execPath, [script], { encoding: 'utf8', timeout: 10_000 })
	assert.equal(result.status, 0, result.stdout + result.stderr)
	assert.match(result.stdout, /PUBLIC_MACOS_AUDIO_IMPORT_OK/)
	console.log('Public macOS import/construct/contract passes without mobile peers (mock bridge).')
}

function silentWav() {
	const samples = 8000 // One second of silence; no audible playback claim.
	const bytes = Buffer.alloc(44 + samples * 2)
	bytes.write('RIFF')
	bytes.writeUInt32LE(bytes.length - 8, 4)
	bytes.write('WAVEfmt ', 8)
	bytes.writeUInt32LE(16, 16)
	bytes.writeUInt16LE(1, 20)
	bytes.writeUInt16LE(1, 22)
	bytes.writeUInt32LE(8000, 24)
	bytes.writeUInt32LE(16000, 28)
	bytes.writeUInt16LE(2, 32)
	bytes.writeUInt16LE(16, 34)
	bytes.write('data', 36)
	bytes.writeUInt32LE(samples * 2, 40)
	return bytes
}

export async function verifyMacOS(packed, temporary) {
	assert.equal(process.platform, 'darwin', 'macOS target check requires macOS')
	const app = join(temporary, 'target')
	await mkdir(app, { recursive: true })
	const local = join(app, 'silence.wav')
	const malformed = join(app, 'malformed.wav')
	const wav = silentWav()
	await writeFile(local, wav)
	await writeFile(malformed, 'This is not audio')
	const server = createServer((request, response) => {
		if (request.url === '/audio.wav') {
			const range = /^bytes=(\d+)-(\d*)$/.exec(request.headers.range ?? '')
			const start = range ? Number(range[1]) : 0
			const end = range?.[2] ? Math.min(Number(range[2]), wav.length - 1) : wav.length - 1
			if (start > end) {
				response.writeHead(416, { 'Content-Range': `bytes */${wav.length}` })
				response.end()
				return
			}

			response.writeHead(range ? 206 : 200, {
				'Content-Type': 'audio/wav',
				'Accept-Ranges': 'bytes',
				'Content-Length': end - start + 1,
				...(range ? { 'Content-Range': `bytes ${start}-${end}/${wav.length}` } : {}),
			})

			response.end(wav.subarray(start, end + 1))
		} else {
			response.writeHead(404)
			response.end('missing')
		}
	})

	await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
	const remote = `http://127.0.0.1:${server.address().port}`
	try {
		const script = await consumer(
			packed,
			app,
			`
import { createAudioPlayer } from '@octane-xplat/audio'
const application = NSApplication.sharedApplication
let observedPlayer
const check = (condition, message) => { if (!condition) throw Error(message) }
const delay = () => new Promise(resolve => setTimeout(resolve, 50))
async function wait(predicate) {
  const deadline = Date.now() + 8000
  while (!predicate()) {
    const snapshot = observedPlayer?.snapshot()
    if (snapshot?.error) throw snapshot.error
    if (Date.now() > deadline) throw Error('condition timed out: ' + JSON.stringify(snapshot))
    await delay()
  }
}
async function main() {
  console.log('MACOS_AUDIO_BEGIN')
  const player = createAudioPlayer()
  observedPlayer = player
  let emissions = 0
  const unsubscribe = player.subscribe(() => emissions++)
  try {
    check(player.capabilities().supported, 'bridge absent')
    check(!player.capabilities().systemControls && !player.capabilities().interruptions, 'unsupported promises')
    await player.setQueue([{ id: 'local', source: ${JSON.stringify(local)} }])
    console.log('MACOS_AUDIO_READY', player.snapshot())
    check(player.snapshot().state === 'paused', 'readiness')
    check(Math.abs(player.snapshot().duration - 1) < 0.1, 'seconds duration')
    await player.seek(0.25)
    await wait(() => player.snapshot().currentTime >= 0.2)
    await player.play()
    await wait(() => player.snapshot().currentTime > 0.3)
    await player.pause()
    check(player.snapshot().state === 'paused', 'pause')
    await player.setQueue([{ id: 'local', source: ${JSON.stringify(local)} }, { id: 'remote', source: ${JSON.stringify(remote + '/audio.wav')} }])
    await player.play()
    await wait(() => player.snapshot().track?.id === 'remote')
    console.log('MACOS_AUDIO_ADVANCED', JSON.stringify(player.snapshot()))
    await wait(() => player.snapshot().state === 'ended')
    console.log('MACOS_AUDIO_ENDED')
    for (const source of [${JSON.stringify(malformed)}, ${JSON.stringify(remote + '/missing.wav')}, 'http://127.0.0.1:1/unreachable.wav']) {
      let rejected = false
      try { await player.setQueue([{ id: 'failure', source }]) } catch { rejected = true }
      check(rejected && player.snapshot().state === 'error' && player.snapshot().error, 'terminal load failure')
    }
    await player.setQueue([{ id: 'replacement', source: ${JSON.stringify(local)} }])
    await player.play()
    player.dispose()
    const count = emissions
    await delay(); await delay(); await delay()
    check(emissions === count && player.snapshot().state === 'idle', 'disposal notification leak')
    console.log('MACOS_AUDIO_TARGET_OK (silent fixture; no audible output evidence)')
  } finally { unsubscribe(); player.dispose() }
}
main().then(() => __xplatStopHost(), error => { console.log('MACOS_AUDIO_ERROR', String(error), error.stack ?? ''); __xplatStopHost() })
`,
		)

		await symlink(
			fileURLToPath(new URL('../../platform', import.meta.url)),
			join(app, 'node_modules/@octane-xplat/platform'),
		)
		const artifact = await buildMacOSNative(app)
		assert.deepEqual([...artifact.leaves].sort(), ['@octane-xplat/audio', '@octane-xplat/platform'])
		const bootstrap = join(app, 'bootstrap.js')
		await writeNativeBootstrap(artifact, bootstrap)
		const output = await new Promise((resolve, reject) => {
			const child = spawn(
				join(hostBundle, 'host'),
				[
					join(hostBundle, 'NativeScript.framework/Versions/A/NativeScript'),
					script,
					artifact.metadata,
					bootstrap,
				],
				{ cwd: app, env: { ...process.env, OCTANE_MACOS_EXTERNAL_RUNLOOP: '1' } },
			)

			let text = ''
			child.stdout.on('data', (chunk) => {
				text += chunk
			})

			child.stderr.on('data', (chunk) => {
				text += chunk
			})

			const timeout = setTimeout(() => child.kill('SIGKILL'), 45_000)
			child.once('error', (error) => {
				clearTimeout(timeout)
				reject(error)
			})

			child.once('close', (code, signal) => {
				clearTimeout(timeout)
				if (code === 0) {
					resolve(text)
				} else {
					reject(new Error(`host exited ${code} ${signal}: ${text}`))
				}
			})
		})

		assert.match(output, /MACOS_AUDIO_TARGET_OK/, output)
		console.log(output.trim())

		// Native-only injection exercises failures and stale notification ownership.
		const executable = join(app, 'native-lifecycle')
		const compiled = spawnSync(
			'xcrun',
			[
				'clang',
				'-fobjc-arc',
				'-fblocks',
				'-framework',
				'Foundation',
				'-framework',
				'AVFoundation',
				'-framework',
				'CoreMedia',
				'-I',
				join(packed, 'platforms/macos/include'),
				join(packed, 'platforms/macos/src/XplatAudioPlayer.m'),
				new URL('native-lifecycle.m', import.meta.url).pathname,
				'-o',
				executable,
			],
			{ encoding: 'utf8', timeout: 30_000 },
		)

		assert.equal(compiled.status, 0, compiled.stdout + compiled.stderr)
		const result = spawnSync(executable, [local], { encoding: 'utf8', timeout: 10_000 })
		assert.equal(result.status, 0, result.stdout + result.stderr)
		assert.match(result.stdout, /NATIVE_AUDIO_LIFECYCLE_OK/)
		console.log(result.stdout.trim())
	} finally {
		server.closeAllConnections()
		await new Promise((resolve) => server.close(resolve))
	}
}
