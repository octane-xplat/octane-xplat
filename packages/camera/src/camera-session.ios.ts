/** Attach an AVFoundation preview layer to a NativeScript UIView host. */
export function startCameraPreview(
	view: any,
	facing: 'front' | 'back',
	onReady?: () => void,
): () => void {
	const av = globalThis as any
	const mediaType = av.AVMediaTypeVideo ?? 'vide'
	const desiredPosition =
		facing === 'front'
			? (av.AVCaptureDevicePositionFront ?? 2)
			: (av.AVCaptureDevicePositionBack ?? 1)

	const devices = av.AVCaptureDevice.devicesWithMediaType(mediaType)
	let device: any = null
	for (let index = 0; index < devices.count; index++) {
		const candidate = devices.objectAtIndex(index)
		if (candidate.position === desiredPosition) {
			device = candidate
			break
		}
	}

	if (!device) {
		throw new Error('camera unavailable')
	}

	const session = av.AVCaptureSession.new()
	const input = av.AVCaptureDeviceInput.deviceInputWithDeviceError(device)
	if (!input || !session.canAddInput(input)) {
		throw new Error('camera input unavailable')
	}
	session.addInput(input)
	const layer = av.AVCaptureVideoPreviewLayer.layerWithSession(session)
	layer.videoGravity = 'resizeAspectFill'
	const connection = layer.connection
	if (connection) {
		connection.automaticallyAdjustsVideoMirroring = false
		if (connection.isVideoMirroringSupported) {
			connection.isVideoMirrored = facing === 'front'
		}
	}

	const nativeView = view.ios ?? view.nativeViewProtected
	if (!nativeView?.layer) {
		throw new Error('camera preview host unavailable')
	}
	nativeView.layer.addSublayer(layer)
	const updateFrame = () => {
		layer.frame = nativeView.bounds
	}

	view.on?.('layoutChanged', updateFrame)
	updateFrame()
	session.startRunning()
	onReady?.()

	return () => {
		view.off?.('layoutChanged', updateFrame)
		session.stopRunning()
		layer.removeFromSuperlayer()
	}
}
