import AVFoundation
import CoreImage
import QuartzCore

/// Qualification candidate: the public iOS factory does not select this writer.
/// One writer and microphone timeline survive video-input replacement. All sample,
/// writer and switching state is confined to queue; replies cross to main.
@objc(XplatSwitchingMovieWriter)
@objcMembers
public final class XplatSwitchingMovieWriter: NSObject, AVCaptureVideoDataOutputSampleBufferDelegate, AVCaptureAudioDataOutputSampleBufferDelegate {
	private let queue = DispatchQueue(label: "com.octanexplat.camera.movie")
	private let video = AVCaptureVideoDataOutput()
	private let audio = AVCaptureAudioDataOutput()
	private let context = CIContext(options: [.cacheIntermediates: false])
	private weak var session: AVCaptureSession?
	private var writer: AVAssetWriter?
	private var videoWriter: AVAssetWriterInput?
	private var audioWriter: AVAssetWriterInput?
	private var pixels: AVAssetWriterInputPixelBufferAdaptor?
	private var lastFrame: CVPixelBuffer?
	private var origin: CMTime?
	private var lastVideo = CMTime.invalid
	private var lastAudio = CMTime.invalid
	private var lastHost = CMTime.invalid
	private var timer: DispatchSourceTimer?
	private var notify: ((String, String) -> Void)?
	private var sourceObserver: ((Bool) -> Void)?
	private weak var previewLayer: AVCaptureVideoPreviewLayer?
	private let overlay = CALayer()
	private var overlayEpoch = 0 // main queue only
	private var releaseReplies: [() -> Void] = []
	private var previousInput: AVCaptureDeviceInput?
	private var unacknowledgedInput: AVCaptureDeviceInput?
	private var restoringPreview = false
	private var rollingBack = false
	private var switchProblem: String?
	private var sourceReady = false
	private var sourcePrepared = true
	private var sourceEpoch = 0
	private var takeEpoch = 0
	private let elapsedLock = NSLock()
	private var publishedElapsed = 0.0
	private var switchReply: ((String?) -> Void)?
	private var requestedAudio = false
	private var stopping = false
	private var ownsOutput = false
	private var released = false
	private var limit: Double = 0
	private var path = ""
	private var width = 0
	private var height = 0
	private var warning: String?
	private var outputFrames = 0
	private var heldFrames = 0
	private var audioBuffers = 0
	private var switching = false
	private var switchEpoch = 0
	private var elapsed: Double = 0
	private var orientation: AVCaptureVideoOrientation = .portrait
	private var expectedCameraID: String?

	@objc(install:)
	public func install(_ session: AVCaptureSession) -> String? {
		guard session.canAddOutput(video), session.canAddOutput(audio) else { return "Sample outputs are unavailable" }
		video.videoSettings = [kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32BGRA]
		video.alwaysDiscardsLateVideoFrames = true
		video.setSampleBufferDelegate(self, queue: queue)
		audio.setSampleBufferDelegate(self, queue: queue)
		session.addOutput(video)
		session.addOutput(audio)
		self.session = session
		return nil
	}

