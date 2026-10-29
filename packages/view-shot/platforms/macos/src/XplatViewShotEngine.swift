import Foundation
import QuartzCore
import AppKit

@objc(XplatViewShotEngine)
@objcMembers
public final class XplatViewShotEngine: NSObject {
    private static var owned: [String: URL] = [:]

    private func reply(_ value: [String: Any]) -> String {
        guard let data = try? JSONSerialization.data(withJSONObject: value),
              let text = String(data: data, encoding: .utf8) else {
            return "{\"error\":\"Could not serialize capture result\"}"
        }
        return text
    }
    private func protectedLayer(_ layer: CALayer) -> Bool {
        for name in ["AVPlayerLayer", "CAMetalLayer", "CAOpenGLLayer"] {
            if let type = NSClassFromString(name), layer.isKind(of: type) { return true }
        }
        return layer.sublayers?.contains { protectedLayer($0) } ?? false
    }
    private func protectedSurface(_ view: NSView) -> Bool {
        for name in ["WKWebView", "NSOpenGLView", "MTKView", "AVPlayerView"] {
            if let type = NSClassFromString(name), view.isKind(of: type) { return true }
        }
        if let layer = view.layer, protectedLayer(layer) { return true }
        return view.subviews.contains { protectedSurface($0) }
    }
    public func validate(_ view: NSView) -> String? {
        guard Thread.isMainThread else { return "View capture requires the main thread" }
        guard view.window != nil else { return "View is detached" }
        guard view.bounds.width.isFinite, view.bounds.height.isFinite,
              view.bounds.width > 0, view.bounds.height > 0 else { return "View has no laid-out area" }
        guard !protectedSurface(view) else { return "Web/video/GPU surfaces are outside this capture subset" }
        return nil
    }
    public func capture(_ json: String, view: NSView) -> String {
        if let failure = validate(view) { return reply(["error": failure]) }
        guard let bytes = json.data(using: .utf8),
              let options = (try? JSONSerialization.jsonObject(with: bytes)) as? [String: Any],
              let format = options["format"] as? String, ["png", "jpg"].contains(format),
              let result = options["result"] as? String, ["tmpfile", "base64", "data-uri"].contains(result),
              let quality = options["quality"] as? Double, quality.isFinite, quality >= 0, quality <= 1,
              (options["snapshotContentContainer"] as? Bool) != true,
              (options["handleGLSurfaceViewOnAndroid"] as? Bool) != true,
              (options["useRenderInContext"] as? Bool) != true,
              options["fileName"] == nil else { return reply(["error": "Unsupported AppKit capture options"]) }
        let scale = view.window?.backingScaleFactor ?? 1
        let sourceWidth = ceil(view.bounds.width * scale), sourceHeight = ceil(view.bounds.height * scale)
        let width = (options["width"] as? Double).map { CGFloat($0) } ?? sourceWidth
        let height = (options["height"] as? Double).map { CGFloat($0) } ?? sourceHeight
        guard sourceWidth > 0, sourceHeight > 0, sourceWidth <= 16384, sourceHeight <= 16384,
              sourceWidth * sourceHeight <= 32000000,
              width.isFinite, height.isFinite, width.rounded() == width, height.rounded() == height,
              width > 0, height > 0, width <= 16384, height <= 16384, width * height <= 32000000 else {
            return reply(["error": "Capture dimensions exceed the bitmap limit"])
        }
        guard let source = view.bitmapImageRepForCachingDisplay(in: view.bounds) else {
            return reply(["error": "AppKit could not allocate the view cache"])
        }
        view.cacheDisplay(in: view.bounds, to: source)
        guard let output = NSBitmapImageRep(bitmapDataPlanes: nil, pixelsWide: Int(width), pixelsHigh: Int(height), bitsPerSample: 8, samplesPerPixel: 4, hasAlpha: true, isPlanar: false, colorSpaceName: .deviceRGB, bytesPerRow: 0, bitsPerPixel: 0),
              let context = NSGraphicsContext(bitmapImageRep: output) else {
            return reply(["error": "AppKit could not allocate the output bitmap"])
        }
        let image = NSImage(size: view.bounds.size)
        image.addRepresentation(source)
        NSGraphicsContext.saveGraphicsState()
        NSGraphicsContext.current = context
        context.imageInterpolation = .high
        let target = NSRect(x: 0, y: 0, width: width, height: height)
        (format == "jpg" ? NSColor.white : NSColor.clear).setFill()
        target.fill()
        image.draw(in: target, from: .zero, operation: .sourceOver, fraction: 1, respectFlipped: true, hints: nil)
        context.flushGraphics()
        NSGraphicsContext.restoreGraphicsState()
        guard let encoded = output.representation(using: format == "png" ? .png : .jpeg, properties: [.compressionFactor: quality]) else {
            return reply(["error": "AppKit could not encode the capture"])
        }
        if result == "tmpfile" {
            let file = FileManager.default.temporaryDirectory.appendingPathComponent("octane-view-shot-" + UUID().uuidString + "." + format)
            do {
                try encoded.write(to: file, options: .atomic)
                XplatViewShotEngine.owned[file.absoluteString] = file
                return reply(["uri": file.absoluteString])
            } catch { return reply(["error": "Could not write the temporary capture"]) }
        }
        let base64 = encoded.base64EncodedString()
        return reply(["uri": result == "data-uri" ? "data:image/" + (format == "jpg" ? "jpeg" : "png") + ";base64," + base64 : base64])
    }
    public func remove(_ uri: String) -> Bool {
        guard Thread.isMainThread else { return false }
        guard let file = XplatViewShotEngine.owned[uri] else { return true }
        do {
            if FileManager.default.fileExists(atPath: file.path) { try FileManager.default.removeItem(at: file) }
            XplatViewShotEngine.owned.removeValue(forKey: uri)
            return true
        } catch { return false }
    }
}
