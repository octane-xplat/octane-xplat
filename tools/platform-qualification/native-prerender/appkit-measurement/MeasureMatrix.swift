import AppKit
import Foundation
import Darwin

final class FixedView: NSView {
    override var intrinsicContentSize: NSSize { NSSize(width: 37, height: 29) }
}
final class PaddedCell: NSTextFieldCell {
    override func cellSize(forBounds bounds: NSRect) -> NSSize {
        var inner = bounds
        inner.size.width = max(0, inner.width - 24)
        let size = super.cellSize(forBounds: inner)
        return NSSize(width: size.width + 24, height: size.height + 7)
    }
}
@main struct Matrix {
    static func main() throws {
        precondition(CommandLine.arguments.count == 3)
        _ = NSApplication.shared
        NSApplication.shared.setActivationPolicy(.prohibited)
        guard dlopen(CommandLine.arguments[1], RTLD_NOW | RTLD_GLOBAL) != nil else { fatalError(String(cString: dlerror())) }
        let host = Thread.main.threadDictionary["xplatMasonHost"] as! NSObject
        @discardableResult func invoke(_ op: String, _ args: [Any] = []) -> Any? {
            host.perform(NSSelectorFromString("invoke:args:"), with: op, with: args)?.takeUnretainedValue()
        }
        invoke("scale", [1])
        let text = "Native layout before JavaScript must measure this long label against the available width rather than its unconstrained single-line size."
        func field(_ content: String, _ lines: Int, _ nowrap: Bool, _ padded: Bool, _ preferred: CGFloat) -> NSTextField {
            let view = NSTextField(labelWithString: content)
            if padded { view.cell = PaddedCell(textCell: content) }
            view.font = NSFont.systemFont(ofSize: 15)
            view.maximumNumberOfLines = nowrap ? 1 : lines
            view.usesSingleLineMode = nowrap
            view.lineBreakMode = nowrap ? .byClipping : .byWordWrapping
            view.cell?.wraps = !nowrap
            view.cell?.isScrollable = false
            view.preferredMaxLayoutWidth = preferred
            return view
        }
        var results: [[String: Any]] = []
        func run(_ name: String, widths: [Double], lines: Int = 0, nowrap: Bool = false, padded: Bool = false, content: String? = nil, automatic: Bool = false, preferred: CGFloat = 0, nonText: Bool = false) {
            let value = content ?? text
            let view: NSView = nonText ? FixedView(frame: .zero) : field(value, lines, nowrap, padded, preferred)
            let root = invoke("node") as! NSValue, leaf = invoke("mnode", [view]) as! NSValue
            defer { invoke("children", [root, []]); invoke("free", [leaf]); invoke("free", [root]) }
            invoke("children", [root, [leaf]])
            for width in widths {
                var parent: [String: Any] = ["display": "flex", "flexDirection": "column", "height": [1, 600]]
                var child: [String: Any] = ["display": "block", "flexShrink": 0]
                if width >= 0 { parent["width"] = [1, width] }
                if automatic {
                    parent["alignItems"] = "flex-start"
                    child["minWidth"] = [1, 0]
                    if width >= 0 { child["maxWidth"] = [1, width] }
                } else if width >= 0 { child["width"] = [1, width] }
                invoke("style", [root, parent]); invoke("style", [leaf, child]); invoke("dirty", [leaf])
                invoke("compute", [root, width, 600])
                let layout = invoke("layout", [root]) as! [NSNumber]
                precondition(layout.count == 44)
                let actualWidth = layout[25].doubleValue, actualHeight = layout[26].doubleValue
                let expected: Double
                if nonText { expected = 29 }
                else {
                    let referenceWidth = nowrap || width < 0 ? 0 : (preferred > 0 && automatic ? min(Double(preferred), actualWidth) : actualWidth)
                    expected = field(value, lines, nowrap, padded, referenceWidth).intrinsicContentSize.height
                }
                results.append(["case": name, "offeredWidth": width, "actualWidth": actualWidth,
                    "actualHeight": actualHeight, "expectedHeight": expected,
                    "preferredWidthRestored": nonText || (view as! NSTextField).preferredMaxLayoutWidth == preferred,
                    "matches": (nonText || (view as! NSTextField).preferredMaxLayoutWidth == preferred) && actualWidth.isFinite && actualHeight.isFinite && expected.isFinite && abs(actualHeight - expected) <= 0.5])
                view.frame = NSRect(x: 0, y: 0, width: actualWidth, height: actualHeight)
            }
        }
        run("wrap-resize", widths: [80, 180, 360, 180])
        run("two-lines", widths: [80, 180, 360], lines: 2)
        run("single-line", widths: [80, 180, 360], nowrap: true)
        run("empty-wrap", widths: [180], content: "")
        run("padded-wrap", widths: [180], padded: true)
        run("available-width", widths: [180, 360], automatic: true)
        run("preferred-width", widths: [180], automatic: true, preferred: 90)
        run("known-width-overrides-preference", widths: [180], preferred: 90)
        run("max-content", widths: [-2], automatic: true)
        run("other-view", widths: [80, 180], nonText: true)
        let output: [String: Any] = ["passed": results.allSatisfy { $0["matches"] as? Bool == true },
            "results": results, "applicationJSRuntimeCreated": false, "windowCreated": false,
            "scope": "Native measurement controls only; no IR or renderer adoption qualification"]
        try JSONSerialization.data(withJSONObject: output, options: [.prettyPrinted, .sortedKeys]).write(to: URL(fileURLWithPath: CommandLine.arguments[2]))
        print(String(data: try JSONSerialization.data(withJSONObject: output, options: [.sortedKeys]), encoding: .utf8)!)
    }
}