	@objc(start:audio:orientation:maximumDurationMs:reply:)
	public func start(_ path: String, audio: Bool, orientation: Int, maximumDurationMs: Double, reply: @escaping (String, String) -> Void) {
		queue.async {
			guard self.writer == nil, !self.released, self.sourceReady else { DispatchQueue.main.async { reply("failed", "Recorder is busy or its source is unavailable") }; return }
			self.path = path
			self.requestedAudio = audio
			self.notify = reply
			self.stopping = false
			self.ownsOutput = false
			self.warning = nil
			self.origin = nil
			self.lastFrame = nil
			self.lastVideo = .invalid
			self.lastAudio = .invalid
			self.elapsed = 0
			self.publishElapsed()
			self.takeEpoch += 1
			self.outputFrames = 0
			self.heldFrames = 0
			self.audioBuffers = 0
			self.limit = maximumDurationMs / 1000
			self.orientation = AVCaptureVideoOrientation(rawValue: orientation) ?? .portrait
			self.expectedCameraID = self.session?.inputs.compactMap { $0 as? AVCaptureDeviceInput }.first { $0.device.hasMediaType(.video) }?.device.uniqueID
			if let connection = self.video.connection(with: .video) {
				connection.automaticallyAdjustsVideoMirroring = false
				if connection.isVideoMirroringSupported { connection.isVideoMirrored = false }
				if let value = AVCaptureVideoOrientation(rawValue: orientation), connection.isVideoOrientationSupported { connection.videoOrientation = value }
			}
			let preparationEpoch = self.takeEpoch
			let selectedOrientation = self.orientation
			DispatchQueue.main.async {
				guard self.queue.sync(execute: { self.takeEpoch == preparationEpoch && !self.released }) else { return }
				if let connection = self.previewLayer?.connection, connection.isVideoOrientationSupported { connection.videoOrientation = selectedOrientation }
			}
			do { self.writer = try AVAssetWriter(outputURL: URL(fileURLWithPath: path), fileType: .mov) }
			catch { self.terminal("failed", error.localizedDescription) }
			let epoch = self.takeEpoch
			self.queue.asyncAfter(deadline: .now() + 15) { [weak self] in
				guard let self else { return }
				if self.takeEpoch == epoch && self.writer != nil && self.outputFrames == 0 && !self.stopping {
					self.warning = "No video frame arrived before timeout"; self.finish()
				}
			}
		}
	}

	private func emit(_ type: String, _ payload: String) {
		guard let notify else { return }
		DispatchQueue.main.async { notify(type, payload) }
	}

	private func begin(_ buffer: CVPixelBuffer, _ time: CMTime) throws {
		guard let writer else { return }
		width = CVPixelBufferGetWidth(buffer)
		height = CVPixelBufferGetHeight(buffer)
		let input = AVAssetWriterInput(mediaType: .video, outputSettings: [
			AVVideoCodecKey: AVVideoCodecType.h264, AVVideoWidthKey: width, AVVideoHeightKey: height,
			AVVideoCompressionPropertiesKey: [AVVideoAverageBitRateKey: 6_000_000, AVVideoExpectedSourceFrameRateKey: 30, AVVideoAllowFrameReorderingKey: false],
		])
		input.expectsMediaDataInRealTime = true
		guard writer.canAdd(input) else { throw failure("Video encoding is unavailable") }
		writer.add(input)
		videoWriter = input
		pixels = AVAssetWriterInputPixelBufferAdaptor(assetWriterInput: input, sourcePixelBufferAttributes: [
			kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32BGRA,
			kCVPixelBufferWidthKey as String: width, kCVPixelBufferHeightKey as String: height,
			kCVPixelBufferIOSurfacePropertiesKey as String: [:],
		])
		if requestedAudio {
			let sound = AVAssetWriterInput(mediaType: .audio, outputSettings: [
				AVFormatIDKey: kAudioFormatMPEG4AAC, AVSampleRateKey: 48_000, AVNumberOfChannelsKey: 1, AVEncoderBitRateKey: 128_000,
			])
			sound.expectsMediaDataInRealTime = true
			guard writer.canAdd(sound) else { throw failure("Audio encoding is unavailable") }
			writer.add(sound)
			audioWriter = sound
		}
		guard writer.startWriting() else { throw writer.error ?? failure("Cannot begin writing") }
		ownsOutput = true
		writer.startSession(atSourceTime: time)
		origin = time
		let pulse = DispatchSource.makeTimerSource(queue: queue)
		pulse.schedule(deadline: .now() + .milliseconds(33), repeating: .milliseconds(33))
		pulse.setEventHandler { [weak self] in self?.holdFrame() }
		timer = pulse
		pulse.resume()
	}

	private func failure(_ message: String) -> NSError { NSError(domain: "OctaneCamera", code: 1, userInfo: [NSLocalizedDescriptionKey: message]) }

