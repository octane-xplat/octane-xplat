import Foundation

@main
struct HomeArtifactCheck {
    static func main() {
        do {
            guard CommandLine.arguments.count == 3 else { throw XplatMasonArtifact.Invalid(reason: "expected artifact path and build hash") }
            let data = try Data(contentsOf: URL(fileURLWithPath: CommandLine.arguments[1]))
            let artifact = try XplatMasonArtifact.decode(data, expectedBuildHash: CommandLine.arguments[2])
            let json = try JSONSerialization.data(withJSONObject: artifact.value, options: [.sortedKeys])
            FileHandle.standardOutput.write(json)
        } catch {
            FileHandle.standardError.write(Data("Home IR rejected: \(error)\n".utf8))
            exit(1)
        }
    }
}
