import { CameraCaptureError } from './types'
import { commitMovie, openStoredMovie, removeReservation, reserveMovie } from './movie-storage.web'
import { inspectMovie } from './movie-metadata.web'
import type {
	BackendCaptureSink,
	BackendObserver,
	BackendPreviewListener,
	CameraSessionBackend,
} from './session-core'

import type {
	CameraPermissionKind,
	CameraPermissionStatus,
	CameraSessionConfig,
	CaptureIssue,
	EffectiveCaptureConfig,
	MovieClip,
} from './types'

const mimeCandidates = [
	'video/webm;codecs=vp8,opus',
	'video/webm;codecs=vp9,opus',
	'video/mp4;codecs=avc1.424028,mp4a.40.2',
]

let owner: object | undefined

const error = (kind: CaptureIssue['kind'], operation: string, message: string, cause?: unknown) =>
	new CameraCaptureError({ kind, operation, message, cause })

const policyAllows = (kind: CameraPermissionKind) => {
	const policy =
		(
			document as Document & {
				permissionsPolicy?: { allowsFeature(feature: string): boolean }
				featurePolicy?: { allowsFeature(feature: string): boolean }
			}
		).permissionsPolicy ?? (document as any).featurePolicy

	return policy?.allowsFeature(kind) !== false
}