	private func normalize(_ buffer: CVPixelBuffer) throws -> CVPixelBuffer {
		guard let pool = pixels?.pixelBufferPool else { throw failure("Pixel buffer pool is unavailable") }
		var target: CVPixelBuffer?
		guard CVPixelBufferPoolCreatePixelBuffer(nil, pool, &target) == kCVReturnSuccess, let target else { throw failure("Cannot allocate video frame") }
		let image = CIImage(cvPixelBuffer: buffer)
		let scale = max(CGFloat(width) / image.extent.width, CGFloat(height) / image.extent.height)
		let resized = image.transformed(by: CGAffineTransform(scaleX: scale, y: scale))
		let positioned = resized.transformed(by: CGAffineTransform(translationX: (CGFloat(width) - resized.extent.width) / 2, y: (CGFloat(height) - resized.extent.height) / 2))
		context.render(positioned, to: target, bounds: CGRect(x: 0, y: 0, width: width, height: height), colorSpace: CGColorSpaceCreateDeviceRGB())
		return target
	}

	private func appendVideo(_ frame: CVPixelBuffer, _ time: CMTime, held: Bool) -> Bool {
		guard let input = videoWriter, let pixels, !stopping else { return false }
		if lastVideo.isValid && time <= lastVideo { return false }
		guard input.isReadyForMoreMediaData else { return false } // Video may drop; audio must not.
		guard pixels.append(frame, withPresentationTime: time) else { warning = writer?.error?.localizedDescription ?? "Video append failed"; finish(); return false }
		lastVideo = time
		lastHost = CMClockGetTime(CMClockGetHostTimeClock())
		lastFrame = frame
		outputFrames += 1
		if held { heldFrames += 1 }
		if let origin { elapsed = max(elapsed, CMTimeGetSeconds(time - origin)); publishElapsed() }
		return true
	}

	private func holdFrame() {
		guard switching || restoringPreview, !stopping, let frame = lastFrame, lastVideo.isValid else { return }
		let time = requestedAudio ? lastAudio : lastVideo + (CMClockGetTime(CMClockGetHostTimeClock()) - lastHost)
		if time.isValid && CMTimeGetSeconds(time - lastVideo) >= 1.0 / 30 { _ = appendVideo(frame, time, held: true) }
		checkLimit()
	}

	public func captureOutput(_ output: AVCaptureOutput, didOutput sampleBuffer: CMSampleBuffer, from connection: AVCaptureConnection) {
		if output === video {
			guard sourcePrepared else { return }
			if let expectedCameraID, !connection.inputPorts.contains(where: { ($0.input as? AVCaptureDeviceInput)?.device.uniqueID == expectedCameraID }) { return }
			setSourceReady(true)
			if restoringPreview { restoringPreview = false; removeOverlay() }
		}
		guard writer != nil, !stopping else { return }
		if writer?.status == .failed || writer?.status == .cancelled { warning = writer?.error?.localizedDescription ?? "Movie writer became unavailable"; finish(); return }
		let time = CMSampleBufferGetPresentationTimeStamp(sampleBuffer)
		if output === video {
			guard let buffer = CMSampleBufferGetImageBuffer(sampleBuffer) else { return }
			let portrait = orientation == .portrait || orientation == .portraitUpsideDown
			if portrait && CVPixelBufferGetWidth(buffer) > CVPixelBufferGetHeight(buffer) { return }
			if !portrait && CVPixelBufferGetHeight(buffer) > CVPixelBufferGetWidth(buffer) { return }
			do {
				if origin == nil { try begin(buffer, time) }
				guard let origin, time >= origin else { return }
				guard videoWriter?.isReadyForMoreMediaData == true else { return }
				if appendVideo(try normalize(buffer), time, held: false) {
					if outputFrames == 1 { emit("started", "{\"width\":\(width),\"height\":\(height)}") }
					if switching, let reply = switchReply {
						let problem = rollingBack ? switchProblem : nil
						completeSwitch(problem, reply: reply)
					}
				}
			} catch { warning = error.localizedDescription; finish() }
		} else if requestedAudio, let origin, time >= origin, let input = audioWriter {
			guard input.isReadyForMoreMediaData, input.append(sampleBuffer) else {
				warning = writer?.error?.localizedDescription ?? "Audio encoder backpressure"; finish(); return
			}
			audioBuffers += 1
			let duration = CMSampleBufferGetDuration(sampleBuffer)
			lastAudio = time + (duration.isValid ? duration : CMTime(value: 1024, timescale: 48000))
			elapsed = max(elapsed, CMTimeGetSeconds(lastAudio - origin))
			publishElapsed()
			holdFrame()
		}
		checkLimit()
	}

