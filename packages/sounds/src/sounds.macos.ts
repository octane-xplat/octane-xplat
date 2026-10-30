import type { SoundBank, SoundBankOptions } from './types'

// Foundation/AVFoundation are supplied by the AppKit host's system metadata.
type SoundData = object
interface SoundPlayer {
	volume: number
	playing: boolean
	prepareToPlay(): boolean
	play(): boolean
	stop(): void
}

interface DataTask {
	resume(): void
	cancel(): void
}

declare const AVAudioPlayer: {
	alloc(): { initWithDataError(data: SoundData, error: null): SoundPlayer | null }
}

declare const NSData: { dataWithContentsOfURL(url: unknown): SoundData | null }
declare const NSURL: { URLWithString(uri: string): unknown; fileURLWithPath(path: string): unknown }
interface SoundSession {
	dataTaskWithURLCompletionHandler(
		url: unknown,
		callback: (
			data: SoundData | null,
			response: { statusCode?: number } | null,
			error: unknown,
		) => void,
	): DataTask
	invalidateAndCancel(): void
}

declare const NSURLSessionConfiguration: { defaultSessionConfiguration: unknown }
declare const NSOperationQueue: { mainQueue: unknown }
declare const NSURLSession: {
	sessionWithConfigurationDelegateDelegateQueue(
		configuration: unknown,
		delegate: null,
		queue: unknown,
	): SoundSession
}

type Clip = { data?: SoundData; cancel?: () => void }
type Voice = { name: string; player: SoundPlayer }

/** Create an owned sound bank of named clips (see SoundBank). */
export const createSoundBank = ({ maxVoices = 6 }: SoundBankOptions = {}): SoundBank => {
	const voiceLimit = Number.isFinite(maxVoices) ? Math.max(1, Math.floor(maxVoices)) : 6
	const supported =
		typeof AVAudioPlayer !== 'undefined' &&
		typeof NSData !== 'undefined' &&
		typeof NSURL !== 'undefined' &&
		typeof NSURLSession !== 'undefined' &&
		typeof NSURLSessionConfiguration !== 'undefined' &&
		typeof NSOperationQueue !== 'undefined'

	// Native callbacks must reenter JavaScript on the AppKit main queue.
	const session = supported
		? NSURLSession.sessionWithConfigurationDelegateDelegateQueue(
				NSURLSessionConfiguration.defaultSessionConfiguration,
				null,
				NSOperationQueue.mainQueue,
			)
		: undefined

	const clips = new Map<string, Clip>()
	const active: Voice[] = []
	let timer: ReturnType<typeof setInterval> | undefined
	let disposed = false

	const stopTimer = () => {
		if (timer !== undefined) {
			clearInterval(timer)
		}

		timer = undefined
	}

	const stopVoice = (voice: Voice) => {
		const index = active.indexOf(voice)
		if (index !== -1) {
			active.splice(index, 1)
		}

		voice.player.stop()
		if (!active.length) {
			stopTimer()
		}
	}

	const reap = () => {
		for (let index = active.length - 1; index >= 0; index--) {
			const voice = active[index]!
			if (!voice.player.playing) {
				stopVoice(voice)
			}
		}
	}

	const stop = (name?: string) => {
		for (let index = active.length - 1; index >= 0; index--) {
			const voice = active[index]!
			if (name === undefined || voice.name === name) {
				stopVoice(voice)
			}
		}
	}

	const playerFor = (data: SoundData) => {
		const player = AVAudioPlayer.alloc().initWithDataError(data, null)
		if (!player || !player.prepareToPlay()) {
			player?.stop()
			throw new Error('Failed to decode sound')
		}

		return player
	}

	return {
		capabilities: () => ({
			supported,
			userGestureRequired: false,
			maxVoices: voiceLimit,
			...(!supported ? { reason: 'AppKit audio APIs are unavailable.' } : {}),
		}),
		load: async (name, source) => {
			if (disposed) {
				throw new Error('SoundBank is disposed')
			}

			if (!supported) {
				throw new Error('AppKit audio APIs are unavailable')
			}

			stop(name)
			clips.get(name)?.cancel?.()
			const clip: Clip = {}
			clips.set(name, clip)
			const uri = typeof source === 'string' ? source : source.uri
			try {
				const url = /^[a-z][a-z\d+.-]*:/i.test(uri)
					? NSURL.URLWithString(uri)
					: NSURL.fileURLWithPath(uri)

				if (!url) {
					throw new Error('Invalid sound URI')
				}

				const data = /^https?:/i.test(uri)
					? await new Promise<SoundData>((resolve, reject) => {
							let settled = false
							const task = session!.dataTaskWithURLCompletionHandler(
								url,
								(bytes, response, error) => {
									if (settled) {
										return
									}

									settled = true
									clip.cancel = undefined
									if (
										error ||
										!bytes ||
										(response?.statusCode !== undefined &&
											(response.statusCode < 200 || response.statusCode >= 300))
									) {
										reject(new Error(`Failed to load sound '${name}'`))
									} else {
										resolve(bytes)
									}
								},
							)

							clip.cancel = () => {
								if (settled) {
									return
								}

								settled = true
								task.cancel()
								reject(new Error(`Sound load '${name}' was cancelled`))
							}

							task.resume()
						})
					: NSData.dataWithContentsOfURL(url)

				if (disposed || clips.get(name) !== clip) {
					throw new Error(`Sound load '${name}' was cancelled`)
				}

				if (!data) {
					throw new Error(`Failed to load sound '${name}'`)
				}

				const player = playerFor(data)
				player.stop()
				clip.data = data
			} catch (error) {
				if (clips.get(name) === clip) {
					clips.delete(name)
				}

				throw error
			}
		},
		play: async (name, { volume = 1 } = {}) => {
			const data = clips.get(name)?.data
			if (disposed || !data) {
				return false
			}

			let player: SoundPlayer | undefined
			try {
				player = playerFor(data)
				player.volume = Number.isFinite(volume) ? Math.max(0, Math.min(1, volume)) : 1
				reap()
				while (active.length >= voiceLimit) {
					stopVoice(active[0]!)
				}

				if (!player.play()) {
					player.stop()
					return false
				}

				active.push({ name, player })
				timer ??= setInterval(reap, 50)
				return true
			} catch {
				player?.stop()
				return false
			}
		},
		stop,
		dispose: () => {
			if (disposed) {
				return
			}

			disposed = true
			stop()
			stopTimer()
			for (const clip of clips.values()) {
				clip.cancel?.()
			}

			clips.clear()
			session?.invalidateAndCancel()
		},
	}
}
