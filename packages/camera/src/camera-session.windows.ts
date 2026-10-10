/** Standalone (non-session) WinUI preview for `CameraView` without a
 *  `session` prop. Owns a private `MediaCapture` bound to a
 *  `CaptureElement`; the returned function stops preview and closes the
 *  device. Session-backed previews share their capture through
 *  `session-backend.windows.ts` instead. */

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

const vectorToArray = (items: any): any[] => {
	const result: any[] = []
	const size = Number(items?.Size ?? items?.Count ?? 0)
	for (let index = 0; index < size; index += 1) {
		result.push(items.GetAt(index))
	}

	return result
}

/** Attach a MediaCapture preview to the view's `CaptureElement`.
 *  `facing` maps to enclosure panels; desktop cameras without a panel fall
 *  back to the OS default — front/back is a preference, never a fabrication. */
export async function startCameraPreview(
	view: any,
	facing: 'front' | 'back',
	onReady?: () => void,
): Promise<() => Promise<void>> {
	const { Windows } = windows()
	const enumeration = Windows?.Devices?.Enumeration
	const captureApi = Windows?.Media?.Capture
	if (!enumeration || !captureApi) {
		throw new Error('camera preview unsupported')
	}

	const found = await toPromise(
		enumeration.DeviceInformation.FindAllAsync(enumeration.DeviceClass.VideoCapture),
	)

	const devices = vectorToArray(found)
	if (!devices.length) {
		throw new Error('camera unavailable')
	}

	const wantedPanel = facing === 'front' ? 1 : 2
	const device =
		devices.find((entry: any) => Number(entry?.EnclosureLocation?.Panel) === wantedPanel) ??
		devices[0]

	const settings = new captureApi.MediaCaptureInitializationSettings()
	settings.VideoDeviceId = String(device?.Id ?? device?.id ?? '')
	settings.StreamingCaptureMode = 0 // Video
	const capture = new captureApi.MediaCapture()
	try {
		await toPromise(capture.InitializeAsync(settings))
	} catch (cause) {
		try {
			capture.Close()
		} catch {
			try {
				capture.Dispose()
			} catch {
				// GC reclaims the device handle.
			}
		}

		throw cause instanceof Error ? cause : new Error('camera unavailable')
	}

	const element = view?.nativeViewProtected ?? view
	element.Source = capture
	try {
		if (Number(device?.EnclosureLocation?.Panel) === 1 && typeof capture.SetPreviewMirroring === 'function') {
			capture.SetPreviewMirroring(true)
		}
	} catch {
		// Mirrored preview is cosmetic.
	}

	await toPromise(capture.StartPreviewAsync())
	onReady?.()

	return async () => {
		try {
			element.Source = null
		} catch {
			// The element may already be gone.
		}

		try {
			await toPromise(capture.StopPreviewAsync())
		} catch {
			// The pipeline may already be down.
		}

		try {
			capture.Close()
		} catch {
			try {
				capture.Dispose()
			} catch {
				// GC reclaims the device handle.
			}
		}
	}
}
