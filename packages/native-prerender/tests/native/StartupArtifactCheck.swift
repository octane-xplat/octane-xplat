import Foundation

@main enum StartupArtifactCheck {
    static func main() {
        do {
            let args = CommandLine.arguments
            guard args.count == 4 || args.count == 12 || (args.count >= 5 && ["visual", "select"].contains(args[4])),
                  let size = try FileManager.default.attributesOfItem(atPath: args[1])[.size] as? NSNumber,
                  size.intValue <= 1048576 else { throw XplatStartupArtifact.Invalid(reason: "arguments or byte length") }
            let snapshot = try XplatStartupArtifact.decode(Data(contentsOf: URL(fileURLWithPath: args[1])), build: args[2], platform: args[3])
            let result: Any
            if args.count >= 5 && args[4] == "visual" { result = try snapshot.visualNodes() }
            else if args.count >= 5 && args[4] == "select" {
                // name=value pairs seed the resolver; omitted names resolve as
                // absent stored keys. Prints the selected tree index or -1.
                var stored: [String: String] = [:]
                for pair in args.dropFirst(5) {
                    guard let mark = pair.firstIndex(of: "=") else { throw XplatStartupArtifact.Invalid(reason: "expected name=value resolver arguments") }
                    stored[String(pair[..<mark])] = String(pair[pair.index(after: mark)...])
                }
                result = snapshot.selectIndex({ stored[$0] }) ?? -1
            }
            else if args.count == 12 {
                guard let scale = Double(args[4]), let width = Double(args[5]), let height = Double(args[6]),
                      let top = Double(args[8]), let right = Double(args[9]), let bottom = Double(args[10]), let left = Double(args[11]),
                      ["true", "false"].contains(args[7])
                else { throw XplatStartupArtifact.Invalid(reason: "environment arguments") }
                result = try snapshot.supports(fontScale: scale, width: width, height: height, reducedMotion: args[7] == "true",
                                               safeAreaInsets: (top: top, right: right, bottom: bottom, left: left))
            } else { result = snapshot.value }
            FileHandle.standardOutput.write(try JSONSerialization.data(withJSONObject: result, options: [.fragmentsAllowed, .sortedKeys]))
        } catch {
            FileHandle.standardError.write(Data(("Native startup rejected: " + String(describing: error) + "\n").utf8))
            exit(1)
        }
    }
}
