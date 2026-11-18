import Foundation
import CoreFoundation

// Mason/Label backend preflight over the reusable XPI1 reader.
// No UI allocation or JS dependency; both themes must pass before mounting.
enum XplatMasonArtifact {
    struct Invalid: Error { let reason: String }
    // Keep this backend value contract aligned with the native Mason mount and font lowerer.
    // Structural validity alone does not make a native setter safe to call.
    private static func validateStyleValue(_ value: Any, key: String) throws {
        let number = value as? NSNumber
        let numeric = number != nil && CFGetTypeID(value as CFTypeRef) != CFBooleanGetTypeID()
        let scalar = numeric ? number!.doubleValue : .nan
        let nonnegativeFloat = scalar >= 0 && Float(scalar).isFinite
        let text = value as? String
        let valid: Bool
        switch key {
        case "display": valid = text == "flex" || text == "block"
        case "flexDirection": valid = text == "row" || text == "column"
        case "alignItems": valid = text == "center"
        case "alignSelf": valid = text == "stretch"
        case "justifyContent": valid = text == "center" || text == "space-between"
        case "maxWidth", "maxHeight": valid = text == "100%"
        case "overflowX", "overflowY": valid = text == "scroll" || text == "hidden"
        case "cornerShape": valid = text == "squircle"
        case "whiteSpace": valid = text == "normal" || text == "nowrap"
        case "textOverflow": valid = text == "clip" || text == "ellipsis"
        case "userSelect": valid = text == "none"
        case "borderWidth": valid = numeric && scalar == 0
        case "opacity": valid = numeric && scalar >= 0 && scalar <= 1
        case "fontWeight": valid = numeric && (100...900).contains(scalar) && scalar.truncatingRemainder(dividingBy: 100) == 0
        case "fontSize": valid = nonnegativeFloat && scalar > 0
        case "fontFamily":
            let trim = CharacterSet(charactersIn: " \t\"'")
            valid = text.map { !$0.components(separatedBy: ",").contains { $0.trimmingCharacters(in: trim).isEmpty } } ?? false
        case "backgroundColor", "color": valid = text.map(validColor) ?? false
        case "flexGrow", "flexShrink", "paddingTop", "paddingRight", "paddingBottom", "paddingLeft", "rowGap", "columnGap", "minWidth", "minHeight", "lineHeight", "borderRadius":
            valid = nonnegativeFloat
        case "width", "height": valid = nonnegativeFloat || text == "100%"
        default: valid = false
        }
        guard valid else { throw Invalid(reason: "unsupported style value: " + key) }
    }
    private static func validColor(_ text: String) -> Bool {
        if text.hasPrefix("#") {
            return text.utf8.count == 7 && text.dropFirst().allSatisfy { "0123456789abcdefABCDEF".contains($0) }
        }
        guard text.hasPrefix("rgba("), text.hasSuffix(")") else { return false }
        let parts = text.dropFirst(5).dropLast().components(separatedBy: ",")
        guard parts.count == 4 else { return false }
        for (index, part) in parts.enumerated() {
            let token = part.trimmingCharacters(in: .whitespaces)
            guard token.range(of: #"^[+-]?(?:[0-9]+(?:\.[0-9]*)?|\.[0-9]+)(?:[eE][+-]?[0-9]+)?$"#, options: .regularExpression) != nil,
                  let value = Double(token), value.isFinite,
                  value >= 0, value <= (index == 3 ? 1 : 255) else { return false }
        }
        return true
    }
    struct Artifact {
        let snapshot: XplatStartupArtifact.Snapshot
        let value: [String: Any]
    }
    static func decode(_ data: Data, expectedBuildHash: String) throws -> Artifact {
        let snapshot: XplatStartupArtifact.Snapshot
        do { snapshot = try XplatStartupArtifact.decode(data, build: expectedBuildHash, platform: "ios") }
        catch let error as XplatStartupArtifact.Invalid { throw Invalid(reason: error.reason) }
        var nodes: [[String: Any]] = []
        for item in try snapshot.visualNodes() {
            // Only these fixed ASCII fields become Swift dictionaries. Arbitrary
            // seed/prop objects retain NSDictionary's exact UTF-16 key identity.
            guard let row = item as? NSDictionary,
                  let index = row["index"], let path = row["path"],
                  let parent = row["parent"], let kind = row["kind"],
                  let text = row["text"], let props = row["props"],
                  let children = row["children"] else { throw Invalid(reason: "visual projection") }
            var projected: [String: Any] = ["index": index, "path": path, "parent": parent,
                          "kind": kind, "text": text, "props": props, "children": children]
            if let hostKind = row["hostKind"] { projected["hostKind"] = hostKind }
            nodes.append(projected)
        }
        guard let source = snapshot.value["variants"] as? NSDictionary,
              let seed = snapshot.value["seed"] as? NSDictionary else { throw Invalid(reason: "artifact projection") }
        var variants: [String: Any] = [:]
        for theme in ["light", "dark"] {
            guard let input = source[theme] as? [NSDictionary] else { throw Invalid(reason: "style records") }
            var records: [[String: Any]] = []
            for row in input {
                guard let style = row["style"] as? [String: Any],
                      let cssKeys = row["cssKeys"] as? [String],
                      let inheritedKeys = row["inheritedKeys"] as? [String] else { throw Invalid(reason: "style record") }
                for (key, value) in style { try validateStyleValue(value, key: key) }
                records.append(["index": records.count, "style": style,
                                "cssKeys": cssKeys, "inheritedKeys": inheritedKeys])
            }
            variants[theme] = records
        }
        return Artifact(snapshot: snapshot, value: ["seed": seed, "nodes": nodes, "variants": variants])
    }
}
