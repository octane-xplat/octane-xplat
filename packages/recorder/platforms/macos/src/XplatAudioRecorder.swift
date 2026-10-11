import AppKit
import AVFoundation

/// One foreground-only PCM take. JS owns admission and promise settlement;
/// this leaf owns microphone lifetime, temporary files and finalization.
@objc(XplatAudioRecorder)
public final class XplatAudioRecorder: NSObject, AVAudioRecorderDelegate {
	private var recorder: AVAudioRecorder?
	private var takeURL: URL?
	private var takeID = 0
	private var emit: ((String) -> Void)?
	private var observers: [NSObjectProtocol] = []
	private var disposed = false
	private var finalizing = false
	private var capturing = false
	private var interrupted = false

	public override init() {
		super.init()
		let center = NotificationCenter.default
		observers.append(center.addObserver(forName: NSApplication.didResignActiveNotification, object: nil, queue: .main) { [weak self] _ in
			self?.interrupt()
		})
		observers.append(center.addObserver(forName: NSApplication.didBecomeActiveNotification, object: nil, queue: .main) { [weak self] _ in
			self?.clearInterruption()
		})
		observers.append(center.addObserver(forName: AVCaptureDevice.wasDisconnectedNotification, object: nil, queue: .main) { [weak self] event in
			if let device = event.object as? AVCaptureDevice, device.hasMediaType(.audio) { self?.interrupt() }
		})
		observers.append(center.addObserver(forName: AVCaptureDevice.wasConnectedNotification, object: nil, queue: .main) { [weak self] _ in
			self?.clearInterruption()
		})
	}

	private func send(_ fields: [String: Any]) {
		var payload = fields
		payload["id"] = takeID
		guard let data = try? JSONSerialization.data(withJSONObject: payload),
			let text = String(data: data, encoding: .utf8) else { return }
		emit?(text)
	}

	@objc public func installObserver(_ listener: @escaping (String) -> Void) { emit = listener }

	@objc public func permissionStatus() -> NSString {
		guard !disposed else { return "unsupported" }
		guard let usage = Bundle.main.object(forInfoDictionaryKey: "NSMicrophoneUsageDescription") as? String,
			!usage.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else { return "undeclared" }
		switch AVCaptureDevice.authorizationStatus(for: .audio) {
		case .denied: return "denied"
		case .restricted: return "restricted"
		case .notDetermined:
			return AVCaptureDevice.default(for: .audio) == nil ? "unavailable" : "undetermined"
		case .authorized:
			return AVCaptureDevice.default(for: .audio) == nil ? "unavailable" : "granted"
		@unknown default: return "unsupported"
		}
	}

	@objc public func requestPermission(_ reply: @escaping (String) -> Void) {
		let current = permissionStatus() as String
		guard current == "undetermined" else { reply(current); return }
		AVCaptureDevice.requestAccess(for: .audio) { [weak self] _ in
			DispatchQueue.main.async { reply(self?.permissionStatus() as String? ?? "unsupported") }
		}
	}

