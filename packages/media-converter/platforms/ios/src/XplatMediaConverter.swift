import Foundation
import AVFoundation
import ImageIO
import CoreGraphics
import CoreVideo
import CoreMedia

@objc(XplatMediaConverter)
@objcMembers
public final class XplatMediaConverter: NSObject {
    private let lock = NSLock()
    private var cancelled = Set<String>()
    private var active = Set<String>()
    public func cancel(_ id: String) {
        lock.lock(); defer { lock.unlock() }
        if active.contains(id) { cancelled.insert(id) }
    }
    private func isCancelled(_ id: String) -> Bool {
        lock.lock(); defer { lock.unlock() }; return cancelled.contains(id)
    }
    private func check(_ id: String) throws {
        if isCancelled(id) { throw NSError(domain: "AbortError", code: 1) }
    }
    private func send(_ value: [String: Any], _ callback: @escaping (String) -> Void) {
        let text = String(data: try! JSONSerialization.data(withJSONObject: value), encoding: .utf8)!
        DispatchQueue.main.async { callback(text) }
    }
    public func start(_ json: String, callback: @escaping (String) -> Void) {
        guard let data = json.data(using: .utf8),
              let request = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
              let id = request["id"] as? String else {
            send(["error": "Invalid conversion request"], callback); return
        }
        lock.lock(); active.insert(id); lock.unlock()
        DispatchQueue.global(qos: .userInitiated).async {
            do { self.send(["result": try self.convert(request, id: id, callback: callback)], callback) }
            catch { self.send(["error": error.localizedDescription, "cancelled": (error as NSError).domain == "AbortError"], callback) }
            self.lock.lock(); self.active.remove(id); self.cancelled.remove(id); self.lock.unlock()
        }
    }
    public func remove(_ uri: String) -> Bool {
        guard let url = URL(string: uri), url.isFileURL,
              url.deletingLastPathComponent().standardizedFileURL == FileManager.default.temporaryDirectory.standardizedFileURL,
              url.lastPathComponent.hasPrefix("xplat-video-") else { return false }
        do { if FileManager.default.fileExists(atPath: url.path) { try FileManager.default.removeItem(at: url) }; return true }
        catch { return false }
    }
    private func convert(_ request: [String: Any], id: String, callback: @escaping (String) -> Void) throws -> [String: Any] {
        func invalid(_ message: String) -> NSError { NSError(domain: "MediaConverter", code: 1, userInfo: [NSLocalizedDescriptionKey: message]) }
        guard request["format"] as? String == "mp4", let uri = request["source"] as? String else { throw invalid("Only GIF to MP4 is available on Apple hosts") }
        let url = uri.hasPrefix("/") ? URL(fileURLWithPath: uri) : URL(string: uri)
        guard let url = url, url.isFileURL else { throw invalid("GIF source must be an absolute file path or file URL") }
        let attrs = try FileManager.default.attributesOfItem(atPath: url.path)
        guard (attrs[.size] as? NSNumber)?.intValue ?? Int.max <= 64 * 1024 * 1024 else { throw invalid("GIF exceeds 64 MiB") }
        guard let source = CGImageSourceCreateWithURL(url as CFURL, nil),
              CGImageSourceGetType(source) as String? == "com.compuserve.gif" else { throw invalid("Source must be a decodable GIF") }
        let count = CGImageSourceGetCount(source)
        guard count > 0, count <= 1000,
              let properties = CGImageSourceCopyPropertiesAtIndex(source, 0, nil) as? [CFString: Any],
              let rawWidth = properties[kCGImagePropertyPixelWidth] as? Int,
              let rawHeight = properties[kCGImagePropertyPixelHeight] as? Int,
              rawWidth > 0, rawHeight > 0, rawWidth * rawHeight <= 4_194_304 else { throw invalid("GIF must have 1–1000 frames and at most 4194304 pixels") }
        var delays: [Int64] = []
        for index in 0..<count {
            let props = CGImageSourceCopyPropertiesAtIndex(source, index, nil) as? [CFString: Any]
            let gif = props?[kCGImagePropertyGIFDictionary] as? [CFString: Any]
            let seconds = (gif?[kCGImagePropertyGIFUnclampedDelayTime] as? Double) ?? (gif?[kCGImagePropertyGIFDelayTime] as? Double) ?? 0
            delays.append(seconds > 0 ? max(10, Int64((seconds * 1000).rounded())) : 100)
        }
        let duration = delays.reduce(0, +)
        guard duration <= 60_000 else { throw invalid("GIF traversal exceeds 60 seconds") }
        let width = rawWidth + rawWidth % 2, height = rawHeight + rawHeight % 2
        let output = FileManager.default.temporaryDirectory.appendingPathComponent("xplat-video-\(UUID().uuidString).mp4")
        let writer = try AVAssetWriter(outputURL: output, fileType: .mp4)
        writer.movieTimeScale = 1000
        let settings: [String: Any] = [AVVideoCodecKey: AVVideoCodecType.h264, AVVideoWidthKey: width, AVVideoHeightKey: height,
            AVVideoCompressionPropertiesKey: [AVVideoAverageBitRateKey: request["bitrate"] as? Int ?? 2_000_000]]
        guard writer.canApply(outputSettings: settings, forMediaType: .video) else { throw invalid("H.264 encoder does not support these dimensions") }
        let input = AVAssetWriterInput(mediaType: .video, outputSettings: settings)
        input.mediaTimeScale = 1000
        let adapter = AVAssetWriterInputPixelBufferAdaptor(assetWriterInput: input, sourcePixelBufferAttributes: [
            kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32ARGB,
            kCVPixelBufferWidthKey as String: width, kCVPixelBufferHeightKey as String: height,
            kCVPixelBufferCGImageCompatibilityKey as String: true,
            kCVPixelBufferCGBitmapContextCompatibilityKey as String: true])
        guard writer.canAdd(input) else { throw invalid("Could not add video track") }
        writer.add(input)
        let rgb = UInt32((request["backgroundColor"] as? String ?? "#000000").dropFirst(), radix: 16) ?? 0
        var succeeded = false
        defer { if !succeeded { writer.cancelWriting(); try? FileManager.default.removeItem(at: output) } }
        try check(id)
        guard writer.startWriting() else { throw writer.error ?? invalid("Could not start video encoding") }
        writer.startSession(atSourceTime: .zero)
        var time: Int64 = 0
        for index in 0..<count {
            try autoreleasepool {
                try check(id)
                let deadline = Date().addingTimeInterval(30)
                while !input.isReadyForMoreMediaData {
                    try check(id)
                    if writer.status == .failed || Date() > deadline { throw writer.error ?? invalid("Video encoder timed out") }
                    Thread.sleep(forTimeInterval: 0.001)
                }
                guard let image = CGImageSourceCreateImageAtIndex(source, index, nil), let pool = adapter.pixelBufferPool else { throw invalid("Could not decode a GIF frame") }
                var pixel: CVPixelBuffer?
                guard CVPixelBufferPoolCreatePixelBuffer(nil, pool, &pixel) == kCVReturnSuccess, let pixel = pixel else { throw invalid("Could not allocate frame pixels") }
                CVPixelBufferLockBaseAddress(pixel, [])
                defer { CVPixelBufferUnlockBaseAddress(pixel, []) }
                let color = CGColorSpaceCreateDeviceRGB()
                guard let context = CGContext(data: CVPixelBufferGetBaseAddress(pixel), width: width, height: height, bitsPerComponent: 8,
                    bytesPerRow: CVPixelBufferGetBytesPerRow(pixel), space: color,
                    bitmapInfo: CGImageAlphaInfo.noneSkipFirst.rawValue) else { throw invalid("Could not draw a video frame") }
                context.setFillColor(red: CGFloat((rgb >> 16) & 255) / 255, green: CGFloat((rgb >> 8) & 255) / 255, blue: CGFloat(rgb & 255) / 255, alpha: 1)
                context.fill(CGRect(x: 0, y: 0, width: width, height: height))
                context.draw(image, in: CGRect(x: 0, y: height - rawHeight, width: rawWidth, height: rawHeight))
                guard adapter.append(pixel, withPresentationTime: CMTime(value: time, timescale: 1000)) else { throw writer.error ?? invalid("Could not append video frame") }
            }
            time += delays[index]
            send(["progress": Double(index + 1) / Double(count)], callback)
        }
        writer.endSession(atSourceTime: CMTime(value: duration, timescale: 1000))
        input.markAsFinished()
        let done = DispatchSemaphore(value: 0)
        writer.finishWriting { done.signal() }
        guard done.wait(timeout: .now() + 60) == .success else { throw invalid("Video finalization timed out") }
        try check(id)
        guard writer.status == .completed else { throw writer.error ?? invalid("Video encoding failed") }
        succeeded = true
        return ["uri": output.absoluteString, "width": width, "height": height, "duration": duration, "mimeType": "video/mp4"]
    }
}
