import AVFoundation
import Foundation

// Deterministic AVFoundation WAV finalization; never opens a microphone.
let url = URL(fileURLWithPath: CommandLine.arguments[1])
let settings: [String: Any] = [
	AVFormatIDKey: kAudioFormatLinearPCM,
	AVSampleRateKey: 16000,
	AVNumberOfChannelsKey: 2,
	AVLinearPCMBitDepthKey: 16,
	AVLinearPCMIsBigEndianKey: false,
	AVLinearPCMIsFloatKey: false,
	AVLinearPCMIsNonInterleaved: false,
]
func writeSamples() throws {
	let file = try AVAudioFile(forWriting: url, settings: settings, commonFormat: .pcmFormatInt16, interleaved: true)
	let buffer = AVAudioPCMBuffer(pcmFormat: file.processingFormat, frameCapacity: 160)!
	buffer.frameLength = 160
	let data = buffer.int16ChannelData![0]
	for frame in 0..<160 {
		data[frame * 2] = 8192
		data[frame * 2 + 1] = -8192
	}
	try file.write(from: buffer)
}
try writeSamples() // File closes before the host checks RIFF size and samples.
