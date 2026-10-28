import * as queueHelpers from '../src/queue.ts'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import vm from 'node:vm'
import ts from 'typescript'
import * as settings from '../src/settings.ts'

export async function webPlayer({ systemControls = false } = {}) {
	class Audio {
		currentTime = 0
		duration = 30
		playbackRate = 1
		volume = 1
		muted = false
		listeners = new Map()
		sources = 0
		set src(value) {
			this.source = value
			this.sources++
		}
		get src() {
			return this.source
		}
		addEventListener(name, listener) {
			this.listeners.set(name, listener)
		}
		removeEventListener(name) {
			this.listeners.delete(name)
		}
		fire(name) {
			this.listeners.get(name)?.()
		}
		async play() {
			this.fire('playing')
		}
		pause() {
			this.fire('pause')
		}
		load() {}
		removeAttribute() {
			this.source = undefined
		}
	}
	const commands = new Map()
	const session = { metadata: null, setActionHandler: (name, action) => commands.set(name, action) }
	let audio
	const exports = {}
	vm.runInNewContext(
		ts.transpile(await readFile(new URL('../src/audio.web.ts', import.meta.url), 'utf8'), {
			module: ts.ModuleKind.CommonJS,
		}),
		{
			exports,
			require: (id) => (id === './queue' ? queueHelpers : settings),
			...(systemControls
				? {
						navigator: { mediaSession: session },
						MediaMetadata: class {
							constructor(value) {
								Object.assign(this, value)
							}
						},
					}
				: {}),
			Audio: class extends Audio {
				constructor() {
					super()
					audio = this
				}
			},
		},
	)
	return { player: exports.createAudioPlayer(), audio: () => audio, commands, session }
}

test('web settings survive queue changes and mute retains independent gain', async () => {
	const { player, audio } = await webPlayer()
	await player.setPlaybackRate(1.75)
	await player.setVolume(0.25)
	await player.setMuted(true)
	await player.setQueue([{ id: 'a', source: '/a.mp3' }])
	await player.play()
	await player.setQueue([{ id: 'b', source: '/b.mp3' }])
	assert.equal(audio().playbackRate, 1.75)
	assert.equal(audio().preservesPitch, true)
	assert.equal(audio().volume, 0.25)
	assert.equal(audio().muted, true)
	await player.setMuted(false)
	assert.equal(player.snapshot().volume, 0.25)
	await assert.rejects(player.setVolume(NaN), /finite/)
	assert.equal(audio().volume, 0.25)
	player.dispose()
	await assert.rejects(player.setPlaybackRate(2), /disposed/)
})

test('Android settings dispatch ordered commands and retain gain while muted', async () => {
	const commands = []
	const actions = {
		ACTION_QUEUE: 'queue',
		ACTION_PLAY: 'play',
		ACTION_PAUSE: 'pause',
		ACTION_RATE: 'rate',
		ACTION_VOLUME: 'volume',
		ACTION_MUTED: 'muted',
		ACTION_RELEASE: 'release',
		dispatch(_context, action, payload, index, seconds) {
			commands.push({ action, seconds })
		},
		snapshot: () => JSON.stringify({ state: 'paused', currentTime: 0, duration: 20 }),
	}
	const exports = {}
	vm.runInNewContext(
		ts.transpile(await readFile(new URL('../src/audio.android.ts', import.meta.url), 'utf8'), {
			module: ts.ModuleKind.CommonJS,
		}),
		{
			exports,
			com: { xplat: { audio: { AudioBridge: actions } } },
			require: (id) =>
				id === './queue'
					? queueHelpers
					: id === './settings'
						? settings
						: { Utils: { android: { getApplicationContext: () => ({}) } } },
			setInterval,
			clearInterval,
		},
	)
	const player = exports.createAudioPlayer()
	await player.setVolume(0.2)
	await player.setMuted(true)
	await player.setPlaybackRate(1.5)
	await player.setMuted(false)
	assert.deepEqual(
		commands.map(({ action, seconds }) => [action, seconds]),
		[
			['volume', 0.2],
			['muted', 1],
			['rate', 1.5],
			['muted', 0],
		],
	)
	assert.equal(player.snapshot().volume, 0.2)
	await assert.rejects(player.setPlaybackRate(Infinity), /finite/)
	assert.equal(commands.length, 4)
	player.dispose()
	await assert.rejects(player.setMuted(true), /disposed/)
})

test('web growing queue preserves the source and waits until more items arrive', async () => {
	const { player, audio } = await webPlayer()
	const a = { id: 'a', source: '/a.mp3' }
	const b = { id: 'b', source: '/b.mp3' }
	await player.setQueue([a], 0, { complete: false })
	await player.play()
	audio().currentTime = 7
	await player.updateQueue([{ ...a, title: 'Renamed' }, b])
	assert.equal(audio().sources, 1)
	assert.equal(player.snapshot().currentTime, 7)
	assert.equal(player.snapshot().track.title, 'Renamed')
	assert.equal(player.snapshot().state, 'playing')
	audio().fire('ended')
	await Promise.resolve()
	assert.equal(player.snapshot().track.id, 'b')
	audio().fire('ended')
	assert.equal(player.snapshot().state, 'waiting')
	await player.updateQueue([a, b, { id: 'c', source: '/c.mp3' }])
	assert.equal(player.snapshot().track.id, 'c')
	assert.equal(player.snapshot().state, 'playing')
	audio().fire('ended')
	await player.updateQueue([a, b, { id: 'c', source: '/c.mp3' }], { complete: true })
	assert.equal(player.snapshot().state, 'ended')
	assert.equal(player.snapshot().queueComplete, true)
	player.dispose()
})

test('web pause cancels waiting auto-resume; invalid updates are atomic', async () => {
	const { player, audio } = await webPlayer()
	const a = { id: 'a', source: '/a.mp3' }
	await player.setQueue([a], 0, { complete: false })
	await player.play()
	audio().fire('ended')
	await player.pause()
	await player.updateQueue([a, { id: 'b', source: '/b.mp3' }])
	assert.equal(player.snapshot().state, 'paused')
	assert.equal(player.snapshot().track.id, 'a')
	await assert.rejects(player.updateQueue([a, a]), /unique/)
	assert.equal(player.snapshot().track.id, 'a')
	await player.updateQueue([{ id: 'other', source: '/other.mp3' }])
	assert.equal(player.snapshot().state, 'paused')
	player.dispose()
})

test('web system pause cancels append auto-resume and metadata updates keep the source', async () => {
	const { player, audio, commands, session } = await webPlayer({ systemControls: true })
	const a = { id: 'a', source: '/a.mp3', title: 'Old' }
	await player.setQueue([a], 0, { complete: false })
	await player.play()
	await player.updateQueue([{ ...a, title: 'New' }])
	assert.equal(session.metadata.title, 'New')
	assert.equal(audio().sources, 1)
	audio().fire('ended')
	commands.get('pause')()
	await player.updateQueue([a, { id: 'b', source: '/b.mp3' }])
	assert.equal(player.snapshot().state, 'paused')
	assert.equal(player.snapshot().track.id, 'a')
	player.dispose()
})
