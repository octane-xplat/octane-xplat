import AppKit
import AVFoundation
import CoreMedia

private func fourCharCode(_ value: FourCharCode) -> String {
	String(
		format: "%c%c%c%c",
		Int((value >> 24) & 0xff),
		Int((value >> 16) & 0xff),
		Int((value >> 8) & 0xff),
		Int(value & 0xff)
	)
}

// Finalized-movie metadata read inside the delegate callback: the file is
// complete at that point, so AVFoundation reports real dimensions, duration,
// audio presence, and rotation instead of estimated state.
private func movieClipInfo(_ url: URL) -> [String: Any] {
	let asset = AVURLAsset(url: url)
	var width = 0.0
	var height = 0.0
	var rotation = 0.0
	var videoCodec: String?

	if let track = asset.tracks(withMediaType: .video).first {
		let transformed = track.naturalSize.applying(track.preferredTransform)
		width = abs(Double(transformed.width))
		height = abs(Double(transformed.height))
		rotation = atan2(Double(track.preferredTransform.b), Double(track.preferredTransform.a))
			* 180.0 / .pi
		if rotation < 0 {
			rotation += 360
		}
		if let format = track.formatDescriptions.first as! CMFormatDescription? {
			let subtype = fourCharCode(CMFormatDescriptionGetMediaSubType(format))
			if subtype == "avc1" {
				videoCodec = "avc1"
			} else if subtype == "hvc1" || subtype == "hev1" {
				videoCodec = "hvc1"
			}
		}
	}

	let duration = CMTimeGetSeconds(asset.duration)
	let size = (try? FileManager.default.attributesOfItem(atPath: url.path))?[.size] as? Int ?? 0
	var info: [String: Any] = [
		"fileUrl": url.absoluteString,
		"durationMs": duration.isFinite ? duration * 1000 : 0,
		"width": width,
		"height": height,
		"rotationAngle": (Int((rotation / 90).rounded()) * 90) % 360,
		"fileSize": size,
		"hasAudio": !asset.tracks(withMediaType: .audio).isEmpty,
		"mimeType": "video/quicktime",
		"container": "mov",
	]
	if let videoCodec {
		info["videoCodec"] = videoCodec
	}
	return info
}

private final class XplatRecordingDelegate: NSObject, AVCaptureFileOutputRecordingDelegate {
	var onStart: (() -> Void)?
	var onFinish: ((URL, Bool, Bool, NSError?) -> Void)?

	func fileOutput(
		_ output: AVCaptureFileOutput,
		didStartRecordingTo fileURL: URL,
		from connections: [AVCaptureConnection]
	) {
		DispatchQueue.main.async { self.onStart?() }
	}

	func fileOutput(
		_ output: AVCaptureFileOutput,
		didFinishRecordingTo outputFileURL: URL,
		from connections: [AVCaptureConnection],
		error: Error?
	) {
		let failure = error as NSError?
		// A requested stop finalizes cleanly; the maximum-duration limit and
		// interruption-driven endings still produce usable files.
		let succeeded =
			failure == nil ||
			(failure!.userInfo[AVErrorRecordingSuccessfullyFinishedKey] as? Bool == true)
		let limitReached =
			failure != nil && failure!.code == AVError.Code.maximumDurationReached.rawValue
		DispatchQueue.main.async { self.onFinish?(outputFileURL, succeeded, limitReached, failure) }
	}
}

@objc(XplatCameraHost)
public final class XplatCameraHost: NSObject {
	private var session: AVCaptureSession?
	private var videoInput: AVCaptureDeviceInput?
	private var audioInput: AVCaptureDeviceInput?
	private var movieOutput: AVCaptureMovieFileOutput?
	private var previewLayer: AVCaptureVideoPreviewLayer?
	private weak var previewView: NSView?
	private var configuredCameraId: String?
	private var configuredAudio = false
	private var rotationAngle: Double?
	private var emit: ((String) -> Void)?
	private var observers: [NSObjectProtocol] = []
	private var disposed = false
	private var recordingPath: String?
	private let queue = DispatchQueue(label: "org.octane.xplat.camera")

