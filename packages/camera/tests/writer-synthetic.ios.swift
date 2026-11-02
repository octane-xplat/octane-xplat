// Appended to the maintained writer by ios-writer-simulator.mjs, so private
// test access never ships in the framework or crosses the NativeScript bridge.
import AudioToolbox

extension XplatSwitchingMovieWriter {
	func syntheticReady() { queue.sync { sourcePrepared = true; setSourceReady(true) } }
	func syntheticSample(_ sample: CMSampleBuffer, video: Bool) {
		queue.sync {
			if video {
				guard sourcePrepared else { return }
				setSourceReady(true); restoringPreview = false
			}
			consume(sample, isVideo: video)
		}
	}
	func syntheticGap(_ reply: @escaping (String?) -> Void) {
		queue.sync {
			switchEpoch += 1; switching = true; switchReply = reply
			sourcePrepared = false; expectedCameraID = "generated"; setSourceReady(false)
		}
	}
	func syntheticResume() { queue.sync { sourcePrepared = true } }
}

func require(_ condition: @autoclosure () -> Bool, _ message: String) throws {
	if !condition() { throw NSError(domain: "SyntheticWriterTest", code: 1, userInfo: [NSLocalizedDescriptionKey: message]) }
}
func pump(_ seconds: Double) { RunLoop.main.run(until: Date(timeIntervalSinceNow: seconds)) }
func waitFor(_ message: String, _ condition: () -> Bool) throws {
	let deadline = Date(timeIntervalSinceNow: 12)
	while !condition() && Date() < deadline { pump(0.01) }
	try require(condition(), message)
}
func videoSample(_ tick: Int, alternate: Bool) throws -> CMSampleBuffer {
	var pixel: CVPixelBuffer?
	let width = alternate ? 480 : 240, height = alternate ? 640 : 320
	try require(CVPixelBufferCreate(nil, width, height, kCVPixelFormatType_32BGRA,
		[kCVPixelBufferIOSurfacePropertiesKey: [:]] as CFDictionary, &pixel) == kCVReturnSuccess, "Allocate generated frame")
	let buffer = pixel!
	// Generate bytes, never inspect pixels. Tests examine encoded timing only.
	CVPixelBufferLockBaseAddress(buffer, [])
	memset(CVPixelBufferGetBaseAddress(buffer), alternate ? 96 : 32, CVPixelBufferGetDataSize(buffer))
	CVPixelBufferUnlockBaseAddress(buffer, [])
	var format: CMVideoFormatDescription?
	try require(CMVideoFormatDescriptionCreateForImageBuffer(allocator: nil, imageBuffer: buffer, formatDescriptionOut: &format) == noErr, "Video description")
	var timing = CMSampleTimingInfo(duration: CMTime(value: 1024, timescale: 48000), presentationTimeStamp: CMTime(value: Int64(480000 + tick * 1024), timescale: 48000), decodeTimeStamp: .invalid)
	var sample: CMSampleBuffer?
	try require(CMSampleBufferCreateReadyWithImageBuffer(allocator: nil, imageBuffer: buffer, formatDescription: format!, sampleTiming: &timing, sampleBufferOut: &sample) == noErr, "Video sample")
	return sample!
}
func audioSample(_ tick: Int) throws -> CMSampleBuffer {
	var description = AudioStreamBasicDescription(mSampleRate: 48000, mFormatID: kAudioFormatLinearPCM,
		mFormatFlags: kAudioFormatFlagIsFloat | kAudioFormatFlagIsPacked, mBytesPerPacket: 4,
		mFramesPerPacket: 1, mBytesPerFrame: 4, mChannelsPerFrame: 1, mBitsPerChannel: 32, mReserved: 0)
	var format: CMAudioFormatDescription?
	try require(CMAudioFormatDescriptionCreate(allocator: nil, asbd: &description, layoutSize: 0, layout: nil, magicCookieSize: 0, magicCookie: nil, extensions: nil, formatDescriptionOut: &format) == noErr, "Audio description")
	var block: CMBlockBuffer?
	try require(CMBlockBufferCreateWithMemoryBlock(allocator: nil, memoryBlock: nil, blockLength: 4096, blockAllocator: nil, customBlockSource: nil, offsetToData: 0, dataLength: 4096, flags: 0, blockBufferOut: &block) == noErr, "Audio allocation")
	let samples: [Float] = (0..<1024).map { index in Float(sin(Double(tick * 1024 + index) * 2 * .pi * 440 / 48000) * 0.1) }
	try samples.withUnsafeBytes { data in
		try require(CMBlockBufferReplaceDataBytes(with: data.baseAddress!, blockBuffer: block!, offsetIntoDestination: 0, dataLength: data.count) == noErr, "Fill generated audio")
	}
	var timing = CMSampleTimingInfo(duration: CMTime(value: 1, timescale: 48000), presentationTimeStamp: CMTime(value: Int64(480000 + tick * 1024), timescale: 48000), decodeTimeStamp: .invalid)
	var sample: CMSampleBuffer?
	try require(CMSampleBufferCreateReady(allocator: nil, dataBuffer: block, formatDescription: format!, sampleCount: 1024, sampleTimingEntryCount: 1, sampleTimingArray: &timing, sampleSizeEntryCount: 0, sampleSizeArray: nil, sampleBufferOut: &sample) == noErr, "Audio sample")
	return sample!
}
func inspect(_ url: URL, audio: Bool) throws -> [[String: Any]] {
	let asset = AVURLAsset(url: url)
	let tracks = asset.tracks
	try require(tracks.filter { $0.mediaType == .video }.count == 1, "One video track")
	try require(tracks.filter { $0.mediaType == .audio }.count == (audio ? 1 : 0), "Expected audio tracks")
	var result: [[String: Any]] = []
	for track in tracks {
		let reader = try AVAssetReader(asset: asset)
		let output = AVAssetReaderTrackOutput(track: track, outputSettings: nil) // compressed packets; no image decoding
		reader.add(output)
		try require(reader.startReading(), "Start compressed packet reader")
		var first: Double?, last: Double?
		var gap = 0.0, count = 0, emptyMarkers = 0
		while let sample = output.copyNextSampleBuffer() {
			// AVAssetReader also returns zero-sample, zero-byte track markers.
			// Count them separately: they contain no encoded media packet.
			if CMSampleBufferGetNumSamples(sample) == 0 {
				try require(CMSampleBufferGetTotalSampleSize(sample) == 0, "Empty marker carries no media bytes")
				emptyMarkers += 1; continue
			}
			// A compressed audio buffer may batch many encoded packets.
			for index in 0..<CMSampleBufferGetNumSamples(sample) {
				var timing = CMSampleTimingInfo()
				try require(CMSampleBufferGetSampleTimingInfo(sample, at: index, timingInfoOut: &timing) == noErr, "Read per-packet timing")
				let stamp = timing.presentationTimeStamp
				let time = CMTimeGetSeconds(stamp)
				try require(stamp.isValid && time.isFinite, "Valid encoded presentation timestamp")
				if first == nil { first = time }
				if let last {
					try require(time > last, "Strictly increasing \(track.mediaType.rawValue) timestamps at packet \(count): \(last) -> \(time)")
					gap = max(gap, time - last)
				}
				last = time; count += 1
			}
		}
		try require(reader.status == .completed, "Reader completes without errors")
		try require(count > 5, "Nonempty encoded track")
		try require(gap < 0.15, "No encoded packet gap above 150 ms")
		if track.mediaType == .video { try require(track.naturalSize == CGSize(width: 240, height: 320), "Fixed output dimensions across replacement") }
		result.append(["type": track.mediaType.rawValue, "first": first!, "last": last!, "maxGap": gap, "packets": count, "emptyMarkers": emptyMarkers])
	}
	if audio { try require(abs((result[0]["last"] as! Double) - (result[1]["last"] as! Double)) < 0.15, "Audio/video endpoints aligned") }
	return result
}

