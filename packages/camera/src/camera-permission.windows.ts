/** Windows camera-permission probe for preview-only `CameraView` callers.
 *  Uses `AppCapability` when projected and falls back to
 *  `DeviceAccessInformation`; both are non-prompting checks — only
 *  `RequestAccessAsync` may show the system prompt. */

const windows = () => globalThis as any

const toPromise = (op: any): Promise<any> => {
	const { NSWinRT } = windows()
	if (NSWinRT?.toPromise && op != null) {
		return NSWinRT.toPromise(op)
	}

	if (op?.done) {
		return new Promise((resolve, reject) => {
			try {
				op.done(resolve, reject)
			} catch (cause) {
				reject(cause)
			}
		})
	}

	return Promise.resolve(op)
}

export function cameraHardwarePresent(): boolean {
	const { Windows, Microsoft } = windows()
	return !!(
		Windows?.Media?.Capture?.MediaCapture &&
		Windows?.Devices?.Enumeration?.DeviceInformation &&
		Microsoft?.UI?.Xaml?.Controls?.CaptureElement
	)
}

export async function ensureCameraPermission(): Promise<boolean> {
	try {
		const { Windows } = windows()
		const capability =
			Windows?.Security?.Authorization?.AppCapabilityAccess?.AppCapability?.Create?.('webcam')

		if (capability) {
			const status = capability.CheckAccess()
			// AppCapabilityAccessStatus: DeniedBySystem=0, NotDeclaredByApp=1,
			// DeniedByUser=2, UserPromptRequired=3, Allowed=4.
			if (status === 4) {
				return true
			}

			if (status === 3) {
				return (await toPromise(capability.RequestAccessAsync())) === 4
			}

			return false
		}

		const enumeration = Windows?.Devices?.Enumeration
		const deviceClass = enumeration?.DeviceClass?.VideoCapture
		const info =
			deviceClass === undefined
				? undefined
				: enumeration?.DeviceAccessInformation?.CreateFromDeviceClass(deviceClass)

		if (info) {
			// DeviceAccessStatus: Unspecified=0, Allowed=1, DeniedByUser=2,
			// DeniedBySystem=3. The enumeration API cannot prompt — an
			// Unspecified outcome is resolved by the preview's own
			// InitializeAsync, which runs the OS consent flow.
			return info.CurrentStatus !== 2 && info.CurrentStatus !== 3
		}
	} catch {
		return false
	}

	return false
}
