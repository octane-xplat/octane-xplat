import Foundation

/// Fences every asynchronous permission, preview and shutter result.
final class PhotoCaptureLifecycle {
	enum Phase { case idle, preparing, preview, capturing, finished }
	private(set) var phase = Phase.idle
	private(set) var generation = 0
	var finished: (() -> Void)?

	func prepare() -> Int? {
		guard phase == .idle else { return nil }
		phase = .preparing
		return generation
	}
	func ready(_ token: Int) -> Bool {
		guard accepts(token), phase == .preparing else { return false }
		phase = .preview
		return true
	}
	func capture() -> Int? {
		guard phase == .preview else { return nil }
		phase = .capturing
		return generation
	}
	func accepts(_ token: Int) -> Bool { phase != .finished && token == generation }
	@discardableResult func finish() -> Bool {
		guard phase != .finished else { return false }
		phase = .finished
		generation += 1
		finished?()
		finished = nil
		return true
	}
}
