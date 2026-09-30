import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import vm from 'node:vm'
import ts from 'typescript'

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
		currentItem: { duration: { seconds: 30 } },
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
	vm.runInNewContext(compiled, { ...globals, exports: module.exports, module })
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