	@objc public func startTake(_ serialized: String) -> NSString {
		guard !disposed, recorder == nil, takeURL == nil else { return "AudioRecorder is busy or disposed" }
		guard permissionStatus() == "granted" else { return "Microphone authorization or input is unavailable" }
		guard NSApplication.shared.isActive else { return "Microphone capture requires an active app" }
		guard let data = serialized.data(using: .utf8),
			let options = (try? JSONSerialization.jsonObject(with: data)) as? [String: Any],
			let id = options["id"] as? Int,
			let rate = options["sampleRate"] as? Int,
			let channels = options["channels"] as? Int,
			(1...192000).contains(rate), (1...2).contains(channels) else { return "Invalid PCM recording options" }
		takeID = id
		// A fresh private directory avoids collisions and limits cancellation
		// to this operation; completed results remain owned by the app.
		let directory = FileManager.default.temporaryDirectory.appendingPathComponent("octane-recorder-\(UUID().uuidString)", isDirectory: true)
		let url = directory.appendingPathComponent("take.wav")
		do {
			try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: false)
			takeURL = url
			let value = try AVAudioRecorder(url: url, settings: [
				AVFormatIDKey: kAudioFormatLinearPCM,
				AVSampleRateKey: rate,
				AVNumberOfChannelsKey: channels,
				AVLinearPCMBitDepthKey: 16,
				AVLinearPCMIsBigEndianKey: false,
				AVLinearPCMIsFloatKey: false,
				AVLinearPCMIsNonInterleaved: false,
			])
			recorder = value
			value.delegate = self
			value.isMeteringEnabled = true
			guard value.prepareToRecord(), value.record() else {
				cancel()
				return "AVAudioRecorder refused to start"
			}
			capturing = true
			interrupted = false
			return ""
		} catch {
			cancel()
			return error.localizedDescription as NSString
		}
	}

	@objc public func pause() {
		recorder?.pause()
		capturing = false
	}

	@objc public func resume() -> NSString {
		guard !disposed, !finalizing, !interrupted, NSApplication.shared.isActive else { return "Microphone interruption has not cleared" }
		guard permissionStatus() == "granted" else { return "Microphone authorization or input is unavailable" }
		guard let recorder, recorder.record() else { return "AVAudioRecorder refused to resume" }
		capturing = true
		return ""
	}

	@objc public func stop() {
		guard let recorder, !finalizing else { return }
		finalizing = true
		capturing = false
		recorder.stop() // The delegate completes only after the file closes.
		DispatchQueue.main.asyncAfter(deadline: .now() + 10) { [weak self, weak recorder] in
			guard let self, let recorder, self.recorder === recorder, self.finalizing else { return }
			self.send(["type": "error", "message": "AVAudioRecorder did not finalize the take"])
			self.cancel()
		}
	}

	private func interrupt() {
		guard recorder != nil, !finalizing, !interrupted else { return }
		pause()
		interrupted = true
		send(["type": "interrupted"])
	}

	private func clearInterruption() {
		guard interrupted, !finalizing, NSApplication.shared.isActive,
			permissionStatus() == "granted" else { return }
		interrupted = false
		send(["type": "interruptionEnded"]) // App explicitly chooses resume.
	}

	@objc public func status() -> NSString {
		if capturing, recorder?.isRecording != true { interrupt() }
		recorder?.updateMeters()
		let power = recorder?.averagePower(forChannel: 0) ?? -160
		let fields: [String: Any] = [
			"durationSeconds": recorder?.currentTime ?? 0,
			"meterLevel": capturing ? min(1, max(0, Double(power + 60) / 60)) as Any : NSNull(),
		]
		guard let data = try? JSONSerialization.data(withJSONObject: fields),
			let text = String(data: data, encoding: .utf8) else { return "{}" }
		return text as NSString
	}

	public func audioRecorderDidFinishRecording(_ value: AVAudioRecorder, successfully flag: Bool) {
		guard Thread.isMainThread else {
			DispatchQueue.main.async { [weak self] in self?.audioRecorderDidFinishRecording(value, successfully: flag) }
			return
		}
		guard recorder === value, let url = takeURL, !disposed else { return }
		recorder = nil // Release the microphone before resolving stop.
		capturing = false
		guard finalizing, flag else {
			send(["type": "error", "message": "AVAudioRecorder ended without a successful stop"])
			cancel()
			return
		}
		do {
			let bytes = try Data(contentsOf: url)
			send(["type": "finished", "base64": bytes.base64EncodedString(), "path": url.path])
			// Validation happens synchronously in JS; on failure it calls cancel
			// while this operation still owns the file. Successful takes transfer.
			takeURL = nil
			finalizing = false
			interrupted = false
		} catch {
			send(["type": "error", "message": error.localizedDescription])
			cancel()
		}
	}

	public func audioRecorderEncodeErrorDidOccur(_ value: AVAudioRecorder, error: Error?) {
		guard Thread.isMainThread else {
			DispatchQueue.main.async { [weak self] in self?.audioRecorderEncodeErrorDidOccur(value, error: error) }
			return
		}
		guard recorder === value, !disposed else { return }
		send(["type": "error", "message": error?.localizedDescription ?? "AVAudioRecorder encode error"])
		cancel()
	}

	@objc public func cancel() {
		let value = recorder
		recorder = nil
		value?.delegate = nil
		value?.stop()
		capturing = false
		finalizing = false
		interrupted = false
		if let url = takeURL {
			try? FileManager.default.removeItem(at: url)
			try? FileManager.default.removeItem(at: url.deletingLastPathComponent())
		}
		takeURL = nil
	}

	@objc public func dispose() {
		guard !disposed else { return }
		disposed = true
		cancel()
		for observer in observers { NotificationCenter.default.removeObserver(observer) }
		observers.removeAll()
		emit = nil
	}

	deinit {
		for observer in observers { NotificationCenter.default.removeObserver(observer) }
	}
}
