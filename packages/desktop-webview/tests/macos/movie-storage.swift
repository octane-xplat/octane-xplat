import AppKit
import AVFoundation

@main struct MovieStorageTests {
	static func main() throws {
		_ = NSApplication.shared
		let host = XplatWebViewHost()
		let fixture = try Data(contentsOf: URL(fileURLWithPath: CommandLine.arguments[1]))
		let prefix = UUID().uuidString
		let directory = URL(string: host.movieDirectory()! as String)!
		let root = directory.appendingPathComponent(prefix, isDirectory: true)
		try FileManager.default.createDirectory(at: root, withIntermediateDirectories: true)
		defer {
			host.dispose()
			try? FileManager.default.removeItem(at: root)
		}
		var checks = 0
		func expect(_ value: @autoclosure () -> Bool, _ label: String) {
			precondition(value(), label)
			checks += 1
		}
		func target(_ name: String) -> URL { root.appendingPathComponent(name + ".mp4") }
		func write(_ url: URL, _ data: Data, final: Bool = false, using owner: XplatWebViewHost? = nil) -> NSDictionary? {
			(owner ?? host).writeMovieFileChunk([
				"fileUrl": url.absoluteString, "base64": data.base64EncodedString(), "final": final,
			])
		}
		func entries() throws -> [String] { try FileManager.default.contentsOfDirectory(atPath: root.path) }
		let movie = target("movie")
		let split = fixture.count / 2
		expect(write(movie, fixture.prefix(split))?["ok"] as? Bool == true, "first chunk acknowledged")
		expect(!FileManager.default.fileExists(atPath: movie.path), "staged bytes stay unpublished")
		expect(write(movie, fixture.suffix(fixture.count - split), final: true)?["uri"] as? String == movie.absoluteString, "final publishes destination")
		expect(try! Data(contentsOf: movie) == fixture, "exact movie bytes survive commit")
		let asset = AVURLAsset(url: movie)
		expect(asset.isReadable && !asset.tracks(withMediaType: .video).isEmpty, "finalized fixture is a readable movie")
		expect(write(movie, Data([0]), final: true) == nil, "existing output is never overwritten")
		expect(try! Data(contentsOf: movie) == fixture, "existing movie preserved")
		let read = host.readMovieFileChunk(["fileUrl": movie.absoluteString, "offset": 0, "length": fixture.count])
		expect(Data(base64Encoded: read! as String) == fixture, "reopen bytes match")
		for length in [-1, 0, 4 * 1024 * 1024 + 1] {
			expect(host.readMovieFileChunk(["fileUrl": movie.absoluteString, "offset": 0, "length": length]) == nil, "invalid read length rejected")
		}
		expect(host.readMovieFileChunk(["fileUrl": movie.absoluteString, "offset": -1, "length": 1]) == nil, "negative read offset rejected")

		let cancelled = target("cancelled")
		expect(write(cancelled, Data([1])) != nil, "stage before cancellation")
		expect(host.deleteMovieFile(cancelled.absoluteString), "cancel removes owned stage")
		expect(try! entries() == ["movie.mp4"], "no cancellation residue")
		let failed = target("failed")
		expect(write(failed, Data([1])) != nil, "stage before failure")
		expect(host.writeMovieFileChunk(["fileUrl": failed.absoluteString, "base64": "!"]) == nil, "invalid chunk fails")
		expect(try! entries() == ["movie.mp4"], "failed stage removed")

		// Two owners never append to each other's unfinished output.
		let other = XplatWebViewHost()
		defer { other.dispose() }
		let shared = target("shared")
		expect(write(shared, Data([1])) != nil, "first owner stages")
		expect(write(shared, fixture, final: true, using: other) != nil, "second owner commits its own bytes")
		expect(try! Data(contentsOf: shared) == fixture, "foreign staging bytes never enter movie")
		expect(write(shared, Data([2]), final: true) == nil, "late first owner cannot overwrite")
		expect(try! entries().sorted() == ["movie.mp4", "shared.mp4"], "conflict cleans only own stage")

		let abandoned = target("abandoned")
		expect(write(abandoned, Data([1])) != nil, "stage before disposal")
		host.dispose()
		expect(try! entries().sorted() == ["movie.mp4", "shared.mp4"], "dispose removes unfinished stages")
		expect(write(target("late"), Data([1])) == nil, "disposed host rejects chunks")
		let reopened = XplatWebViewHost()
		defer { reopened.dispose() }
		expect(reopened.movieFileInfo(movie.absoluteString)?["exists"] as? Bool == true, "new host reopens durable output after disposal")
		expect(Data(base64Encoded: reopened.readMovieFile(movie.absoluteString)! as String) == fixture, "release preserves stored clip")
		let devices = AVCaptureDevice.DiscoverySession(deviceTypes: [.builtInWideAngleCamera, .externalUnknown], mediaType: .video, position: .unspecified).devices
		print("MOVIE_STORAGE_OK: \(checks) checks; cameraCount=\(devices.count); permission queries only; fixture media, no capture")
	}
}
