import * as queueHelpers from '../src/queue.ts'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import vm from 'node:vm'
import ts from 'typescript'

const settings = await import('../src/settings.ts')

const source = await readFile(new URL('../src/audio.ios.ts', import.meta.url), 'utf8')
const compiled = ts.transpile(source, {
	module: ts.ModuleKind.CommonJS,
	target: ts.ScriptTarget.ES2022,
	verbatimModuleSyntax: false,
})

function createPlayer() {
	const commands = Object.fromEntries(
		['play', 'pause', 'next', 'previous', 'seek'].map((name) => [
			name,
			{
				addTargetWithHandler(handler) {
					this.handler = handler
					return handler
				},
				removeTarget() {},
				invoke(event) {
					return this.handler(event)
				},
			},
		]),
	)

	const sessionCalls = []
	const session = {
		setCategoryModeOptionsError(...args) {
			sessionCalls.push(['category', ...args])
		},
		setActiveWithOptionsError(...args) {
			sessionCalls.push(['active', ...args])
		},
	}

	const nowPlaying = { nowPlayingInfo: null }
	const observers = []
	const notificationCenter = {
		addObserverForNameObjectQueueUsingBlock(name, _object, _queue, callback) {
			const observer = { name, callback }
			observers.push(observer)
			return observer
		},
		removeObserver() {},
	}

	const nativePlayer = {
		rate: 0,
		paused: false,
		status: 1,
		error: undefined,
		currentItem: { duration: { seconds: 30 }, status: 1, error: undefined },
		currentTime: () => ({ seconds: 5 }),
		play() {
			this.rate = 1
			this.paused = false
		},
		pause() {
			this.rate = 0
			this.paused = true
		},
		seekToTime(time) {
			this.position = time.seconds
		},
	}

	const globals = {
		AVAudioTimePitchAlgorithmTimeDomain: 'time-domain',
		AVAudioSession: { sharedInstance: () => session },
		AVAudioSessionCategoryPlayback: 'playback',
		AVAudioSessionModeDefault: 'default',
		AVAudioSessionInterruptionNotification: 'interruption',
		AVAudioSessionInterruptionTypeKey: 'type',
		AVAudioSessionInterruptionOptionKey: 'options',
		AVAudioSessionInterruptionType: { Began: 1, Ended: 0 },
		AVAudioSessionInterruptionOptions: { ShouldResume: 1 },
		AVAudioSessionSetActiveOptions: { NotifyOthersOnDeactivation: 1 },
		AVPlayer: { playerWithPlayerItem: () => nativePlayer },
		AVPlayerItem: { playerItemWithURL: () => ({}) },
		AVPlayerItemDidPlayToEndTimeNotification: 'ended',
		AVPlayerItemFailedToPlayToEndTimeNotification: 'failed',
		AVPlayerItemFailedToPlayToEndTimeErrorKey: 'error',
		CMTimeGetSeconds: (time) => time.seconds,
		CMTimeMakeWithSeconds: (seconds) => ({ seconds }),
		NSURL: {
			fileURLWithPath: (path) => path,
			URLWithString: (url) => url,
		},
		NSNotificationCenter: { defaultCenter: notificationCenter },
		NSOperationQueue: { mainQueue: {} },
		NSMutableDictionary: {
			dictionary: () => ({
				setObjectForKey(value, key) {
					this[key] = value
				},
			}),
		},
		MPRemoteCommandCenter: {
			sharedCommandCenter: () => ({
				playCommand: commands.play,
				pauseCommand: commands.pause,
				nextTrackCommand: commands.next,
				previousTrackCommand: commands.previous,
				changePlaybackPositionCommand: commands.seek,
			}),
		},
		MPNowPlayingInfoCenter: { defaultCenter: () => nowPlaying },
		MPRemoteCommandHandlerStatus: { Success: 0 },
		MPMediaItemPropertyTitle: 'title',
		MPMediaItemPropertyArtist: 'artist',
		MPMediaItemPropertyAlbumTitle: 'album',
		MPMediaItemPropertyPlaybackDuration: 'playbackDuration',
		MPNowPlayingInfoPropertyElapsedPlaybackTime: 'elapsedPlaybackTime',
		MPNowPlayingInfoPropertyPlaybackRate: 'playbackRate',
		setInterval,
		clearInterval,
	}

	const module = { exports: {} }
	vm.runInNewContext(compiled, {
		...globals,
		exports: module.exports,
		module,
		require: (specifier) => {
			if (specifier === './queue') {
				return queueHelpers
			}
			if (specifier === './settings') {
				return settings
			}
			if (specifier === '@octane-xplat/platform/ios') {
				return globals
			}

			throw new Error(`Unexpected module: ${specifier}`)
		},
	})

	return {
		player: module.exports.createAudioPlayer(),
		commands,
		nativePlayer,
		nowPlaying,
		observers,
		sessionCalls,
	}
}

