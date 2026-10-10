import { Application } from '@nativescript/core'
import { CameraCaptureError } from './types'
import type {
	BackendCaptureRequest,
	BackendCaptureSink,
	BackendObserver,
	BackendPreviewListener,
	CameraSessionBackend,
} from './session-core'

import type {
	CameraDeviceInfo,
	CameraOrientation,
	CameraPermissionKind,
	CameraPermissionStatus,
	CameraSessionConfig,
	CaptureIssue,
	EffectiveCaptureConfig,
	MovieOutputHandle,
} from './types'

/** Windows adapter: one `Windows.Media.Capture.MediaCapture` shared between a
 *  `Microsoft.UI.Xaml.Controls.CaptureElement` preview and a single
 *  `StartRecordToStorageFileAsync` capture attempt. Everything reaches WinRT
 *  through the runtime's dynamic projection (`Windows`/`Microsoft`/`NSWinRT`
 *  globals), so every call site is guarded — a projection miss reports
 *  `unsupported`/`unavailable`, never fabricated capture. */

// Windows.Devices.Enumeration.DeviceAccessStatus
const deviceAccessUnspecified = 0
const deviceAccessAllowed = 1
const deviceAccessDeniedByUser = 2
const deviceAccessDeniedBySystem = 3

// Windows.Security.Authorization.AppCapabilityAccess.AppCapabilityAccessStatus
const appCapabilityDeniedBySystem = 0
const appCapabilityNotDeclaredByApp = 1
const appCapabilityDeniedByUser = 2
const appCapabilityUserPromptRequired = 3
const appCapabilityAllowed = 4

// Windows.Devices.Enumeration.Panel
const panelFront = 1
const panelBack = 2

// Windows.Media.Capture.StreamingCaptureMode
const captureModeVideo = 0
const captureModeAudioAndVideo = 2

// Windows.Media.Capture.MediaCaptureRotation
const recordRotationNone = 0
const recordRotation90 = 1
const recordRotation180 = 2
const recordRotation270 = 3

// Windows.Storage.CreationCollisionOption
const collisionGenerateUniqueName = 0
const collisionFailIfExists = 1
const collisionOpenIfExists = 2

// Windows.Storage.FileProperties.VideoOrientation — stored display rotation
const fileOrientationNormal = 0
const fileOrientation90 = 90
const fileOrientation180 = 180
const fileOrientation270 = 270

const capabilityNameFor = (kind: CameraPermissionKind): string =>
	kind === 'camera' ? 'webcam' : 'microphone'

const minFreeDiskBytes = 64 * 1024 * 1024

const projection = (): { Windows?: any; Microsoft?: any; NSWinRT?: any } => {
	const host = globalThis as any
	return { Windows: host.Windows, Microsoft: host.Microsoft, NSWinRT: host.NSWinRT }
}

const error = (kind: CaptureIssue['kind'], operation: string, message: string, cause?: unknown) =>
	new CameraCaptureError({ kind, operation, message, cause })

const issue = (
	kind: CaptureIssue['kind'],
	operation: string,
	message: string,
	extra?: Partial<CaptureIssue>,
): CaptureIssue => ({ kind, operation, message, ...extra })

/** AppCapabilityAccessStatus → portable permission. `notDeclared` is a
 *  setup error, not a status — callers surface `configurationMissing`. */
export const accessStatusToPermission = (
	status: number | undefined,
): CameraPermissionStatus | 'notDeclared' => {
	switch (status) {
		case appCapabilityAllowed:
			return 'granted'
		case appCapabilityDeniedByUser:
			return 'denied'
		case appCapabilityDeniedBySystem:
			return 'restricted'
		case appCapabilityUserPromptRequired:
			return 'notDetermined'
		case appCapabilityNotDeclaredByApp:
			return 'notDeclared'
		default:
			return 'unknown'
	}
}

/** DeviceAccessStatus → portable permission for hosts without AppCapability. */
export const deviceAccessStatusToPermission = (
	status: number | undefined,
): CameraPermissionStatus => {
	switch (status) {
		case deviceAccessAllowed:
			return 'granted'
		case deviceAccessDeniedByUser:
			return 'denied'
		case deviceAccessDeniedBySystem:
			return 'restricted'
		case deviceAccessUnspecified:
			return 'notDetermined'
		default:
			return 'unknown'
	}
}

/** Enclosure panel → facing. Desktop cameras often report no panel — an
 *  external webcam never fabricates front/back semantics. */
export const panelToFacing = (panel: number | undefined): 'front' | 'back' | undefined =>
	panel === panelFront ? 'front' : panel === panelBack ? 'back' : undefined

/** Stored display rotation (degrees CW) → cardinal orientation, matching the
 *  iOS transform mapping. Missing or unrecognized values stay `unspecified`. */
export const videoOrientationToOrientation = (degrees: number | undefined): CameraOrientation => {
	switch (degrees) {
		case fileOrientation90:
			return 'portrait'
		case fileOrientation180:
			return 'landscapeLeft'
		case fileOrientation270:
			return 'portraitUpsideDown'
		case fileOrientationNormal:
			return 'landscapeRight'
		default:
			return 'unspecified'
	}
}

export const orientationToRotation = (orientation: CameraOrientation): number | undefined =>
	orientation === 'portrait'
		? recordRotation90
		: orientation === 'portraitUpsideDown'
			? recordRotation270
			: orientation === 'landscapeLeft'
				? recordRotation180
				: orientation === 'landscapeRight'
					? recordRotationNone
					: undefined

export interface WindowsCameraDevice {
	id: string
	label: string
	facing?: 'front' | 'back'
}

