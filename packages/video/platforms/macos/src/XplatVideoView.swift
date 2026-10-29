import AppKit
import AVFoundation
import CoreMedia
import QuartzCore

/// Package-owned AVFoundation surface. The Octane leaf owns all transport UI.
@objc(XplatVideoView)
@objcMembers public final class XplatVideoView: NSView {
	private var player = AVPlayer()
	private let videoLayer = AVPlayerLayer()
	private var item: AVPlayerItem?
	private var observers: [NSObjectProtocol] = []
	private var generation = 0
	private var command = 0
	private var seekRevision = 0
	private var disposed = false
	private var wasAttached = false
	private var wantsPlayback = false
	private var ended = false
	private var seeking = false
	private var looping = false
	private var muted = false
	private var failure: String?

	public class func create() -> XplatVideoView { XplatVideoView(frame: .zero) }

	public override init(frame frameRect: NSRect) {
		super.init(frame: frameRect)
		wantsLayer = true
		layer?.backgroundColor = NSColor.black.cgColor
		layer?.masksToBounds = true
		videoLayer.player = player
		videoLayer.videoGravity = .resizeAspect
		layer?.addSublayer(videoLayer)
		setAccessibilityElement(false)
	}
	public required init?(coder: NSCoder) { fatalError("Use XplatVideoView.create") }
	public override func hitTest(_ point: NSPoint) -> NSView? { nil }
	public override func layout() {
		super.layout()
		CATransaction.begin()
		CATransaction.setDisableActions(true)
		videoLayer.frame = bounds
		CATransaction.commit()
	}
	public override func viewDidMoveToWindow() {
		super.viewDidMoveToWindow()
		if window != nil { wasAttached = true }
		else if wasAttached { pause() }
	}

	public func setSource(_ source: String) {
		if disposed { return }
		clear()
		if source.isEmpty { return }
		let url: URL?
		if source.hasPrefix("~/") {
			url = Bundle.main.resourceURL?.appendingPathComponent(String(source.dropFirst(2)))
		} else if source.hasPrefix("/") { url = URL(fileURLWithPath: source) }
		else { url = URL(string: source) }
		guard let url, ["http", "https", "file"].contains(url.scheme?.lowercased() ?? ""),
			  url.isFileURL || !(url.host ?? "").isEmpty else {
			failure = "Video source must be a bundle path, absolute file, or HTTP(S) URL"
			return
		}
		if url.isFileURL && !FileManager.default.isReadableFile(atPath: url.path) {
			failure = "Video file is not readable"
			return
		}
		let next = AVPlayerItem(url: url), ownGeneration = generation
		item = next
		player = AVPlayer(playerItem: next)
		player.isMuted = muted
		videoLayer.player = player
		observers.append(NotificationCenter.default.addObserver(forName: AVPlayerItem.didPlayToEndTimeNotification, object: next, queue: .main) { [weak self, weak next] _ in
			guard let self, let next, !self.disposed, self.generation == ownGeneration, self.item === next else { return }
			if self.looping && self.wantsPlayback { self.seek(0, resume: true) }
			else { self.ended = true; self.pause() }
		})
		observers.append(NotificationCenter.default.addObserver(forName: AVPlayerItem.failedToPlayToEndTimeNotification, object: next, queue: .main) { [weak self, weak next] _ in
			guard let self, let next, !self.disposed, self.generation == ownGeneration, self.item === next else { return }
			self.failure = "Video playback failed"
			self.pause()
		})
	}
	public func setMuted(_ value: Bool) { muted = value; if !disposed { player.isMuted = value } }
	public func setLooping(_ value: Bool) { looping = value }
	public func setFit(_ value: String) {
		videoLayer.videoGravity = value == "cover" ? .resizeAspectFill : value == "fill" ? .resize : .resizeAspect
	}
	public func play() {
		if disposed || item == nil || failure != nil || (wasAttached && window == nil) { return }
		command += 1
		wantsPlayback = true
		if ended { seek(0, resume: true) } else { player.play() }
	}
	public func pause() {
		command += 1
		wantsPlayback = false
		player.pause()
	}
	public func seekToMS(_ milliseconds: Double) { seek(milliseconds, resume: wantsPlayback) }
	private func seek(_ milliseconds: Double, resume: Bool) {
		guard !disposed, let item, milliseconds.isFinite else { return }
		command += 1
		seekRevision += 1
		let ownCommand = command, ownSeek = seekRevision, ownGeneration = generation
		let duration = CMTimeGetSeconds(item.duration)
		let seconds = max(0, duration.isFinite && duration > 0 ? min(milliseconds / 1000, duration) : milliseconds / 1000)
		seeking = true
		ended = false
		item.cancelPendingSeeks()
		player.seek(to: CMTime(seconds: seconds, preferredTimescale: 600), toleranceBefore: .zero, toleranceAfter: .zero) { [weak self, weak item] _ in
			DispatchQueue.main.async {
				guard let self, let item, !self.disposed, self.generation == ownGeneration, self.seekRevision == ownSeek, self.item === item else { return }
				self.seeking = false
				if resume && self.wantsPlayback && self.command == ownCommand { self.player.play() }
			}
		}
	}
	public func snapshot() -> String {
		if item != nil && (item?.status == .failed || player.status == .failed) { failure = "Video playback failed"; pause() }
		let status = failure != nil ? "failed" : item == nil ? "idle" : ended ? "ended" : item?.status == .readyToPlay ? "ready" : "loading"
		let position = CMTimeGetSeconds(player.currentTime()), duration = item.map { CMTimeGetSeconds($0.duration) } ?? 0
		let value: [String: Any] = ["status": status, "position": position.isFinite ? max(0, position * 1000) : 0,
			"duration": duration.isFinite ? max(0, duration * 1000) : 0, "playing": player.timeControlStatus == .playing,
			"requestedPlaying": wantsPlayback, "seeking": seeking, "message": failure ?? ""]
		guard let data = try? JSONSerialization.data(withJSONObject: value), let text = String(data: data, encoding: .utf8) else { return "{\"status\":\"failed\"}" }
		return text
	}
	public func clear() {
		generation += 1
		command += 1
		seekRevision += 1
		observers.forEach { NotificationCenter.default.removeObserver($0) }
		observers.removeAll()
		item?.cancelPendingSeeks()
		player.pause()
		player.replaceCurrentItem(with: nil)
		videoLayer.player = nil
		item = nil
		wantsPlayback = false
		ended = false
		seeking = false
		failure = nil
	}
	public func dispose() {
		if disposed { return }
		clear()
		disposed = true
		videoLayer.player = nil
	}
	deinit {
		observers.forEach { NotificationCenter.default.removeObserver($0) }
		player.pause()
		player.replaceCurrentItem(with: nil)
	}
}
