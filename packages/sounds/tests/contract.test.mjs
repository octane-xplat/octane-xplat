import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import vm from 'node:vm'
import ts from 'typescript'

function fixture(target) {
	const voices = []
	let closed = 0
	class Context {
		destination = {}
		decodeAudioData = async (uri) => ({ uri })
		resume = async () => {}
		close = async () => {
			closed++
		}
		createGain({ gain }) {
			return { gain, connect() {}, disconnect() {} }
		}
		createBufferSource() {
			const source = {
				playing: false,
				buffer: null,
				onended: null,
				disconnect() {},
				connect(gain) {
					this.volume = gain.gain
				},
				start() {
					this.playing = true
				},
				stop() {
					this.playing = false
				},
			}

			voices.push(source)
			return source
		}
	}

	class Audio {
		readyState = 1
		playing = false
		listeners = new Map()
		src = ''
		volume = 1
		load() {}
		pause() {
			this.playing = false
		}
		removeAttribute() {
			this.src = ''
		}
		cloneNode() {
			const audio = new Audio()
			audio.src = this.src
			voices.push(audio)
			return audio
		}
		addEventListener(event, callback) {
			this.listeners.set(event, callback)
		}
		removeEventListener(event) {
			this.listeners.delete(event)
		}
		async play() {
			this.playing = true
		}
	}

	const compiled = ts.transpile(
		readFileSync(
			new URL(`../src/sounds${target === 'web' ? '.web' : ''}.ts`, import.meta.url),
			'utf8',
		),
		{ module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
	)

	const host = {
		exports: {},
		Audio,
		HTMLMediaElement: { HAVE_METADATA: 1 },
		require(name) {
			assert.equal(name, '@nativescript/audio-context')
			return { AudioContext: Context }
		},
	}

	vm.runInNewContext(compiled, host)
	return {
		create: host.exports.createSoundBank,
		voices,
		get closed() {
			return closed
		},
	}
}

for (const target of ['web', 'native']) {
	test(`${target}: load, independent overlapping voices, eviction, volume, stops and disposal`, async () => {
		const f = fixture(target)
		const bank = f.create({ maxVoices: 2 })
		assert.equal(bank.capabilities().supported, true)
		assert.equal(bank.capabilities().userGestureRequired, target === 'web')
		assert.equal(await bank.play('missing'), false)
		await bank.load('one', { uri: '/one.wav' })
		await bank.load('two', '/two.wav')
		assert.equal(await bank.play('one', { volume: 0.25 }), true)
		assert.equal(await bank.play('one', { volume: 0.75 }), true)
		const [first, second] = f.voices
		assert.equal(first.playing && second.playing, true)
		assert.deepEqual([first.volume, second.volume], [0.25, 0.75])
		await bank.play('two', { volume: 2 })
		const third = f.voices[2]
		assert.equal(first.playing, false)
		assert.equal(second.playing && third.playing, true)
		assert.equal(third.volume, 1)
		bank.stop('one')
		assert.equal(second.playing, false)
		assert.equal(third.playing, true)
		bank.stop()
		assert.equal(third.playing, false)
		await bank.play('one')
		await bank.load('one', '/replacement.wav')
		assert.equal(f.voices.at(-1).playing, false)
		await bank.play('one')
		bank.dispose()
		bank.dispose()
		assert.equal(
			f.voices.every((voice) => !voice.playing),
			true,
		)

		assert.equal(await bank.play('one'), false)
		await assert.rejects(bank.load('one', '/one.wav'), /disposed/)
		if (target === 'native') {
			assert.equal(f.closed, 1)
		}
	})
}
