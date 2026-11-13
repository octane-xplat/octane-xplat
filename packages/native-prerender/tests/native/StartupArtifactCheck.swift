import Foundation

@main enum StartupArtifactCheck {
    static func main() {
        do {
            let args = CommandLine.arguments
            guard [4, 5, 8].contains(args.count),
                  let size = try FileManager.default.attributesOfItem(atPath: args[1])[.size] as? NSNumber,
                  size.intValue <= 1048576 else { throw XplatStartupArtifact.Invalid(reason: "arguments or byte length") }
            let snapshot = try XplatStartupArtifact.decode(Data(contentsOf: URL(fileURLWithPath: args[1])), build: args[2], platform: args[3])
            let result: Any
            if args.count == 5 { result = try snapshot.visualNodes() }
            else if args.count == 8 {
                guard let scale = Double(args[4]), let width = Double(args[5]), let height = Double(args[6]), ["true", "false"].contains(args[7])
                else { throw XplatStartupArtifact.Invalid(reason: "environment arguments") }
                result = try snapshot.supports(fontScale: scale, width: width, height: height, reducedMotion: args[7] == "true")
            } else { result = snapshot.value }
            FileHandle.standardOutput.write(try JSONSerialization.data(withJSONObject: result, options: [.fragmentsAllowed, .sortedKeys]))
        } catch {
            FileHandle.standardError.write(Data(("Native startup rejected: " + String(describing: error) + "\n").utf8))
            exit(1)
        }
    }
}