test('iOS reports system controls when the playback-duration key is available', () => {
	const { player } = createPlayer()
	assert.equal(player.capabilities().systemControls, true)
})

test('iOS Now Playing metadata uses the media-item playback-duration key', async () => {
	const { player, nowPlaying } = createPlayer()
	await player.setQueue([{ id: 'sample', source: 'https://example.test/sample.mp3' }])
	assert.equal(nowPlaying.nowPlayingInfo.playbackDuration, 30)
	player.dispose()
})

test("iOS lock-screen pause uses the player's pause behavior", async () => {
	const { player, commands, nativePlayer } = createPlayer()
	await player.setQueue([{ id: 'sample', source: 'https://example.test/sample.mp3' }])
	await player.play()
	assert.equal(commands.pause.invoke(), 0)
	assert.equal(nativePlayer.paused, true)
	assert.equal(player.snapshot().state, 'paused')
	player.dispose()
})

test('iOS resumes only when interruption options allow it and deactivates the session', async () => {
	const { player, observers, nativePlayer, sessionCalls } = createPlayer()
	await player.setQueue([{ id: 'sample', source: 'https://example.test/sample.mp3' }])
	await player.play()
	const interruption = observers.find((observer) => observer.name === 'interruption')
	const event = (type, options) => ({
		userInfo: {
			objectForKey: (key) => ({ unsignedIntegerValue: key === 'type' ? type : options }),
		},
	})

	interruption.callback(event(1, 0))
	assert.equal(player.snapshot().state, 'paused')
	assert.equal(nativePlayer.paused, true)
	interruption.callback(event(0, 0))
	assert.equal(player.snapshot().state, 'paused')
	await player.play()
	interruption.callback(event(1, 0))
	interruption.callback(event(0, 1))
	assert.equal(player.snapshot().state, 'playing')
	assert.equal(nativePlayer.paused, false)

	player.dispose()
	assert.deepEqual(sessionCalls.at(-1), ['active', false, 1, null])
})

test('iOS play() after the queue ends rewinds the finished item', async () => {
	const { player, observers, nativePlayer } = createPlayer()
	await player.setQueue([{ id: 'sample', source: 'https://example.test/sample.mp3' }])
	await player.play()
	observers.find((observer) => observer.name === 'ended').callback()
	assert.equal(player.snapshot().state, 'ended')

	await player.play()
	assert.equal(nativePlayer.position, 0)
	assert.equal(player.snapshot().state, 'playing')
	player.dispose()
})

test('iOS surfaces an asynchronous item failure as state error', async () => {
	const { player, observers, nativePlayer } = createPlayer()
	await player.setQueue([{ id: 'sample', source: 'https://example.test/dead.mp3' }])
	const failure = observers.find((observer) => observer.name === 'failed')
	failure.callback({
		userInfo: {
			objectForKey: (key) =>
				key === 'error' ? { localizedDescription: 'cannot decode' } : undefined,
		},
	})

	const snapshot = player.snapshot()
	assert.equal(snapshot.state, 'error')
	assert.equal(snapshot.error.message, 'cannot decode')
	assert.equal(nativePlayer.paused, true)
	player.dispose()
})

test('iOS polls player status so a mid-playback failure reaches state error', async () => {
	const { player, nativePlayer } = createPlayer()
	await player.setQueue([{ id: 'sample', source: 'https://example.test/sample.mp3' }])
	await player.play()
	player.subscribe(() => {})
	nativePlayer.currentItem.status = 2 // AVPlayerStatus.Failed
	nativePlayer.currentItem.error = { localizedDescription: 'stream dropped' }
	await new Promise((resolve) => setTimeout(resolve, 600))

	const snapshot = player.snapshot()
	assert.equal(snapshot.state, 'error')
	assert.equal(snapshot.error.message, 'stream dropped')
	player.dispose()
})