	public override init() {
		super.init()
	}

	private func send(_ payload: [String: Any]) {
		guard
			let emit,
			let data = try? JSONSerialization.data(withJSONObject: payload),
			let text = String(data: data, encoding: .utf8)
		else {
			return
		}

		emit(text)
	}

	@objc public func installObserver(_ listener: @escaping (String) -> Void) {
		emit = listener
	}

	private func status(for mediaType: AVMediaType) -> String {
		switch AVCaptureDevice.authorizationStatus(for: mediaType) {
		case .authorized:
			return "granted"
		case .denied:
			return "denied"
		case .restricted:
			return "restricted"
		case .notDetermined:
			return "notDetermined"
		@unknown default:
			return "unknown"
		}
	}

	private func mediaKind(_ kind: String) -> AVMediaType {
		kind == "microphone" ? .audio : .video
	}

	private func declared(_ mediaType: AVMediaType) -> Bool {
		let key = mediaType == .audio ? "NSMicrophoneUsageDescription" : "NSCameraUsageDescription"
		return Bundle.main.object(forInfoDictionaryKey: key) != nil
	}

	@objc public func permissionStatus(_ kind: String) -> NSString {
		let mediaType = mediaKind(kind)
		guard declared(mediaType) else { return "undeclared" }
		return status(for: mediaType) as NSString
	}

	@objc public func requestPermission(_ kind: String, reply: @escaping (String) -> Void) {
		let mediaType = mediaKind(kind)
		guard declared(mediaType) else {
			reply("undeclared")
			return
		}
		let current = status(for: mediaType)
		guard current == "notDetermined" else {
			reply(current)
			return
		}
		AVCaptureDevice.requestAccess(for: mediaType) { _ in
			DispatchQueue.main.async { reply(self.status(for: mediaType)) }
		}
	}

	private func cameraDevices() -> [AVCaptureDevice] {
		let types: [AVCaptureDevice.DeviceType] = [.builtInWideAngleCamera, .externalUnknown]
		var found = AVCaptureDevice.DiscoverySession(
			deviceTypes: types,
			mediaType: .video,
			position: .unspecified
		).devices
		// The discovery session is authoritative; keep the legacy enumerator as
		// a merge source for devices on older system builds.
		for device in AVCaptureDevice.devices(for: .video) where !found.contains(device) {
			found.append(device)
		}
		return found
	}

	@objc public func devices() -> NSString {
		let list: [[String: Any]] = cameraDevices().map {
			["id": $0.uniqueID, "name": $0.localizedName, "facing": NSNull()]
		}
		guard
			let data = try? JSONSerialization.data(withJSONObject: list),
			let text = String(data: data, encoding: .utf8)
		else {
			return "[]"
		}
		return text as NSString
	}

	@objc public func audioDeviceAvailable() -> Bool {
		!AVCaptureDevice.devices(for: .audio).isEmpty
	}

	private func ensureSession() -> AVCaptureSession? {
		if let session {
			return session
		}
		guard status(for: .video) == "granted" else {
			return nil
		}
		let session = AVCaptureSession()
		if session.canSetSessionPreset(.hd1280x720) {
			session.sessionPreset = .hd1280x720
		}
		self.session = session
		let names: [Notification.Name] = [
			.AVCaptureSessionWasInterrupted,
			.AVCaptureSessionInterruptionEnded,
			.AVCaptureSessionRuntimeError,
			.AVCaptureSessionDidStartRunning,
			.AVCaptureSessionDidStopRunning,
		]
		for name in names {
			observers.append(
				NotificationCenter.default.addObserver(
					forName: name,
					object: session,
					queue: .main
				) { [weak self] note in
					self?.handleSessionNotification(note)
				}
			)
		}
		for (name, available) in [
			(NSNotification.Name.AVCaptureDeviceWasDisconnected, false),
			(NSNotification.Name.AVCaptureDeviceWasConnected, true),
		] {
			observers.append(
				NotificationCenter.default.addObserver(
					forName: name,
					object: nil,
					queue: .main
				) { [weak self] _ in
					self?.send(["type": "availability", "available": available])
				}
			)
		}
		return session
	}

