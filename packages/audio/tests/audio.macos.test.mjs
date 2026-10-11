import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import vm from 'node:vm'
import ts from 'typescript'

const source = await readFile(new URL('../src/audio.macos.ts', import.meta.url), 'utf8')
const compiled = ts.transpile(source, {
	module: ts.ModuleKind.CommonJS,
	target: ts.ScriptTarget.ES2022,
})

const tracks = [
	{ id: 'local', source: '/audio.wav' },
	{ id: 'remote', source: 'https://example.test/audio.mp3' },
]

function fixture({ missing = false, loading = false } = {}) {
	const timers = new Set()
	const calls = []
	const native = {
		value: { state: 'idle', currentTime: 0, duration: 0 },
		setSource(source) {
			calls.push(['source', source])
			this.value = { state: loading ? 'loading' : 'paused', currentTime: 0, duration: 12.5 }
		},
		play() {
			calls.push(['play'])
			this.value.state = 'playing'
		},
		pause() {
			calls.push(['pause'])
			this.value.state = 'paused'
		},
		seekSeconds(seconds) {
			calls.push(['seek', seconds])
			this.value.currentTime = seconds
		},
		snapshot() {
			return JSON.stringify(this.value)
		},
		clear() {
			calls.push(['clear'])
			this.value = { state: 'idle', currentTime: 0, duration: 0 }
		},
		dispose() {
			calls.push(['dispose'])
			this.clear()
		},
	}

	const module = { exports: {} }
	vm.runInNewContext(compiled, {
		exports: module.exports,
		module,
		...(missing ? {} : { XplatAudioPlayer: { new: () => native } }),
		setInterval(callback) {
			timers.add(callback)
			return callback
		},
		clearInterval(callback) {
			timers.delete(callback)
		},
	})

	return {
		player: module.exports.createAudioPlayer(),
		native,
		calls,
		timers,
		tick() {
			// Snapshot the timers because a tick can install a replacement load.
			for (const callback of Array.from(timers)) {
				callback()
			}
		},
	}
}

test('macOS constructs without mobile globals; absent bridge is explicit and safe', async () => {
	const { player } = fixture({ missing: true })
	assert.equal(player.capabilities().supported, false)
	assert.equal(player.capabilities().systemControls, false)
	assert.equal(player.capabilities().interruptions, false)
	await assert.rejects(player.setQueue(tracks), /bridge is unavailable/)
	assert.equal(player.snapshot().state, 'error')
	player.dispose()
})

test('local/remote sources, queue index, seconds, snapshots and unsubscribe', async () => {
	const { player, calls, native, tick } = fixture()
	const seen = []
	const unsubscribe = player.subscribe((value) => seen.push(value))
	assert.equal(seen[0].state, 'idle')
	const input = tracks.map((track) => ({ ...track }))
	await player.setQueue(input, 100)
	input[1].id = 'mutated'
	assert.equal(player.snapshot().track.id, 'remote')
	assert.equal(player.snapshot().duration, 12.5)
	await player.play()
	await player.seek(2.75)
	assert.equal(player.snapshot().currentTime, 2.75)
	await player.seek(-1)
	await player.seek(NaN)
	assert.deepEqual(
		calls.filter(([name]) => name === 'seek'),
		[
			['seek', 2.75],
			['seek', 0],
		],
	)

	await player.pause()
	assert.equal(player.snapshot().state, 'paused')
	native.value.currentTime = 7.25
	tick()
	assert.equal(seen.at(-1).currentTime, 7.25)
	unsubscribe()
	const count = seen.length
	tick()
	assert.equal(seen.length, count)
	await player.setQueue(tracks, NaN)
	assert.equal(calls.filter(([name]) => name === 'source').at(-1)[1], '/audio.wav')
	await player.setQueue([])
	assert.equal(player.snapshot().state, 'idle')
	assert.equal(player.snapshot().track, undefined)
	player.dispose()
})

test('play waits for readiness; queue replacement rejects obsolete load and play', async () => {
	const { player, native, calls, tick } = fixture({ loading: true })
	const first = player.setQueue(tracks)
	const firstResult = assert.rejects(first, /superseded/)
	const playing = player.play()
	const playingResult = assert.rejects(playing, /superseded/)
	assert.equal(
		calls.some(([name]) => name === 'play'),
		false,
	)

	const second = player.setQueue([tracks[1]])
	native.value.state = 'paused'
	tick()
	await Promise.all([firstResult, playingResult, second])
	assert.equal(player.snapshot().track.id, 'remote')
	await player.play()
	assert.equal(player.snapshot().state, 'playing')
	player.dispose()
})

