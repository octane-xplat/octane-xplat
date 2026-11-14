import UIKit
import TNSWidgets
import MasonCore
import os.signpost

// Fixed Home control. The SDK variant uses NativeSource and the stock launcher;
// the independent experimental host still compiles this file as main.swift.
private let homeBuildHash = "__XPLAT_PRERENDER_BUILD_HASH__"

final class HomeDelegate: UIResponder, UIApplicationDelegate {
    func application(_ application: UIApplication, didFinishLaunchingWithOptions options: [UIApplication.LaunchOptionsKey: Any]?) -> Bool { true }
    func application(_ application: UIApplication, configurationForConnecting session: UISceneSession, options: UIScene.ConnectionOptions) -> UISceneConfiguration {
        let config = UISceneConfiguration(name: "Home", sessionRole: session.role)
        config.delegateClass = HomeScene.self
        return config
    }
}
final class HomeWeakObject {
    weak var object: AnyObject?
    init(_ object: AnyObject?) { self.object = object }
}
final class HomeScene: UIResponder, UIWindowSceneDelegate {
    var window: UIWindow?
    var root: MasonUIView!
    var home: MasonUIView!
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
    func views(_ view: UIView) -> [UIView] {
        [view] + (view is UILabel ? [] : view.subviews.flatMap { views($0) })
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
        let content = outer.safeAreaLayoutGuide.layoutFrame
        precondition(content.width == window.bounds.width && content.height > 500, "Expected full Page-compatible content viewport")
        root = NSCMason.shared.createView()
        // The host owns the viewport; Home's flex growth uses its vertical axis.
        root.style.display = .Flex
        root.style.flexDirection = .Column
        outer.addSubview(root)
        let width = Float(content.width * window.screen.scale), height = Float(content.height * window.screen.scale)
        root.style.setSizePoints(width, height)
        root.frame = content
        let theme = window.traitCollection.userInterfaceStyle == .dark ? "dark" : "light"
        let artifact: [String: Any]
        do {
            #if XPLAT_PRERENDER_STOCK_SDK
            let resource = Bundle.main.url(forResource: "startup", withExtension: "bin", subdirectory: "app")
            #else
            let resource = Bundle.main.url(forResource: "home", withExtension: "bin")
            #endif
            guard let url = resource else {
                throw XplatMasonArtifact.Invalid(reason: "missing artifact")
            }
            let decoded = try XplatMasonArtifact.decode(Data(contentsOf: url), expectedBuildHash: homeBuildHash)
            guard try decoded.snapshot.supports(
                fontScale: UIApplication.shared.preferredContentSizeCategory == .large ? 1 : 0,
                width: Double(content.width), height: Double(content.height),
                reducedMotion: UIAccessibility.isReduceMotionEnabled
            ) else { throw XplatMasonArtifact.Invalid(reason: "launch constraints differ") }
            artifact = decoded.value
            guard let nodes = artifact["nodes"] as? [[String: Any]], nodes.count == 19,
                  nodes.first?["kind"] as? String == "masonview" else {
                throw XplatMasonArtifact.Invalid(reason: "unsupported Home topology")
            }
        } catch {
            let reason = (error as? XplatMasonArtifact.Invalid)?.reason ?? "artifact read failed"
            root.computeWithSize(width, height)
            root.markRootComputeApplied(width, height)
            root.layoutIfNeeded()
            precondition(root.subviews.isEmpty, "Rejected artifact created Home views")
            try! JSONSerialization.data(withJSONObject: ["artifactRejected": true, "reason": reason, "theme": theme, "scale": window.screen.scale, "rows": []]).write(to: documents("native-home.json"), options: .atomic)
            record("native-artifact-rejected", ["reason": reason, "beforeEngineInit": true, "artifactViews": 0])
            // A rejected optimization must leave the ordinary renderer usable.
            DispatchQueue.main.async { self.boot() }
            return
        }
        record("native-binary-decoded", ["nodes": (artifact["nodes"] as! [Any]).count, "buildHash": homeBuildHash, "beforeEngineInit": true])
        let mount = XplatMasonMount(artifact, theme: theme, scale: window.screen.scale)
        guard let mounted = mount.root as? MasonUIView else {
            preconditionFailure("Home fixture requires a Mason container root")
        }
        home = mounted
        PrerenderMountHost.mount = mount
        PrerenderMountHost.viewport = root
        root.addView(home)
        root.computeWithSize(width, height)
        root.markRootComputeApplied(width, height)
        root.frame = content
        root.layoutIfNeeded()
        let rows = PrerenderHomeMount.snapshot(home)
        let labels = views(home).compactMap { $0 as? UILabel }
        precondition(rows.count == 19 && labels.count == 10 && labels.allSatisfy { $0.frame.width > 0 && $0.frame.height > 0 && $0.window === window })
        try! JSONSerialization.data(withJSONObject: ["theme": theme, "scale": window.screen.scale, "rows": rows]).write(to: documents("native-home.json"), options: .atomic)
        record("native-mounted", ["visualNodes": rows.count, "labels": labels.map { $0.text ?? "" }, "contentRect": NSCoder.string(for: content), "owningScale": window.screen.scale])
        link = CADisplayLink(target: self, selector: #selector(tick))
        link!.add(to: .main, forMode: .common)
    }
    @objc func tick() {
        frames += 1
        guard frames == 3 else { return }
        let labels = views(home).compactMap { $0 as? UILabel }
        precondition(labels.count == 10 && labels.allSatisfy { $0.window === window && $0.frame.width > 0 && $0.frame.height > 0 })
        record("display-link-before-runtime", ["frames": frames, "visibleHomeLabels": labels.count, "windowVisible": !(window?.isHidden ?? true)])
        link?.invalidate(); link = nil
        #if XPLAT_PRERENDER_STALE_THEME
        window!.overrideUserInterfaceStyle = window!.traitCollection.userInterfaceStyle == .dark ? .light : .dark
        record("native-environment-invalidated", ["themeChanged":true, "beforeEngineInit":true])
        #endif
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.25) { self.boot() }
    }
    func observeLifetime(_ views: [HomeWeakObject], _ nodes: [HomeWeakObject]) {
        var attempts = 0
        completionTimer = Timer.scheduledTimer(withTimeInterval: 0.025, repeats: true) { [self] timer in
            attempts += 1
            let completed = (try? JSONSerialization.jsonObject(with: Data(contentsOf: documents("lifetime-js.json")))) as? [String: Any]
            let liveViews = views.indices.filter { views[$0].object != nil }
            let liveNodes = nodes.indices.filter { nodes[$0].object != nil }
            let passed = completed?["passed"] as? Bool == true && liveViews.isEmpty && liveNodes.isEmpty
            if !passed && attempts < 400 { return }
            timer.invalidate(); completionTimer = nil
            let result: [String: Any] = ["passed": passed, "liveViewIndices": liveViews, "liveNodeIndices": liveNodes, "attempts": attempts, "js": completed ?? [:]]
            try! JSONSerialization.data(withJSONObject: result, options: [.prettyPrinted, .sortedKeys]).write(to: documents("lifetime-result.json"), options: .atomic)
            record(passed ? "passed" : "lifetime-failed", ["homeVisualNodes": 19, "homeAdoptionQualified": true, "homeLifetimeQualified": passed, "liveViews": liveViews.count, "liveNodes": liveNodes.count, "presentationQualified": false])
        }
    }
    func boot() {
        var oldViews = home == nil ? [] : views(home)
        var oldNodes = oldViews.map { NSCMason.shared.nodeForView($0) }
        var oldParents = oldViews.map { $0.superview }
        record("engine-init-begin")
        #if XPLAT_PRERENDER_STOCK_SDK
        NativeScriptStart.setup()
        #else
        precondition(StartProbeRuntime())
        #endif
        runtimeStarted = true
        record("engine-init-end")
        #if XPLAT_PRERENDER_STOCK_SDK
        NativeScriptStart.boot()
        #else
        RunProbeApplication()
        #endif
        record("js-entry-end")
        var attempts = 0
        // The optional HID fixture waits for an external input driver.
        let maximumAttempts = FileManager.default.fileExists(atPath: documents("home-os-input").path) ? 9000 : 300
        completionTimer = Timer.scheduledTimer(withTimeInterval: 0.01, repeats: true) { [self] timer in
            attempts += 1
            let completed = (try? JSONSerialization.jsonObject(with: Data(contentsOf: documents("entry-details.json")))) as? [String: Any]
            guard completed?["passed"] as? Bool == true else { precondition(attempts < maximumAttempts, "Shared Home adoption assertions did not complete"); return }
            timer.invalidate(); completionTimer = nil
            if home == nil {
                precondition(oldViews.isEmpty && root.subviews.count == 1, "Artifact fallback root mismatch")
                let current = views(root.subviews[0])
                precondition(current.count == 19 && current.allSatisfy { $0.window === window }, "Artifact fallback did not attach Home")
                precondition(completed?["artifactRejectedBeforeRuntime"] as? Bool == true && completed?["normalRenderFallback"] as? Bool == true && completed?["claimsBeforeReject"] as? Int == 0)
                record("passed", ["homeVisualNodes": current.count, "ordinaryFallbackQualified": true, "artifactRejectedBeforeRuntime": true, "presentationQualified": false, "adoptionQualified": false])
                return
            }
            #if XPLAT_PRERENDER_STALE_THEME
            precondition(home.superview == nil, "Stale Home stayed attached")
            precondition(root.subviews.count == 1, "Fallback did not mount one Home")
            let current = views(root.subviews[0])
            precondition(current.count == 19 && current.allSatisfy { view in !oldViews.contains { $0 === view } }, "Fallback reused stale native views")
            precondition(completed?["normalRenderFallback"] as? Bool == true && completed?["claimsBeforeReject"] as? Int == 0)
            record("passed", ["homeVisualNodes":current.count,"ordinaryFallbackQualified":true,"staleThemeRejectedBeforeClaims":true,"presentationQualified":false,"adoptionQualified":false])
            #else
            let current = views(home)
            precondition(current.count == oldViews.count && zip(current, oldViews).allSatisfy { $0 === $1 }, "Home native view identity/order changed")
            precondition(zip(current, oldNodes).allSatisfy { NSCMason.shared.nodeForView($0) === $1 }, "Home Mason Node identity changed")
            precondition(zip(current, oldParents).allSatisfy { $0.superview === $1 }, "Home native parent changed")
            if FileManager.default.fileExists(atPath: documents("home-lifetime").path) {
                let weakViews = oldViews.map { HomeWeakObject($0) }
                let weakNodes = oldNodes.map { HomeWeakObject($0) }
                precondition(weakViews.count == 19 && weakNodes.count == 19 && weakViews.allSatisfy { $0.object != nil } && weakNodes.allSatisfy { $0.object != nil }, "Lifetime baseline was not live")
                home = nil
                PrerenderMountHost.mount = nil
                PrerenderMountHost.viewport = nil
                oldViews.removeAll(); oldNodes.removeAll(); oldParents.removeAll()
                try! JSONSerialization.data(withJSONObject: ["bootstrapReferencesReleased": true]).write(to: documents("native-handover.json"), options: .atomic)
                record("bootstrap-references-released", ["views": weakViews.count, "nodes": weakNodes.count])
                DispatchQueue.main.async { [self] in observeLifetime(weakViews, weakNodes) }
                return
            }
            #if XPLAT_PRERENDER_STOCK_SDK
            precondition(UIApplication.shared.connectedScenes.count == 1 && window?.windowScene?.windows.count == 1, "SDK Home created another scene/window")
            #endif
            record("passed", ["homeVisualNodes": current.count, "homeAdoptionQualified": true, "presentationQualified": false, "adoptionQualified": false])
            #endif
        }
    }
}
UIApplicationMain(CommandLine.argc, CommandLine.unsafeArgv, nil, NSStringFromClass(HomeDelegate.self))
