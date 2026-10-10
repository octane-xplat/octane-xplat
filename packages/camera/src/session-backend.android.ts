import { Application } from '@nativescript/core'
import { CameraCaptureError } from './types'
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
} from './types'

let requestCode = 7820
let permissionChain: Promise<unknown> = Promise.resolve()
let owner: object | undefined

const nativeBridge = () => (globalThis as any).com?.octanexplat?.camera?.CameraSessionBridge
const permissionName = (kind: CameraPermissionKind) =>
	kind === 'camera' ? 'android.permission.CAMERA' : 'android.permission.RECORD_AUDIO'

const error = (kind: CaptureIssue['kind'], operation: string, message: string, cause?: unknown) =>
	new CameraCaptureError({ kind, operation, message, cause })

const context = () => Application.android.context
const preferences = () => context().getSharedPreferences('octane-camera-permissions', 0)

async function checkPermission(kind: CameraPermissionKind): Promise<CameraPermissionStatus> {
	const activity = Application.android.foregroundActivity ?? Application.android.startActivity
	if (!activity) {
		return 'unavailable'
	}

	const permission = permissionName(kind)
	if (activity.checkSelfPermission(permission) === 0) {
		return 'granted'
	}

	return preferences().getBoolean(kind, false)
		? activity.shouldShowRequestPermissionRationale(permission)
			? 'denied'
			: 'blocked'
		: 'notDetermined'
}

function requestPermission(kind: CameraPermissionKind): Promise<CameraPermissionStatus> {
	const result = permissionChain.then(async () => {
		const status = await checkPermission(kind)
		if (status !== 'notDetermined') {
			return status
		}

		const activity = Application.android.foregroundActivity ?? Application.android.startActivity
		if (!activity) {
			return 'unavailable' as const
		}

		return new Promise<CameraPermissionStatus>((resolve) => {
			const code = requestCode++
			const finish = (value: CameraPermissionStatus) => {
				clearTimeout(timer)
				Application.android.off(Application.android.activityRequestPermissionsEvent, onResult)
				resolve(value)
			}

			const onResult = (args: any) => {
				if (args.requestCode !== code) {
					return
				}

				if (!args.grantResults?.length) {
					finish('unknown')
					return
				}

				preferences().edit().putBoolean(kind, true).apply()
				finish(
					args.grantResults[0] === 0
						? 'granted'
						: activity.shouldShowRequestPermissionRationale(permissionName(kind))
							? 'denied'
							: 'blocked',
				)
			}

			const timer = setTimeout(() => finish('unknown'), 120_000)
			Application.android.on(Application.android.activityRequestPermissionsEvent, onResult)
			try {
				activity.requestPermissions([permissionName(kind)], code)
			} catch {
				finish('unavailable')
			}
		})
	})

	permissionChain = result.catch(() => {})
	return result
}

