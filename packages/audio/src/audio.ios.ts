import type { AudioCapabilities, AudioPlayer, AudioSnapshot, Track } from './types'

// CoreMedia is available at runtime but omitted from NativeScript's common
// ambient references. Reuse AVPlayer's time type for this bridge slice.
type PlayerTime = ReturnType<AVPlayer['currentTime']>
declare function CMTimeGetSeconds(time: PlayerTime): number
declare function CMTimeMakeWithSeconds(seconds: number, preferredTimescale: number): PlayerTime

export const createAudioPlayer = (): AudioPlayer => {
	const listeners = new Set<(snapshot: AudioSnapshot) => void>()
	const session = AVAudioSession.sharedInstance()
	// NativeScript's ambient const enums cannot be read with verbatimModuleSyntax.
	const interruptionBegan = 1 // AVAudioSessionInterruptionType.Began
	const interruptionShouldResume = 1 // AVAudioSessionInterruptionOptions.ShouldResume
	const notifyOthersOnDeactivation = 1 as AVAudioSessionSetActiveOptions
	// Lock-screen transport (MPRemoteCommandCenter / MPNowPlayingInfoCenter)
	// needs MediaPlayer.framework linked AND metadata-generated — plugin
	// LDFLAGS alone don't reach the metadata scan, so the MP* globals can be
	// undefined. Playback still works; guard and report systemControls:false.
	const hasMediaPlayer =
		typeof MPRemoteCommandCenter !== 'undefined' &&
		typeof MPNowPlayingInfoCenter !== 'undefined' &&
		// The runtime metadata keys may be absent when MediaPlayer isn't linked.
		typeof (globalThis as any).MPMediaItemPropertyPlaybackDuration !== 'undefined' &&
		typeof (globalThis as any).MPRemoteCommandHandlerStatus !== 'undefined'

	const commandCenter = hasMediaPlayer ? MPRemoteCommandCenter.sharedCommandCenter() : undefined
	const nowPlaying = hasMediaPlayer ? MPNowPlayingInfoCenter.defaultCenter() : undefined
	let queue: Track[] = []
	let index = -1
	let player: AVPlayer | undefined
	let state: AudioSnapshot['state'] = 'idle'
	let error: Error | undefined
	let disposed = false
	let wasPlayingBeforeInterruption = false
	let timer: ReturnType<typeof setInterval> | undefined
	let endObserver: NSObjectProtocol | undefined
	let interruptionObserver: NSObjectProtocol | undefined
	const remoteTargets: Array<{ command: any; token: any }> = []

	const current = () => queue[index]
	const seconds = (time: PlayerTime) => {
		const value = CMTimeGetSeconds(time)
		return Number.isFinite(value) && value > 0 ? value : 0
	}

	const snapshot = (): AudioSnapshot => ({
		state,
		track: current(),
		currentTime: player ? seconds(player.currentTime()) : 0,
		duration: player?.currentItem ? seconds(player.currentItem.duration) : 0,
		error,
	})

	const emit = () => {
		const value = snapshot()
		for (const listener of listeners) {
			listener(value)
		}
	}

	const updateNowPlaying = () => {
		if (!nowPlaying) {
			return
		}
		const track = current()
		if (!track) {
			nowPlaying.nowPlayingInfo = null as unknown as NSDictionary<string, any>
			return
		}

		const info = NSMutableDictionary.dictionary()
		info.setObjectForKey(track.title ?? track.id, MPMediaItemPropertyTitle)
		if (track.artist) {
			info.setObjectForKey(track.artist, MPMediaItemPropertyArtist)
		}
		if (track.album) {
			info.setObjectForKey(track.album, MPMediaItemPropertyAlbumTitle)
		}
		info.setObjectForKey(
			snapshot().duration,
			(globalThis as any).MPMediaItemPropertyPlaybackDuration,
		)

		info.setObjectForKey(snapshot().currentTime, MPNowPlayingInfoPropertyElapsedPlaybackTime)
		info.setObjectForKey(player?.rate ?? 0, MPNowPlayingInfoPropertyPlaybackRate)
		nowPlaying.nowPlayingInfo = info
	}

	const clearTrack = () => {
		if (endObserver) {
			NSNotificationCenter.defaultCenter.removeObserver(endObserver)
			endObserver = undefined
		}

		player?.pause()
		player = undefined
	}

	const load = async (autoplay = false) => {
		clearTrack()
		const track = current()
		if (!track) {
			state = 'idle'
			updateNowPlaying()
			emit()
			return
		}

		state = 'loading'
		error = undefined
		emit()
		try {
			const url = track.source.startsWith('/')
				? NSURL.fileURLWithPath(track.source)
				: NSURL.URLWithString(track.source)

			const item = AVPlayerItem.playerItemWithURL(url)
			player = AVPlayer.playerWithPlayerItem(item)
			endObserver = NSNotificationCenter.defaultCenter.addObserverForNameObjectQueueUsingBlock(
				AVPlayerItemDidPlayToEndTimeNotification,
				item,
				NSOperationQueue.mainQueue,
				() => void advance(1),
			)

			state = 'paused'
			updateNowPlaying()
			emit()
			if (autoplay) {
				await play()
			}
		} catch (cause) {
			error = cause instanceof Error ? cause : new Error(String(cause))
			state = 'error'
			emit()
			throw error
		}
	}

	const advance = async (delta: number) => {
		if (!queue.length || disposed) {
			return
		}
		if (index + delta >= queue.length) {
			state = 'ended'
			player?.pause()
			emit()
			return
		}

		index = Math.max(0, index + delta)
		await load(true)
	}

	const play = async () => {
		if (!player || disposed) {
			return
		}
		const category = AVAudioSessionCategoryPlayback
		session.setCategoryModeOptionsError(
			category,
			AVAudioSessionModeDefault,
			0 as AVAudioSessionCategoryOptions,
			undefined,
		)
		session.setActiveWithOptionsError(true, 0 as AVAudioSessionSetActiveOptions, undefined)
		player.play()
		state = 'playing'
		updateNowPlaying()
		emit()
	}

	const pause = async () => {
		player?.pause()
		state = 'paused'
		updateNowPlaying()
		emit()
	}

	const addRemoteTarget = (command: any, handler: (event?: any) => void) => {
		const token = command.addTargetWithHandler((event: any) => {
			handler(event)
			return (globalThis as any).MPRemoteCommandHandlerStatus.Success
		})

		remoteTargets.push({ command, token })
	}

	if (commandCenter) {
		addRemoteTarget(commandCenter.playCommand, () => void play())
		addRemoteTarget(commandCenter.pauseCommand, () => void pause())
		addRemoteTarget(commandCenter.nextTrackCommand, () => void advance(1))
		addRemoteTarget(commandCenter.previousTrackCommand, () => void advance(-1))
		addRemoteTarget(commandCenter.changePlaybackPositionCommand, (event) => {
			if (player && Number.isFinite(event.positionTime)) {
				player.seekToTime(CMTimeMakeWithSeconds(Math.max(0, event.positionTime), 600))
				updateNowPlaying()
				emit()
			}
		})
	}

	interruptionObserver = NSNotificationCenter.defaultCenter.addObserverForNameObjectQueueUsingBlock(
		AVAudioSessionInterruptionNotification,
		null,
		NSOperationQueue.mainQueue,
		(notification) => {
			const type = notification.userInfo.objectForKey(
				AVAudioSessionInterruptionTypeKey,
			).unsignedIntegerValue
			if (type === interruptionBegan) {
				wasPlayingBeforeInterruption = state === 'playing'
				player?.pause()
				state = 'paused'
				emit()
			} else if (wasPlayingBeforeInterruption) {
				const options =
					notification.userInfo.objectForKey(AVAudioSessionInterruptionOptionKey)
						?.unsignedIntegerValue ?? 0
				wasPlayingBeforeInterruption = false
				if ((options & interruptionShouldResume) !== 0) {
					void play()
				}
			}
		},
	)

	return {
		capabilities: (): AudioCapabilities => ({
			supported: true,
			backgroundPlayback: true,
			systemControls: hasMediaPlayer,
			userGestureRequired: false,
			interruptions: true,
		}),
		snapshot,
		subscribe: (listener) => {
			listeners.add(listener)
			listener(snapshot())
			timer ??= setInterval(() => {
				updateNowPlaying()
				emit()
			}, 500)

			return () => {
				listeners.delete(listener)
				if (!listeners.size && timer) {
					clearInterval(timer)
					timer = undefined
				}
			}
		},
		setQueue: async (tracks, startAt = 0) => {
			if (disposed) {
				throw new Error('AudioPlayer is disposed')
			}
			queue = [...tracks]
			index = queue.length
				? Math.max(
						0,
						Math.min(Number.isFinite(startAt) ? Math.floor(startAt) : 0, queue.length - 1),
					)
				: -1

			await load()
		},
		play,
		pause,
		seek: async (value) => {
			if (!player || !Number.isFinite(value)) {
				return
			}
			player.seekToTime(CMTimeMakeWithSeconds(Math.max(0, value), 600))
			updateNowPlaying()
			emit()
		},
		dispose: () => {
			if (disposed) {
				return
			}
			disposed = true
			clearTrack()
			if (interruptionObserver) {
				NSNotificationCenter.defaultCenter.removeObserver(interruptionObserver)
			}
			interruptionObserver = undefined
			for (const { command, token } of remoteTargets) {
				command.removeTarget(token)
			}
			remoteTargets.length = 0
			if (timer) {
				clearInterval(timer)
			}
			timer = undefined
			if (nowPlaying) {
				nowPlaying.nowPlayingInfo = null as unknown as NSDictionary<string, any>
			}
			session.setActiveWithOptionsError(false, notifyOthersOnDeactivation, undefined)
			listeners.clear()
			queue = []
			index = -1
			state = 'idle'
		},
	}
}
