import AppKit
import AVFoundation

// Only the camera is replaced. Sheet controls, close notifications, callbacks,
// deadlines and temporary JPEG persistence execute the production Swift leaf.
final class XplatCameraHost {
	static var instances: [XplatCameraHost] = []
	var permissionRequests = 0
	var permissionReply: ((String) -> Void)?
	var observer: ((String) -> Void)?
	var photoReply: ((NSData?) -> Void)?
	var disposed = false
	var configuration: NSDictionary?
	var failure: NSString?
	init() { Self.instances.append(self) }
	func permissionStatus(_ kind: String) -> NSString { precondition(kind == "camera"); return "notDetermined" }
	func requestPermission(_ kind: String, reply: @escaping (String) -> Void) {
		precondition(kind == "camera")
		permissionRequests += 1
		permissionReply = reply
	}
	func configure(_ options: NSDictionary) -> NSString? { configuration = options; return failure }
	func installObserver(_ listener: @escaping (String) -> Void) { observer = listener }
	func attachPreview(_ view: NSView) -> NSString? { nil }
	func capturePhoto(_ reply: @escaping (NSData?) -> Void) -> NSString? { photoReply = reply; return nil }
	func dispose() { disposed = true }
}

@main struct PhotoSheetTests {
	static func main() {
		_ = NSApplication.shared
		var checks = 0
		func expect(_ condition: @autoclosure () -> Bool) { precondition(condition()); checks += 1 }
		func wait(_ predicate: () -> Bool) {
			let end = Date().addingTimeInterval(2)
			while !predicate() && Date() < end { RunLoop.main.run(until: Date().addingTimeInterval(0.01)) }
			precondition(predicate())
		}
		func make() -> (XplatPhotoCaptureSheet, NSWindow, XplatCameraHost, NSButton, NSButton, () -> [String?]) {
			let owner = XplatPhotoCaptureSheet()
			let parent = NSWindow(contentRect: NSRect(x: 0, y: 0, width: 640, height: 480),
				styleMask: [.titled], backing: .buffered, defer: false)
			var results: [String?] = []
			owner.presentOnWindow(parent, options: [:]) { results.append($0) }
			let buttons = parent.attachedSheet!.contentView!.subviews.compactMap { $0 as? NSButton }
			let host = XplatCameraHost.instances.last!
			return (owner, parent, host, buttons.first { $0.title == "Capture" }!,
				buttons.first { $0.title == "Cancel" }!, { results })
		}
		let (cancelOwner, cancelParent, cancelHost, _, cancel, cancelResults) = make()
		expect(cancelHost.permissionRequests == 0)
		cancel.performClick(nil)
		expect(cancelResults().count == 1 && cancelResults()[0] == nil)
		expect(cancelHost.disposed)
		cancelOwner.dispose()
		expect(cancelResults().count == 1)
		expect(cancelParent.attachedSheet == nil)

		let (deniedOwner, deniedParent, deniedHost, deniedCapture, _, deniedResults) = make()
		deniedCapture.performClick(nil)
		expect(deniedHost.permissionRequests == 1)
		deniedHost.permissionReply?("denied")
		expect(deniedResults().count == 1 && deniedResults()[0] == nil)
		expect(deniedHost.disposed && deniedParent.attachedSheet == nil)

		let (lateOwner, lateParent, lateHost, lateCapture, lateCancel, lateResults) = make()
		lateCapture.performClick(nil)
		lateCancel.performClick(nil)
		lateHost.permissionReply?("granted")
		expect(lateHost.configuration == nil)
		expect(lateResults().count == 1 && lateParent.attachedSheet == nil)
		lateOwner.dispose()

		let (busyOwner, busyParent, busyHost, busyCapture, _, busyResults) = make()
		busyHost.failure = "busy"
		busyCapture.performClick(nil)
		busyHost.permissionReply?("granted")
		wait { !busyResults().isEmpty }
		expect(busyResults()[0] == nil && busyHost.disposed && busyParent.attachedSheet == nil)
		busyOwner.dispose()

		let (closeOwner, closeParent, closeHost, _, _, closeResults) = make()
		NotificationCenter.default.post(name: NSWindow.willCloseNotification, object: closeParent)
		expect(closeResults().count == 1 && closeHost.disposed)
		closeOwner.dispose()

		let (timeoutOwner, timeoutParent, timeoutHost, timeoutCapture, _, timeoutResults) = make()
		timeoutOwner.operationTimeout = 0.02
		timeoutCapture.performClick(nil)
		wait { !timeoutResults().isEmpty }
		expect(timeoutResults()[0] == nil && timeoutHost.disposed && timeoutParent.attachedSheet == nil)
		timeoutHost.permissionReply?("granted")
		expect(timeoutHost.configuration == nil)

		let (captureCancelOwner, captureCancelParent, captureCancelHost, captureCancelButton, captureCancel, captureCancelResults) = make()
		captureCancelButton.performClick(nil)
		captureCancelHost.permissionReply?("granted")
		wait { captureCancelHost.observer != nil }
		captureCancelHost.observer?("{\"type\":\"previewReady\",\"ready\":true}")
		captureCancelButton.performClick(nil)
		captureCancel.performClick(nil)
		captureCancelHost.photoReply?(NSData())
		expect(captureCancelResults().count == 1 && captureCancelResults()[0] == nil)
		expect(captureCancelHost.disposed && captureCancelParent.attachedSheet == nil)
		captureCancelOwner.dispose()

		let (photoOwner, photoParent, photoHost, capture, _, photoResults) = make()
		capture.performClick(nil)
		photoHost.permissionReply?("granted")
		wait { photoHost.observer != nil }
		expect(photoHost.configuration?["audio"] as? Bool == false)
		expect(photoHost.configuration?["photo"] as? Bool == true)
		photoHost.observer?("{\"type\":\"previewReady\",\"ready\":true}")
		capture.performClick(nil)
		expect(photoHost.photoReply != nil)
		let bitmap = NSBitmapImageRep(bitmapDataPlanes: nil, pixelsWide: 2, pixelsHigh: 2,
			bitsPerSample: 8, samplesPerPixel: 4, hasAlpha: true, isPlanar: false,
			colorSpaceName: .deviceRGB, bytesPerRow: 0, bitsPerPixel: 0)!
		let data = bitmap.representation(using: .jpeg, properties: [:])!
		photoHost.photoReply?(data as NSData)
		expect(photoResults().count == 1 && photoHost.disposed && photoParent.attachedSheet == nil)
		deniedOwner.dispose()
		let result = try! JSONSerialization.jsonObject(with: photoResults()[0]!.data(using: .utf8)!) as! [String: String]
		expect(result["dataUrl"]!.hasPrefix("data:image/jpeg;base64,"))
		expect(FileManager.default.fileExists(atPath: result["uri"]!))
		photoOwner.discard(result["uri"]!)
		expect(!FileManager.default.fileExists(atPath: result["uri"]!))
		photoHost.photoReply?(data as NSData)
		expect(photoResults().count == 1)
		print("PASS \(checks) AppKit photo sheet assertions (injected camera, no OS input or hardware)")
	}
}
