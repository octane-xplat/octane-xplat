import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import vm from 'node:vm'
import ts from 'typescript'

function load(path, imports = {}) {
	const source = readFileSync(new URL(path, import.meta.url), 'utf8')
	const sandbox = {
		exports: {},
		require: (name) => {
			assert.ok(Object.hasOwn(imports, name), `unexpected import ${name}`)
			return imports[name]
		},
		Error,
		Uint8Array,
		setInterval,
		clearInterval,
	}

	vm.runInNewContext(
		ts.transpile(source, { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }),
		sandbox,
	)

	return sandbox.exports
}

const wav = load('../src/wav.ts')
const { createMacOSRecorder } = load('../src/recorder-core.macos.ts', { './wav': wav })
class Host {
	permission = 'granted'
	starts = []
	stops = 0
	cancels = 0
	disposals = 0
	paused = 0
	resumes = 0
	durationSeconds = 0.25
	meterLevel = 0.5
	permissionStatus() {
		return this.permission
	}
	requestPermission(reply) {
		this.reply = reply
		if (this.permission !== 'undetermined') {
			reply(this.permission)
		}
	}
	installObserver(listener) {
		this.listener = listener
	}
	startTake(options) {
		this.starts.push(JSON.parse(options))
		return this.startError ?? ''
	}
	pause() {
		this.paused++
	}
	resume() {
		this.resumes++
		return this.resumeError ?? ''
	}
	stop() {
		this.stops++
	}
	cancel() {
		this.cancels++
	}
	status() {
		return JSON.stringify({ durationSeconds: this.durationSeconds, meterLevel: this.meterLevel })
	}
	dispose() {
		this.disposals++
	}
	event(type, rest = {}) {
		this.listener(JSON.stringify({ type, id: this.starts.at(-1)?.id, ...rest }))
	}
	finish(bytes = wav.encodeWavFloat32([new Float32Array([0.5, -0.5])], 16000)) {
		this.event('finished', {
			path: '/private/operation/take.wav',
			base64: Buffer.from(bytes).toString('base64'),
		})
	}
}

function fixture(t) {
	const host = new Host()
	const recorder = createMacOSRecorder(host)
	t.after(() => recorder.dispose())
	return { host, recorder }
}

test('macOS public source import does not evaluate mobile APIs', () => {
	const root = load('../src/index.macos.ts', {
		'./recorder.macos': load('../src/recorder.macos.ts', {
			'./recorder-core.macos': { createMacOSRecorder },
		}),
		'./types': {},
	})

	const recorder = root.createAudioRecorder()
	assert.equal(recorder.capabilities().supported, false)
	assert.equal(recorder.snapshot().permission, 'unsupported')
	recorder.dispose()
})

test('authorization pending is idle; start is exclusive and cancel settles before OS reply', async (t) => {
	const { host, recorder } = fixture(t)
	host.permission = 'undetermined'
	const start = recorder.start()
	assert.equal(recorder.snapshot().state, 'idle')
	assert.equal(host.starts.length, 0)
	await assert.rejects(recorder.start(), /starting/)
	await assert.rejects(recorder.stop(), /no take/)
	await recorder.cancel()
	await assert.rejects(start, /cancelled/)
	host.reply('granted')
	await Promise.resolve()
	assert.equal(host.starts.length, 0)
	assert.equal(recorder.snapshot().state, 'idle')
})

for (const [native, expected] of [
	['denied', 'denied'],
	['restricted', 'denied'],
	['unavailable', 'unavailable'],
	['undeclared', 'unsupported'],
]) {
	test(`permission ${native} retains ${expected} and rejects start with its cause`, async (t) => {
		const { host, recorder } = fixture(t)
		host.permission = native
		assert.equal(await recorder.requestPermission(), expected)
		await assert.rejects(recorder.start(), new RegExp(native))
		assert.equal(recorder.snapshot().state, 'error')
		assert.equal(recorder.snapshot().permission, expected)
		assert.equal(host.starts.length, 0)
	})
}

test('dispose settles authorization/start and ignores late permission replies', async (t) => {
	const { host, recorder } = fixture(t)
	host.permission = 'undetermined'
	const permission = recorder.requestPermission()
	const start = recorder.start()
	recorder.dispose()
	await assert.rejects(permission, /disposed/)
	await assert.rejects(start, /cancelled|disposed/)
	host.reply('granted')
	await Promise.resolve()
	assert.equal(host.starts.length, 0)
	assert.equal(host.disposals, 1)
	assert.equal(recorder.snapshot().state, 'idle')
})

