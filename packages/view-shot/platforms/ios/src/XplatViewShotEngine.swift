import Foundation
import QuartzCore
import UIKit

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
        for name in ["AVPlayerLayer", "CAMetalLayer", "CAEAGLLayer"] {
            if let type = NSClassFromString(name), layer.isKind(of: type) { return true }
        }
        return layer.sublayers?.contains { protectedLayer($0) } ?? false
    }
    private func protectedSurface(_ view: UIView) -> Bool {
        for name in ["WKWebView", "UIWebView", "MTKView", "GLKView"] {
            if let type = NSClassFromString(name), view.isKind(of: type) { return true }
        }
        if protectedLayer(view.layer) { return true }
        return view.subviews.contains { protectedSurface($0) }
    }
    public func validate(_ view: UIView) -> String? {
        guard Thread.isMainThread else { return "View capture requires the main thread" }
        guard view.window != nil else { return "View is detached" }
        guard view.bounds.width.isFinite, view.bounds.height.isFinite,
              view.bounds.width > 0, view.bounds.height > 0 else { return "View has no laid-out area" }
        guard !protectedSurface(view) else { return "Web/video/GPU surfaces are outside this capture subset" }
        return nil
    }
    public func capture(_ json: String, view: UIView) -> String {
        if let failure = validate(view) { return reply(["error": failure]) }
        guard let bytes = json.data(using: .utf8),
              let options = (try? JSONSerialization.jsonObject(with: bytes)) as? [String: Any],
              let format = options["format"] as? String, ["png", "jpg"].contains(format),
              let result = options["result"] as? String, ["tmpfile", "base64", "data-uri"].contains(result),
              let quality = options["quality"] as? Double, quality.isFinite, quality >= 0, quality <= 1,
              (options["snapshotContentContainer"] as? Bool) != true,
              (options["handleGLSurfaceViewOnAndroid"] as? Bool) != true,
              options["fileName"] == nil else { return reply(["error": "Unsupported iOS capture options"]) }
        let scale = view.window?.screen.scale ?? 1
        let naturalWidth = ceil(view.bounds.width * scale)
        let naturalHeight = ceil(view.bounds.height * scale)
        let width = (options["width"] as? Double).map { CGFloat($0) } ?? naturalWidth
        let height = (options["height"] as? Double).map { CGFloat($0) } ?? naturalHeight
        guard width.isFinite, height.isFinite, width.rounded() == width, height.rounded() == height,
              width > 0, height > 0, width <= 16384, height <= 16384,
              width * height <= 32000000 else { return reply(["error": "Capture dimensions exceed the bitmap limit"]) }
        let settings = UIGraphicsImageRendererFormat.default()
        settings.scale = 1
        settings.opaque = format == "jpg"
        let renderer = UIGraphicsImageRenderer(size: CGSize(width: width, height: height), format: settings)
        var rendered = true
        let image = renderer.image { context in
            if format == "jpg" {
                UIColor.white.setFill()
                context.fill(CGRect(x: 0, y: 0, width: width, height: height))
            }
            context.cgContext.scaleBy(x: width / view.bounds.width, y: height / view.bounds.height)
            context.cgContext.translateBy(x: -view.bounds.minX, y: -view.bounds.minY)
            if (options["useRenderInContext"] as? Bool) == true {
                view.layer.render(in: context.cgContext)
            } else {
                rendered = view.drawHierarchy(in: view.bounds, afterScreenUpdates: true)
            }
        }
        guard rendered else { return reply(["error": "UIKit did not render the complete view hierarchy"]) }
        #if swift(>=4.2)
        let data = format == "png" ? image.pngData() : image.jpegData(compressionQuality: CGFloat(quality))
#else
        let data = format == "png" ? UIImagePNGRepresentation(image) : UIImageJPEGRepresentation(image, CGFloat(quality))
#endif
        guard let encoded = data else {
            return reply(["error": "UIKit could not encode the capture"])
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
