import Foundation
import CoreFoundation
import CryptoKit

// Structural preflight only. Backend values/fonts must pass before UI allocation.
enum XplatStartupArtifact {
    struct Invalid: Error { let reason: String }
    final class Node {
        let index: Int, parent: Int
        let path: String, kind: String
        let props: NSDictionary
        fileprivate(set) var children: [Int] = []
        fileprivate init(_ index: Int, _ parent: Int, _ path: String, _ kind: String, _ props: NSDictionary) {
            self.index = index; self.parent = parent; self.path = path; self.kind = kind; self.props = props
        }
    }
    struct Snapshot {
        let value: NSDictionary
        let nodes: [Node]
        fileprivate init(_ value: NSDictionary, _ nodes: [Node]) { self.value = value; self.nodes = nodes }
        func supports(fontScale: Double, width: Double, height: Double, reducedMotion: Bool, safeAreaInsets: (top: Double, right: Double, bottom: Double, left: Double)) throws -> Bool {
            try check([fontScale, width, height, safeAreaInsets.top, safeAreaInsets.right, safeAreaInsets.bottom, safeAreaInsets.left].allSatisfy { $0.isFinite && $0 >= 0 }, "invalid environment")
            let insets: [String: Double] = [
                "safeAreaTop": safeAreaInsets.top,
                "safeAreaRight": safeAreaInsets.right,
                "safeAreaBottom": safeAreaInsets.bottom,
                "safeAreaLeft": safeAreaInsets.left,
            ]
            for item in try array(field(value, "constraints")) {
                let row = try object(item), input = try text(field(row, "input"))
                if input == "fontScale", fontScale != (try number(field(row, "equals"))) { return false }
                if input == "reducedMotion", reducedMotion != (try boolean(field(row, "equals"))) { return false }
                if let actual = insets[input], actual != (try number(field(row, "equals"))) { return false }
                if input == "width" || input == "height" {
                    let actual = input == "width" ? width : height
                    let min = try number(field(row, "min")), max = try number(field(row, "max"))
                    if actual < min || actual > max { return false }
                }
            }
            return true
        }
        func visualNodes() throws -> NSArray {
            final class Visual {
                let node: Node, parent: Int, path: String
                var children: [Int] = []
                var text: String
                init(_ node: Node, _ parent: Int, _ path: String, _ text: String) {
                    self.node = node; self.parent = parent; self.path = path; self.text = text
                }
            }
            var records: [Visual] = [], indices = Array(repeating: -1, count: nodes.count)
            for node in nodes {
                if node.kind == "#text" {
                    records[indices[node.parent]].text += try text(field(node.props, "value")); continue
                }
                let index = records.count, parent = node.parent < 0 ? -1 : indices[node.parent]
                let path = parent < 0 ? "0" : records[parent].path + "/" + String(records[parent].children.count)
                let content = node.props.object(forKey: "text")
                records.append(Visual(node, parent, path, content == nil ? "" : try text(content!)))
                indices[node.index] = index
                if parent >= 0 { records[parent].children.append(index) }
            }
            var result: [NSDictionary] = []
            for (index, visual) in records.enumerated() {
                result.append(try dictionary([
                    ("index", index), ("logicalNode", visual.node.index), ("path", visual.path),
                    ("parent", visual.parent < 0 ? NSNull() : NSNumber(value: visual.parent)),
                    ("kind", visual.node.kind), ("props", visual.node.props),
                    ("children", visual.children), ("text", visual.text),
                ]))
            }
            return NSArray(array: result)
        }
    }
    private static let styleKeys: Set<String> = [
        "alignItems", "backgroundColor", "borderRadius", "borderWidth", "color", "columnGap",
        "cornerShape", "display", "flexDirection", "flexGrow", "flexShrink", "fontFamily", "fontSize",
        "fontWeight", "height", "justifyContent", "lineHeight", "maxWidth", "minWidth", "minHeight", "opacity", "paddingBottom",
        "paddingLeft", "paddingRight", "paddingTop", "rowGap", "textOverflow", "userSelect", "whiteSpace",
    ]
    private static func check(_ value: Bool, _ reason: String) throws {
        guard value else { throw Invalid(reason: reason) }
    }
    private static func field(_ object: NSDictionary, _ key: String) throws -> Any {
        guard let value = object.object(forKey: key as NSString) else { throw Invalid(reason: "missing field " + key) }
        return value
    }
    private static func text(_ value: Any) throws -> String {
        guard let value = value as? String, value.utf16.count <= 65536 else { throw Invalid(reason: "expected string") }
        return value
    }
    private static func number(_ value: Any) throws -> Double {
        guard let value = value as? NSNumber, CFGetTypeID(value) != CFBooleanGetTypeID(), value.doubleValue.isFinite
        else { throw Invalid(reason: "expected finite number") }
        return value.doubleValue
    }
    private static func boolean(_ value: Any) throws -> Bool {
        guard let value = value as? NSNumber, CFGetTypeID(value) == CFBooleanGetTypeID() else { throw Invalid(reason: "expected boolean") }
        return value.boolValue
    }
    private static func integer(_ value: Any, _ min: Int, _ max: Int) throws -> Int {
        let value = try number(value)
        try check(value >= Double(min) && value <= Double(max) && value.rounded(.towardZero) == value, "integer range")
        return Int(value)
    }
    private static func object(_ value: Any) throws -> NSDictionary {
        guard let value = value as? NSDictionary else { throw Invalid(reason: "expected object") }
        return value
    }
    private static func array(_ value: Any) throws -> NSArray {
        guard let value = value as? NSArray else { throw Invalid(reason: "expected array") }
        return value
    }
    private static func dictionary(_ pairs: [(String, Any)]) throws -> NSDictionary {
        let result = NSMutableDictionary()
        for (key, value) in pairs { result.setObject(value, forKey: key as NSString) }
        guard let frozen = result.copy() as? NSDictionary else { throw Invalid(reason: "dictionary copy") }
        return frozen
    }
    // NSDictionary/NSString preserve distinct UTF-16 keys (unlike Swift String
    // dictionary equality). Do not convert arbitrary initial data to [String: Any].
    private static func keys(_ object: NSDictionary, _ expected: [String]) throws {
        try check(object.count == expected.count, "object field count")
        for key in object.allKeys {
            let key = try text(key)
            try check(key.utf8.allSatisfy { $0 < 128 } && expected.contains(key), "object fields differ")
        }
    }
    private static func style(_ value: Any) throws {
        let value = try object(value)
        for key in value.allKeys {
            let key = try text(key)
            try check(key.utf8.allSatisfy { $0 < 128 } && styleKeys.contains(key), "style property")
            let item = try field(value, key)
            if item is String { _ = try text(item) } else { _ = try number(item) }
        }
    }
    private static func provenance(_ value: Any, _ style: NSDictionary) throws -> [String] {
        let input = try array(value)
        try check(input.count <= styleKeys.count, "style provenance size")
        var result: [String] = []
        for item in input {
            let key = try text(item)
            try check(key.utf8.allSatisfy { $0 < 128 } && !result.contains(key) && style.object(forKey: key as NSString) != nil, "style provenance")
            result.append(key)
        }
        return result.sorted()
    }
    private static func literalBounds(_ value: Any, _ depth: Int, _ remaining: inout Int) throws {
        remaining -= 1
        try check(remaining >= 0 && depth < 24, "literal complexity")
        if let items = value as? NSArray {
            try check(items.count <= 1024, "literal array size")
            for item in items { try literalBounds(item, depth + 1, &remaining) }
        } else if let object = value as? NSDictionary {
            try check(object.count <= 256, "literal object size")
            for item in object.allValues { try literalBounds(item, depth + 1, &remaining) }
        }
    }
    private static func props(_ node: Node) throws {
        var remaining = 100000
        try literalBounds(node.props, 0, &remaining)
        if node.kind == "#text" { try keys(node.props, ["value"]); _ = try text(field(node.props, "value")); return }
        for key in node.props.allKeys {
            let key = try text(key), value = try field(node.props, key)
            try check(key.utf8.allSatisfy { $0 < 128 }, "host prop name")
            switch key {
            case "id", "className", "text", "testID", "whiteSpace", "accessibilityRole", "accessibilityLabel", "accessibilityHint", "accessibilityState", "accessibilityValue": _ = try text(value)
            case "accessible", "isEnabled": _ = try boolean(value)
            case "maxLines": _ = try integer(value, 0, 1000000)
            case "style": try style(value)
            default: throw Invalid(reason: "unsupported host prop " + key)
            }
        }
        try check(node.kind == "label" || node.props.object(forKey: "text") == nil, "container text prop")
    }
    private static func validate(_ value: Any, _ count: Int, _ build: String, _ platform: String) throws -> Snapshot {
        let root = try object(value)
        try keys(root, ["version", "platform", "hostContract", "build", "seed", "constraints", "nodes", "variants"])
        try check(number(field(root, "version")) == 1 && text(field(root, "hostContract")) == "mason-label-v1", "schema or host contract")
        try check(text(field(root, "build")) == build && text(field(root, "platform")) == platform, "artifact/app identity")
        let seed = try object(field(root, "seed")); var remaining = 100000
        try literalBounds(seed, 0, &remaining)
        let input = try array(field(root, "nodes")); try check(input.count == count, "header node count")
        var nodes: [Node] = [], visual: [Int] = []
        for (index, value) in input.enumerated() {
            let row = try object(value)
            try keys(row, ["index", "path", "parent", "kind", "props"])
            try check(integer(field(row, "index"), 0, 1023) == index, "node index")
            let kind = try text(field(row, "kind")); try check(["masonview", "label", "#text"].contains(kind), "host kind")
            var parent = -1
            if index == 0 { try check(field(row, "parent") is NSNull && kind != "#text", "root parent or kind") }
            else {
                parent = try integer(field(row, "parent"), 0, index - 1)
                let owner = nodes[parent].kind
                try check(owner == "masonview" ? kind != "#text" : owner == "label" && kind == "#text", "child kind")
            }
            let path = parent < 0 ? "0" : nodes[parent].path + "/" + String(nodes[parent].children.count)
            try check(text(field(row, "path")) == path && path.split(separator: "/", omittingEmptySubsequences: false).count <= 64, "node address or depth")
            let node = try Node(index, parent, path, kind, object(field(row, "props")))
            try props(node); nodes.append(node)
            if parent >= 0 { nodes[parent].children.append(index) }
            if kind != "#text" { visual.append(index) }
        }
        func visit(_ index: Int, _ expected: Int) throws -> Int {
            try check(index == expected, "nodes must use depth-first order")
            let node = nodes[index]
            try check(node.kind != "label" || node.children.isEmpty || node.props.object(forKey: "text") == nil, "ambiguous label content")
            var next = expected + 1
            for child in node.children { next = try visit(child, next) }
            return next
        }
        try check(visit(0, 0) == nodes.count, "unreachable node")
        let constraints = try array(field(root, "constraints")); try check(constraints.count <= 8, "constraint count")
        var seen: Set<String> = []
        for value in constraints {
            let row = try object(value), input = try text(field(row, "input"))
            try check(seen.insert(input).inserted, "duplicate constraint")
            switch input {
            case "fontScale": try keys(row, ["input", "equals"]); try check(number(field(row, "equals")) == 1, "font scale")
            case "reducedMotion": try keys(row, ["input", "equals"]); _ = try boolean(field(row, "equals"))
            case "width", "height":
                try keys(row, ["input", "min", "max"])
                let min = try number(field(row, "min")), max = try number(field(row, "max"))
                try check(min >= 0 && max >= min, "dimension interval")
            case "safeAreaTop", "safeAreaRight", "safeAreaBottom", "safeAreaLeft":
                try keys(row, ["input", "equals"])
                try check(try number(field(row, "equals")) >= 0, "safe-area inset")
            default: throw Invalid(reason: "unknown launch input")
            }
        }
        try check(seen.contains("fontScale"), "font scale preflight required")
        let variants = try object(field(root, "variants")); try keys(variants, ["light", "dark"])
        var normalized: [(String, Any)] = []
        for theme in ["light", "dark"] {
            let rows = try array(field(variants, theme)); try check(rows.count == visual.count, "variant node count")
            var output: [NSDictionary] = []
            for (index, value) in rows.enumerated() {
                let row = try object(value); try keys(row, ["node", "style", "cssKeys", "inheritedKeys"])
                try check(integer(field(row, "node"), 0, count - 1) == visual[index], "style node identity")
                let data = try object(field(row, "style")); try style(data)
                output.append(try dictionary([
                    ("node", visual[index]), ("style", data),
                    ("cssKeys", provenance(field(row, "cssKeys"), data)),
                    ("inheritedKeys", provenance(field(row, "inheritedKeys"), data)),
                ]))
            }
            normalized.append((theme, NSArray(array: output)))
        }
        var result: [(String, Any)] = []
        for key in root.allKeys {
            let key = try text(key)
            result.append((key, key == "variants" ? try dictionary(normalized) : try field(root, key)))
        }
        return Snapshot(try dictionary(result), nodes)
    }
    private struct Reader {
        let bytes: [UInt8]
        var offset = 0, values = 0
        mutating func take(_ count: Int) throws -> ArraySlice<UInt8> {
            try check(count >= 0 && count <= bytes.count - offset, "truncated binary value")
            defer { offset += count }; return bytes[offset ..< offset + count]
        }
        mutating func uint(_ count: Int = 4) throws -> UInt64 {
            var result: UInt64 = 0
            for (index, byte) in try take(count).enumerated() { result |= UInt64(byte) << (index * 8) }
            return result
        }
        mutating func count(_ limit: Int) throws -> Int {
            let value = try uint(); try check(value <= UInt64(limit), "collection or string size"); return Int(value)
        }
        mutating func text() throws -> String {
            let length = try count(65536)
            guard let result = String(bytes: try take(length), encoding: .utf8) else { throw Invalid(reason: "invalid UTF-8") }
            return result
        }
        mutating func literal(_ depth: Int) throws -> Any {
            values += 1; try check(values <= 100000 && depth < 32, "binary literal complexity")
            let tag = try uint(1)
            switch tag {
            case 0: return NSNull()
            case 1, 2: return NSNumber(value: tag == 2)
            case 3:
                let value = Double(bitPattern: try uint(8)); try check(value.isFinite, "non-finite number")
                return NSNumber(value: value == 0 ? 0 : value)
            case 4: return try text()
            case 5:
                let length = try count(1024); var result: [Any] = []
                for _ in 0 ..< length { result.append(try literal(depth + 1)) }
                return NSArray(array: result)
            case 6:
                let length = try count(256); var result: [(String, Any)] = [], previous: String?
                for _ in 0 ..< length {
                    let key = try text()
                    if let previous { try check(previous.utf16.lexicographicallyPrecedes(key.utf16), "duplicate or unsorted object key") }
                    result.append((key, try literal(depth + 1))); previous = key
                }
                return try dictionary(result)
            default: throw Invalid(reason: "unknown value tag")
            }
        }
    }
    static func decode(_ data: Data, build: String, platform: String) throws -> Snapshot {
        try check(data.count >= 80 && data.count <= 1048576, "artifact byte length")
        try check(build.utf8.count == 64 && build.utf8.allSatisfy { (48...57).contains($0) || (97...102).contains($0) } && ["ios", "android"].contains(platform), "expected identity")
        var reader = Reader(bytes: Array(data))
        try check(Array(reader.take(4)) == [88, 80, 73, 49], "binary magic")
        try check(reader.uint(2) == 1 && reader.uint(2) == 0 && reader.uint() == UInt64(data.count), "binary version, flags or length")
        let count = try reader.count(1024); try check(count > 0, "node count")
        let actual = try reader.take(32).map { String(format: "%02x", $0) }.joined()
        try check(actual == build, "binary build identity")
        let checksum = try reader.take(32)
        try check(Array(SHA256.hash(data: data.subdata(in: 80 ..< data.count))) == Array(checksum), "payload checksum")
        let value = try reader.literal(0); try check(reader.offset == reader.bytes.count, "trailing bytes")
        return try validate(value, count, build, platform)
    }
}
