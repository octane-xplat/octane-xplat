import UIKit
import TNSWidgets
import MasonCore
import os.signpost

// Variable-topology mount control. The SDK build compiles this file as
// main.swift through NativeSource and the stock launcher; no Application.run
// or Page handoff participates in this bounded 320x640 control.
private let mountBuildHash = "__XPLAT_PRERENDER_BUILD_HASH__"

final class MountDelegate: UIResponder, UIApplicationDelegate {
    func application(_ application: UIApplication, didFinishLaunchingWithOptions options: [UIApplication.LaunchOptionsKey: Any]?) -> Bool { true }
    func application(_ application: UIApplication, configurationForConnecting session: UISceneSession, options: UIScene.ConnectionOptions) -> UISceneConfiguration {
        let config = UISceneConfiguration(name: "Mount", sessionRole: session.role)
        config.delegateClass = MountScene.self
        return config
    }
}
final class MountScene: UIResponder, UIWindowSceneDelegate {
    var window: UIWindow?
    var viewport: MasonUIView!
    var mount: XplatMasonMount?
    var runtimeStarted = false
    var frames = 0
    var link: CADisplayLink?
    var completionTimer: Timer?
    var events: [[String: Any]] = []
    let started = ProcessInfo.processInfo.systemUptime
    let traceLog = OSLog(subsystem: "org.octanexplat.prerenderbootstrap", category: "bootstrap")
    func record(_ name: String, _ extra: [String: Any] = [:]) {
        os_signpost(.event, log: traceLog, name: "BootstrapStage", "%{public}@", name as NSString)
        var event = extra
        event["event"] = name
        event["runtimeStarted"] = runtimeStarted
        event["ms"] = (ProcessInfo.processInfo.systemUptime - started) * 1000
        events.append(event)
        let file = documents("result.json")
        try! JSONSerialization.data(withJSONObject: events, options: [.prettyPrinted, .sortedKeys]).write(to: file, options: .atomic)
    }
    func documents(_ name: String) -> URL {
        FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0].appendingPathComponent(name)
    }
    func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options: UIScene.ConnectionOptions) {
        guard let scene = scene as? UIWindowScene else { preconditionFailure("Expected window scene") }
        record("native-launch")
        let controller = UIViewController()
        let outer = UIView()
        controller.view = outer
        let window = UIWindow(windowScene: scene)
        window.rootViewController = controller
        self.window = window
        window.makeKeyAndVisible()
        outer.frame = window.bounds
        outer.layoutIfNeeded()
        // The fixture build fixes this to a bounded 320x640 canvas; the
        // custom-screen build substitutes window.bounds so the mount
        // fills the device for visual transition evaluation.
        let canvas: CGRect = __XPLAT_PRERENDER_CANVAS__
        viewport = NSCMason.shared.createView()
        viewport.style.display = .Flex
        viewport.style.flexDirection = .Column
        let scale = window.screen.scale
        viewport.style.setSizePoints(Float(canvas.width * scale), Float(canvas.height * scale))
        viewport.frame = canvas
        outer.addSubview(viewport)
        let theme = window.traitCollection.userInterfaceStyle == .dark ? "dark" : "light"
        let artifact: [String: Any]
        do {
            let resource = Bundle.main.url(forResource: "startup", withExtension: "bin", subdirectory: "app")
            guard let url = resource else {
                throw XplatMasonArtifact.Invalid(reason: "missing artifact")
            }
            let decoded = try XplatMasonArtifact.decode(Data(contentsOf: url), expectedBuildHash: mountBuildHash)
            guard try decoded.snapshot.supports(
                fontScale: UIApplication.shared.preferredContentSizeCategory == .large ? 1 : 0,
                width: Double(canvas.width), height: Double(canvas.height),
                reducedMotion: UIAccessibility.isReduceMotionEnabled
            ) else { throw XplatMasonArtifact.Invalid(reason: "launch constraints differ") }
            artifact = decoded.value
            guard let nodes = artifact["nodes"] as? [[String: Any]], !nodes.isEmpty,
                  nodes.first?["kind"] as? String == "masonview" else {
                throw XplatMasonArtifact.Invalid(reason: "unsupported mount topology")
            }
        } catch {
            let reason = (error as? XplatMasonArtifact.Invalid)?.reason ?? "artifact read failed"
            try! JSONSerialization.data(withJSONObject: ["artifactRejected": true, "reason": reason, "theme": theme, "scale": scale, "rows": []]).write(to: documents("native-mount.json"), options: .atomic)
            record("failed", ["reason": reason, "beforeEngineInit": true])
            return
        }
        record("native-binary-decoded", ["nodes": (artifact["nodes"] as! [Any]).count, "buildHash": mountBuildHash, "beforeEngineInit": true])
        let mounted = XplatMasonMount(artifact, theme: theme, scale: scale)
        mount = mounted
        viewport.addView(mounted.root)
        viewport.computeWithSize(Float(canvas.width * scale), Float(canvas.height * scale))
        viewport.markRootComputeApplied(Float(canvas.width * scale), Float(canvas.height * scale))
        viewport.frame = canvas
        viewport.layoutIfNeeded()
        guard let mountedRoot = mounted.root as? MasonUIView else {
            preconditionFailure("Mounted root is not a MasonUIView")
        }
        let rows = PrerenderHomeMount.snapshot(mountedRoot)
        precondition(rows.count == mounted.views.count && mounted.views.allSatisfy { $0.window === window && $0.frame.width > 0 && $0.frame.height > 0 })
        try! JSONSerialization.data(withJSONObject: ["theme": theme, "scale": scale, "rows": rows]).write(to: documents("native-mount.json"), options: .atomic)
        record("native-mounted", ["visualNodes": rows.count, "canvas": NSCoder.string(for: canvas), "owningScale": scale])
        PrerenderMountHost.mount = mounted
        PrerenderMountHost.viewport = viewport
        link = CADisplayLink(target: self, selector: #selector(tick))
        link!.add(to: .main, forMode: .common)
    }
    @objc func tick() {
        frames += 1
        guard frames == 3 else { return }
        precondition(mount?.views.allSatisfy { $0.window === window && $0.frame.width > 0 && $0.frame.height > 0 } == true)
        record("display-link-before-runtime", ["frames": frames, "windowVisible": !(window?.isHidden ?? true)])
        link?.invalidate(); link = nil
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.25) { self.boot() }
    }
    func boot() {
        record("engine-init-begin")
        NativeScriptStart.setup()
        runtimeStarted = true
        record("engine-init-end")
        NativeScriptStart.boot()
        record("js-entry-end")
        var attempts = 0
        completionTimer = Timer.scheduledTimer(withTimeInterval: 0.01, repeats: true) { [self] timer in
            attempts += 1
            let proofs = (try? JSONSerialization.jsonObject(with: Data(contentsOf: documents("artifact-proofs.json")))) as? [[String: Any]]
            let lastPhase = proofs?.last?["phase"] as? String
            let completed = lastPhase == "disposed" || lastPhase == "presented"
            let failed = proofs?.contains(where: { $0["phase"] as? String == "failed" }) == true ||
                FileManager.default.fileExists(atPath: documents("entry-error.txt").path)
            guard completed || failed else { precondition(attempts < 3000, "Shared mount adoption did not complete"); return }
            timer.invalidate(); completionTimer = nil
            guard let mount else { preconditionFailure("Mount control lost its mount") }
            let adopt = proofs?.contains(where: { $0["phase"] as? String == "hydrated" }) == true
            let nodes = NSCMason.shared.nodeForView(viewport).getChildren().count
            if lastPhase == "presented" {
                // Custom screens keep the hydrated tree on screen for visual
                // transition evaluation; the runner leaves the app running.
                let retained = mount.views.allSatisfy { $0.window != nil } && !viewport.subviews.isEmpty
                record("mount-held", ["nativeChildren": viewport.subviews.count, "masonChildren": nodes, "nativeViewsDetached": !retained])
                if failed || !retained {
                    record("failed", ["reason": failed ? "fixture failure" : "presented viewport lost its native subtree", "adopt": adopt])
                    return
                }
                record("passed", ["visualNodes": mount.views.count, "adoptionQualified": true, "presentationQualified": false, "presentationHeld": true])
                return
            }
            let detached = mount.views.allSatisfy { adopt ? $0.superview == nil : $0.window == nil }
            let cleared = viewport.subviews.isEmpty && detached && nodes == 0
            record("mount-disposed", ["nativeChildren": viewport.subviews.count, "masonChildren": nodes, "nativeViewsDetached": detached])
            if failed || !cleared {
                record("failed", ["reason": failed ? "fixture failure" : "viewport or native subtree retained", "adopt": adopt])
                return
            }
            record("passed", ["visualNodes": mount.views.count, "adoptionQualified": true, "presentationQualified": false])
        }
    }
}
UIApplicationMain(CommandLine.argc, CommandLine.unsafeArgv, nil, NSStringFromClass(MountDelegate.self))
