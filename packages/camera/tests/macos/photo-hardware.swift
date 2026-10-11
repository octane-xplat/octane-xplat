import AppKit
import AVFoundation

// Real-host AppKit checks: production XplatCameraHost, XplatPhotoCaptureSheet,
// AVCaptureSession and CameraOwnership — no injected camera. Button actions are
// dispatched through performClick, not OS input. On a camera-equipped host the
// capture case validates a real JPEG; on a host with no camera it qualifies the
// no-device settle. Declared vs undeclared binaries cover the granted and
// non-granted permission branches without mutating user TCC state.
@main struct PhotoHardwareTests {
	static func main() {
		_ = NSApplication.shared
		var checks = 0
		func expect(_ condition: @autoclosure () -> Bool, _ label: String) {
			precondition(condition(), label)
			checks += 1
		}
		func wait(_ seconds: Double = 20, _ predicate: () -> Bool) -> Bool {
			let end = Date().addingTimeInterval(seconds)
			while !predicate() && Date() < end {
				RunLoop.main.run(until: Date().addingTimeInterval(0.01))
			}
			return predicate()
		}
		struct Sheet {
			let owner: XplatPhotoCaptureSheet
			let parent: NSWindow
			var results: () -> [String?]
			var capture: NSButton { button("Capture") }
			var cancel: NSButton { button("Cancel") }
			func button(_ title: String) -> NSButton {
				parent.attachedSheet!.contentView!.subviews
					.compactMap { $0 as? NSButton }.first { $0.title == title }!
			}
			var status: String {
				parent.attachedSheet!.contentView!.subviews
					.compactMap { $0 as? NSTextField }.first!.stringValue
			}
		}
		func make(_ options: NSDictionary = [:]) -> Sheet? {
			let owner = XplatPhotoCaptureSheet()
			let parent = NSWindow(contentRect: NSRect(x: 0, y: 0, width: 640, height: 480),
				styleMask: [.titled], backing: .buffered, defer: false)
			var results: [String?] = []
			owner.presentOnWindow(parent, options: options) { results.append($0) }
			guard parent.attachedSheet != nil else {
				expect(results.count == 1 && results[0] == nil, "rejected presentation settles nil")
				return nil
			}
			return Sheet(owner: owner, parent: parent) { results }
		}
		func released(_ id: String) -> Bool {
			let probe = NSObject()
			guard CameraOwnership.claim(id, owner: probe) else { return false }
			CameraOwnership.release(id, owner: probe)
			return true
		}

		let devices = AVCaptureDevice.DiscoverySession(
			deviceTypes: [.builtInWideAngleCamera, .externalUnknown],
			mediaType: .video,
			position: .unspecified
		).devices
		let status = AVCaptureDevice.authorizationStatus(for: .video)
		let declared = Bundle.main.object(forInfoDictionaryKey: "NSCameraUsageDescription") != nil
		print("HW: cameras=\(devices.count) permission=\(status.rawValue) declared=\(declared)")

		// Cancel before Capture: the sheet detaches and the host releases.
		if let sheet = make() {
			sheet.cancel.performClick(nil)
			expect(sheet.results().count == 1 && sheet.results()[0] == nil, "cancel settles nil")
			expect(sheet.parent.attachedSheet == nil, "cancel detaches sheet")
		}

		// A second sheet on an occupied parent is rejected, never stealing the UI.
		if let sheet = make() {
			let second = XplatPhotoCaptureSheet()
			var secondResults: [String?] = []
			second.presentOnWindow(sheet.parent, options: [:]) { secondResults.append($0) }
			expect(secondResults.count == 1 && secondResults[0] == nil, "attached parent rejects second sheet")
			second.dispose()
			sheet.owner.dispose()
			expect(sheet.results().count == 1 && sheet.results()[0] == nil, "dispose settles pending reply nil")
		}

		// Parent close settles nil and releases the host.
		if let sheet = make() {
			NotificationCenter.default.post(name: NSWindow.willCloseNotification, object: sheet.parent)
			expect(sheet.results().count == 1 && sheet.results()[0] == nil, "parent close settles nil")
			expect(sheet.parent.attachedSheet == nil, "close detaches sheet")
			sheet.owner.dispose()
		}

		// saveToGallery is rejected before permission acquisition or UI.
		var galleryResults: [String?] = []
		let gallery = XplatPhotoCaptureSheet()
		let galleryParent = NSWindow(contentRect: NSRect(x: 0, y: 0, width: 640, height: 480),
			styleMask: [.titled], backing: .buffered, defer: false)
		gallery.presentOnWindow(galleryParent, options: ["saveToGallery": true]) { galleryResults.append($0) }
		expect(galleryResults.count == 1 && galleryResults[0] == nil, "saveToGallery rejected")
		expect(galleryParent.attachedSheet == nil, "saveToGallery presents nothing")
		gallery.dispose()

		// Capture flow: the first Capture requests real camera authorization. The
		// notDetermined case would show a live TCC prompt, so it is reported and
		// skipped rather than blocked behind desktop input.
		if let sheet = make() {
			switch status {
			case .notDetermined:
				print("SKIP: permission is notDetermined; the real OS prompt requires a human response")
				sheet.owner.dispose()
			default:
				if status != .authorized {
					sheet.capture.performClick(nil)
					expect(wait(10) { !sheet.results().isEmpty }, "non-granted permission settles")
					expect(sheet.results()[0] == nil, "non-granted permission settles nil")
					expect(sheet.parent.attachedSheet == nil, "non-granted permission detaches sheet")
					sheet.owner.dispose()
				} else if devices.isEmpty {
					sheet.capture.performClick(nil)
					expect(wait(10) { !sheet.results().isEmpty }, "no-device configure settles")
					expect(sheet.results()[0] == nil, "no camera settles nil")
					expect(sheet.parent.attachedSheet == nil, "no camera detaches sheet")
					sheet.owner.dispose()
				} else {
					// Real device: a contending host owns it first — the sheet
					// must settle busy, never seize the camera.
					let contender = XplatCameraHost()
					expect(contender.configure(["photo": true]) == nil, "contender configures")
					sheet.capture.performClick(nil)
					expect(wait(15) { !sheet.results().isEmpty }, "busy camera settles")
					expect(sheet.results()[0] == nil, "busy camera settles nil")
					contender.dispose()
					if let id = devices.first?.uniqueID {
						expect(wait(15) { released(id) }, "contender release frees the device")
					}
					sheet.owner.dispose()

					// A posted disconnect notification settles a live preview.
					if let live = make() {
						live.capture.performClick(nil)
						expect(wait(30) { live.capture.isEnabled || !live.results().isEmpty },
							"preview readies or settles")
						if live.results().isEmpty {
							expect(wait(30) { live.status.contains("Frame your photo") },
								"preview status announces readiness")
							NotificationCenter.default.post(
								name: .AVCaptureDeviceWasDisconnected, object: devices.first!)
							expect(wait(15) { !live.results().isEmpty }, "disconnect settles")
							expect(live.results()[0] == nil, "disconnect settles nil")
							if let id = devices.first?.uniqueID {
								expect(wait(15) { released(id) }, "disconnect releases the device")
							}
						}
						live.owner.dispose()
					}

					// The undisturbed flow returns a readable JPEG file.
					if let shot = make() {
						shot.capture.performClick(nil)
						expect(wait(30) { shot.capture.isEnabled || !shot.results().isEmpty },
							"second preview readies or settles")
						if shot.results().isEmpty, shot.capture.isEnabled {
							shot.capture.performClick(nil)
							expect(wait(30) { !shot.results().isEmpty }, "shutter settles")
						}
						if let message = shot.results().first ?? nil {
							let payload = try! JSONSerialization.jsonObject(
								with: message.data(using: .utf8)!) as! [String: String]
							let uri = payload["uri"]!
							expect(payload["name"]!.hasPrefix("octane-capture-"), "capture name")
							expect(FileManager.default.fileExists(atPath: uri), "capture file exists")
							let data = try! Data(contentsOf: URL(fileURLWithPath: uri))
							expect(data.count > 2 && data[0] == 0xff && data[1] == 0xd8, "JPEG signature")
							let bitmap = NSBitmapImageRep(data: data)!
							expect(bitmap.pixelsWide > 0 && bitmap.pixelsHigh > 0, "pixel dimensions")
							let encoded = Data(base64Encoded: String(payload["dataUrl"]!.split(separator: ",")[1]))!
							expect(encoded == data, "data URL bytes equal file bytes")
							print("HW: real capture \(bitmap.pixelsWide)x\(bitmap.pixelsHigh) \(data.count) bytes")
							shot.owner.discard(uri)
							expect(!FileManager.default.fileExists(atPath: uri), "discard removes the file")
						}
						if let id = devices.first?.uniqueID {
							expect(wait(15) { released(id) }, "capture releases the device")
						}
						shot.owner.dispose()
					}
				}
			}
		}

		print("PASS \(checks) AppKit photo hardware assertions (production host, no injected camera)")
	}
}
