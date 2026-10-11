import Foundation

@main struct PhotoLifecycleTests {
	static func main() {
		var checks = 0
		func expect(_ condition: @autoclosure () -> Bool) { precondition(condition()); checks += 1 }
		for exit in ["cancel", "denied", "no camera", "busy", "timeout", "close", "dispose"] {
			let state = PhotoCaptureLifecycle()
			var releases = 0
			state.finished = { releases += 1 }
			expect(state.capture() == nil)
			let token = state.prepare()!
			expect(state.prepare() == nil)
			expect(state.finish())
			expect(!state.finish())
			expect(releases == 1)
			expect(!state.accepts(token))
			expect(!state.ready(token))
			expect(state.capture() == nil)
			print("PASS \(exit): settles once, releases once, rejects late permission/preview")
		}
		let state = PhotoCaptureLifecycle()
		let token = state.prepare()!
		expect(state.ready(token))
		expect(!state.ready(token))
		expect(state.capture() == token)
		expect(state.capture() == nil)
		expect(state.finish())
		expect(!state.accepts(token))
		let a = NSObject(), b = NSObject()
		expect(CameraOwnership.claim("test-camera", owner: a))
		expect(!CameraOwnership.claim("test-camera", owner: b))
		CameraOwnership.release("test-camera", owner: b)
		expect(!CameraOwnership.claim("test-camera", owner: b))
		CameraOwnership.release("test-camera", owner: a)
		expect(CameraOwnership.claim("test-camera", owner: b))
		CameraOwnership.release("test-camera", owner: b)
		print("PASS \(checks) deterministic lifecycle and shared ownership checks")
	}
}