test('ended advances once, autoplays next, then settles at the final track', async () => {
	const { player, native, calls, tick, timers } = fixture()
	await player.setQueue(tracks)
	await player.play()
	native.value.state = 'ended'
	tick()
	await new Promise((resolve) => setImmediate(resolve))
	assert.equal(player.snapshot().track.id, 'remote')
	assert.equal(player.snapshot().state, 'playing')
	assert.equal(calls.filter(([name]) => name === 'source').length, 2)
	native.value.state = 'ended'
	tick()
	tick()
	assert.equal(player.snapshot().state, 'ended')
	assert.equal(timers.size, 0)
	player.dispose()
})

test('pause while loading cancels an earlier play request', async () => {
	const { player, native, calls, tick } = fixture({ loading: true })
	const ready = player.setQueue(tracks)
	const play = player.play()
	await player.pause()
	native.value.state = 'paused'
	tick()
	await Promise.all([ready, play])
	assert.equal(
		calls.some(([name]) => name === 'play'),
		false,
	)

	assert.equal(player.snapshot().state, 'paused')
	player.dispose()
})

for (const message of [
	'Malformed media',
	'Network failed',
	'Output device failed',
	'Audio loading or buffering timed out',
]) {
	test(`${message} rejects readiness and stays terminal until queue replacement`, async () => {
		const { player, native, tick, timers } = fixture({ loading: true })
		const ready = player.setQueue(tracks)
		const rejected = assert.rejects(ready, new RegExp(message))
		native.value = { state: 'error', error: message }
		tick()
		await rejected
		assert.equal(player.snapshot().state, 'error')
		assert.equal(player.snapshot().error.message, message)
		assert.equal(timers.size, 0)
		await assert.rejects(player.play(), new RegExp(message))
		await assert.rejects(player.pause(), new RegExp(message))
		const replacement = player.setQueue([tracks[1]])
		native.value.state = 'paused'
		tick()
		await replacement
		assert.equal(player.snapshot().error, undefined)
		player.dispose()
	})
}

test('command failure and failure while advancing cannot escape the notification loop', async () => {
	const { player, native, tick } = fixture()
	await player.setQueue(tracks)
	native.play = () => {
		throw new Error('Output failure')
	}

	await assert.rejects(player.play(), /Output failure/)
	assert.equal(player.snapshot().state, 'error')
	await player.setQueue(tracks)
	native.setSource = () => {
		throw new Error('Next track failed')
	}

	native.value.state = 'ended'
	tick()
	await new Promise((resolve) => setImmediate(resolve))
	assert.equal(player.snapshot().state, 'error')
	assert.match(player.snapshot().error.message, /Next track failed/)
	player.dispose()
})

test('dispose cancels pending readiness, stops playback/timers/notifications and is idempotent', async () => {
	const { player, timers, calls, tick } = fixture({ loading: true })
	let count = 0
	player.subscribe(() => count++)
	const ready = player.setQueue(tracks)
	const rejected = assert.rejects(ready, /disposed/)
	const staleTick = [...timers][0]
	player.dispose()
	player.dispose()
	await rejected
	const after = count
	tick()
	staleTick()
	assert.equal(count, after)
	assert.equal(timers.size, 0)
	assert.equal(calls.filter(([name]) => name === 'dispose').length, 1)
	assert.equal(player.snapshot().state, 'idle')
	assert.equal(player.snapshot().track, undefined)
	for (const operation of [
		() => player.setQueue(tracks),
		() => player.play(),
		() => player.pause(),
		() => player.seek(1),
	]) {
		await assert.rejects(operation(), /disposed/)
	}

	assert.throws(() => player.subscribe(() => {}), /disposed/)
})

test('disposal inside subscription prevents later listeners from receiving stale state', async () => {
	const { player } = fixture()
	player.subscribe((value) => {
		if (value.state === 'loading') {
			player.dispose()
		}
	})

	const seen = []
	player.subscribe((value) => seen.push(value.state))
	await player.setQueue(tracks)
	assert.deepEqual(seen, ['idle'])
})
