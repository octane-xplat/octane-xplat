import Foundation
import Pulsar

@objcMembers
public final class XplatPulsarBridge: NSObject {
	private let pulsar = Pulsar()
	private lazy var realtime = pulsar.getRealtimeComposer()

	public func isSupported() -> Bool { pulsar.isHapticsSupported() }

	public func playPreset(_ name: String) -> Bool {
		guard let preset = pulsar.getPresets().getByName(name) else { return false }
		preset.play()
		return true
	}

	public func playPattern(_ json: String) -> Bool {
		guard let data = json.data(using: .utf8),
			let pattern = try? JSONDecoder().decode(InputPattern.self, from: data)
		else { return false }
		let points = pattern.points
		let amplitude = points.map { ValuePoint(time: $0.at, value: Float(max(0, min(1, $0.intensity)))) }
		let frequency = points.map { ValuePoint(time: $0.at, value: Float(max(0, min(1, $0.sharpness ?? 0.5)))) }
		let patternData = PatternData(continuousPattern: ContinuousPattern(amplitude: amplitude, frequency: frequency), discretePattern: [])
		pulsar.getPatternComposer().playPattern(hapticsData: patternData)
		return true
	}

	public func startRealtime(_ intensity: Float, sharpness: Float) { realtime.set(amplitude: intensity, frequency: sharpness) }
	public func setRealtime(_ intensity: Float, _ sharpness: Float) { realtime.set(amplitude: intensity, frequency: sharpness) }
	public func stopRealtime() { realtime.stop() }
	public func stop() { pulsar.stopHaptics() }
}

private struct InputPattern: Decodable {
	let duration: Double
	let points: [InputPoint]
}

private struct InputPoint: Decodable {
	let at: Double
	let intensity: Double
	let sharpness: Double?
}