export function createSessionBackend(config: CameraSessionConfig): CameraSessionBackend {
	let currentConfig = { ...config }
	let observer: BackendObserver | undefined
	let host: HTMLVideoElement | undefined
	let listener: BackendPreviewListener | undefined
	let stream: MediaStream | undefined
	let ready = false
	let released = false
	let generation = 0
	let persistent = false
	let recorder: MediaRecorder | undefined
	let sink: BackendCaptureSink | undefined
	let startedAt = 0
	let stoppedAt = 0
	let stopTimer: ReturnType<typeof setTimeout> | undefined
	let watchdog: ReturnType<typeof setTimeout> | undefined
	let recordingAudio = false
	let captureFailure: ((cause: unknown) => Promise<void>) | undefined
	const lease = {}
	const known: Record<CameraPermissionKind, CameraPermissionStatus> = {
		camera: 'unknown',
		microphone: 'unknown',
	}

	const supported = () =>
		typeof navigator !== 'undefined' &&
		globalThis.isSecureContext === true &&
		!!navigator.mediaDevices?.getUserMedia &&
		typeof MediaRecorder !== 'undefined' &&
		typeof indexedDB !== 'undefined' &&
		!!navigator.storage?.persisted &&
		!!mimeType()

	const mimeType = () =>
		typeof MediaRecorder === 'undefined'
			? ''
			: (mimeCandidates.find((mime) => MediaRecorder.isTypeSupported(mime)) ?? '')

	const markReady = (value: boolean) => {
		ready = value
		observer?.previewReady(value)
	}

	const dropStream = () => {
		if (host) {
			host.srcObject = null
		}

		stream?.getTracks().forEach((track) => track.stop())
		stream = undefined
		markReady(false)
		if (owner === lease) {
			owner = undefined
		}
	}

	const onVisibility = () => {
		if (document.visibilityState === 'hidden') {
			markReady(false)
			observer?.interruption('began', 'background')
		} else {
			observer?.interruption('ended', 'background')
			markReady(!!host && stream?.getVideoTracks()[0]?.readyState === 'live')
		}
	}

	const onPageHide = () => {
		markReady(false)
		observer?.interruption('began', 'background')
	}

	const observeTracks = (target: MediaStream) => {
		for (const track of target.getTracks()) {
			track.addEventListener('ended', () => {
				if (track.kind === 'audio' && (!sink || !recordingAudio)) {
					return
				}

				if (stream !== target) {
					return
				}

				markReady(false)
				observer?.availability(false)
				observer?.interruption('began', 'unknown')
			})

			track.addEventListener('mute', () => {
				if (track.kind === 'audio' && (!sink || !recordingAudio)) {
					return
				}

				if (stream === target) {
					markReady(false)
					observer?.interruption('began', 'unknown')
				}
			})

			track.addEventListener('unmute', () => {
				if (stream === target && document.visibilityState !== 'hidden') {
					observer?.interruption('ended', 'unknown')
					observer?.availability(true)
					markReady(!!host)
				}
			})
		}
	}

	const constraints = (): MediaTrackConstraints => {
		const camera = currentConfig.camera
		return {
			width: { ideal: 1280 },
			height: { ideal: 720 },
			frameRate: { ideal: 30 },
			...(typeof camera === 'object'
				? { deviceId: { exact: camera.deviceId } }
				: camera === 'front' || camera === 'back'
					? { facingMode: { exact: camera === 'front' ? 'user' : 'environment' } }
					: {}),
		}
	}

	let acquisition: Promise<void> | undefined
	const acquireCameraOnce = async () => {
		if (stream?.getVideoTracks()[0]?.readyState === 'live') {
			return
		}

		if (owner && owner !== lease) {
			throw error('busy', 'preview', 'Another camera session still owns the source')
		}

		owner = lease
		const epoch = generation
		try {
			const acquired = await navigator.mediaDevices.getUserMedia({
				video: constraints(),
				audio: false,
			})

			if (released || epoch !== generation) {
				acquired.getTracks().forEach((track) => track.stop())
				if (!stream && owner === lease) {
					owner = undefined
				}

				return
			}

			for (const track of stream?.getAudioTracks() ?? []) {
				acquired.addTrack(track)
			}

			stream = acquired
			known.camera = 'granted'
			observeTracks(acquired)
			observer?.availability(true)
		} catch (cause) {
			if (owner === lease) {
				owner = undefined
			}

			throw cause
		}
	}

	const acquireCamera = () => {
		acquisition ??= acquireCameraOnce().finally(() => {
			acquisition = undefined
		})

		return acquisition
	}

	const showPreview = async () => {
		if (!host || released) {
			return
		}

		const element = host
		const epoch = generation
		if ((await checkPermission('camera')) !== 'granted') {
			listener?.onError?.(
				error(
					'permissionBlocked',
					'preview',
					'Request camera access from a user action before activating this preview',
				),
			)

			return
		}

		await acquireCamera()
		if (host !== element || !stream || released || epoch !== generation) {
			return
		}

		element.srcObject = stream
		element.muted = true
		const facing = stream.getVideoTracks()[0]?.getSettings().facingMode
		element.style.transform = facing === 'user' ? 'scaleX(-1)' : ''
		await element.play()
		if (host !== element || released || epoch !== generation) {
			return
		}

		markReady(document.visibilityState !== 'hidden')
		listener?.onReady?.()
	}

	async function checkPermission(kind: CameraPermissionKind): Promise<CameraPermissionStatus> {
		if (globalThis.isSecureContext !== true || !navigator.mediaDevices?.getUserMedia) {
			return 'unavailable'
		}

		if (!policyAllows(kind)) {
			return 'blocked'
		}

		try {
			const status = await navigator.permissions.query({ name: kind as PermissionName })
			return status.state === 'granted'
				? 'granted'
				: status.state === 'denied'
					? 'blocked'
					: known[kind] === 'blocked'
						? 'blocked'
						: 'notDetermined'
		} catch {
			if (known[kind] !== 'granted') {
				return known[kind]
			}

			const tracks = kind === 'camera' ? stream?.getVideoTracks() : stream?.getAudioTracks()
			return tracks?.some((track) => track.readyState === 'live') ? 'granted' : 'unknown'
		}
	}

	const settle = (value: Parameters<BackendCaptureSink['settled']>[0], expected = sink) => {
		const target = sink
		if (!target || target !== expected) {
			return
		}

		sink = undefined
		recorder = undefined
		captureFailure = undefined
		clearTimeout(stopTimer)
		clearTimeout(watchdog)
		if (!host) {
			dropStream()
		}

		target.settled(value)
	}

	const stop = () => {
		if (!recorder || !sink) {
			return
		}

		stoppedAt ||= performance.now()
		clearTimeout(watchdog)
		const target = sink
		const fail = captureFailure
		watchdog = setTimeout(() => {
			if (sink !== target) {
				return
			}

			dropStream()
			void fail?.(error('finalizationFailed', 'stop', 'Recorder finalization callback timed out'))
		}, 30_000)

		if (recorder.state === 'inactive') {
			return
		}

		try {
			recorder.stop()
		} catch (cause) {
			void fail?.(error('captureFailed', 'stop', 'The recorder could not stop', cause))
		}
	}

	return {
		platform: 'web',
		get supported() {
			return supported()
		},
		checkPermission,
		requestPermission: async (kind) => {
			const status = await checkPermission(kind)
			if (status === 'blocked' || status === 'unavailable') {
				return status
			}

			if (navigator.userActivation && !navigator.userActivation.isActive && status !== 'granted') {
				return 'blocked'
			}

			// Persistence and device prompts run only inside an explicit app action.
			persistent = (await navigator.storage?.persisted?.().catch(() => false)) ?? false
			if (!persistent && (!navigator.userActivation || navigator.userActivation.isActive)) {
				persistent = (await navigator.storage?.persist?.().catch(() => false)) ?? false
			}

			try {
				if (kind === 'camera') {
					await acquireCamera()
				} else if (!stream?.getAudioTracks().some((track) => track.readyState === 'live')) {
					const epoch = generation
					const audio = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
					if (released || epoch !== generation) {
						audio.getTracks().forEach((track) => track.stop())
						return 'unavailable'
					}

					if (!stream) {
						stream = new MediaStream()
					}

					for (const track of audio.getAudioTracks()) {
						stream.addTrack(track)
					}

					observeTracks(stream)
				}

				known[kind] = 'granted'
				if (host) {
					await showPreview()
				}

				return 'granted'
			} catch (cause) {
				known[kind] =
					cause instanceof DOMException &&
					(cause.name === 'NotAllowedError' || cause.name === 'SecurityError')
						? 'blocked'
						: 'unavailable'

				return known[kind]
			}
		},
		getCapabilities: async () => {
			persistent = (await navigator.storage?.persisted?.().catch(() => false)) ?? false
			const devices = (await navigator.mediaDevices?.enumerateDevices?.().catch(() => [])) ?? []
			const settings = stream?.getVideoTracks()[0]?.getSettings()
			const mime = mimeType()
			return {
				supported: supported(),
				available: ready && persistent,
				reason: !supported()
					? 'Secure media capture, a supported WebM/MP4 codec, and IndexedDB storage are required'
					: !persistent
						? 'Persistent origin storage must be granted before recording'
						: !ready
							? 'An active permitted preview is required'
							: undefined,
				cameras: devices
					.filter((device) => device.kind === 'videoinput')
					.map((device) => ({ id: device.deviceId, label: device.label })),
				profiles:
					settings?.width && settings.height && settings.frameRate
						? [
								{
									profile: 'standard' as const,
									width: settings.width,
									height: settings.height,
									frameRate: settings.frameRate,
								},
							]
						: [],
				audio: devices.some((device) => device.kind === 'audioinput'),
				orientations: [],
				durationLimit: 'bestEffort',
				elapsedTime: 'estimated',
				output: {
					mimeType: mime,
					container: !mime ? '' : mime.startsWith('video/mp4') ? 'mp4' : 'webm',
					storage: 'originLocal',
					destinationFileUrl: false,
				},
			}
		},
		previewReady: () => ready && !!host && !released,
		validateStart: (options) => {
			if (!persistent) {
				throw error(
					'destinationUnavailable',
					'startRecording',
					'Persistent origin storage has not been granted; check capabilities after a user permission action',
				)
			}

			if (options.destinationFileUrl) {
				throw error(
					'unsupportedConfiguration',
					'startRecording',
					'Browser output does not accept native file URLs',
				)
			}

			if (options.orientation && options.orientation !== 'unspecified') {
				throw error(
					'unsupportedConfiguration',
					'startRecording',
					'This browser cannot lock a recording orientation',
				)
			}
		},
		attachPreview: (target, callbacks) => {
			if (released || sink) {
				throw error('invalidState', 'attachPreview', 'The camera is disposed or still finalizing')
			}

			host = target as HTMLVideoElement
			listener = callbacks
			document.addEventListener('visibilitychange', onVisibility)
			globalThis.addEventListener('pagehide', onPageHide)
			void showPreview().catch((cause) =>
				callbacks?.onError?.(
					error('unavailable', 'preview', 'Could not activate camera preview', cause),
				),
			)

			return () => {
				if (host) {
					host.srcObject = null
				}

				host = undefined
				listener = undefined
				generation += 1
				markReady(false)
				document.removeEventListener('visibilitychange', onVisibility)
				globalThis.removeEventListener('pagehide', onPageHide)
				if (!sink) {
					dropStream()
				}
			}
		},
		configure: (next) => {
			const sourceChanged =
				JSON.stringify(next.camera) !== JSON.stringify(currentConfig.camera) ||
				next.profile !== currentConfig.profile

			currentConfig = { ...next }
			if (sourceChanged) {
				generation += 1
				dropStream()
				if (host) {
					void showPreview().catch((cause) =>
						listener?.onError?.(
							error('unavailable', 'configure', 'Could not change camera', cause),
						),
					)
				}
			}
		},
		startCapture: (request, target) => {
			sink = target
			recordingAudio = request.audio
			startedAt = 0
			stoppedAt = 0
			const source = stream
			const video = source?.getVideoTracks()[0]
			const audio = source?.getAudioTracks().filter((track) => track.readyState === 'live') ?? []
			if (!video || (request.audio && !audio.length)) {
				settle({
					kind: 'failed',
					stage: 'preparation',
					issue: error(
						request.audio ? 'permissionDenied' : 'unavailable',
						'startRecording',
						request.audio
							? 'Requested microphone access is missing'
							: 'Video source is unavailable',
					),
				})

				return
			}

			const recordingStream = new MediaStream([video, ...(request.audio ? audio : [])])
			let reservation: string | undefined
			let stage: 'preparation' | 'capture' | 'finalization' | 'storage' = 'preparation'
			const chunks: Blob[] = []
			let captureError: unknown
			let limitReached = false
			let failing = false
			let didStart = false
			captureFailure = fail
			void (async () => {
				try {
					if (!(await navigator.storage.persisted())) {
						throw error(
							'destinationUnavailable',
							'startRecording',
							'Persistent storage is unavailable',
						)
					}

					reservation = await reserveMovie()
					if (!source || video.readyState !== 'live' || document.visibilityState === 'hidden') {
						throw error(
							'unavailable',
							'startRecording',
							'Camera source became inactive before recording',
						)
					}

					const activeRecorder = new MediaRecorder(recordingStream, { mimeType: mimeType() })
					recorder = activeRecorder
					activeRecorder.ondataavailable = (event) => {
						if (sink !== target || failing) {
							return
						}

						if (event.data.size) {
							chunks.push(event.data)
						}
					}

					activeRecorder.onerror = (event) => {
						if (sink !== target || failing) {
							return
						}

						captureError = event
						stop()
					}

					activeRecorder.onstart = () => {
						if (sink !== target || failing) {
							return
						}

						if (didStart) {
							return
						}

						didStart = true
						clearTimeout(watchdog)
						startedAt = performance.now()
						stage = 'capture'
						const settings = video.getSettings()
						const effective: EffectiveCaptureConfig = {
							cameraId: settings.deviceId ?? '',
							audio: request.audio,
							width: settings.width ?? 0,
							height: settings.height ?? 0,
							frameRate: settings.frameRate ?? 0,
							orientation: 'unspecified',
							mimeType: activeRecorder.mimeType,
							container: activeRecorder.mimeType.startsWith('video/mp4') ? 'mp4' : 'webm',
						}

						// The adapter owns a limit even when capabilities() was not called.
						if (request.maximumDurationMs) {
							const limit = request.maximumDurationMs
							const checkLimit = () => {
								if (sink !== target || failing) {
									return
								}

								const remaining = limit - (performance.now() - startedAt)
								if (remaining > 0) {
									stopTimer = setTimeout(checkLimit, Math.min(remaining, 2_147_483_647))
								} else {
									limitReached = true
									stop()
								}
							}

							stopTimer = setTimeout(checkLimit, Math.min(limit, 2_147_483_647))
						}

						target.started(effective)
					}

					activeRecorder.onstop = () => {
						if (sink !== target || failing) {
							return
						}

						target.finishing(
							captureError ? 'captureError' : limitReached ? 'maximumDuration' : undefined,
						)

						stoppedAt ||= performance.now()
						clearTimeout(stopTimer)
						clearTimeout(watchdog)
						void (async () => {
							try {
								stage = 'finalization'
								if (!startedAt) {
									throw error('noMedia', 'finalize', 'No recording start was observed')
								}

								const bytes = new Blob(chunks, { type: activeRecorder.mimeType })
								const metadata = await inspectMovie(bytes, request.audio)
								if (sink !== target || failing) {
									return
								}

								const output = {
									kind: 'browserStorage' as const,
									resourceId: reservation!,
									retention: 'persistent' as const,
								}

								const clip: MovieClip = { ...metadata, output }
								stage = 'storage'
								await commitMovie(reservation!, bytes, clip)
								settle(
									{
										kind: 'clip',
										...clip,
										limitReached,
										warning: captureError
											? error(
													'captureFailed',
													'capture',
													'Recorder reported an error; finalized media was verified',
													captureError,
												)
											: undefined,
									},
									target,
								)
							} catch (cause) {
								await fail(cause)
							}
						})()
					}

					activeRecorder.start(1000)
					watchdog = setTimeout(() => {
						if (!startedAt && sink === target) {
							stop()
							void fail(
								error('captureFailed', 'startRecording', 'Recorder start callback timed out'),
							)
						}
					}, 15_000)
				} catch (cause) {
					await fail(cause)
				}
			})()

			async function fail(cause: unknown) {
				if (sink !== target || failing) {
					return
				}

				failing = true
				if (reservation) {
					await removeReservation(reservation).catch(() => {})
				}

				settle(
					{
						kind: 'failed',
						stage,
						issue:
							cause instanceof CameraCaptureError
								? cause
								: error(
										stage === 'storage'
											? 'storageFailed'
											: stage === 'preparation' || stage === 'capture'
												? 'captureFailed'
												: 'finalizationFailed',
										stage,
										'Movie recording could not complete',
										cause,
									),
					},
					target,
				)
			}
		},
		stopCapture: stop,
		elapsedMs: () => (startedAt ? Math.max(0, (stoppedAt || performance.now()) - startedAt) : 0),
		openOutput: openStoredMovie,
		release: async () => {
			released = true
			generation += 1
			document.removeEventListener('visibilitychange', onVisibility)
			globalThis.removeEventListener('pagehide', onPageHide)
			dropStream()
			host = undefined
		},
		setObserver: (value) => {
			observer = value
		},
	}
}