export function createSessionBackend(config: CameraSessionConfig): CameraSessionBackend {
	let currentConfig = { ...config }
	let observer: BackendObserver | undefined
	let bridge: any
	let host: any
	let listener: BackendPreviewListener | undefined
	let sink: BackendCaptureSink | undefined
	let released = false
	const lease = {}
	const selected = () =>
		typeof currentConfig.camera === 'object'
			? `id:${currentConfig.camera.deviceId}`
			: (currentConfig.camera ?? 'default')

	const releaseLease = () => {
		if (owner === lease) {
			owner = undefined
		}
	}

	const onSuspend = () => bridge?.background()
	const onResume = () => bridge?.foreground()
	const ensureBridge = () => {
		if (bridge) {
			return
		}

		const Bridge = nativeBridge()
		if (!Bridge) {
			throw error(
				'unsupportedPlatform',
				'preview',
				'CameraX video bridge is missing from the native build',
			)
		}

		bridge = new Bridge(
			context(),
			new Bridge.Listener({
				event(type: string, payload: string) {
					if (type === 'ready') {
						observer?.previewReady(payload === 'true')
						if (payload === 'true') {
							listener?.onReady?.()
						}
					} else if (type === 'availability') {
						observer?.availability(payload === 'true')
					} else if (type === 'interruption') {
						observer?.interruption('began', payload as any)
					} else if (type === 'recovered') {
						observer?.interruption('ended', payload as any)
					} else if (type === 'previewError') {
						observer?.availability(false)
						listener?.onError?.(error('unavailable', 'preview', payload))
						if (!host) {
							releaseLease()
						}
					} else if (type === 'finishing') {
						sink?.finishing(payload ? (payload as any) : undefined)
					} else if (type === 'started') {
						sink?.started(JSON.parse(payload))
					} else if (type === 'finished' || type === 'failed') {
						const target = sink
						sink = undefined
						if (!host) {
							releaseLease()
						}

						const result = JSON.parse(payload)
						target?.settled(
							type === 'finished'
								? result
								: {
										kind: 'failed',
										stage: result.stage,
										issue: error(result.kind, result.stage, result.message),
									},
						)
					}
				},
			}),
		)

		Application.on(Application.suspendEvent, onSuspend)
		Application.on(Application.resumeEvent, onResume)
	}

	return {
		platform: 'android',
		get supported() {
			return !!nativeBridge()
		},
		checkPermission,
		requestPermission: async (kind) => {
			const status = await requestPermission(kind)
			if (
				kind === 'camera' &&
				status === 'granted' &&
				host &&
				!sink &&
				!released &&
				!bridge?.isReady()
			) {
				try {
					ensureBridge()
					bridge.attach(host, selected())
				} catch (cause) {
					observer?.availability(false)
					listener?.onError?.(
						error(
							'unavailable',
							'preview',
							'Could not activate CameraX after permission approval',
							cause,
						),
					)
				}
			}

			return status
		},
		getCapabilities: async () => {
			const value = bridge ? JSON.parse(bridge.capabilities()) : { cameras: [], profiles: [] }
			const supported = !!nativeBridge()
			return {
				supported,
				available: !!bridge?.isReady(),
				reason: !supported
					? 'CameraX video bridge is missing from the native build'
					: !bridge?.isReady()
						? 'An active permitted preview is required'
						: undefined,
				cameras: value.cameras,
				profiles: value.profiles,
				audio: context().getPackageManager().hasSystemFeature('android.hardware.microphone'),
				orientations: [],
				durationLimit: 'native',
				elapsedTime: 'nativeMedia',
				output: {
					mimeType: 'video/mp4',
					container: 'mp4',
					storage: 'appPrivateFile',
					destinationFileUrl: true,
				},
			}
		},
		previewReady: () => !!bridge?.isReady(),
		validateStart: (options) => {
			if (
				options.maximumDurationMs !== undefined &&
				options.maximumDurationMs > 9_223_372_036_854
			) {
				throw error(
					'unsupportedConfiguration',
					'startRecording',
					'The duration exceeds CameraX media-time range',
				)
			}

			if (options.orientation && options.orientation !== 'unspecified') {
				throw error(
					'unsupportedConfiguration',
					'startRecording',
					'Fixed cardinal orientation has not been qualified on this Android source',
				)
			}
		},
		attachPreview: (target, callbacks) => {
			if (released || sink) {
				throw error('invalidState', 'attachPreview', 'The camera is disposed or finalizing')
			}

			if (owner && owner !== lease) {
				throw error('busy', 'attachPreview', 'Another camera session is still finalizing')
			}

			owner = lease
			host = target
			listener = callbacks
			try {
				ensureBridge()
			} catch (cause) {
				host = undefined
				listener = undefined
				releaseLease()
				throw error(
					'unavailable',
					'attachPreview',
					'Could not construct the CameraX native bridge',
					cause,
				)
			}

			void checkPermission('camera').then((status) => {
				if (released || !host) {
					return
				}

				if (status !== 'granted') {
					listener?.onError?.(
						error(
							'permissionDenied',
							'preview',
							'Request camera permission before activating this preview',
						),
					)

					return
				}

				try {
					bridge.attach(host, selected())
				} catch (cause) {
					listener?.onError?.(
						error('unavailable', 'preview', 'Could not bind shared CameraX preview', cause),
					)
				}
			})

			return () => {
				host = undefined
				listener = undefined
				bridge.detach()
				if (!sink) {
					releaseLease()
				}
			}
		},
		configure: (next) => {
			const sourceChanged =
				JSON.stringify(next.camera) !== JSON.stringify(currentConfig.camera) ||
				next.profile !== currentConfig.profile

			currentConfig = { ...next }
			if (host && sourceChanged) {
				bridge.detach()
				bridge.attach(host, selected())
			}
		},
		startCapture: (request, target) => {
			sink = target
			try {
				bridge.start(
					request.audio,
					request.destinationPath ?? '',
					request.maximumDurationMs === undefined
						? 0
						: Math.max(1, Math.ceil(request.maximumDurationMs)),
				)
			} catch (cause) {
				sink = undefined
				target.settled({
					kind: 'failed',
					stage: 'preparation',
					issue: error(
						'captureFailed',
						'startRecording',
						'CameraX could not begin recording',
						cause,
					),
				})
			}
		},
		stopCapture: () => bridge?.stop(),
		elapsedMs: () => Number(bridge?.elapsedMs() ?? 0),
		openOutput: async (output) => {
			if (output.kind !== 'nativeFile' || output.synthetic) {
				throw error('invalidArgument', 'openOutput', 'Expected a native Android movie reference')
			}

			try {
				const url = nativeBridge().openOutput(output.resourceId, output.fileUrl)
				return { url, fileUrl: url, release: () => {} }
			} catch (cause) {
				throw error(
					'destinationUnavailable',
					'openOutput',
					'The stored Android movie cannot be reopened',
					cause,
				)
			}
		},
		release: async () => {
			released = true
			Application.off(Application.suspendEvent, onSuspend)
			Application.off(Application.resumeEvent, onResume)
			bridge?.release()
			host = undefined
			releaseLease()
		},
		setObserver: (value) => {
			observer = value
		},
	}
}
