import Foundation
import CryptoKit

// Experimental XPH1 reader. Decode and validate completely before creating views.
// Foundation-only so the same reader can be qualified without a JS engine or UI.
enum HomeArtifact {
    struct Invalid: Error { let reason: String }
    private static let styleKeys: Set<String> = [
        "alignItems", "backgroundColor", "borderRadius", "borderWidth", "color",
        "columnGap", "cornerShape", "display", "flexDirection", "flexGrow", "flexShrink",
        "fontFamily", "fontSize", "fontWeight", "height", "justifyContent", "lineHeight",
        "maxWidth", "minWidth", "paddingBottom", "paddingLeft", "paddingRight",
        "paddingTop", "rowGap", "textOverflow", "userSelect", "whiteSpace",
    ]
    private struct Reader {
        let bytes: [UInt8]
        var offset = 0
        var values = 0
        mutating func take(_ count: Int) throws -> ArraySlice<UInt8> {
            guard count >= 0, count <= bytes.count - offset else { throw Invalid(reason: "truncated record") }
            defer { offset += count }
            return bytes[offset ..< offset + count]
        }
        mutating func byte() throws -> UInt8 { try take(1).first! }
        mutating func uint(_ count: Int = 4) throws -> UInt64 {
            var result: UInt64 = 0
            for (index, byte) in try take(count).enumerated() { result |= UInt64(byte) << (index * 8) }
            return result
        }
        mutating func string() throws -> String {
            let count = Int(try uint())
            guard count <= 65536, let value = String(bytes: try take(count), encoding: .utf8) else { throw Invalid(reason: "invalid string") }
            return value
        }
        mutating func literal(_ depth: Int = 0) throws -> Any {
            values += 1
            guard values <= 100000, depth < 16 else { throw Invalid(reason: "literal complexity limit") }
            switch try byte() {
            case 0: return NSNull()
            case 1: return false
            case 2: return true
            case 3:
                let number = Double(bitPattern: try uint(8))
                guard number.isFinite else { throw Invalid(reason: "non-finite number") }
                return number
            case 4: return try string()
            case 5:
                let count = Int(try uint())
                guard count <= 1024 else { throw Invalid(reason: "array limit") }
                var result: [Any] = []
                for _ in 0 ..< count { result.append(try literal(depth + 1)) }
                return result
            case 6:
                let count = Int(try uint())
                guard count <= 256 else { throw Invalid(reason: "object limit") }
                var result: [String: Any] = [:]
                for _ in 0 ..< count {
                    let key = try string()
                    guard result[key] == nil else { throw Invalid(reason: "duplicate object key") }
                    result[key] = try literal(depth + 1)
                }
                return result
            default: throw Invalid(reason: "unknown literal tag")
            }
        }
    }
    static func decode(_ data: Data, expectedBuildHash: String) throws -> [String: Any] {
        guard data.count >= 80, data.count <= 1024 * 1024,
              expectedBuildHash.count == 64,
              expectedBuildHash.allSatisfy({ "0123456789abcdef".contains($0) }) else { throw Invalid(reason: "size or build identity") }
        var reader = Reader(bytes: Array(data))
        guard Array(try reader.take(4)) == Array("XPH1".utf8),
              try reader.uint(2) == 1, try reader.uint(2) == 0,
              try reader.uint() == UInt64(data.count) else { throw Invalid(reason: "incompatible header") }
        let count = Int(try reader.uint())
        guard count > 0, count <= 1024 else { throw Invalid(reason: "node count") }
        let build = try reader.take(32).map { String(format: "%02x", $0) }.joined()
        let digest = Array(try reader.take(32))
        guard build == expectedBuildHash else { throw Invalid(reason: "build mismatch") }
        guard digest == Array(SHA256.hash(data: data.dropFirst(80))) else { throw Invalid(reason: "payload checksum") }
        let scope = try reader.string()
        guard let seed = try reader.literal() as? [String: Any] else { throw Invalid(reason: "initial data object") }
        var nodes: [[String: Any]] = []
        var children = Array(repeating: [Int](), count: count)
        var paths: [String] = []
        var kinds: [UInt8] = []
        for index in 0 ..< count {
            let kind = try reader.byte(), parent = Int(try reader.uint())
            guard kind <= 1, index == 0 ? parent == 0xffffffff : parent < index && kinds[parent] == 0 else { throw Invalid(reason: "node kind or parent") }
            let text = try reader.string()
            guard kind == 1 || text.isEmpty, let props = try reader.literal() as? [String: Any] else { throw Invalid(reason: "text or host props") }
            let path = index == 0 ? "0" : paths[parent] + "/" + String(children[parent].count)
            if index > 0 { children[parent].append(index) }
            paths.append(path)
            kinds.append(kind)
            nodes.append(["index": index, "kind": kind == 0 ? "masonview" : "label", "parent": index == 0 ? NSNull() : NSNumber(value: parent), "path": path, "text": text, "props": props])
        }
        for index in 0 ..< count { nodes[index]["children"] = children[index] }
        var variants: [String: Any] = [:]
        for theme in ["light", "dark"] {
            var records: [[String: Any]] = []
            for index in 0 ..< count {
                guard let style = try reader.literal() as? [String: Any],
                      let cssKeys = try reader.literal() as? [String],
                      let inheritedKeys = try reader.literal() as? [String] else { throw Invalid(reason: "style record") }
                for (key, value) in style {
                    // CFBoolean also bridges to NSNumber; exclude it explicitly.
                    guard styleKeys.contains(key), value is String || (value is NSNumber && CFGetTypeID(value as CFTypeRef) != CFBooleanGetTypeID()) else { throw Invalid(reason: "unsupported style property") }
                }
                for keys in [cssKeys, inheritedKeys] {
                    guard Set(keys).count == keys.count, keys.allSatisfy({ style[$0] != nil }) else { throw Invalid(reason: "style provenance") }
                }
                records.append(["index": index, "style": style, "cssKeys": cssKeys, "inheritedKeys": inheritedKeys])
            }
            variants[theme] = records
        }
        guard reader.offset == data.count else { throw Invalid(reason: "trailing bytes") }
        return ["scope": scope, "seed": seed, "nodes": nodes, "variants": variants]
    }
}
