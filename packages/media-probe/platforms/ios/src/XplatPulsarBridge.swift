import Foundation
import Pulsar

@objcMembers
public final class XplatPulsarBridge: NSObject {
	private let pulsar: Pulsar
	private let realtime: RealtimeComposer

	public override init() {
		let instance = Pulsar()
		pulsar = instance
		realtime = instance.getRealtimeComposer()
		super.init()
	}

	public func playPreset() {
		pulsar.getPresets().getByName("Success")?.play()
	}

	public func playCustomPattern() {
		let data = PatternData(
			continuousPattern: ContinuousPattern(
				amplitude: [
					ValuePoint(time: 0, value: 0),
					ValuePoint(time: 90, value: 0.8),
					ValuePoint(time: 220, value: 0),
				],
				frequency: [
					ValuePoint(time: 0, value: 0.4),
					ValuePoint(time: 220, value: 0.8),
				],
			),
			discretePattern: [DiscretePoint(time: 35, amplitude: 1, frequency: 0.6)],
		)
		pulsar.getPatternComposer().playPattern(hapticsData: data)
	}

	public func setRealtime(_ amplitude: Float, frequency: Float) {
		realtime.set(amplitude: amplitude, frequency: frequency)
	}

	public func stopRealtime() {
		realtime.stop()
	}
}
