import AppKit
import QuartzCore

/// NSImageView owns GIF frame timing. No app-shell scripts or mobile image plugin.
@objc(XplatAnimatedImageView)
public final class XplatAnimatedImageView: NSView {
	private let imageView = NSImageView()
	private let session: URLSession = {
		let config = URLSessionConfiguration.ephemeral
		config.urlCache = nil; config.urlCredentialStorage = nil; config.httpCookieStorage = nil; config.httpShouldSetCookies = false
		return URLSession(configuration: config)
	}()
	private var task: URLSessionDataTask?
	private var revision = 0
	private var disposed = false
	private var fit = "aspectFit"
	private var displayObserver: NSObjectProtocol?

	@objc public class func create() -> XplatAnimatedImageView { XplatAnimatedImageView(frame: .zero) }
	public override init(frame frameRect: NSRect) {
		super.init(frame: frameRect)
		wantsLayer = true
		layer?.masksToBounds = true
		imageView.imageScaling = .scaleAxesIndependently
		imageView.isEditable = false
		imageView.allowsCutCopyPaste = false
		imageView.setAccessibilityElement(false)
		addSubview(imageView)
		setAccessibilityRole(.image)
		setAccessibilityElement(false)
		displayObserver = NSWorkspace.shared.notificationCenter.addObserver(forName: NSWorkspace.accessibilityDisplayOptionsDidChangeNotification, object: nil, queue: .main) { [weak self] _ in self?.updateAnimation() }
	}
	public required init?(coder: NSCoder) { fatalError("Use XplatAnimatedImageView.create") }
	public override var isFlipped: Bool { true }
	public override var intrinsicContentSize: NSSize { imageView.image?.size ?? .zero }
	public override func hitTest(_ point: NSPoint) -> NSView? { nil }
	public override func layout() {
		super.layout()
		guard let image = imageView.image else { imageView.frame = bounds; return }
		let size = image.size
		guard size.width > 0, size.height > 0, bounds.width > 0, bounds.height > 0 else { imageView.frame = .zero; return }
		var target = size
		if fit == "fill" { target = bounds.size }
		else if fit != "none" {
			let x = bounds.width / size.width, y = bounds.height / size.height
			let scale = fit == "aspectFill" ? max(x, y) : min(x, y)
			target = NSSize(width: size.width * scale, height: size.height * scale)
		}
		imageView.frame = NSRect(x: bounds.midX - target.width / 2, y: bounds.midY - target.height / 2, width: target.width, height: target.height)
	}
	public override func viewDidMoveToWindow() { super.viewDidMoveToWindow(); updateAnimation() }
	public override func viewDidHide() { super.viewDidHide(); updateAnimation() }
	public override func viewDidUnhide() { super.viewDidUnhide(); updateAnimation() }
	private func updateAnimation() {
		imageView.animates = !disposed && window != nil && !isHiddenOrHasHiddenAncestor && !NSWorkspace.shared.accessibilityDisplayShouldReduceMotion
	}
	@objc public func setFit(_ value: String) { fit = value; needsLayout = true }
	@objc public func setAlt(_ value: String) {
		setAccessibilityLabel(value)
		setAccessibilityElement(!value.isEmpty)
	}
	@objc public func setSource(_ source: String) {
		guard !disposed else { return }
		revision += 1
		task?.cancel(); task = nil
		imageView.animates = false; imageView.image = nil; invalidateIntrinsicContentSize()
		let own = revision
		let url: URL?
		if source.hasPrefix("~/") { url = Bundle.main.resourceURL?.appendingPathComponent(String(source.dropFirst(2))) }
		else if source.hasPrefix("/") { url = URL(fileURLWithPath: source) }
		else { url = URL(string: source) }
		guard let url, let scheme = url.scheme?.lowercased(), ["http", "https", "file", "data"].contains(scheme),
			url.isFileURL || scheme == "data" || !(url.host ?? "").isEmpty else { return }
		let install: (Data?) -> Void = { [weak self] data in
			DispatchQueue.main.async { [weak self] in
				guard let self, !self.disposed, self.revision == own else { return }
				self.task = nil
				self.imageView.image = data.flatMap { NSImage(data: $0) }
				self.invalidateIntrinsicContentSize()
				self.needsLayout = true
				self.updateAnimation()
			}
		}
		if url.isFileURL || scheme == "data" {
			// File/data reads are not cancellable once started; revision drops stale results.
			DispatchQueue.global(qos: .userInitiated).async { install(try? Data(contentsOf: url)) }
		} else {
			let request = session.dataTask(with: url) { data, response, error in
				let status = (response as? HTTPURLResponse)?.statusCode ?? 0
				install(error == nil && (200..<300).contains(status) ? data : nil)
			}
			task = request; request.resume()
		}
	}
	@objc public func dispose() {
		guard !disposed else { return }
		disposed = true; revision += 1
		session.invalidateAndCancel()
		task?.cancel(); task = nil
		imageView.animates = false; imageView.image = nil; invalidateIntrinsicContentSize()
		if let displayObserver { NSWorkspace.shared.notificationCenter.removeObserver(displayObserver) }
		displayObserver = nil
	}
	deinit {
		session.invalidateAndCancel()
		task?.cancel()
		if let displayObserver { NSWorkspace.shared.notificationCenter.removeObserver(displayObserver) }
	}
}