	private func checkLimit() { if !stopping && limit > 0 && elapsed >= limit { emit("limit", ""); finish() } }

	@objc(observeSource:)
	public func observeSource(_ observer: @escaping (Bool) -> Void) {
		queue.async { self.sourceObserver = observer; self.sendSourceReady() }
	}
	@objc(setPreviewLayer:)
	public func setPreviewLayer(_ layer: AVCaptureVideoPreviewLayer?) {
		queue.async { self.previewLayer = layer }
		DispatchQueue.main.async {
			if self.overlay.superlayer != nil, let layer { self.overlay.frame = layer.frame }
		}
	}
	@objc(expectCamera:)
	public func expectCamera(_ id: String) {
		queue.async {
			self.sourceEpoch += 1
			let epoch = self.sourceEpoch
			self.expectedCameraID = id; self.sourcePrepared = false; self.setSourceReady(false)
			let orientation = self.orientation
			DispatchQueue.main.async {
				guard self.queue.sync(execute: { self.sourceEpoch == epoch }) else { return }
				self.applyConnection(orientation)
				self.queue.async { if self.sourceEpoch == epoch { self.sourcePrepared = true } }
			}
		}
	}
	private func sendSourceReady() {
		let value = sourceReady
		let epoch = sourceEpoch
		guard let observer = sourceObserver else { return }
		DispatchQueue.main.async {
			guard self.queue.sync(execute: { self.sourceEpoch == epoch && self.sourceReady == value }) else { return }
			observer(value)
		}
	}
	private func setSourceReady(_ ready: Bool) {
		if sourceReady != ready { sourceReady = ready; sendSourceReady() }
	}
	private func publishElapsed() {
		elapsedLock.lock(); publishedElapsed = elapsed * 1000; elapsedLock.unlock()
	}
	private func applyConnection(_ orientation: AVCaptureVideoOrientation) {
		if let connection = video.connection(with: .video) {
			connection.automaticallyAdjustsVideoMirroring = false
			if connection.isVideoMirroringSupported { connection.isVideoMirrored = false }
			if connection.isVideoOrientationSupported { connection.videoOrientation = orientation }
		}
		if let connection = previewLayer?.connection, connection.isVideoOrientationSupported { connection.videoOrientation = orientation }
	}
	private func removeOverlay(_ epoch: Int? = nil) {
		DispatchQueue.main.async {
			if let epoch, self.overlayEpoch != epoch { return }
			self.overlay.removeFromSuperlayer(); self.overlay.contents = nil
		}
	}
	private func completeSwitch(_ problem: String?, reply: ((String?) -> Void)? = nil, keepOverlay: Bool = false) {
		let callback = reply ?? switchReply
		let epoch = switchEpoch
		unacknowledgedInput = problem == nil ? previousInput : nil
		switchEpoch += 1; switching = false; rollingBack = false
		switchReply = nil; previousInput = nil; switchProblem = nil
		DispatchQueue.main.async {
			if problem != nil && !keepOverlay && self.overlayEpoch == epoch { self.overlay.removeFromSuperlayer(); self.overlay.contents = nil }
			callback?(problem)
		}
	}
	/// Session transactions run away from the sample queue. Audio callbacks and
	/// held-frame writes must remain serviceable while AVFoundation reconfigures.
	private func exchangeInput(_ input: AVCaptureDeviceInput, completion: @escaping (Bool) -> Void) {
		guard let session else { completion(false); return }
		sourceEpoch += 1
		let epoch = sourceEpoch
		let orientation = self.orientation
		expectedCameraID = input.device.uniqueID
		sourcePrepared = false; setSourceReady(false)
		DispatchQueue.main.async {
			guard self.queue.sync(execute: { self.sourceEpoch == epoch }) else { return }
			session.beginConfiguration()
			for old in session.inputs.compactMap({ $0 as? AVCaptureDeviceInput }) where old.device.hasMediaType(.video) { session.removeInput(old) }
			let possible = session.canAddInput(input)
			if possible { session.addInput(input) }
			session.commitConfiguration()
			self.applyConnection(orientation)
			self.queue.async {
				guard self.sourceEpoch == epoch else { return }
				self.sourcePrepared = possible
				completion(possible)
			}
		}
	}

