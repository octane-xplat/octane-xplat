import UIKit

// A stock SDK startup gate. The normal NativeSource build owns this entry point.
@main
final class StartupApp: UIResponder, UIApplicationDelegate {
    func application(_ application: UIApplication, configurationForConnecting session: UISceneSession,
                     options: UIScene.ConnectionOptions) -> UISceneConfiguration {
        let configuration = UISceneConfiguration(name: "Startup", sessionRole: session.role)
        configuration.delegateClass = StartupScene.self
        return configuration
    }
}

final class StartupScene: UIResponder, UIWindowSceneDelegate {
    var window: UIWindow?
    private var label: UILabel?
    private var link: CADisplayLink?
    private var ticks = 0
    private var booted = false
    private var events: [[String: Any]] = []
    private var timeout: Timer?

    private func record(_ event: String, _ details: [String: Any] = [:]) {
        var item = details
        item["event"] = event
        item["time"] = ProcessInfo.processInfo.systemUptime
        events.append(item)
        let path = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
            .appendingPathComponent("sdk-startup.json")
        do {
            try JSONSerialization.data(withJSONObject: events, options: [.prettyPrinted, .sortedKeys])
                .write(to: path, options: .atomic)
        } catch { NSLog("Startup gate could not write evidence: %@", String(describing: error)) }
    }

    func scene(_ scene: UIScene, willConnectTo session: UISceneSession,
               options: UIScene.ConnectionOptions) {
        guard let scene = scene as? UIWindowScene, window == nil else { return }
        let controller = UIViewController()
        controller.view.backgroundColor = .systemBackground
        let label = UILabel()
        label.tag = 6021
        label.text = "Native before JavaScript"
        label.textColor = .label
        label.frame = CGRect(x: 24, y: 100, width: 330, height: 60)
        controller.view.addSubview(label)
        let window = UIWindow(windowScene: scene)
        window.rootViewController = controller
        self.window = window
        self.label = label
        window.makeKeyAndVisible()
        controller.view.layoutIfNeeded()
        record("native-mounted", ["beforeSDKSetup": true])
        let link = CADisplayLink(target: self, selector: #selector(frame))
        self.link = link
        link.add(to: .main, forMode: .common)
        timeout = Timer.scheduledTimer(withTimeInterval: 25, repeats: false) { [weak self] _ in
            self?.record("failed", ["reason": "late JS did not update the original label"])
            self?.link?.invalidate()
        }
    }

    @objc private func frame() {
        guard let window, let label else { return }
        ticks += 1
        if !booted {
            guard ticks >= 3, label.window === window, window.windowScene != nil,
                  label.bounds.width > 0, label.bounds.height > 0 else { return }
            booted = true
            record("native-layout", ["beforeSDKSetup": true, "displayLinkTicks": ticks,
                                     "width": label.bounds.width, "height": label.bounds.height])
            record("sdk-setup-begin")
            NativeScriptStart.setup()
            record("sdk-setup-end")
            NativeScriptStart.boot()
            record("sdk-boot-returned")
        }
        if label.text == "JavaScript updated the native label" {
            record("passed", ["sameNativeLabel": label.window === window,
                              "sceneCount": UIApplication.shared.connectedScenes.count,
                              "windowCount": window.windowScene?.windows.count ?? 0,
                              "osInputQualified": false, "presentationQualified": false])
            link?.invalidate()
            timeout?.invalidate()
        }
    }

    func sceneDidDisconnect(_ scene: UIScene) {
        link?.invalidate()
        timeout?.invalidate()
    }
}
