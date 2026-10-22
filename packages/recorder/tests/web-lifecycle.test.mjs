import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import vm from 'node:vm'
import ts from 'typescript'

const compile = (file) => ts.transpile(
	readFileSync(new URL(`../src/${file}.ts`, import.meta.url), 'utf8'),
	{ module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
)
const wav = {}
vm.runInNewContext(compile('wav'), { exports: wav })
const recorderSource = compile('recorder.web')

// This exercises the web adapter's asynchronous ownership and cleanup. It
// models browser media interfaces; it does not acquire an OS microphone.
function fixture(getUserMedia, options = {}) {
	const contexts = []
	const track = {
		stopped: false,
		stop() { this.stopped = true },
		getSettings: () => ({ channelCount: 1 }),
		addEventListener() {}, removeEventListener() {},
	}
	const stream = { active: true, getTracks: () => [track], getAudioTracks: () => [track] }
	const node = () => ({ connect() {}, disconnect() {} })
	class AudioContext {
		constructor() {
			contexts.push(this)
			this.sampleRate = 44100
			this.destination = {}
			this.state = 'running'
			if (options.addModule) { this.audioWorklet = { addModule: options.addModule } }
		}
		createMediaStreamSource() { return node() }
		createScriptProcessor() { return node() }
		createGain() { return { ...node(), gain: { value: 1 } } }
		async resume() { await options.resume?.() }
		async close() { this.state = 'closed' }
	}
	const exports = {}
	vm.runInNewContext(recorderSource, {
		exports,
		require: (id) => {
			assert.equal(id, './wav')
			return wav
		},
		AudioContext,
		AudioWorkletNode: class { constructor() { throw new Error('worklet must not attach after disposal') } },
		URL, Blob,
		navigator: { mediaDevices: { getUserMedia: () => getUserMedia ? getUserMedia(stream) : Promise.resolve(stream) } },
		setInterval, clearInterval,
	})
	const recorder = exports.createAudioRecorder()
	return {
		recorder, track, contexts,
		async cleanup() {
			recorder.dispose()
			track.stop()
			for (const context of contexts) {
				await context.close()
			}
		},
	}
}

test('disposing a recording releases its stream and audio context', async () => {
	const { recorder, track, contexts, cleanup } = fixture()
	try {
		await recorder.start()
		assert.equal(recorder.snapshot().state, 'recording')
		recorder.dispose()
		assert.equal(track.stopped, true)
		assert.equal(contexts[0].state, 'closed')
	} finally {
		await cleanup()
	}
})

test('disposing while permission is pending prevents later microphone capture', async () => {
	let grant
	const permission = new Promise((resolve) => { grant = resolve })
	const { recorder, track, contexts, cleanup } = fixture(async (stream) => {
		await permission
		return stream
	})
	try {
		const starting = recorder.start()
		recorder.dispose()
		grant()
		await assert.rejects(starting, /disposed/)
		assert.equal(track.stopped, true, 'the late microphone stream must be stopped after disposal')
		assert.equal(recorder.snapshot().state, 'idle')
		assert.equal(contexts.length, 0)
		await assert.rejects(recorder.start(), /disposed/)
	} finally {
		await cleanup()
	}
})


for (const stage of ['addModule', 'resume']) {
	test(`disposing during ${stage} keeps startup terminal`, async () => {
		let release, enter
		const waiting = new Promise((resolve) => { release = resolve })
		const entered = new Promise((resolve) => { enter = resolve })
		const { recorder, track, contexts, cleanup } = fixture(undefined, {
			[stage]: async () => { enter(); await waiting },
		})
		try {
			const starting = recorder.start()
			await entered
			recorder.dispose()
			release()
			await assert.rejects(starting, /disposed/)
			assert.equal(track.stopped, true)
			assert.equal(contexts.length, 1)
			assert.equal(contexts[0].state, 'closed')
			assert.equal(recorder.snapshot().state, 'idle')
			await assert.rejects(recorder.start(), /disposed/)
		} finally {
			await cleanup()
		}
	})
}