test('iOS ignores a pending resume after an explicit pause during interruption', async () => {
	const { player, observers } = createPlayer()
	await player.setQueue([{ id: 'sample', source: 'https://example.test/sample.mp3' }])
	await player.play()
	const interruption = observers.find((observer) => observer.name === 'interruption')
	const event = (type, options) => ({
		userInfo: {
			objectForKey: (key) => ({ unsignedIntegerValue: key === 'type' ? type : options }),
		},
	})

	interruption.callback(event(1, 0)) // Began — was playing
	await player.pause() // explicit user pause clears the pending resume
	interruption.callback(event(0, 1)) // Ended + ShouldResume must not restart
	assert.equal(player.snapshot().state, 'paused')
	player.dispose()
})

test('iOS ignores non-Ended interruption notifications for resume', async () => {
	const { player, observers } = createPlayer()
	await player.setQueue([{ id: 'sample', source: 'https://example.test/sample.mp3' }])
	await player.play()
	const interruption = observers.find((observer) => observer.name === 'interruption')
	interruption.callback({
		userInfo: { objectForKey: (key) => ({ unsignedIntegerValue: key === 'type' ? 1 : 0 }) },
	})

	// A notification carrying no type must not be treated as Ended.
	interruption.callback({ userInfo: { objectForKey: () => undefined } })
	assert.equal(player.snapshot().state, 'paused')
	player.dispose()
})

test('settings survive loads and interruption recovery without unpausing', async () => {
	const { player, nativePlayer, nowPlaying } = createPlayer()
	await player.setPlaybackRate(1.75)
	await player.setVolume(0.4)
	await player.setMuted(true)
	await player.setQueue([{ id: 'a', source: '/a.mp3' }])
	assert.equal(nativePlayer.rate, 0)
	assert.equal(nativePlayer.volume, 0.4)
	assert.equal(nativePlayer.muted, true)
	await player.play()
	assert.equal(nativePlayer.rate, 1.75)
	assert.equal(nowPlaying.nowPlayingInfo.playbackRate, 1.75)
	await player.pause()
	await player.setPlaybackRate(2)
	assert.equal(nativePlayer.rate, 0)
	await player.play()
	assert.equal(nativePlayer.rate, 2)
	await player.setMuted(false)
	assert.equal(nativePlayer.volume, 0.4)
	assert.equal(player.snapshot().muted, false)
	await assert.rejects(player.setPlaybackRate(NaN), /finite/)
	assert.equal(player.snapshot().playbackRate, 2)
	await player.setPlaybackRate(99)
	await player.setVolume(-2)
	assert.equal(player.snapshot().playbackRate, 3)
	assert.equal(player.snapshot().volume, 0)
	player.dispose()
	await assert.rejects(player.setVolume(1), /disposed/)
})

test('iOS preserves current item and explicit pause cancels growing-queue resume', async () => {
	const { player, nativePlayer, observers } = createPlayer()
	const a = { id: 'a', source: '/a.mp3' }
	await player.setQueue([a], 0, { complete: false })
	await player.play()
	await player.updateQueue([{ ...a, title: 'Updated' }])
	assert.equal(player.snapshot().state, 'playing')
	assert.equal(player.snapshot().currentTime, 5)
	observers.find((o) => o.name === 'ended').callback()
	assert.equal(player.snapshot().state, 'waiting')
	await player.pause()
	await player.updateQueue([a, { id: 'b', source: '/b.mp3' }])
	assert.equal(player.snapshot().track.id, 'a')
	assert.equal(nativePlayer.paused, true)
	await assert.rejects(player.updateQueue([a, a]), /unique/)
	assert.equal(player.snapshot().track.id, 'a')
	player.dispose()
})

test('iOS stale item notifications cannot end or fail a replacement', async () => {
	const { player, observers } = createPlayer()
	await player.setQueue([{ id: 'a', source: '/a.mp3' }])
	const end = observers.find((o) => o.name === 'ended')
	const failure = observers.find((o) => o.name === 'failed')
	await player.setQueue([{ id: 'b', source: '/b.mp3' }])
	end.callback()
	failure.callback({
		userInfo: { objectForKey: () => ({ localizedDescription: 'obsolete failure' }) },
	})
	assert.equal(player.snapshot().track.id, 'b')
	assert.equal(player.snapshot().state, 'paused')
	assert.equal(player.snapshot().error, undefined)
	player.dispose()
})
