import AppKit
import AVFoundation

/// App-owned still-photo UI. No microphone input, movie output or Photos writes.
@objc(XplatPhotoCaptureSheet)
public final class XplatPhotoCaptureSheet: NSObject, NSWindowDelegate {
	private let host = XplatCameraHost()
	private let lifecycle = PhotoCaptureLifecycle()
	private var sheet: NSWindow?
	private weak var parent: NSWindow?
	private var reply: ((String?) -> Void)?
	private var timeout: DispatchWorkItem?
	private var closeObserver: NSObjectProtocol?
	private var preview: NSView?
	private var captureButton: NSButton?
	private var statusLabel: NSTextField?
	private var options: NSDictionary = [:]
	private var disposed = false
	var operationTimeout: TimeInterval = 15

	@objc public func permissionStatus() -> NSString { host.permissionStatus("camera") }

	@objc public func present(_ options: NSDictionary, reply: @escaping (String?) -> Void) {
		guard let parent = NSApp.keyWindow ?? NSApp.mainWindow else { reply(nil); return }
		presentOnWindow(parent, options: options, reply: reply)
	}

	// Explicit host window also allows deterministic AppKit lifecycle checks.
	func presentOnWindow(_ parent: NSWindow, options: NSDictionary, reply: @escaping (String?) -> Void) {
		guard !disposed, sheet == nil, parent.attachedSheet == nil,
			!(options["saveToGallery"] as? Bool ?? false)
		else { reply(nil); return }
		self.options = options
		self.reply = reply
		self.parent = parent
		let sheet = NSWindow(contentRect: NSRect(x: 0, y: 0, width: 640, height: 480),
			styleMask: [.titled, .closable], backing: .buffered, defer: false)
		sheet.title = "Take a photo"
		sheet.delegate = self
		let content = NSView(frame: NSRect(x: 0, y: 0, width: 640, height: 480))
		let preview = NSView(frame: NSRect(x: 16, y: 80, width: 608, height: 384))
		preview.wantsLayer = true
		preview.layer?.backgroundColor = NSColor.black.cgColor
		content.addSubview(preview)
		let status = NSTextField(labelWithString: "Choose Capture to start the camera.")
		status.frame = NSRect(x: 16, y: 48, width: 440, height: 22)
		content.addSubview(status)
		let cancel = NSButton(title: "Cancel", target: self, action: #selector(cancelPhoto))
		cancel.keyEquivalent = "\u{1b}"
		cancel.frame = NSRect(x: 432, y: 12, width: 92, height: 32)
		content.addSubview(cancel)
		let capture = NSButton(title: "Capture", target: self, action: #selector(capturePhoto))
		capture.keyEquivalent = "\r"
		capture.frame = NSRect(x: 528, y: 12, width: 96, height: 32)
		content.addSubview(capture)
		sheet.contentView = content
		self.sheet = sheet
		self.preview = preview
		statusLabel = status
		captureButton = capture
		closeObserver = NotificationCenter.default.addObserver(forName: NSWindow.willCloseNotification,
			object: parent, queue: .main) { [weak self] _ in self?.complete(nil) }
		parent.beginSheet(sheet) { [weak self] _ in self?.complete(nil) }
	}

	private func deadline(_ token: Int) {
		timeout?.cancel()
		let work = DispatchWorkItem { [weak self] in
			guard let self, lifecycle.accepts(token) else { return }
			complete(nil)
		}
		timeout = work
		DispatchQueue.main.asyncAfter(deadline: .now() + operationTimeout, execute: work)
	}

	@objc private func capturePhoto() {
		if let token = lifecycle.prepare() {
			captureButton?.isEnabled = false
			statusLabel?.stringValue = "Starting camera…"
			deadline(token)
			// Authorization happens only after the user presses Capture.
			host.requestPermission("camera") { [weak self] status in
				guard let self, lifecycle.accepts(token) else { return }
				guard status == "granted" else { complete(nil); return }
				DispatchQueue.global(qos: .userInitiated).async { [self] in
					let failure = self.host.configure(["photo": true, "audio": false])
					DispatchQueue.main.async { [self] in
						guard self.lifecycle.accepts(token) else { return }
						guard failure == nil, let preview = self.preview else { self.complete(nil); return }
						self.host.installObserver { [weak self] message in
							guard let self, lifecycle.accepts(token),
								let data = message.data(using: .utf8),
								let event = try? JSONSerialization.jsonObject(with: data) as? [String: Any]
							else { return }
							if event["type"] as? String == "previewReady", event["ready"] as? Bool == true,
								lifecycle.ready(token) {
								timeout?.cancel()
								captureButton?.isEnabled = true
								statusLabel?.stringValue = "Frame your photo, then choose Capture."
							} else if event["type"] as? String == "interrupted" ||
								(event["type"] as? String == "availability" && event["available"] as? Bool == false) {
								complete(nil)
							}
						}
						if self.host.attachPreview(preview) != nil { self.complete(nil) }
					}
				}
			}
			return
		}
		guard let token = lifecycle.capture() else { return }
		captureButton?.isEnabled = false
		statusLabel?.stringValue = "Taking photo…"
		deadline(token)
		if host.capturePhoto({ [weak self] data in
			guard let self, lifecycle.accepts(token) else { return }
			guard let data, let result = persist(data as Data) else { complete(nil); return }
			complete(result)
		}) != nil { complete(nil) }
	}

	private func persist(_ data: Data) -> String? {
		guard let source = NSBitmapImageRep(data: data) else { return nil }
		let width = (options["width"] as? NSNumber)?.doubleValue ?? Double(source.pixelsWide)
		let height = (options["height"] as? NSNumber)?.doubleValue ?? Double(source.pixelsHigh)
		guard width.isFinite, height.isFinite, width >= 1, height >= 1, width <= 16384, height <= 16384, width * height <= 64_000_000 else { return nil }
		let keepAspectRatio = options["keepAspectRatio"] as? Bool ?? true
		let scale = min(width / Double(source.pixelsWide), height / Double(source.pixelsHigh), 1)
		let size = NSSize(width: keepAspectRatio ? Double(source.pixelsWide) * scale : width,
			height: keepAspectRatio ? Double(source.pixelsHigh) * scale : height)
		guard let bitmap = NSBitmapImageRep(bitmapDataPlanes: nil, pixelsWide: Int(size.width),
			pixelsHigh: Int(size.height), bitsPerSample: 8, samplesPerPixel: 4, hasAlpha: true,
			isPlanar: false, colorSpaceName: .deviceRGB, bytesPerRow: 0, bitsPerPixel: 0),
			let context = NSGraphicsContext(bitmapImageRep: bitmap) else { return nil }
		NSGraphicsContext.saveGraphicsState()
		NSGraphicsContext.current = context
		let image = NSImage(size: NSSize(width: source.pixelsWide, height: source.pixelsHigh))
		image.addRepresentation(source)
		image.draw(in: NSRect(origin: .zero, size: size))
		NSGraphicsContext.restoreGraphicsState()
		guard let jpeg = bitmap.representation(using: .jpeg, properties: [.compressionFactor: 0.9]) else { return nil }
		let name = "octane-capture-\(UUID().uuidString).jpg"
		let url = FileManager.default.temporaryDirectory.appendingPathComponent(name)
		do {
			let payload: [String: String] = ["name": name, "uri": url.path,
				"dataUrl": "data:image/jpeg;base64," + jpeg.base64EncodedString()]
			let message = try JSONSerialization.data(withJSONObject: payload)
			try jpeg.write(to: url, options: .atomic)
			return String(data: message, encoding: .utf8)
		} catch {
			try? FileManager.default.removeItem(at: url)
			return nil
		}
	}

	@objc private func cancelPhoto() { complete(nil) }
	public func windowShouldClose(_ sender: NSWindow) -> Bool { complete(nil); return false }

	private func complete(_ result: String?) {
		guard lifecycle.finish() else { return }
		let callback = reply
		reply = nil
		dispose()
		callback?(result)
	}

	@objc public func discard(_ path: String) {
		let url = URL(fileURLWithPath: path).standardizedFileURL
		guard url.deletingLastPathComponent() == FileManager.default.temporaryDirectory.standardizedFileURL,
			url.lastPathComponent.hasPrefix("octane-capture-") else { return }
		try? FileManager.default.removeItem(at: url)
	}

	@objc public func dispose() {
		guard !disposed else { return }
		disposed = true
		timeout?.cancel()
		timeout = nil
		if let closeObserver { NotificationCenter.default.removeObserver(closeObserver) }
		closeObserver = nil
		host.dispose()
		if let sheet { parent?.endSheet(sheet); sheet.orderOut(nil) }
		sheet = nil
		preview = nil
		captureButton = nil
		statusLabel = nil
		// Disposal is also a cancellation, including an external owner teardown.
		if lifecycle.finish() { let callback = reply; reply = nil; callback?(nil) }
	}

	deinit { dispose() }
}