/** Camera selection: explicit deviceId wins; front/back match the enclosure
 *  panel; `default` takes the OS-preferred camera then the first device. */
export const selectCameraDevice = (
	camera: CameraSessionConfig['camera'],
	devices: WindowsCameraDevice[],
	defaultId: string | undefined,
): WindowsCameraDevice | undefined => {
	if (camera && typeof camera === 'object' && 'deviceId' in camera) {
		return devices.find((entry) => entry.id === camera.deviceId)
	}

	if (camera === 'front' || camera === 'back') {
		return devices.find((entry) => entry.facing === camera)
	}

	return (
		devices.find((entry) => entry.id === defaultId) ??
		devices.find((entry) => entry.facing === 'back') ??
		devices[0]
	)
}

export interface WindowsStreamProfile {
	width: number
	height: number
	frameRate: number
	subtype?: string
}

/** Pick the standard profile: 1280x720 @ 30 fps when the source offers it,
 *  otherwise the smallest stream then lowest frame rate. The selected
 *  combination is disclosed — never an idealized 720p claim. */
export const chooseStandardProfile = (
	profiles: WindowsStreamProfile[],
): WindowsStreamProfile | undefined => {
	if (!profiles.length) {
		return undefined
	}

	const exact = profiles.find(
		(entry) => entry.width === 1280 && entry.height === 720 && Math.round(entry.frameRate) === 30,
	)

	if (exact) {
		return exact
	}

	return [...profiles].sort((a, b) => {
		const areaDelta = a.width * a.height - b.width * b.height
		if (areaDelta !== 0) {
			return areaDelta
		}

		return a.frameRate - b.frameRate
	})[0]
}

/** Classify a native failure without depending on projected error shapes.
 *  HRESULTs surface as `number`/`hresult`; MediaCapture failures also carry a
 *  numeric `code`. */
export const captureFailureKind = (cause: unknown): CaptureIssue['kind'] => {
	const code = Number(
		(cause as any)?.number ?? (cause as any)?.hresult ?? (cause as any)?.code ?? Number.NaN,
	)

	const message = String((cause as any)?.message ?? cause ?? '').toLowerCase()
	if (code === -2147024891 || /access is denied|unauthorizedaccess|e_accessdenied/.test(message)) {
		return 'permissionDenied'
	}

	if (code === -2147024814 || /sharing violation|in use|0x800700aa/.test(message)) {
		return 'unavailable'
	}

	if (/no capture devices|device (is )?not (available|found|ready)|cannot find/.test(message)) {
		return 'unavailable'
	}

	if (/quota|disk|storage|no space|insufficient/.test(message)) {
		return 'insufficientStorage'
	}

	return 'captureFailed'
}

/** WinRT TimeSpan marshals as `{ Duration: bigint|number }` of 100-ns ticks;
 *  some projections surface the raw tick count. */
const timeSpanToMs = (value: unknown): number => {
	const ticks =
		typeof value === 'bigint'
			? Number(value)
			: typeof value === 'number'
				? value
				: Number((value as any)?.Duration ?? (value as any)?.duration ?? Number.NaN)

	return Number.isFinite(ticks) ? ticks / 10_000 : Number.NaN
}

const toPromise = async (op: any): Promise<any> => {
	const { NSWinRT } = projection()
	if (NSWinRT?.toPromise && op != null) {
		return NSWinRT.toPromise(op)
	}

	// Some preview builds expose `.done()` on the projected async op.
	if (op?.done) {
		return new Promise((resolve, reject) => {
			try {
				op.done(resolve, reject)
			} catch (cause) {
				reject(cause)
			}
		})
	}

	return op
}

const vectorToArray = (items: any): any[] => {
	const result: any[] = []
	const size = Number(items?.Size ?? items?.Count ?? 0)
	for (let index = 0; index < size; index += 1) {
		result.push(items.GetAt(index))
	}

	return result
}

/** The first backend that initializes a device claims it — a new owner
 *  cannot seize the same hardware while the previous one is finalizing. */
const claimedDevices = new Map<string, object>()

