import UIKit
import TNSWidgets
import MasonCore
import os.signpost

// Experimental fixed Home host. Build tooling substitutes the exact artifact
// identity and compiles this entry point as main.swift. Not app startup wiring.
private let homeBuildHash = "__XPLAT_PRERENDER_BUILD_HASH__"

final class HomeDelegate: UIResponder, UIApplicationDelegate {
    func application(_ application: UIApplication, didFinishLaunchingWithOptions options: [UIApplication.LaunchOptionsKey: Any]?) -> Bool { true }
    func application(_ application: UIApplication, configurationForConnecting session: UISceneSession, options: UIScene.ConnectionOptions) -> UISceneConfiguration {
        let config = UISceneConfiguration(name: "Home", sessionRole: session.role)
        config.delegateClass = HomeScene.self
        return config
    }
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
        let artifact = try! HomeArtifact.decode(Data(contentsOf: Bundle.main.url(forResource: "home", withExtension: "bin")!), expectedBuildHash: homeBuildHash)
        record("native-binary-decoded", ["nodes": (artifact["nodes"] as! [Any]).count, "buildHash": homeBuildHash, "beforeEngineInit": true])
        let theme = window.traitCollection.userInterfaceStyle == .dark ? "dark" : "light"
        home = PrerenderHomeMount.mount(artifact, theme: theme, scale: window.screen.scale)
        root = NSCMason.shared.createView()
        // The host owns the viewport; Home's flex growth uses its vertical axis.
        root.style.display = .Flex
        root.style.flexDirection = .Column
        root.addView(home)
        outer.addSubview(root)
        let width = Float(content.width * window.screen.scale), height = Float(content.height * window.screen.scale)
        root.style.setSizePoints(width, height)
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
    func boot() {
        let oldViews = views(home)
        let oldNodes = oldViews.map { NSCMason.shared.nodeForView($0) }
        let oldParents = oldViews.map { $0.superview }
        record("engine-init-begin")
        precondition(StartProbeRuntime())
        runtimeStarted = true
        record("engine-init-end")
        RunProbeApplication()
        record("js-entry-end")
        var attempts = 0
        completionTimer = Timer.scheduledTimer(withTimeInterval: 0.01, repeats: true) { [self] timer in
            attempts += 1
            let completed = (try? JSONSerialization.jsonObject(with: Data(contentsOf: documents("entry-details.json")))) as? [String: Any]
            guard completed?["passed"] as? Bool == true else { precondition(attempts < 300, "Shared Home adoption assertions did not complete"); return }
            timer.invalidate(); completionTimer = nil
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
            record("passed", ["homeVisualNodes": current.count, "homeAdoptionQualified": true, "presentationQualified": false, "adoptionQualified": false])
            #endif
        }
    }
}
UIApplicationMain(CommandLine.argc, CommandLine.unsafeArgv, nil, NSStringFromClass(HomeDelegate.self))