	private func handleSessionNotification(_ note: Notification) {
		switch note.name {
		case .AVCaptureSessionWasInterrupted:
			// macOS publishes no interruption-reason keys — the cause stays
			// honest 'unknown' rather than a guessed code.
			send(["type": "interrupted", "cause": "unknown"])
		case .AVCaptureSessionInterruptionEnded:
			send(["type": "interruptionEnded"])
		case .AVCaptureSessionRuntimeError:
			send(["type": "availability", "available": false])
			send(["type": "interrupted", "cause": "cameraInUse"])
		case .AVCaptureSessionDidStartRunning:
			send(["type": "previewReady", "ready": true])
		case .AVCaptureSessionDidStopRunning:
			send(["type": "previewReady", "ready": false])
		default:
			break
		}
	}

	/** Rotation-angle connections exist on macOS 14+; earlier hosts cannot
	 *  lock a take's orientation. */
	@objc public func supportsRotationAngles() -> Bool {
		if #available(macOS 14.0, *) {
			return true
		}
		return false
	}

	private func applyRotation(_ connection: AVCaptureConnection?) {
		guard let connection, let rotationAngle else { return }
		if #available(macOS 14.0, *),
			connection.isVideoRotationAngleSupported(rotationAngle)
		{
			connection.videoRotationAngle = rotationAngle
		}
	}

	@objc public func configure(_ options: NSDictionary) -> NSString? {
		guard let session = ensureSession() else { return "permissionDenied" }
		var failure: String?
		queue.sync {
			let cameraId = options["cameraId"] as? String
			let audio = options["audio"] as? Bool ?? false
			rotationAngle = (options["rotationAngle"] as? NSNumber)?.doubleValue
			let devices = cameraDevices()
			guard let device = cameraId != nil
				? devices.first(where: { $0.uniqueID == cameraId })
				: devices.first ?? AVCaptureDevice.default(for: .video)
			else {
				failure = "unavailable"
				return
			}

			session.beginConfiguration()
			if videoInput == nil || videoInput?.device.uniqueID != device.uniqueID {
				do {
					let input = try AVCaptureDeviceInput(device: device)
					if videoInput != nil {
						session.removeInput(videoInput!)
					}
					videoInput = input
					if session.canAddInput(input) {
						session.addInput(input)
					}
				} catch {
					session.commitConfiguration()
					failure = "unavailable"
					return
				}
			}

			if audio && audioInput == nil {
				if let microphone = AVCaptureDevice.default(for: .audio),
					let input = try? AVCaptureDeviceInput(device: microphone),
					session.canAddInput(input)
				{
					audioInput = input
					session.addInput(input)
				}
			} else if !audio, let audioInput {
				session.removeInput(audioInput)
				self.audioInput = nil
			}

			if movieOutput == nil {
				let output = AVCaptureMovieFileOutput()
				if session.canAddOutput(output) {
					session.addOutput(output)
					movieOutput = output
				}
			}
			session.commitConfiguration()
			if let rotationAngle {
				let connection = movieOutput?.connection(with: .video)
				let supported: Bool
				if #available(macOS 14.0, *) {
					supported = connection?.isVideoRotationAngleSupported(rotationAngle) ?? false
				} else {
					supported = false
				}
				if !supported {
					failure = "unsupportedConfiguration"
					return
				}
			}
			configuredCameraId = device.uniqueID
			configuredAudio = audio
			applyRotation(movieOutput?.connection(with: .video))
			applyRotation(previewLayer?.connection)
		}
		return failure.map { $0 as NSString }
	}

	@objc public func activeDeviceId() -> NSString? {
		videoInput?.device.uniqueID as NSString?
	}

	@objc public func audioInputAttached() -> Bool {
		audioInput != nil
	}

	@objc public func recordedMs() -> Double {
		guard let duration = movieOutput?.recordedDuration, duration.isValid else {
			return 0
		}
		return CMTimeGetSeconds(duration) * 1000
	}

	@objc public func attachPreview(_ view: NSView) -> NSString? {
		guard let session = ensureSession() else { return "permissionDenied" }
		previewView = view
		previewLayer = AVCaptureVideoPreviewLayer(session: session)
		previewLayer?.videoGravity = .resizeAspectFill
		view.wantsLayer = true
		if let layer = previewLayer {
			layer.frame = view.bounds
			layer.autoresizingMask = [.layerWidthSizable, .layerHeightSizable]
			view.layer?.addSublayer(layer)
			applyRotation(layer.connection)
		}
		queue.async {
			if !session.isRunning {
				session.startRunning()
			}
		}
		return nil
	}

	@objc public func detachPreview() {
		previewLayer?.removeFromSuperlayer()
		previewLayer = nil
		previewView = nil
		queue.async { [weak self] in
			self?.session?.stopRunning()
		}
	}

	/** App-private recordings root: ~/Library/Application Support/<bundle>/octane-camera */
	@objc public func movieDirectory() -> NSString? {
		guard let base = FileManager.default.urls(
			for: .applicationSupportDirectory,
			in: .userDomainMask
		).first else {
			return nil
		}
		let identifier = Bundle.main.bundleIdentifier ?? "org.octane.xplat"
		let directory = base.appendingPathComponent(identifier).appendingPathComponent("octane-camera")
		guard (try? FileManager.default.createDirectory(
			at: directory,
			withIntermediateDirectories: true
		)) != nil else {
			return nil
		}
		return directory.absoluteString as NSString
	}

	@objc public func startRecording(_ path: String, maximumDurationMs: Double) -> NSString? {
		guard session != nil, let movieOutput else { return "unavailable" }
		queue.sync {
			let url = URL(fileURLWithPath: path)
			recordingPath = path
			movieOutput.maxRecordedDuration =
				maximumDurationMs > 0
					? CMTime(seconds: maximumDurationMs / 1000.0, preferredTimescale: 1000)
					: .invalid
			recordingDelegate.onStart = { [weak self] in
				self?.send([
					"type": "recordingStarted",
					"fileUrl": url.absoluteString,
					"audio": self?.audioInput != nil,
				])
			}
			recordingDelegate.onFinish = { [weak self] fileUrl, succeeded, limitReached, failure in
				var payload: [String: Any] = [
					"type": "recordingFinished",
					"fileUrl": fileUrl.absoluteString,
					"succeeded": succeeded,
					"limitReached": limitReached,
				]
				if succeeded, FileManager.default.fileExists(atPath: fileUrl.path) {
					payload["clip"] = movieClipInfo(fileUrl)
				} else {
					// Reclaim only the file this attempt created — admission
					// never allows a pre-existing destination.
					try? FileManager.default.removeItem(at: fileUrl)
					payload["error"] = [
						"domain": failure?.domain ?? "XplatCamera",
						"code": failure?.code ?? -1,
						"message": failure?.localizedDescription ?? "Movie recording did not complete",
					]
				}
				self?.send(payload)
			}
			movieOutput.startRecording(to: url, recordingDelegate: recordingDelegate)
		}
		return nil
	}

	@objc public func stopRecording() {
		movieOutput?.stopRecording()
	}

	@objc public func recording() -> Bool {
		movieOutput?.isRecording ?? false
	}

	private let recordingDelegate = XplatRecordingDelegate()

	/** JSON {width,height} of the configured device's active format. */
	@objc public func previewSize() -> String {
		guard let device = videoInput?.device else {
			return "{}"
		}
		let dimensions = CMVideoFormatDescriptionGetDimensions(
			device.activeFormat.formatDescription
		)
		return "{\"width\":\(Int(dimensions.width)),\"height\":\(Int(dimensions.height))}"
	}

	@objc public func dispose() {
		guard !disposed else { return }
		disposed = true
		for observer in observers {
			NotificationCenter.default.removeObserver(observer)
		}
		observers = []
		detachPreview()
		session = nil
		videoInput = nil
		audioInput = nil
		movieOutput = nil
		emit = nil
	}

	deinit {
		dispose()
	}
}