test('pause, interruptions and foreground recovery require explicit resume', async (t) => {
	const { host, recorder } = fixture(t)
	await recorder.start()
	assert.equal(host.starts[0].sampleRate, 44100)
	assert.equal(host.starts[0].channels, 1)
	assert.equal(recorder.snapshot().state, 'recording')
	await recorder.pause()
	assert.equal(recorder.snapshot().state, 'paused')
	assert.equal(recorder.snapshot().meterLevel, null)
	await recorder.resume()
	host.event('interrupted')
	assert.equal(recorder.snapshot().state, 'interrupted')
	await assert.rejects(recorder.resume(), /interrupted/)
	host.event('interruptionEnded')
	assert.equal(recorder.snapshot().state, 'paused')
	assert.equal(host.resumes, 1)
	await recorder.resume()
	assert.equal(host.resumes, 2)
})

test('meter reports only during capture and pause retains captured duration', async (t) => {
	const { host, recorder } = fixture(t)
	await recorder.start()
	await new Promise((resolve) => setTimeout(resolve, 280))
	assert.equal(recorder.snapshot().meterLevel, 0.5)
	await recorder.pause()
	assert.equal(recorder.snapshot().durationSeconds, host.durationSeconds)
	assert.equal(recorder.snapshot().meterLevel, null)
})

test('stop waits for delegate, validates bytes and uses written metadata', async (t) => {
	const { host, recorder } = fixture(t)
	await recorder.start({ sampleRate: 44100, channels: 2 })
	const stop = recorder.stop()
	assert.equal(recorder.stop(), stop)
	let settled = false
	void stop.then(() => {
		settled = true
	})

	await Promise.resolve()
	assert.equal(settled, false)
	assert.equal(host.stops, 1)
	assert.equal(recorder.snapshot().state, 'paused')
	await assert.rejects(recorder.resume(), /cannot resume/)
	host.finish()
	const take = await stop
	assert.equal(take.mimeType, 'audio/wav')
	assert.equal(take.channels, 1)
	assert.equal(take.sampleRate, 16000)
	assert.equal(take.durationSeconds, 2 / 16000)
	assert.equal(take.bytes.length, 48)
	assert.equal(recorder.snapshot().state, 'idle')
})

test('invalid finalized WAV rejects stop, releases capture and deletes only current take', async (t) => {
	const { host, recorder } = fixture(t)
	await recorder.start()
	const stop = recorder.stop()
	host.finish(new Uint8Array(44))
	await assert.rejects(stop, /finalized/)
	assert.equal(recorder.snapshot().state, 'error')
	assert.equal(host.cancels, 1)
})

test('native write failure settles stop and cancel resets error', async (t) => {
	const { host, recorder } = fixture(t)
	await recorder.start()
	const stop = recorder.stop()
	host.event('error', { message: 'Disk full' })
	await assert.rejects(stop, /Disk full/)
	assert.equal(recorder.snapshot().state, 'error')
	await recorder.cancel()
	assert.equal(recorder.snapshot().state, 'idle')
	assert.equal(recorder.snapshot().error, undefined)
})

test('start/resume native failures publish error and release capture', async (t) => {
	const { host, recorder } = fixture(t)
	host.startError = 'Device busy'
	await assert.rejects(recorder.start(), /Device busy/)
	assert.equal(recorder.snapshot().state, 'error')
	await recorder.cancel()
	host.startError = ''
	await recorder.start()
	await recorder.pause()
	host.resumeError = 'Input lost'
	await assert.rejects(recorder.resume(), /Input lost/)
	assert.equal(recorder.snapshot().state, 'error')
})

for (const action of ['cancel', 'dispose']) {
	test(`${action} settles finalization and stale callbacks cannot finish a later take`, async (t) => {
		const { host, recorder } = fixture(t)
		await recorder.start()
		const id = host.starts[0].id
		const stop = recorder.stop()
		await recorder[action]()
		await assert.rejects(stop, /cancelled/)
		host.event('finished', { id, path: 'old.wav', base64: 'broken' })
		assert.equal(recorder.snapshot().state, 'idle')
		if (action === 'cancel') {
			await recorder.start()
			host.event('error', { id, message: 'Stale error' })
			assert.equal(recorder.snapshot().state, 'recording')
		}
	})
}

test('restart replaces take and resets omitted options to public defaults', async (t) => {
	const { host, recorder } = fixture(t)
	await recorder.start({ sampleRate: 16000, channels: 2 })
	await recorder.restart()
	assert.equal(host.starts[1].sampleRate, 44100)
	assert.equal(host.starts[1].channels, 1)
	assert.equal(host.cancels, 1)
})