	private func armSwitchTimeout() {
		let epoch = switchEpoch
		queue.asyncAfter(deadline: .now() + 5) { [weak self] in
			guard let self, self.switching, self.switchEpoch == epoch else { return }
			self.failSwitch("Camera did not deliver a frame before timeout")
		}
	}
	private func failSwitch(_ problem: String) {
		guard switching else { return }
		if rollingBack || previousInput == nil {
			sourcePrepared = false; setSourceReady(false)
			warning = "Camera switch and rollback failed: \(problem)"
			completeSwitch(problem)
			emit("sourceLost", warning ?? problem)
			finish()
			return
		}
		rollingBack = true; switchProblem = problem; switchEpoch += 1
		exchangeInput(previousInput!) { possible in
			guard self.switching, self.rollingBack else { return }
			if possible { self.armSwitchTimeout() } else { self.failSwitch("Previous camera input is unavailable") }
		}
	}
	@objc(switchTo:reply:)
	public func switchTo(_ id: String, reply: @escaping (String?) -> Void) {
		queue.async {
			guard !self.stopping, self.writer != nil, self.origin != nil, !self.switching, self.unacknowledgedInput == nil, self.sourceReady,
				let previous = self.session?.inputs.compactMap({ $0 as? AVCaptureDeviceInput }).first(where: { $0.device.hasMediaType(.video) }),
				let device = AVCaptureDevice(uniqueID: id), let frame = self.lastFrame else {
				DispatchQueue.main.async { reply("Switch is unavailable") }; return
			}
			do {
				let next = try AVCaptureDeviceInput(device: device)
				guard let image = self.context.createCGImage(CIImage(cvPixelBuffer: frame), from: CGRect(x: 0, y: 0, width: self.width, height: self.height)) else {
					DispatchQueue.main.async { reply("The last preview frame is unavailable") }; return
				}
				self.switchEpoch += 1
				let epoch = self.switchEpoch
				self.switching = true; self.switchReply = reply; self.previousInput = previous
				self.sourcePrepared = false; self.setSourceReady(false)
				self.rollingBack = false; self.switchProblem = nil
				// Install the hold on main before disturbing the preview connection.
				// Never synchronously wait for main from the sample queue.
				DispatchQueue.main.async {
					guard self.queue.sync(execute: { self.switching && self.switchEpoch == epoch && !self.stopping }) else { return }
					self.overlayEpoch = epoch
					if let layer = self.previewLayer, let parent = layer.superlayer {
						self.overlay.frame = layer.frame; self.overlay.contentsGravity = .resizeAspectFill
						self.overlay.contents = image
						self.overlay.setAffineTransform(CGAffineTransform(scaleX: layer.connection?.isVideoMirrored == true ? -1 : 1, y: 1))
						parent.addSublayer(self.overlay)
					}
					self.queue.async {
						guard self.switching, self.switchEpoch == epoch, !self.stopping else { self.removeOverlay(epoch); return }
						self.exchangeInput(next) { possible in
							guard self.switching, self.switchEpoch == epoch else { return }
							if possible { self.armSwitchTimeout() } else { self.failSwitch("Camera input is incompatible") }
						}
					}
				}
			} catch { DispatchQueue.main.async { reply(error.localizedDescription) } }
		}
	}
	private func cancelSwitchInternal(_ message: String) {
		guard switching || unacknowledgedInput != nil else { return }
		let previous = previousInput ?? unacknowledgedInput
		restoringPreview = true
		if switching { completeSwitch(message, keepOverlay: true) }
		unacknowledgedInput = nil
		if let previous {
			exchangeInput(previous) { possible in
				let epoch = self.sourceEpoch
				self.queue.asyncAfter(deadline: .now() + 5) { [weak self] in
					guard let self, self.sourceEpoch == epoch, self.restoringPreview, !self.released else { return }
					self.restoringPreview = false; self.removeOverlay()
					self.warning = "Camera did not recover after cancellation"
					self.emit("sourceLost", self.warning!); self.finish()
				}
				if !possible { self.restoringPreview = false; self.removeOverlay(); self.warning = "Cannot restore camera after cancellation"; self.emit("sourceLost", self.warning!); self.finish() }
			}
		}
	}
	/// Physical acquisition precedes the JS operation's commit. Until this
	/// acknowledgement, stop must still be able to restore the previous source.
	@objc(confirmSwitch:)
	public func confirmSwitch(_ id: String) {
		queue.async { if self.expectedCameraID == id { self.unacknowledgedInput = nil; self.removeOverlay() } }
	}
	@objc public func cancelSwitch() { queue.async { self.cancelSwitchInternal("Camera switching was cancelled") } }
	@objc public func stop() { queue.async { self.finish() } }
	@objc public func elapsedMs() -> Double {
		elapsedLock.lock(); defer { elapsedLock.unlock() }; return publishedElapsed
	}
	@objc(releaseWithReply:)
	public func releaseWithReply(_ reply: @escaping () -> Void) {
		queue.async {
			self.releaseReplies.append(reply)
			if self.writer != nil { self.finish() } else { self.finishRelease() }
		}
	}
	private func finishRelease() {
		guard !releaseReplies.isEmpty else { return }
		sourceEpoch += 1; switchEpoch += 1; sourcePrepared = false; released = true; sourceReady = false
		timer?.cancel(); timer = nil
		video.setSampleBufferDelegate(nil, queue: nil)
		audio.setSampleBufferDelegate(nil, queue: nil)
		sourceObserver = nil; previewLayer = nil; removeOverlay()
		let replies = releaseReplies; releaseReplies = []
		DispatchQueue.main.async { for reply in replies { reply() } }
	}

