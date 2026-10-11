import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import vm from 'node:vm'
import ts from 'typescript'

const compiled = ts.transpile(
	readFileSync(new URL('../src/sounds.macos.ts', import.meta.url), 'utf8'),
	{ module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
)

function fixture({ absent = false } = {}) {
	const players = []
	const tasks = []
	const timers = new Map()
	let nextTimer = 0
	let invalidations = 0
	const host = {
		exports: {},
		setInterval(callback) {
			const id = ++nextTimer
			timers.set(id, callback)
			return id
		},
		clearInterval(id) {
			timers.delete(id)
		},
		NSURL: { URLWithString: (uri) => uri, fileURLWithPath: (path) => path },
		NSData: { dataWithContentsOfURL: (url) => (url === '/missing' ? null : url) },
		NSURLSessionConfiguration: { defaultSessionConfiguration: {} },
		NSOperationQueue: { mainQueue: {} },
		NSURLSession: {
			sessionWithConfigurationDelegateDelegateQueue: (configuration, delegate, queue) => {
				assert.equal(configuration, host.NSURLSessionConfiguration.defaultSessionConfiguration)
				assert.equal(delegate, null)
				assert.equal(queue, host.NSOperationQueue.mainQueue)
				return {
					invalidateAndCancel() {
						invalidations++
					},
					dataTaskWithURLCompletionHandler(url, callback) {
						const task = {
							url,
							callback,
							resumed: false,
							cancelled: false,
							resume() {
								this.resumed = true
							},
							cancel() {
								this.cancelled = true
							},
						}

						tasks.push(task)
						return task
					},
				}
			},
		},
		AVAudioPlayer: {
			alloc: () => ({
				initWithDataError(data) {
					if (data === '/malformed') {
						throw Error('decode failed')
					}

					const player = {
						data,
						playing: false,
						volume: 1,
						stops: 0,
						prepareToPlay: () => data !== '/prepare-failure',
						play() {
							this.playing = data !== '/play-failure'
							return this.playing
						},
						stop() {
							this.playing = false
							this.stops++
						},
					}

					players.push(player)
					return player
				},
			}),
		},
	}

	if (absent) {
		delete host.AVAudioPlayer
	}

	vm.runInNewContext(compiled, host)
	return {
		get invalidations() {
			return invalidations
		},
		create: host.exports.createSoundBank,
		players,
		tasks,
		timers,
		tick() {
			for (const callback of timers.values()) {
				callback()
			}
		},
	}
}

test('constructs safely without AppKit and normalizes limits', async () => {
	const f = fixture({ absent: true })
	for (const [input, limit] of [
		[0, 1],
		[2.9, 2],
		[NaN, 6],
		[Infinity, 6],
	]) {
		const bank = f.create({ maxVoices: input })
		assert.equal(bank.capabilities().maxVoices, limit)
		assert.equal(bank.capabilities().supported, false)
		assert.equal(bank.capabilities().userGestureRequired, false)
		await assert.rejects(bank.load('one', '/one'), /unavailable/)
		assert.equal(await bank.play('one'), false)
		bank.dispose()
	}
})

test('overlap, oldest eviction, volume and targeted/global stop', async () => {
	const f = fixture()
	const bank = f.create({ maxVoices: 2 })
	assert.equal(await bank.play('missing'), false)
	await bank.load('one', { uri: '/one' })
	await bank.load('two', '/two')
	assert.equal(await bank.play('one', { volume: 0.25 }), true)
	assert.equal(await bank.play('one', { volume: 0.75 }), true)
	const [first, second] = f.players.slice(-2)
	assert.equal(first.playing && second.playing, true)
	assert.deepEqual([first.volume, second.volume], [0.25, 0.75])
	assert.equal(await bank.play('two', { volume: 5 }), true)
	const third = f.players.at(-1)
	assert.equal(first.playing, false)
	assert.equal(second.playing && third.playing, true)
	assert.equal(third.volume, 1)
	bank.stop('one')
	assert.equal(second.playing, false)
	assert.equal(third.playing, true)
	bank.stop()
	assert.equal(third.playing, false)
	assert.equal(f.timers.size, 0)
	for (const [input, expected] of [
		[-1, 0],
		[NaN, 1],
		[Infinity, 1],
	]) {
		await bank.play('one', { volume: input })
		assert.equal(f.players.at(-1).volume, expected)
	}

	bank.dispose()
	bank.dispose()
	assert.equal(
		f.players.every((player) => !player.playing),
		true,
	)

	assert.equal(f.timers.size, 0)
	assert.equal(await bank.play('one'), false)
	await assert.rejects(bank.load('one', '/one'), /disposed/)
})

test('completion frees voices and stops the owned timer', async () => {
	const f = fixture()
	const bank = f.create({ maxVoices: 1 })
	await bank.load('one', '/one')
	await bank.play('one')
	const finished = f.players.at(-1)
	finished.playing = false
	f.tick()
	assert.equal(f.timers.size, 0)
	assert.equal(finished.stops, 1)
	await bank.play('one')
	assert.equal(f.players.at(-1).playing, true)
	bank.dispose()
})

test('reload stops all matching voices while preserving other sounds', async () => {
	const f = fixture()
	const bank = f.create()
	await bank.load('one', '/one')
	await bank.load('two', '/two')
	await bank.play('one')
	await bank.play('one')
	await bank.play('two')
	const [first, second, other] = f.players.slice(-3)
	await bank.load('one', '/new')
	assert.equal(first.playing || second.playing, false)
	assert.equal(other.playing, true)
	await bank.play('one')
	assert.equal(f.players.at(-1).data, '/new')
	bank.dispose()
})

test('load failure rejects; unprepared or refused playback never leaks a voice', async () => {
	const f = fixture()
	const bank = f.create()
	for (const uri of ['/missing', '/malformed', '/prepare-failure']) {
		await assert.rejects(bank.load('one', uri))
		assert.equal(await bank.play('one'), false)
	}

	await bank.load('one', '/play-failure')
	assert.equal(await bank.play('one'), false)
	assert.equal(f.players.at(-1).stops, 1)
	assert.equal(f.timers.size, 0)
	bank.dispose()
})

test('remote load checks HTTP failure and validates downloaded bytes', async () => {
	const f = fixture()
	const bank = f.create()
	for (const [bytes, status, error] of [
		['/one', 404, null],
		[null, 200, null],
		['/malformed', 200, null],
		['/one', 200, Error('network')],
	]) {
		const loading = bank.load('one', 'https://example.test/one')
		const rejected = assert.rejects(loading)
		assert.equal(f.tasks.at(-1).resumed, true)
		f.tasks.at(-1).callback(bytes, { statusCode: status }, error)
		await rejected
	}

	const loading = bank.load('one', 'https://example.test/one')
	f.tasks.at(-1).callback('/one', { statusCode: 200 }, null)
	await loading
	assert.equal(await bank.play('one'), true)
	bank.dispose()
})

test('dispose cancels pending load, rejects promptly, and ignores late callbacks', async () => {
	const f = fixture()
	const bank = f.create()
	const loading = bank.load('one', 'https://example.test/one')
	const rejected = assert.rejects(loading, /cancelled/)
	bank.dispose()
	assert.equal(f.tasks[0].cancelled, true)
	await rejected
	f.tasks[0].callback('/one', { statusCode: 200 }, null)
	assert.equal(f.players.length, 0)
	assert.equal(await bank.play('one'), false)
	assert.equal(f.timers.size, 0)
})

test('replacement cancels previous load and late callbacks cannot replace it', async () => {
	const f = fixture()
	const bank = f.create()
	const pending = bank.load('one', 'https://example.test/one')
	const rejected = assert.rejects(pending, /cancelled/)
	await bank.load('one', '/replacement')
	await rejected
	f.tasks[0].callback('/stale', { statusCode: 200 }, null)
	await bank.play('one')
	assert.equal(f.players.at(-1).data, '/replacement')
	bank.dispose()
})
