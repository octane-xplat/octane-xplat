import type { SoundBank, SoundBankOptions, SoundCapabilities, SoundSource } from './types'

export const createSoundBank = ({ maxVoices = 6 }: SoundBankOptions = {}): SoundBank => {
	const voiceLimit = Number.isFinite(maxVoices) ? Math.max(1, Math.floor(maxVoices)) : 6

	const clips = new Map<string, HTMLAudioElement>()
	const active = new Map<HTMLAudioElement, string>()
	let disposed = false

	const stopVoice = (voice: HTMLAudioElement) => {
		voice.pause()
		voice.removeAttribute('src')
		active.delete(voice)
	}

	return {
		capabilities: (): SoundCapabilities => ({
			supported: typeof Audio !== 'undefined',
			userGestureRequired: true,
			maxVoices: voiceLimit,
			reason: 'Browsers may block playback until a user gesture unlocks audio.',
		}),
		load: async (name: string, source: SoundSource) => {
			if (disposed) {
				throw new Error('SoundBank is disposed')
			}

			for (const [voice, voiceName] of active) {
				if (voiceName === name) {
					stopVoice(voice)
				}
			}

			const old = clips.get(name)
			old?.pause()
			old?.removeAttribute('src')

			const audio = new Audio()
			audio.preload = 'auto'
			audio.src = typeof source === 'string' ? source : source.uri
			audio.load()
			clips.set(name, audio)
			await new Promise<void>((resolve, reject) => {
				if (audio.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) {
					return resolve()
				}

				audio.addEventListener('canplaythrough', () => resolve(), {
					once: true,
				})

				audio.addEventListener(
					'error',
					() => reject(new Error(`Failed to preload sound '${name}'`)),
					{ once: true },
				)
			})
		},
		play: async (name, { volume = 1 } = {}) => {
			const source = clips.get(name)
			if (!source || disposed) {
				return false
			}

			if (active.size >= voiceLimit) {
				const oldest = active.keys().next().value as HTMLAudioElement | undefined

				if (oldest) {
					stopVoice(oldest)
				}
			}

			const voice = source.cloneNode() as HTMLAudioElement
			voice.volume = Math.max(0, Math.min(1, volume))
			active.set(voice, name)
			voice.addEventListener('ended', () => active.delete(voice), {
				once: true,
			})

			voice.addEventListener('error', () => active.delete(voice), {
				once: true,
			})

			try {
				await voice.play()
				return true
			} catch {
				active.delete(voice)
				return false
			}
		},
		stop: (name) => {
			for (const [voice, voiceName] of active) {
				if (name === undefined || voiceName === name) {
					stopVoice(voice)
				}
			}
		},
		dispose: () => {
			disposed = true
			for (const audio of [...active.keys(), ...clips.values()]) {
				audio.pause()
				audio.removeAttribute('src')
				audio.load()
			}

			active.clear()
			clips.clear()
		},
	}
}
