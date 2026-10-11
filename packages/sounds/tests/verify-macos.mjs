// Nonvisual packed API checks. Silent native fixtures do not prove audible output.
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { cp, mkdir, writeFile } from 'node:fs/promises'
import { createServer } from 'node:http'
import { join } from 'node:path'
import { build } from 'vite'
import { hostBundle, hostRoot } from '../../cli/src/macos/jsc-host/runtime.mjs'

async function consumer(packed, app, source) {
	const installed = join(app, 'node_modules/@octane-xplat/sounds')
	await mkdir(installed, { recursive: true })
	await cp(packed, installed, { recursive: true })
	await writeFile(join(app, 'package.json'), JSON.stringify({ type: 'module' }))
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
import { createSoundBank } from '@octane-xplat/sounds'
async function check() {
 const bank = createSoundBank({ maxVoices: 2 })
 if (bank.capabilities().supported) throw Error('Missing AppKit must be explicit')
 if (bank.capabilities().maxVoices !== 2) throw Error('Voice limit differs')
 let rejected = false
 try { await bank.load('one', '/missing') } catch { rejected = true }
 if (!rejected || await bank.play('one')) throw Error('Unsupported behavior differs')
 bank.stop(); bank.dispose(); bank.dispose()
 console.log('PUBLIC_MACOS_SOUNDS_IMPORT_OK')
}
check().catch(error => { console.error(error); process.exitCode = 1 })
`,
	)

	const result = spawnSync(process.execPath, [script], { encoding: 'utf8', timeout: 10_000 })
	assert.equal(result.status, 0, result.stdout + result.stderr)
	assert.match(result.stdout, /PUBLIC_MACOS_SOUNDS_IMPORT_OK/)
	console.log('Packed macOS public import/construct passes without mobile peers.')
}

function silentWav() {
	const samples = 16000
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
	assert.equal(process.platform, 'darwin')
	const app = join(temporary, 'target')
	await mkdir(app, { recursive: true })
	const local = join(app, 'silence.wav')
	const malformed = join(app, 'malformed.wav')
	await writeFile(local, silentWav())
	await writeFile(malformed, 'not audio')
	const server = createServer((request, response) => {
		if (request.url === '/slow') {
			return
		}

		response.writeHead(request.url === '/audio.wav' ? 200 : 404, { 'Content-Type': 'audio/wav' })
		response.end(request.url === '/audio.wav' ? silentWav() : 'missing')
	})

	await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
	const remote = `http://127.0.0.1:${server.address().port}`
	try {
		const script = await consumer(
			packed,
			app,
			`
import { createSoundBank } from '@octane-xplat/sounds'
const application = NSApplication.sharedApplication
console.log('MACOS_SOUNDS_BEGIN')
const check = (condition, message) => { if (!condition) throw Error(message) }
// Observe the actual system players without replacing their native behavior.
const systemPlayer = AVAudioPlayer
const players = []
const playerFactory = { alloc: () => ({ initWithDataError(data, error) {
 const player = systemPlayer.alloc().initWithDataError(data, error)
 if (player) players.push(player)
 return player
} }) }
Object.defineProperty(globalThis, 'AVAudioPlayer', { configurable: true, value: playerFactory })
check(AVAudioPlayer === playerFactory, 'native observation factory not installed')
const delay = ms => new Promise(resolve => setTimeout(resolve, ms))
async function main() {
 const bank = createSoundBank({ maxVoices: 2 })
 try {
  check(bank.capabilities().supported, 'AppKit APIs unavailable')
  console.log('MACOS_SOUNDS_CAPABLE')
  await bank.load('one', ${JSON.stringify(local)})
  console.log('MACOS_SOUNDS_LOCAL_READY')
  await bank.load('two', { uri: ${JSON.stringify(remote + '/audio.wav')} })
  check(await bank.play('one', { volume: 0.25 }), 'first play failed')
  const first = players[players.length - 1]
  check(await bank.play('one', { volume: 0.75 }), 'second play failed')
  const second = players[players.length - 1]
  await delay(100)
  check(first.playing && second.playing, 'same-clip overlap failed')
  check(first.currentTime > 0 && second.currentTime > 0, 'players did not progress')
  check(Math.abs(first.volume - 0.25) < 0.01 && Math.abs(second.volume - 0.75) < 0.01, 'per-play volume failed')
  check(await bank.play('two', { volume: 5 }), 'remote play failed')
  const third = players[players.length - 1]
  check(!first.playing && second.playing && third.playing, 'oldest eviction failed')
  check(third.volume === 1, 'volume clamp failed')
  bank.stop('one')
  check(!second.playing && third.playing, 'targeted stop failed')
  bank.stop()
  check(!third.playing, 'global stop failed')
  check(await bank.play('one'), 'replay failed')
  const finishing = players[players.length - 1]
  await delay(2300)
  check(!finishing.playing, 'natural completion failed')
  check(await bank.play('one'), 'play after completion failed')
  await bank.load('one', { uri: ${JSON.stringify('file://' + local)} })
  check(players.every(p => !p.playing), 'reload did not stop old voice')
  for (const source of [${JSON.stringify(malformed)}, ${JSON.stringify(join(app, 'missing.wav'))}, ${JSON.stringify(remote + '/missing')}]) {
   let rejected = false
   try { await bank.load('bad', source) } catch { rejected = true }
   check(rejected && !(await bank.play('bad')), 'failed load became playable')
  }
  const loading = bank.load('slow', ${JSON.stringify(remote + '/slow')})
  const cancelled = loading.then(() => false, () => true)
  check(await bank.play('one'), 'final play failed')
  bank.dispose(); bank.dispose()
  check(await cancelled, 'disposal did not reject pending load')
  check(players.every(p => !p.playing), 'disposal leaked playback')
  check(!(await bank.play('one')), 'disposed bank played')
  console.log('MACOS_SOUNDS_TARGET_OK (silent fixture; audible output unqualified)')
 } finally { bank.dispose(); Object.defineProperty(globalThis, 'AVAudioPlayer', { configurable: true, value: systemPlayer }) }
}
main().then(() => __xplatStopHost(), error => { console.log('MACOS_SOUNDS_ERROR', String(error), error.stack || ''); __xplatStopHost() })
`,
		)

		// Use the existing system metadata and host shim; no added native engine/library.
		const { spawn } = await import('node:child_process')
		const output = await new Promise((resolve, reject) => {
			const child = spawn(
				join(hostBundle, 'host'),
				[
					join(hostBundle, 'NativeScript.framework/Versions/A/NativeScript'),
					script,
					join(hostBundle, 'metadata.nsmd'),
					join(hostRoot, 'shim.js'),
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

			const timeout = setTimeout(() => child.kill('SIGKILL'), 20_000)
			child.once('error', (error) => {
				clearTimeout(timeout)
				reject(error)
			})

			child.once('close', (code, signal) => {
				clearTimeout(timeout)
				if (code === 0) {
					resolve(text)
				} else {
					reject(Error(`host exited ${code} ${signal}: ${text}`))
				}
			})
		})

		assert.match(output, /MACOS_SOUNDS_TARGET_OK/, output)
		console.log(output.trim())
	} finally {
		server.closeAllConnections()
		await new Promise((resolve) => server.close(resolve))
	}
}