	private func finish() {
		guard let writer, !stopping else { return }
		stopping = true
		cancelSwitchInternal("Recording is finalizing")
		timer?.cancel(); timer = nil
		emit("finishing", warning == nil ? "" : "captureError")
		guard origin != nil, writer.status == .writing else {
			if !ownsOutput { writer.cancelWriting() }; terminal("failed", warning ?? writer.error?.localizedDescription ?? "No video frames were captured"); return
		}
		videoWriter?.markAsFinished()
		audioWriter?.markAsFinished()
		let epoch = takeEpoch
		queue.asyncAfter(deadline: .now() + 30) { [weak self, weak writer] in
			guard let self, let writer else { return }
			if self.takeEpoch == epoch && self.writer === writer {
				self.terminal("failed", "Movie finalization timed out; output bytes may be incomplete")
			}
		}
		let summary: [String: Any] = ["path": path, "frames": outputFrames, "heldFrames": heldFrames, "audioBuffers": audioBuffers, "elapsedMs": elapsed * 1000, "warning": warning ?? ""]
		writer.finishWriting { [weak self, weak writer] in
			guard let self, let writer else { return }
			self.queue.async {
				guard self.takeEpoch == epoch, self.writer === writer else { return }
				if writer.status == .completed && self.outputFrames > 0 {
					let data = (try? JSONSerialization.data(withJSONObject: summary)) ?? Data()
					self.terminal("finished", String(data: data, encoding: .utf8) ?? "{}")
				} else { self.terminal("failed", writer.error?.localizedDescription ?? (self.outputFrames == 0 ? "No video frames were captured" : "Movie finalization failed")) }
			}
		}
	}

	private func terminal(_ type: String, _ payload: String) {
		let reply = notify
		let message: String
		if type == "failed", let data = try? JSONSerialization.data(withJSONObject: ["message": payload, "ownsOutput": ownsOutput, "hasVideo": outputFrames > 0, "canInspectOutput": writer?.status == .completed || writer?.status == .failed]) { message = String(data: data, encoding: .utf8) ?? payload }
		else { message = payload }
		clear()
		DispatchQueue.main.async { reply?(type, message) }
		finishRelease()
	}

	private func clear() {
		writer = nil; videoWriter = nil; audioWriter = nil; pixels = nil; lastFrame = nil; notify = nil; origin = nil
	}

}
