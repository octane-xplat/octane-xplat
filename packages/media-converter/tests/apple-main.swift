import Foundation
import AVFoundation
import CoreVideo

let engine = XplatMediaConverter()
let source = CommandLine.arguments[1]
var complete = false
var failure: String?
var output: String?
let request: [String: Any] = ["id": "fixture", "source": source, "format": "mp4", "backgroundColor": "#000000", "bitrate": 2_000_000]
let json = String(data: try JSONSerialization.data(withJSONObject: request), encoding: .utf8)!
engine.start(json) { text in
    do {
        let event = try JSONSerialization.jsonObject(with: text.data(using: .utf8)!) as! [String: Any]
        if let error = event["error"] as? String { failure = error; complete = true }
        if let result = event["result"] as? [String: Any] {
            output = result["uri"] as? String
            precondition(result["duration"] as? Int == 600)
            precondition(result["width"] as? Int == 16 && result["height"] as? Int == 16)
            complete = true
        }
    } catch { failure = error.localizedDescription; complete = true }
}
let deadline = Date().addingTimeInterval(60)
while !complete && Date() < deadline { RunLoop.main.run(until: Date().addingTimeInterval(0.01)) }
precondition(complete && failure == nil, failure ?? "Conversion timed out")
let url = URL(string: output!)!
let asset = AVURLAsset(url: url)
precondition(abs(CMTimeGetSeconds(asset.duration) - 0.6) < 0.03)
let reader = try AVAssetReader(asset: asset)
let track = asset.tracks(withMediaType: .video).first!
let samples = AVAssetReaderTrackOutput(track: track, outputSettings: [kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32BGRA])
reader.add(samples); precondition(reader.startReading())
var times: [Double] = []
while let sample = samples.copyNextSampleBuffer() {
    let time = CMTimeGetSeconds(CMSampleBufferGetPresentationTimeStamp(sample)); times.append(time)
    let pixel = CMSampleBufferGetImageBuffer(sample)!
    CVPixelBufferLockBaseAddress(pixel, .readOnly)
    let ptr = CVPixelBufferGetBaseAddress(pixel)!.assumingMemoryBound(to: UInt8.self)
    let red = ptr[2], blue = ptr[0]
    precondition(time < 0.4 ? red > 180 && blue < 80 : blue > 180 && red < 80, "Wrong composited frame at \(time): r=\(red), b=\(blue)")
    CVPixelBufferUnlockBaseAddress(pixel, .readOnly)
}
precondition(times.count == 3 && abs(times[1] - 0.1) < 0.01 && abs(times[2] - 0.4) < 0.01)
precondition(!engine.remove(URL(fileURLWithPath: source).absoluteString))
precondition(engine.remove(output!) && engine.remove(output!))
var aborted = false
var cancelRequest = request; cancelRequest["id"] = "cancel"
engine.start(String(data: try JSONSerialization.data(withJSONObject: cancelRequest), encoding: .utf8)!) { text in
    let event = try! JSONSerialization.jsonObject(with: text.data(using: .utf8)!) as! [String: Any]
    if event["error"] != nil { precondition(event["cancelled"] as? Bool == true); aborted = true }
}
engine.cancel("cancel")
while !aborted && Date() < deadline { RunLoop.main.run(until: Date().addingTimeInterval(0.01)) }
precondition(aborted)
print("APPLE_CONVERTER_OK timing,pixels,transparency,cancellation,ownership")
