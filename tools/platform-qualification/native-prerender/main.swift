import UIKit
import MasonCore

// Mechanism probe only: display-link progress does not prove compositor presentation.
final class ProbeDelegate: UIResponder, UIApplicationDelegate {
    func application(_ application: UIApplication, didFinishLaunchingWithOptions options: [UIApplication.LaunchOptionsKey: Any]?) -> Bool { true }
    func application(_ application: UIApplication, configurationForConnecting session: UISceneSession, options: UIScene.ConnectionOptions) -> UISceneConfiguration {
        let config = UISceneConfiguration(name: "Probe", sessionRole: session.role)
        config.delegateClass = ProbeScene.self
        return config
    }
}

final class ProbeScene: UIResponder, UIWindowSceneDelegate {
    var window: UIWindow?
    var runtimeStarted = false
    var frames = 0
    var link: CADisplayLink?
    var root: MasonUIView!
    var labels: [UILabel] = []
    var events: [[String: Any]] = []
    let started = ProcessInfo.processInfo.systemUptime

    func record(_ name: String, _ extra: [String: Any] = [:]) {
        var event = extra
        event["event"] = name
        event["ms"] = (ProcessInfo.processInfo.systemUptime - started) * 1000
        event["runtimeStarted"] = runtimeStarted
        events.append(event)
        let url = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0].appendingPathComponent("result.json")
        try! JSONSerialization.data(withJSONObject: events, options: [.prettyPrinted, .sortedKeys]).write(to: url, options: .atomic)
    }

    func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options: UIScene.ConnectionOptions) {
        guard let windowScene = scene as? UIWindowScene else { preconditionFailure("Expected window scene") }
        record("native-launch")
        let controller = UIViewController()
        root = NSCMason.shared.createView()
        root.display = .Flex
        root.flexDirection = .Column
        root.backgroundColor = .systemBackground
        let data = try! Data(contentsOf: Bundle.main.url(forResource: "screen", withExtension: "bin")!)
        // Disposable v0 fixture: magic, count, then UTF-8 byte-length/string records.
        precondition(Array(data.prefix(4)) == [88, 80, 82, 48])
        var cursor = 5
        for _ in 0..<Int(data[4]) {
            let length = Int(data[cursor]); cursor += 1
            precondition(cursor + length <= data.count)
            let label = UILabel()
            label.text = String(data: data[cursor..<cursor + length], encoding: .utf8)!
            cursor += length
            label.font = .systemFont(ofSize: 24)
            root.addView(label)
            labels.append(label)
        }
        precondition(cursor == data.count && labels.count == 2)
        controller.view = root
        let window = UIWindow(windowScene: windowScene)
        window.rootViewController = controller
        self.window = window
        window.makeKeyAndVisible()
        root.computeWithSize(Float(window.bounds.width), Float(window.bounds.height))
        root.layoutIfNeeded()
        record("native-mounted", ["root": String(describing: Unmanaged.passUnretained(root).toOpaque()), "node": String(describing: root.node), "labels": labels.map { $0.text! }, "frames": labels.map { NSCoder.string(for: $0.frame) }])
        link = CADisplayLink(target: self, selector: #selector(tick))
        link!.add(to: .main, forMode: .common)
    }

    @objc func tick() {
        frames += 1
        if frames == 3 {
            record("display-link-before-runtime", ["frames": frames, "windowVisible": !(window?.isHidden ?? true), "labelFrames": labels.map { NSCoder.string(for: $0.frame) }])
            precondition(labels.allSatisfy { $0.superview != nil && $0.frame.width > 0 && $0.frame.height > 0 }, "Native text must have nonzero layout before JS")
            // Give the run loop a chance to return; never block it to delay JS.
            link?.invalidate(); link = nil
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.25) { self.boot() }
        }
    }

    func boot() {
        let oldRoot = root!
        let oldNode = root.node
        let oldLabels = labels
        record("engine-init-begin")
        precondition(StartProbeRuntime())
        runtimeStarted = true
        record("engine-init-end")
        precondition(labels.first?.text == "Updated through NativeScript bridge")
        precondition(root === oldRoot && root.node === oldNode)
        precondition(zip(labels, oldLabels).allSatisfy { $0 === $1 })
        record("passed", ["nativeIdentityRetained": true, "presentationQualified": false, "adoptionQualified": false, "bridgeUpdateQualified": true])
    }
}
UIApplicationMain(CommandLine.argc, CommandLine.unsafeArgv, nil, NSStringFromClass(ProbeDelegate.self))