const normalizePath = (value: string): string => {
	let next = value.replace(/\//g, '\\')
	// file:///C:/dir/file.mp4 decodes to /C:/dir/file.mp4 — strip the leading
	// separator before a drive letter.
	next = next.replace(/^\\(?=[A-Za-z]:)/, '')
	return next
}

const fileUrlForPath = (value: string): string =>
	`file:///${value.replace(/\\/g, '/').replace(/^\/+/, '')}`

export function createSessionBackend(config: CameraSessionConfig): CameraSessionBackend {
	let currentConfig = { ...config }
	let observer: BackendObserver | undefined
	let host: any
	let listener: BackendPreviewListener | undefined
	let capture: any
	let captureElement: any
	let captureDevice: WindowsCameraDevice | undefined
	let captureAudioMode = false
	let previewReadyFlag = false
	let interrupted = false
	let released = false
	let generation = 0
	let watcher: any
	let watcherDelegates: { event: string; delegate: any }[] = []
	let captureDelegates: { event: string; delegate: any }[] = []
	let sink: BackendCaptureSink | undefined
	let request: BackendCaptureRequest | undefined
	let recordFile: any
	let recordStartedAt = 0
	let wantStop = false
	let finalizing = false
	const lease = {}

	const projectionAvailable = () => {
		const { Windows, Microsoft } = projection()
		return !!(
			Windows?.Media?.Capture?.MediaCapture &&
			Windows?.Media?.Capture?.MediaCaptureInitializationSettings &&
			Windows?.Devices?.Enumeration?.DeviceInformation &&
			Windows?.Storage?.ApplicationData &&
			Microsoft?.UI?.Xaml?.Controls?.CaptureElement
		)
	}

	const markReady = (value: boolean) => {
		if (previewReadyFlag === value) {
			return
		}

		previewReadyFlag = value
		observer?.previewReady(value)
	}

	const appCapability = (kind: CameraPermissionKind): any => {
		try {
			return projection().Windows?.Security?.Authorization?.AppCapabilityAccess?.AppCapability?.Create(
				capabilityNameFor(kind),
			)
		} catch {
			return undefined
		}
	}

	const deviceAccessInfo = (kind: CameraPermissionKind): any => {
		try {
			const enumeration = projection().Windows?.Devices?.Enumeration
			const deviceClass =
				kind === 'camera'
					? enumeration?.DeviceClass?.VideoCapture
					: enumeration?.DeviceClass?.AudioCapture

			return deviceClass === undefined
				? undefined
				: enumeration?.DeviceAccessInformation?.CreateFromDeviceClass(deviceClass)
		} catch {
			return undefined
		}
	}

	const checkPermission = async (kind: CameraPermissionKind): Promise<CameraPermissionStatus> => {
		const capability = appCapability(kind)
		if (capability) {
			try {
				const mapped = accessStatusToPermission(capability.CheckAccess())
				// A missing manifest declaration is a setup error, not a
				// status — expose it as unknown here and as
				// `configurationMissing` on request.
				return mapped === 'notDeclared' ? 'unknown' : mapped
			} catch {
				// Fall through to the enumeration-based probe.
			}
		}

		const info = deviceAccessInfo(kind)
		if (info) {
			try {
				return deviceAccessStatusToPermission(info.CurrentStatus)
			} catch {
				return 'unknown'
			}
		}

		return 'unknown'
	}

	let permissionChain: Promise<unknown> = Promise.resolve()
	const requestPermission = (kind: CameraPermissionKind): Promise<CameraPermissionStatus> => {
		const result = permissionChain.then(async () => {
			const status = await checkPermission(kind)
			if (status !== 'notDetermined') {
				if (status === 'unknown') {
					try {
						if (accessStatusToPermission(appCapability(kind)?.CheckAccess()) === 'notDeclared') {
							throw error(
								'configurationMissing',
								'requestPermission',
								`Missing '${capabilityNameFor(kind)}' device capability in the host app's Package.appxmanifest`,
								{ permission: kind },
							)
						}
					} catch (cause) {
						if (cause instanceof CameraCaptureError) {
							throw cause
						}
					}
				}

				return status
			}

			const capability = appCapability(kind)
			if (!capability?.RequestAccessAsync) {
				return 'unknown'
			}

			try {
				const next = accessStatusToPermission(await toPromise(capability.RequestAccessAsync()))
				return next === 'notDeclared' ? 'unknown' : next
			} catch (cause) {
				throw error(
					'unavailable',
					'requestPermission',
					`The system ${kind} permission request could not run`,
					cause,
				)
			}
		})

		permissionChain = result.catch(() => {})
		return result
	}

	const listDevices = async (): Promise<WindowsCameraDevice[]> => {
		const enumeration = projection().Windows?.Devices?.Enumeration
		const deviceClass = enumeration?.DeviceClass?.VideoCapture
		if (!enumeration?.DeviceInformation?.FindAllAsync || deviceClass === undefined) {
			return []
		}

		const found = await toPromise(enumeration.DeviceInformation.FindAllAsync(deviceClass))
		return vectorToArray(found).map((device: any) => ({
			id: String(device?.Id ?? device?.id ?? ''),
			label: String(device?.Name ?? device?.name ?? device?.Id ?? ''),
			facing: panelToFacing(
				Number(device?.EnclosureLocation?.Panel ?? device?.EnclosureLocation?.panel),
			),
		}))
	}

	const listAudioDevices = async (): Promise<number> => {
		try {
			const enumeration = projection().Windows?.Devices?.Enumeration
			const deviceClass = enumeration?.DeviceClass?.AudioCapture
			if (!enumeration?.DeviceInformation?.FindAllAsync || deviceClass === undefined) {
				return 0
			}

			const found = await toPromise(enumeration.DeviceInformation.FindAllAsync(deviceClass))
			return Number(found?.Size ?? found?.Count ?? 0)
		} catch {
			return 0
		}
	}

	const defaultDeviceId = (): string | undefined => {
		try {
			const devices = projection().Windows?.Media?.Devices
			const kind = devices?.AudioVideoCaptureDeviceKind?.Video
			const id = devices?.MediaDevice?.GetDefaultVideoCaptureId?.(kind)
			return typeof id === 'string' && id ? id : undefined
		} catch {
			return undefined
		}
	}

	const streamProfiles = (target: any, streamKind: any): WindowsStreamProfile[] => {
		const controller = target?.VideoDeviceController
		if (!controller?.GetAvailableMediaStreamProperties || streamKind === undefined) {
			return []
		}

		try {
			return vectorToArray(controller.GetAvailableMediaStreamProperties(streamKind))
				.map((entry: any) => ({
					width: Number(entry?.Width ?? 0),
					height: Number(entry?.Height ?? 0),
					frameRate:
						Number(entry?.FrameRate?.Numerator ?? 0) /
						Math.max(1, Number(entry?.FrameRate?.Denominator ?? 1)),
					subtype: typeof entry?.Subtype === 'string' ? entry.Subtype : undefined,
				}))
				.filter((entry: WindowsStreamProfile) => entry.width > 0 && entry.height > 0)
		} catch {
			return []
		}
	}

	const recordStreamProfiles = (): WindowsStreamProfile[] =>
		streamProfiles(capture, projection().Windows?.Media?.Capture?.MediaStreamType?.VideoRecord)

	const detachCaptureDelegates = () => {
		for (const entry of captureDelegates) {
			try {
				capture[entry.event] = null
			} catch {
				// The projection may not accept null — dropping the
				// references still detaches our handlers.
			}
		}

		captureDelegates = []
	}

	const onCaptureFailed = (_sender: any, args: any) => {
		const message = String(args?.Message ?? args?.message ?? 'Camera capture failed')
		markReady(false)
		observer?.availability(false)
		observer?.interruption('began', /in use|denied|access/i.test(message) ? 'cameraInUse' : 'unknown')
		if (sink) {
			// The pipeline died under a live take — try to finalize the
			// partial media instead of discarding it outright.
			sink.finishing(/device|available|found/i.test(message) ? 'cameraUnavailable' : 'captureError')
			void stopRecording()
		}
	}

	const onRecordLimitationExceeded = () => {
		// The OS-level recording limitation ended the take — finalize the
		// usable media and keep first-cause semantics from the core.
		sink?.finishing('interrupted')
		void stopRecording()
	}

	const attachCaptureDelegates = (target: any) => {
		const { NSWinRT } = projection()
		const subscribe = (event: string, type: string, handler: (...args: any[]) => void) => {
			try {
				const delegate = NSWinRT?.asDelegate ? NSWinRT.asDelegate(type, handler) : handler
				target[event] = delegate
				captureDelegates.push({ event, delegate })
			} catch {
				try {
					target[event] = handler
					captureDelegates.push({ event, delegate: handler })
				} catch {
					// The event is unsubscribable on this projection — the
					// adapter still functions without that notification.
				}
			}
		}

		subscribe(
			'Failed',
			'Windows.Foundation.TypedEventHandler`2<Windows.Media.Capture.MediaCapture,Windows.Media.Capture.MediaCaptureFailedEventArgs>',
			onCaptureFailed,
		)

		subscribe(
			'RecordLimitationExceeded',
			'Windows.Media.Capture.RecordLimitationExceededEventHandler',
			onRecordLimitationExceeded,
		)
	}

	const stopWatcher = () => {
		if (!watcher) {
			return
		}

		for (const entry of watcherDelegates) {
			try {
				watcher[entry.event] = null
			} catch {
				// See detachCaptureDelegates.
			}
		}

		watcherDelegates = []
		try {
			watcher.Stop()
		} catch {
			// A stopped or failed watcher still releases cleanly.
		}

		watcher = undefined
	}

	const ensureWatcher = () => {
		if (watcher) {
			return
		}

		const enumeration = projection().Windows?.Devices?.Enumeration
		const deviceClass = enumeration?.DeviceClass?.VideoCapture
		if (!enumeration?.DeviceInformation?.CreateWatcher || deviceClass === undefined) {
			return
		}

		try {
			const target = enumeration.DeviceInformation.CreateWatcher(deviceClass)
			const { NSWinRT } = projection()
			const subscribe = (event: string, type: string, handler: (...args: any[]) => void) => {
				const delegate = NSWinRT?.asDelegate ? NSWinRT.asDelegate(type, handler) : handler
				target[event] = delegate
				watcherDelegates.push({ event, delegate })
			}

			subscribe(
				'Removed',
				'Windows.Foundation.TypedEventHandler`2<Windows.Devices.Enumeration.DeviceWatcher,Windows.Devices.Enumeration.DeviceInformationUpdate>',
				(_sender: any, update: any) => {
					const id = String(update?.Id ?? update?.id ?? '')
					if (!id || id === captureDevice?.id) {
						observer?.availability(false)
					}
				},
			)

			subscribe(
				'Added',
				'Windows.Foundation.TypedEventHandler`2<Windows.Devices.Enumeration.DeviceWatcher,Windows.Devices.Enumeration.DeviceInformation>',
				() => observer?.availability(true),
			)

			target.Start()
			watcher = target
		} catch {
			watcher = undefined
			watcherDelegates = []
		}
	}

	const applyStreamProperties = async (target: any) => {
		const streamType = projection().Windows?.Media?.Capture?.MediaStreamType
		const controller = target?.VideoDeviceController
		const candidates = streamProfiles(target, streamType?.VideoRecord)
		const chosen = chooseStandardProfile(candidates)
		if (!controller?.SetMediaStreamPropertiesAsync || !chosen || !streamType) {
			return
		}

		const props = candidates.length
			? vectorToArray(controller.GetAvailableMediaStreamProperties(streamType.VideoRecord)).find(
					(entry: any) =>
						Number(entry?.Width) === chosen.width && Number(entry?.Height) === chosen.height,
				)
			: undefined

		if (!props) {
			return
		}

		try {
			await toPromise(controller.SetMediaStreamPropertiesAsync(streamType.VideoRecord, props))
			try {
				await toPromise(controller.SetMediaStreamPropertiesAsync(streamType.VideoPreview, props))
			} catch {
				// A preview format mismatch must not block recording.
			}
		} catch {
			// The driver rejected the format request — the device default
			// still records and capabilities disclose what was measured.
		}
	}

	const releaseClaim = () => {
		if (captureDevice && claimedDevices.get(captureDevice.id) === lease) {
			claimedDevices.delete(captureDevice.id)
		}
	}

	const closeCapture = () => {
		detachCaptureDelegates()
		releaseClaim()
		const target = capture
		capture = undefined
		captureDevice = undefined
		captureAudioMode = false
		if (!target) {
			return
		}

		try {
			target.Close()
		} catch {
			try {
				target.Dispose()
			} catch {
				// GC reclaims the device handle.
			}
		}
	}

	const ensureCapture = async (): Promise<any> => {
		const epoch = generation
		if (capture) {
			return capture
		}

		const { Windows } = projection()
		const devices = await listDevices()
		const selected = selectCameraDevice(currentConfig.camera, devices, defaultDeviceId())
		if (!selected) {
			throw error('unavailable', 'startPreview', 'No camera device is available')
		}

		const owner = claimedDevices.get(selected.id)
		if (owner && owner !== lease) {
			throw error('busy', 'startPreview', 'Another camera session still owns this device')
		}

		const settings = new Windows.Media.Capture.MediaCaptureInitializationSettings()
		settings.VideoDeviceId = selected.id
		settings.StreamingCaptureMode =
			currentConfig.audio === true ? captureModeAudioAndVideo : captureModeVideo

		const target = new Windows.Media.Capture.MediaCapture()
		try {
			await toPromise(target.InitializeAsync(settings))
		} catch (cause) {
			try {
				target.Close()
			} catch {
				// See closeCapture.
			}

			throw error(
				captureFailureKind(cause),
				'startPreview',
				'The camera could not be initialized',
				cause,
			)
		}

		if (epoch !== generation || released) {
			try {
				target.Close()
			} catch {
				// See closeCapture.
			}

			throw error('unavailable', 'startPreview', 'The camera session was released')
		}

		capture = target
		captureDevice = selected
		captureAudioMode = currentConfig.audio === true
		claimedDevices.set(selected.id, lease)
		attachCaptureDelegates(target)
		ensureWatcher()
		await applyStreamProperties(target)
		try {
			if (selected.facing === 'front' && typeof target.SetPreviewMirroring === 'function') {
				target.SetPreviewMirroring(true)
			}
		} catch {
			// Mirrored preview is cosmetic; recorded output stays unmirrored.
		}

		return target
	}

	const activate = async (): Promise<void> => {
		const epoch = ++generation
		try {
			const target = await ensureCapture()
			if (!captureElement || epoch !== generation) {
				return
			}

			try {
				captureElement.Source = target
			} catch (cause) {
				throw error('unavailable', 'startPreview', 'The preview element rejected the source', cause)
			}

			await toPromise(target.StartPreviewAsync())
			if (epoch !== generation) {
				return
			}

			markReady(true)
			listener?.onReady?.()
		} catch (cause) {
			if (epoch === generation) {
				markReady(false)
				listener?.onError?.(
					cause instanceof CameraCaptureError
						? cause
						: error('unavailable', 'startPreview', 'Camera preview could not start', cause),
				)
			}
		}
	}

	const deactivate = async () => {
		generation += 1
		markReady(false)
		const target = capture
		if (captureElement) {
			try {
				captureElement.Source = null
			} catch {
				// Detach is best-effort — the element may already be gone.
			}
		}

		if (target && !sink) {
			try {
				await toPromise(target.StopPreviewAsync())
			} catch {
				// The pipeline may already be down.
			}
		}
	}

	const recordingsFolder = async (): Promise<any> => {
		const storage = projection().Windows?.Storage
		const folder = storage?.ApplicationData?.Current?.LocalFolder
		if (!folder?.CreateFolderAsync) {
			throw error('destinationUnavailable', 'startRecording', 'App-private storage is unavailable')
		}

		return toPromise(folder.CreateFolderAsync('octane-camera', collisionOpenIfExists))
	}

	const reserveDestination = async (destinationPath: string | undefined): Promise<any> => {
		const storage = projection().Windows?.Storage
		if (!destinationPath) {
			const folder = await recordingsFolder()
			const name = `clip-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.mp4`
			return toPromise(folder.CreateFileAsync(name, collisionGenerateUniqueName))
		}

		const filePath = normalizePath(destinationPath)
		const directory = filePath.slice(0, filePath.lastIndexOf('\\'))
		const name = filePath.slice(filePath.lastIndexOf('\\') + 1)
		if (!directory || !name) {
			throw error('destinationUnavailable', 'startRecording', 'destinationFileUrl is not a file path')
		}

		const tempPath = String(storage?.ApplicationData?.Current?.TemporaryFolder?.Path ?? '')
		if (tempPath && filePath.toLowerCase().startsWith(tempPath.toLowerCase())) {
			throw error(
				'destinationUnavailable',
				'startRecording',
				'Temporary storage does not satisfy durable output',
			)
		}

		const folder = await toPromise(storage.StorageFolder.GetFolderFromPathAsync(directory)).catch(
			(cause: unknown) => {
				throw error(
					'destinationUnavailable',
					'startRecording',
					'destinationFileUrl directory is not writable',
					cause,
				)
			},
		)

		return toPromise(folder.CreateFileAsync(name, collisionFailIfExists)).catch(
			(cause: unknown) => {
				throw error(
					'destinationUnavailable',
					'startRecording',
					'destinationFileUrl already exists or cannot be created',
					cause,
				)
			},
		)
	}

	const freeDiskBytes = async (): Promise<number> => {
		try {
			const folder = projection().Windows?.Storage?.ApplicationData?.Current?.LocalFolder
			const result = await toPromise(
				folder.Properties.RetrievePropertiesAsync(['System.FreeSpace']),
			)

			const value = result?.['System.FreeSpace'] ?? result?.Lookup?.('System.FreeSpace')
			return Number.isFinite(Number(value)) ? Number(value) : Number.MAX_SAFE_INTEGER
		} catch {
			return Number.MAX_SAFE_INTEGER
		}
	}

	const removeFileQuietly = async (file: any) => {
		if (!file) {
			return
		}

		try {
			await toPromise(file.DeleteAsync())
		} catch {
			// Temporary leftovers are reclaimed by the OS.
		}
	}

	const nativeVideoMetadata = async (file: any, audioRequested: boolean) => {
		const { Windows } = projection()
		const basic = await toPromise(file.GetBasicPropertiesAsync())
		const size = Number(basic?.Size ?? 0)
		if (!(size > 0)) {
			throw error('noMedia', 'finalize', 'The recorder produced an empty movie file')
		}

		const video = await toPromise(file.Properties.GetVideoPropertiesAsync())
		const width = Number(video?.Width ?? 0)
		const height = Number(video?.Height ?? 0)
		let durationMs = timeSpanToMs(video?.Duration)
		let hasAudio = false
		let audioKnown = true
		try {
			const source = Windows.Media.Core.MediaSource.CreateFromStorageFile(file)
			const item = new Windows.Media.Playback.MediaPlaybackItem(source)
			const audioTracks = item?.AudioTracks
			hasAudio = Number(audioTracks?.Size ?? audioTracks?.Count ?? 0) > 0
			if (!Number.isFinite(durationMs) || durationMs <= 0) {
				durationMs = timeSpanToMs(source?.Duration)
			}
		} catch {
			// The audio-track probe is mandatory for requested audio — the
			// byte-level reader must prove the track instead of guessing.
			audioKnown = false
		}

		if (audioRequested && !audioKnown) {
			throw error(
				'finalizationFailed',
				'finalize',
				'The audio track could not be verified in the finalized movie',
			)
		}

		return {
			durationMs,
			width,
			height,
			hasAudio: audioKnown && hasAudio,
			orientation: videoOrientationToOrientation(Number(video?.Orientation)),
		}
	}

	const mediabunnyMetadata = async (file: any) => {
		const { Windows } = projection()
		const buffer = await toPromise(Windows.Storage.FileIO.ReadBufferAsync(file))
		const length = Number(buffer?.Length ?? 0)
		if (!(length > 0)) {
			throw error('noMedia', 'finalize', 'The recorder produced an empty movie file')
		}

		const reader = Windows.Storage.Streams.DataReader.FromBuffer(buffer)
		const bytes = new Uint8Array(length)
		reader.ReadBytes(bytes)
		const { BufferSource, BlobSource, Input, MP4 } = await import('mediabunny')
		const Source = BufferSource ?? BlobSource
		const input = new Input({ source: new Source(bytes as any), formats: [MP4] })
		try {
			const video = await input.getPrimaryVideoTrack()
			if (!video) {
				throw error('noMedia', 'finalize', 'The movie contains no video track')
			}

			const audio = await input.getPrimaryAudioTrack()
			const hasAudio = audio !== null && (await audio.computeDuration()) > 0
			const durationMs = (await input.computeDuration()) * 1000
			const width = await video.getDisplayWidth()
			const height = await video.getDisplayHeight()
			return { durationMs, width, height, hasAudio, orientation: 'unspecified' as CameraOrientation }
		} finally {
			input.dispose()
		}
	}

	const teardown = () => {
		if (!host) {
			void deactivate().then(() => {
				if (!host && !sink) {
					closeCapture()
				}
			})
		}
	}

	const finishWithError = (
		stage: 'preparation' | 'capture' | 'finalization' | 'storage',
		cause: CaptureIssue,
	) => {
		const target = sink
		sink = undefined
		request = undefined
		finalizing = false
		wantStop = false
		recordStartedAt = 0
		const file = recordFile
		recordFile = undefined
		void removeFileQuietly(file)
		target?.settled({ kind: 'failed', stage, issue: cause })
		teardown()
	}

	const settleClip = async (file: any) => {
		const target = sink
		const take = request
		if (!target || !take) {
			return
		}

		try {
			let metadata: Awaited<ReturnType<typeof nativeVideoMetadata>>
			try {
				metadata = await nativeVideoMetadata(file, take.audio)
			} catch (nativeCause) {
				if (nativeCause instanceof CameraCaptureError && nativeCause.kind === 'noMedia') {
					throw nativeCause
				}

				metadata = await mediabunnyMetadata(file)
			}

			if (!(metadata.durationMs > 0) || !(metadata.width > 0) || !(metadata.height > 0)) {
				throw error('noMedia', 'finalize', 'The finalized movie has no usable video media')
			}

			if (take.audio && !metadata.hasAudio) {
				throw error(
					'captureFailed',
					'finalize',
					'Requested audio is absent from the finalized movie',
				)
			}

			const filePath = String(file?.Path ?? '')
			sink = undefined
			request = undefined
			recordFile = undefined
			finalizing = false
			wantStop = false
			target.settled({
				kind: 'clip',
				output: {
					kind: 'nativeFile',
					resourceId: `file:${filePath}`,
					fileUrl: fileUrlForPath(filePath),
				},
				mimeType: 'video/mp4',
				durationMs: Math.round(metadata.durationMs),
				width: metadata.width,
				height: metadata.height,
				orientation:
					take.orientation && take.orientation !== 'unspecified'
						? take.orientation
						: metadata.orientation,
				hasAudio: take.audio && metadata.hasAudio,
			})
		} catch (cause) {
			sink = undefined
			request = undefined
			recordFile = undefined
			finalizing = false
			wantStop = false
			void removeFileQuietly(file)
			target.settled({
				kind: 'failed',
				stage: 'finalization',
				issue:
					cause instanceof CameraCaptureError
						? cause
						: issue(
								'finalizationFailed',
								'finalize',
								cause instanceof Error ? cause.message : String(cause),
								{ cause },
							),
			})
		}

		recordStartedAt = 0
		teardown()
	}

	const stopRecording = async () => {
		const target = capture
		const file = recordFile
		// recordStartedAt stays 0 while StartRecordToStorageFileAsync is in
		// flight — an early stop is honored by `wantStop` once it resolves.
		if (!target || !file || finalizing || recordStartedAt === 0) {
			return
		}

		finalizing = true
		try {
			await toPromise(target.StopRecordAsync())
		} catch (cause) {
			finishWithError(
				'finalization',
				error('finalizationFailed', 'finalize', 'The movie could not be finalized', cause),
			)

			return
		}

		await settleClip(file)
	}

	const onSuspend = () => {
		interrupted = true
		markReady(false)
		observer?.interruption('began', 'background')
	}

	const onResume = () => {
		interrupted = false
		observer?.interruption('ended', 'background')
		if (capture) {
			observer?.availability(true)
			markReady(!!captureElement)
		}
	}

	let lifecycleBound = false
	const bindLifecycle = () => {
		if (lifecycleBound) {
			return
		}

		lifecycleBound = true
		try {
			Application.on(Application.suspendEvent, onSuspend)
			Application.on(Application.resumeEvent, onResume)
		} catch {
			// The windows core may not emit suspend/resume — capture
			// still works without lifecycle notifications.
		}
	}

	const unbindLifecycle = () => {
		if (!lifecycleBound) {
			return
		}

		lifecycleBound = false
		try {
			Application.off(Application.suspendEvent, onSuspend)
			Application.off(Application.resumeEvent, onResume)
		} catch {
			// See bindLifecycle.
		}
	}

	return {
		platform: 'windows',
		get supported() {
			return projectionAvailable()
		},
		checkPermission,
		requestPermission: async (kind) => {
			const status = await requestPermission(kind)
			if (kind === 'camera' && status === 'granted' && host && !sink && !released && !capture) {
				try {
					await activate()
				} catch {
					// Activation reports through the preview listener.
				}
			}

			return status
		},
		getCapabilities: async () => {
			const devices = await listDevices()
			const cameras: CameraDeviceInfo[] = devices.map((entry) => ({
				id: entry.id,
				label: entry.label,
				facing: entry.facing,
			}))

			const supported = projectionAvailable() && cameras.length > 0
			const cameraStatus = await checkPermission('camera')
			const available = supported && cameraStatus === 'granted'
			const measured = capture ? chooseStandardProfile(recordStreamProfiles()) : undefined
			const profile = measured ?? { width: 1280, height: 720, frameRate: 30 }
			return {
				supported,
				reason: !projectionAvailable()
					? 'The WinUI camera runtime is unavailable'
					: cameras.length === 0
						? 'No camera device is available on this host'
						: cameraStatus !== 'granted'
							? 'Camera permission has not been granted'
							: undefined,
				available,
				cameras,
				profiles: [{ profile: 'standard', ...profile }],
				audio: (await listAudioDevices()) > 0,
				orientations:
					capture && typeof capture.SetRecordRotationAsync === 'function'
						? ['portrait', 'portraitUpsideDown', 'landscapeLeft', 'landscapeRight']
						: [],
				durationLimit: 'bestEffort',
				elapsedTime: 'estimated',
				output: {
					mimeType: 'video/mp4',
					container: 'mp4',
					storage: 'appPrivateFile',
					destinationFileUrl: true,
				},
			}
		},
		previewReady: () => previewReadyFlag && !interrupted,
		validateStart: (options) => {
			if (
				options.orientation &&
				options.orientation !== 'unspecified' &&
				(!capture || typeof capture.SetRecordRotationAsync !== 'function')
			) {
				throw error(
					'unsupportedConfiguration',
					'startRecording',
					'Fixed cardinal orientation has not been qualified on this Windows source',
				)
			}
		},
		attachPreview: (target, callbacks) => {
			if (released || sink) {
				throw error('invalidState', 'attachPreview', 'The camera is disposed or finalizing')
			}

			host = target
			listener = callbacks
			const view = target as any
			captureElement = view?.nativeViewProtected ?? view
			bindLifecycle()
			void checkPermission('camera').then((status) => {
				if (released || !host) {
					return
				}

				if (status !== 'granted') {
					listener?.onError?.(
						error(
							status === 'restricted' ? 'permissionRestricted' : 'permissionDenied',
							'preview',
							'Request camera permission before activating this preview',
							{ permission: 'camera' },
						),
					)

					return
				}

				void activate()
			})

			return () => {
				host = undefined
				listener = undefined
				captureElement = undefined
				void deactivate().then(() => {
					if (!sink) {
						closeCapture()
					}
				})
			}
		},
		configure: (next) => {
			const changed =
				JSON.stringify(next.camera) !== JSON.stringify(currentConfig.camera) ||
				(next.audio ?? false) !== (currentConfig.audio ?? false)

			currentConfig = { ...next }
			if (!changed || !capture) {
				return
			}

			// A camera or audio-mode change cannot mutate a live MediaCapture —
			// rebuild it and restore the attached preview.
			const hadPreview = !!captureElement
			void deactivate()
				.then(() => {
					closeCapture()
					if (hadPreview && host) {
						return activate()
					}
				})
				.catch(() => {
					observer?.availability(false)
				})
		},
		startCapture: (take, target) => {
			if (!capture || !captureDevice || !previewReadyFlag || interrupted) {
				target.settled({
					kind: 'failed',
					stage: 'preparation',
					issue: issue('unavailable', 'startRecording', 'The camera preview is not running'),
				})

				return
			}

			sink = target
			request = take
			const active = capture
			const run = async () => {
				if (take.audio) {
					const micStatus = await checkPermission('microphone')
					if (micStatus !== 'granted') {
						throw error(
							micStatus === 'restricted'
								? 'permissionRestricted'
								: micStatus === 'unavailable'
									? 'unavailable'
									: 'permissionDenied',
							'startRecording',
							`Microphone permission is ${micStatus}`,
							{ permission: 'microphone' },
						)
					}

					if (!captureAudioMode) {
						throw error(
							'unsupportedConfiguration',
							'startRecording',
							'This session was created without audio; configure audio before recording',
						)
					}
				}

				if ((await freeDiskBytes()) < minFreeDiskBytes) {
					throw error(
						'insufficientStorage',
						'startRecording',
						'Not enough local storage for a movie recording',
					)
				}

				if (take.orientation) {
					const rotation = orientationToRotation(take.orientation)
					if (rotation === undefined || typeof active.SetRecordRotationAsync !== 'function') {
						throw error(
							'unsupportedConfiguration',
							'startRecording',
							`Orientation '${take.orientation}' is not supported by this camera`,
						)
					}

					try {
						await toPromise(active.SetRecordRotationAsync(rotation))
					} catch (cause) {
						throw error(
							'unsupportedConfiguration',
							'startRecording',
							`Orientation '${take.orientation}' was rejected by this camera`,
							cause,
						)
					}
				}

				const file = await reserveDestination(take.destinationPath)
				const media = projection().Windows?.Media
				const profile = media?.MediaProperties?.MediaEncodingProfile?.CreateMp4(
					media?.MediaProperties?.VideoEncodingQuality?.Auto ?? 0,
				)

				if (!profile) {
					await removeFileQuietly(file)
					throw error(
						'unsupportedPlatform',
						'startRecording',
						'MP4 encoding profiles are unavailable on this host',
					)
				}

				const chosen = chooseStandardProfile(recordStreamProfiles())
				try {
					if (chosen && profile.Video) {
						profile.Video.Width = chosen.width
						profile.Video.Height = chosen.height
						if (profile.Video.FrameRate) {
							profile.Video.FrameRate.Numerator = Math.max(1, Math.round(chosen.frameRate * 1000))
							profile.Video.FrameRate.Denominator = 1000
						}
					}
				} catch {
					// The auto profile still describes a real encoding.
				}

				if (!take.audio) {
					try {
						profile.Audio = null
					} catch {
						// A projection without property writes still records;
						// silence is verified from the finalized movie.
					}
				}

				recordFile = file
				wantStop = false
				try {
					await toPromise(active.StartRecordToStorageFileAsync(profile, file))
				} catch (cause) {
					recordFile = undefined
					await removeFileQuietly(file)
					throw error(
						captureFailureKind(cause),
						'startRecording',
						'MediaCapture could not begin recording',
						cause,
					)
				}

				recordStartedAt = Date.now()
				const stream = chooseStandardProfile(recordStreamProfiles())
				const configuration: EffectiveCaptureConfig = {
					cameraId: captureDevice!.id,
					facing: captureDevice!.facing,
					audio: take.audio && captureAudioMode,
					width: stream?.width ?? chosen?.width ?? 0,
					height: stream?.height ?? chosen?.height ?? 0,
					frameRate: stream?.frameRate ?? chosen?.frameRate ?? 0,
					orientation: take.orientation ?? 'unspecified',
					mimeType: 'video/mp4',
					container: 'mp4',
				}

				target.started(configuration)
				if (wantStop) {
					void stopRecording()
				}
			}

			run().catch((cause: unknown) => {
				finishWithError(
					'preparation',
					cause instanceof CameraCaptureError
						? cause
						: issue(
								'captureFailed',
								'startRecording',
								cause instanceof Error ? cause.message : String(cause),
								{ cause },
							),
				)
			})
		},
		stopCapture: () => {
			wantStop = true
			void stopRecording()
		},
		elapsedMs: () => (recordStartedAt > 0 ? Math.max(0, Date.now() - recordStartedAt) : 0),
		openOutput: async (output) => {
			if (output.kind !== 'nativeFile' || output.synthetic) {
				throw error('invalidArgument', 'openOutput', 'Expected a native Windows movie reference')
			}

			const filePath = normalizePath(output.fileUrl.slice('file://'.length))
			const storage = projection().Windows?.Storage
			try {
				await toPromise(storage.StorageFile.GetFileFromPathAsync(filePath))
			} catch (cause) {
				throw error('unavailable', 'openOutput', `Movie file is missing at ${output.fileUrl}`, cause)
			}

			const handle: MovieOutputHandle = {
				url: output.fileUrl,
				fileUrl: output.fileUrl,
				release: () => {},
			}

			return handle
		},
		release: async () => {
			released = true
			generation += 1
			unbindLifecycle()
			sink = undefined
			request = undefined
			wantStop = false
			finalizing = false
			recordStartedAt = 0
			const file = recordFile
			recordFile = undefined
			void removeFileQuietly(file)
			markReady(false)
			await deactivate()
			stopWatcher()
			closeCapture()
			host = undefined
			captureElement = undefined
		},
		onPreviewDetached: () => {
			// Finalization still owns the device while a settle is in
			// flight; the detach path already released it otherwise.
		},
		setObserver: (next) => {
			observer = next
		},
	}
}
