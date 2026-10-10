import '@nativescript/macos-node-api'

interface CameraHost {
	attachPreview(view: object): string | null
	detachPreview(): void
	installObserver(emit: (message: string) => void): void
	permissionStatus(kind: string): string
	requestPermissionReply(kind: string, reply: (status: string) => void): void
	devices(): string
	audioDeviceAvailable(): boolean
	configure(options: { cameraId?: string; audio?: boolean; rotationAngle?: number }): string | null
	dispose(): void
}

declare const XplatCameraHost: {
	alloc(): { init(): CameraHost }
}

let helper: CameraHost | undefined
const helperHost = () => (helper ??= XplatCameraHost.alloc().init())

export function cameraHardwarePresent(): boolean {
	try {
		return JSON.parse(helperHost().devices()).length > 0
	} catch {
		return false
	}
}

/** Preview-only permission entry point: prompts once from mount, mirrors the
 *  iOS legacy path. Session code should use `session.requestPermission` —
 *  explicit actions only. */
export function ensureCameraPermission(): Promise<boolean> {
	const status = helperHost().permissionStatus('camera')
	if (status === 'granted') {
		return Promise.resolve(true)
	}

	if (status === 'undeclared') {
		return Promise.resolve(false)
	}

	return new Promise((resolve) =>
		helperHost().requestPermissionReply('camera', (next) => resolve(next === 'granted')),
	)
}

/** Legacy preview-only path: a dedicated XplatCameraHost owns the preview
 *  session — shared with nothing, disposed with the view. The session-backed
 *  path goes through `attachSessionPreview` instead. */
export function startCameraPreview(
	view: object,
	_facing: 'front' | 'back',
	onReady?: () => void,
): () => void {
	const host = XplatCameraHost.alloc().init()
	host.installObserver(() => {})
	const configured = host.configure({ audio: false })
	if (configured) {
		host.dispose()
		throw new Error(`camera unavailable: ${configured}`)
	}

	const failure = host.attachPreview(view)
	if (failure) {
		host.dispose()
		throw new Error(`camera unavailable: ${failure}`)
	}

	onReady?.()
	return () => {
		host.detachPreview()
		host.dispose()
	}
}
