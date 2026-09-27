// Web twin of camera-permission.native — the web leaf doesn't call these:
// getUserMedia IS the permission prompt. Present so the import surface
// stays twin-symmetric.

export function cameraHardwarePresent(): boolean {
	return typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia
}

export function ensureCameraPermission(): Promise<boolean> {
	return Promise.resolve(false)
}