let directory = FileManager.default.temporaryDirectory.appendingPathComponent("octane-generated-writer-\(UUID().uuidString)")
var evidence: [[String: Any]] = []
do {
	try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
	let writer = XplatSwitchingMovieWriter()
	writer.syntheticReady()
	for scenario in ["switch", "cancel", "limit"] {
		let url = directory.appendingPathComponent("\(scenario).mov")
		var events: [(String, String)] = []
		var replies: [String?] = []
		var submittedAudio = 0
		writer.start(url.path, audio: true, orientation: 1, maximumDurationMs: scenario == "limit" ? 600 : 0) { events.append(($0, $1)) }
		pump(0.03)
		for tick in 0..<85 {
			if tick == 24 && scenario != "limit" { writer.syntheticGap { replies.append($0) } }
			if scenario == "cancel" && tick == 36 { writer.cancelSwitch(); writer.stop(); writer.stop(); break }
			if tick == 48 && scenario == "switch" { writer.syntheticResume() }
			if tick < 24 || (tick >= 48 && scenario == "switch") || scenario == "limit" {
				writer.syntheticSample(try videoSample(tick, alternate: tick >= 48), video: true)
			}
			writer.syntheticSample(try audioSample(tick), video: false)
			submittedAudio += 1
			pump(1024.0 / 48000)
			if scenario == "switch", replies.count == 1 { writer.confirmSwitch("generated") }
			if events.contains(where: { $0.0 == "finished" || $0.0 == "failed" }) { break }
		}
		let elapsed = writer.elapsedMs()
		writer.stop(); writer.stop()
		try waitFor("Terminal callback", { events.contains { $0.0 == "finished" || $0.0 == "failed" } })
		pump(0.05)
		try require(events.filter { $0.0 == "finished" || $0.0 == "failed" }.count == 1, "Exactly one terminal callback")
		try require(events.filter { $0.0 == "started" }.count == 1, "Exactly one start")
		guard let finished = events.first(where: { $0.0 == "finished" }) else { throw NSError(domain: "WriterFailure", code: 1, userInfo: [NSLocalizedDescriptionKey: "\(events)"]) }
		let summary = try JSONSerialization.jsonObject(with: Data(finished.1.utf8)) as! [String: Any]
		try require((summary["warning"] as? String) == "", "No writer warnings")
		try require((summary["audioBuffers"] as! Int) == submittedAudio, "Every generated audio buffer was accepted")
		try require(abs(elapsed - Double(submittedAudio) * 1024 / 48) < 1, "Elapsed time includes audio during source gap")
		if scenario != "limit" {
			try require((summary["heldFrames"] as! Int) > 4, "Writer submits retained frames during source gap")
			try require(replies.count == 1, "Exactly one switch reply")
			try require((replies[0] == nil) == (scenario == "switch"), "Switch/cancellation reply")
		} else { try require(events.filter { $0.0 == "limit" }.count == 1, "Exactly one duration limit event") }
		evidence.append(["scenario": scenario, "elapsedMs": elapsed, "summary": summary, "tracks": try inspect(url, audio: true)])
		writer.syntheticReady()
	}
	var releases = 0
	writer.releaseWithReply { releases += 1 }; writer.releaseWithReply { releases += 1 }
	try waitFor("Joined release callbacks", { releases == 2 })
	print("IOS_WRITER_RESULT=" + String(data: try JSONSerialization.data(withJSONObject: ["passed": true, "cases": evidence]), encoding: .utf8)!)
	try FileManager.default.removeItem(at: directory)
	exit(0)
} catch {
	print("IOS_WRITER_RESULT=\(error)")
	try? FileManager.default.removeItem(at: directory)
	exit(1)
}
