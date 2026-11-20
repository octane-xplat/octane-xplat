import UIKit
import TNSWidgets
import MasonCore
import os.signpost

// Installable startup mount entry for a real app. Copy this file into the
// app's ios.NativeSource directory as `main.swift`, set NS_SWIFTUI_BOOT = 1 in
// build.xcconfig so the stock Objective-C launcher stays compiled out, and
// package `startup.bin` (binary artifact) plus the `XplatStartupBuildHash`
// Info.plist string the producer emits. The scene mounts the artifact's cold
// tree before NativeScriptStart.setup() initializes the JS engine, publishes
// the mount through PrerenderMountHost, then boots JavaScript; the app's
// entry calls renderWithStartup (the ./startup export) to adopt the mounted
// natives through the normal Application.run/Page path, or render ordinarily.
private let mountBuildHash = Bundle.main.object(forInfoDictionaryKey: "XplatStartupBuildHash") as? String
private let mountResource = "startup"
private let mountSubdirectory = "app"
// main.swift top-level lets evaluate at program entry, so this marks the
// boundary between dyld/framework load and UIKit launch work.
private let mainEnteredUptime = ProcessInfo.processInfo.systemUptime

// Reads the startup artifact off the willConnectTo critical path: begin()
// runs in main() before UIApplicationMain so the file read overlaps UIKit
// launch and scene setup.
final class XplatStartupArtifactPrefetch {
    private static var data: Data?
    private static let ready = DispatchSemaphore(value: 0)
    static func begin() {
        DispatchQueue.global(qos: .userInitiated).async {
            data = Bundle.main.url(forResource: mountResource, withExtension: "bin", subdirectory: mountSubdirectory).flatMap { try? Data(contentsOf: $0) }
            ready.signal()
        }
    }
    static func take() -> Data? {
        ready.wait()
        return data
    }
}

private func xplatStartupProcessStartUptime() -> TimeInterval {
    var mib: [Int32] = [CTL_KERN, KERN_PROC, KERN_PROC_PID, getpid()]
    var kp = kinfo_proc()
    var size = MemoryLayout<kinfo_proc>.size
    let ok = mib.withUnsafeMutableBufferPointer { sysctl($0.baseAddress, u_int($0.count), &kp, &size, nil, 0) } == 0
    guard ok, size == MemoryLayout<kinfo_proc>.size else {
        return ProcessInfo.processInfo.systemUptime
    }
    let tv = kp.kp_proc.p_starttime
    let startedWall = TimeInterval(tv.tv_sec) + TimeInterval(tv.tv_usec) / 1_000_000
    return startedWall - (Date().timeIntervalSince1970 - ProcessInfo.processInfo.systemUptime)
}

final class XplatStartupApp: UIResponder, UIApplicationDelegate {
    func application(_ application: UIApplication, didFinishLaunchingWithOptions options: [UIApplication.LaunchOptionsKey: Any]?) -> Bool { true }
    func application(_ application: UIApplication, configurationForConnecting session: UISceneSession, options: UIScene.ConnectionOptions) -> UISceneConfiguration {
        let config = UISceneConfiguration(name: "Startup", sessionRole: session.role)
        config.delegateClass = XplatStartupScene.self
        return config
    }
}

final class XplatStartupScene: UIResponder, UIWindowSceneDelegate {
    var window: UIWindow?
    var viewport: MasonUIView!
    var mount: XplatMasonMount?
    var runtimeStarted = false
    var frames = 0
    var attempts = 0
    var booted = false
    var link: CADisplayLink?
    var events: [[String: Any]] = []
    let started = ProcessInfo.processInfo.systemUptime
    let traceLog = OSLog(subsystem: "org.octanexplat.prerender.startup", category: "bootstrap")

