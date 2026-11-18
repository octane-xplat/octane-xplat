import Foundation

@main
struct HomeArtifactCheck {
    static func main() {
        do {
            let args = CommandLine.arguments
            guard args.count >= 3 else { throw XplatMasonArtifact.Invalid(reason: "expected artifact path and build hash") }
            // Trailing name=value pairs seed the launch-input resolver; an
            // omitted name resolves as an absent stored key (its declared
            // default applies). Flat artifacts ignore the resolver.
            var stored: [String: String] = [:]
            for pair in args.dropFirst(3) {
                guard let mark = pair.firstIndex(of: "=") else { throw XplatMasonArtifact.Invalid(reason: "expected name=value resolver arguments") }
                stored[String(pair[..<mark])] = String(pair[pair.index(after: mark)...])
            }
            let data = try Data(contentsOf: URL(fileURLWithPath: args[1]))
            let artifact = try XplatMasonArtifact.decode(data, expectedBuildHash: args[2])
            guard let selected = artifact.select({ stored[$0] }) else { throw XplatMasonArtifact.Invalid(reason: "launch inputs outside declared domain") }
            let json = try JSONSerialization.data(withJSONObject: selected.value, options: [.sortedKeys])
            FileHandle.standardOutput.write(json)
        } catch {
            FileHandle.standardError.write(Data("Home IR rejected: \(error)\n".utf8))
            exit(1)
        }
    }
}