    func documents(_ name: String) -> URL {
        FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0].appendingPathComponent(name)
    }

    func record(_ name: String, _ extra: [String: Any] = [:]) {
        os_signpost(.event, log: traceLog, name: "BootstrapStage", "%{public}@", name as NSString)
        var event = extra
        event["event"] = name
        event["runtimeStarted"] = runtimeStarted
        event["ms"] = (ProcessInfo.processInfo.systemUptime - started) * 1000
        events.append(event)
        let file = documents("result.json")
        try? JSONSerialization.data(withJSONObject: events, options: [.prettyPrinted, .sortedKeys]).write(to: file, options: .atomic)
    }

    /// Publishes the pre-JS mount receipt. The JavaScript startup entry reads
    /// PrerenderMountHost statics directly; the file is evidence plus the
    /// rejection handoff for tools and diagnostics.
    func writeMountReceipt(_ payload: [String: Any]) {
        try? JSONSerialization.data(withJSONObject: payload, options: [.prettyPrinted, .sortedKeys]).write(to: documents("native-mount.json"), options: .atomic)
    }

    func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options: UIScene.ConnectionOptions) {
        guard let scene = scene as? UIWindowScene else { preconditionFailure("Expected window scene") }
        let preSceneMs = (started - xplatStartupProcessStartUptime()) * 1000
        record("native-launch", ["preSceneMs": preSceneMs, "spawnToMainMs": (mainEnteredUptime - xplatStartupProcessStartUptime()) * 1000])
        let controller = UIViewController()
        let outer = UIView()
        controller.view = outer
        let window = UIWindow(windowScene: scene)
        window.rootViewController = controller
        self.window = window
        window.makeKeyAndVisible()
        outer.frame = window.bounds
        outer.layoutIfNeeded()
        let canvas: CGRect = window.bounds
        viewport = NSCMason.shared.createView()
        viewport.style.display = .Flex
        viewport.style.flexDirection = .Column
        let scale = window.screen.scale
        viewport.style.setSizePoints(Float(canvas.width * scale), Float(canvas.height * scale))
        viewport.frame = canvas
        outer.addSubview(viewport)
        let theme = window.traitCollection.userInterfaceStyle == .dark ? "dark" : "light"
        let windowInsets = window.safeAreaInsets
        record("native-window-ready")
        PrerenderMountHost.window = window
        PrerenderMountHost.theme = theme

        var selectedBind: NSDictionary?
        let artifact: [String: Any]
        do {
            guard let expectedHash = mountBuildHash, !expectedHash.isEmpty else {
                throw XplatMasonArtifact.Invalid(reason: "XplatStartupBuildHash missing")
            }
            let resource = Bundle.main.url(forResource: mountResource, withExtension: "bin", subdirectory: mountSubdirectory)
            guard let url = resource else {
                throw XplatMasonArtifact.Invalid(reason: "missing artifact")
            }
            let prefetched = XplatStartupArtifactPrefetch.take()
            let bytes = try prefetched ?? Data(contentsOf: url)
            record("native-artifact-read", ["prefetched": prefetched != nil])
            let decoded = try XplatMasonArtifact.decode(bytes, expectedBuildHash: expectedHash)
            guard try decoded.snapshot.supports(
                fontScale: UIApplication.shared.preferredContentSizeCategory == .large ? 1 : 0,
                width: Double(canvas.width), height: Double(canvas.height),
                reducedMotion: UIAccessibility.isReduceMotionEnabled,
                safeAreaInsets: (
                    top: Double(windowInsets.top), right: Double(windowInsets.right),
                    bottom: Double(windowInsets.bottom), left: Double(windowInsets.left)
                )
            ) else { throw XplatMasonArtifact.Invalid(reason: "launch constraints differ") }
            // Resolve declared launch inputs from the same persisted store the
            // app's ApplicationSettings reads, plus the implicit
            // systemAppearance bind from the same trait read that chooses the
            // mount theme; no matching bind means JavaScript boot.
            let defaults = UserDefaults.standard
            guard let selected = decoded.select({ name in
                name == "systemAppearance" ? theme : defaults.string(forKey: name)
            }) else {
                throw XplatMasonArtifact.Invalid(reason: "launch inputs outside declared domain")
            }
            selectedBind = selected.tree.bind
            artifact = selected.value
            guard let nodes = artifact["nodes"] as? [[String: Any]], !nodes.isEmpty,
                  nodes.first?["kind"] as? String == "masonview" else {
                throw XplatMasonArtifact.Invalid(reason: "unsupported mount topology")
            }
        } catch {
            let reason = (error as? XplatMasonArtifact.Invalid)?.reason ?? "artifact read failed"
            PrerenderMountHost.rejection = reason
            writeMountReceipt(["artifactRejected": true, "reason": reason, "theme": theme, "scale": scale,
                "safeAreaInsets": ["top": windowInsets.top, "right": windowInsets.right, "bottom": windowInsets.bottom, "left": windowInsets.left], "rows": []])
            record("startup-mount-rejected", ["reason": reason, "beforeEngineInit": true])
            scheduleBoot()
            return
        }
        record("native-binary-decoded", ["nodes": (artifact["nodes"] as! [Any]).count, "buildHash": mountBuildHash ?? "<missing>", "bind": selectedBind ?? [:], "beforeEngineInit": true])
        let mounted = XplatMasonMount(artifact, theme: theme, scale: scale)
        mount = mounted
        viewport.addView(mounted.root)
        viewport.computeWithSize(Float(canvas.width * scale), Float(canvas.height * scale))
        viewport.markRootComputeApplied(Float(canvas.width * scale), Float(canvas.height * scale))
        viewport.frame = canvas
        viewport.layoutIfNeeded()

        let rows: [[String: Any]] = mounted.views.enumerated().map { index, view in
            ["index": index, "class": NSStringFromClass(type(of: view)), "frame": NSCoder.string(for: view.frame)]
        }
        let bindJSON = (try? JSONSerialization.data(withJSONObject: selectedBind ?? [:], options: [.sortedKeys]))
            .flatMap { String(data: $0, encoding: .utf8) } ?? "{}"
        PrerenderMountHost.bind = bindJSON
        PrerenderMountHost.mount = mounted
        PrerenderMountHost.viewport = viewport
        writeMountReceipt(["theme": theme, "scale": scale, "bind": selectedBind ?? [:],
            "safeAreaInsets": ["top": windowInsets.top, "right": windowInsets.right, "bottom": windowInsets.bottom, "left": windowInsets.left],
            "canvas": NSCoder.string(for: canvas), "beforeEngineInit": true, "rows": rows])
        record("native-mounted", ["visualNodes": rows.count, "canvas": NSCoder.string(for: canvas), "owningScale": scale,
            "beforeEngineInit": true, "safeAreaInsets": ["top": windowInsets.top, "right": windowInsets.right, "bottom": windowInsets.bottom, "left": windowInsets.left]])
        link = CADisplayLink(target: self, selector: #selector(tick))
        link!.add(to: .main, forMode: .common)
    }

    private func scheduleBoot() {
        DispatchQueue.main.async { self.boot() }
    }

    @objc func tick() {
        frames += 1
        // One presented frame is enough: the cold tree has been composited
        // before the engine initializes. The attempt bound avoids a boot
        // deadlock if the window never presents (e.g. backgrounded scene).
        guard frames >= 1 || attempts >= 120 else { attempts += 1; return }
        link?.invalidate(); link = nil
        boot()
    }

    func boot() {
        guard !booted else { return }
        booted = true
        record("engine-init-begin")
        NativeScriptStart.setup()
        runtimeStarted = true
        record("engine-init-end")
        NativeScriptStart.boot()
        record("js-entry-end")
    }
}

XplatStartupArtifactPrefetch.begin()
UIApplicationMain(CommandLine.argc, CommandLine.unsafeArgv, nil, NSStringFromClass(XplatStartupApp.self))
