import Foundation
import CoreFoundation
import UIKit

// UIKit owns the continuation of the app's compiled launch storyboard. The
// first normal app window is the only owner; this is never a re-show API.
@objc(XplatSplashScreen)
@objcMembers
public final class XplatSplashScreen: NSObject {
    private static let shared = XplatSplashScreen()
    private var prepared = false
    private var held = false
    private var dismissed = false
    private var hiding = false
    private var failed = false
    private var fade = false
    private var duration: TimeInterval = 0.4
    private var maxHold: TimeInterval = 30
    private weak var owner: UIWindow?
    private var controller: UIViewController?
    private var visibleObserver: NSObjectProtocol?
    private var hiddenObserver: NSObjectProtocol?
    private var rootObservation: NSKeyValueObservation?
    private var timeout: DispatchWorkItem?
    private var autoHide: DispatchWorkItem?

    private static func storyboardName() -> String? {
        guard let configured = Bundle.main.object(forInfoDictionaryKey: "UILaunchStoryboardName") as? String,
              !configured.isEmpty else { return nil }
        let name = configured.hasSuffix(".storyboard") ? String(configured.dropLast(11)) : configured
        return Bundle.main.path(forResource: name, ofType: "storyboardc") == nil ? nil : name
    }
    public static func configured() -> Bool { return storyboardName() != nil }
    public static func prepare(_ alreadyStarted: Bool) -> Bool {
        guard Thread.isMainThread else { return false }
        let value = shared
        if value.prepared { return !value.failed }
        guard configured() else { return false }
        if let supplied = Bundle.main.object(forInfoDictionaryKey: "XplatSplashScreenMaxHoldMilliseconds") {
            guard let number = supplied as? NSNumber,
                  CFGetTypeID(number) != CFBooleanGetTypeID(),
                  number.doubleValue.isFinite,
                  number.doubleValue.rounded() == number.doubleValue,
                  number.doubleValue >= 100, number.doubleValue <= 120000 else { return false }
            value.maxHold = number.doubleValue / 1000
        }
        value.prepared = true
        value.dismissed = alreadyStarted
        if alreadyStarted { return true }
        // Register before UIApplicationMain; do not create an application or
        // window while NativeScript is still evaluating the entry module.
        value.visibleObserver = NotificationCenter.default.addObserver(
            forName: Notification.Name("UIWindowDidBecomeVisibleNotification"), object: nil, queue: nil
        ) { [weak value] notification in
            guard let value = value, let window = notification.object as? UIWindow,
                  Thread.isMainThread, value.isNormalWindow(window),
                  !window.isHidden else { return }
            // NativeScript's scene delegate makes its primary window visible
            // before assigning the root controller. Attach during that event,
            // before the first scene frame, rather than waiting for a root.
            value.attach(window)
        }
        return true
    }
    private func isNormalWindow(_ window: UIWindow) -> Bool {
#if swift(>=4.2)
        return window.windowLevel == .normal
#else
        return window.windowLevel == UIWindowLevelNormal
#endif
    }
    public static func preventAutoHide() -> Bool {
        let value = shared
        guard Thread.isMainThread, value.prepared, !value.dismissed, !value.hiding, !value.failed else { return false }
        value.held = true
        value.autoHide?.cancel()
        value.autoHide = nil
        if value.timeout == nil {
            let work = DispatchWorkItem { [weak value] in value?.dismiss(animated: false) }
            value.timeout = work
            DispatchQueue.main.asyncAfter(deadline: .now() + value.maxHold, execute: work)
        }
        return true
    }
    public static func configure(_ options: String) -> Bool {
        guard Thread.isMainThread, let bytes = options.data(using: .utf8),
              let value = try? JSONSerialization.jsonObject(with: bytes),
              let object = value as? [String: Any] else { return false }
        if let duration = object["duration"] as? NSNumber {
            guard CFGetTypeID(duration) != CFBooleanGetTypeID(), duration.doubleValue.isFinite,
                  duration.doubleValue >= 0, duration.doubleValue <= 60000 else { return false }
            shared.duration = duration.doubleValue / 1000
        }
        if let fade = object["fade"] as? Bool { shared.fade = fade }
        return true
    }
    public static func hide() { shared.dismiss(animated: shared.fade) }

    private func attach(_ window: UIWindow) {
        guard !dismissed, !hiding, owner == nil else { return }
        guard let name = XplatSplashScreen.storyboardName(),
              let root = UIStoryboard(name: name, bundle: .main).instantiateInitialViewController(),
              let view = root.view else {
            failed = true
            dismiss(animated: false)
            return
        }
        owner = window
        controller = root
        view.frame = window.bounds
        view.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        view.accessibilityIdentifier = "xplat.launch-screen"
        view.accessibilityViewIsModal = true
        // A launch screen blocks input until dismissal without disabling the
        // underlying app window or changing its key-window/interaction state.
        view.isUserInteractionEnabled = true
        window.addSubview(view)
        // UIKit removes existing window subviews when NativeScript assigns
        // the scene root. Reattach synchronously after that assignment, before
        // the first frame, and keep the continuation above replacement roots.
        rootObservation = window.observe(\.rootViewController, options: [.new]) { [weak self] window, _ in
            guard let value = self, !value.dismissed, !value.hiding,
                  let overlay = value.controller?.view else { return }
            overlay.frame = window.bounds
            window.addSubview(overlay)
        }
        if let observer = visibleObserver { NotificationCenter.default.removeObserver(observer) }
        visibleObserver = nil
        hiddenObserver = NotificationCenter.default.addObserver(
            forName: Notification.Name("UIWindowDidBecomeHiddenNotification"), object: window, queue: nil
        ) { [weak self] _ in self?.dismiss(animated: false) }
        if !held {
            let work = DispatchWorkItem { [weak self] in
                guard let value = self, !value.held else { return }
                value.dismiss(animated: value.fade)
            }
            autoHide = work
            DispatchQueue.main.async(execute: work)
        }
    }
    private func dismiss(animated: Bool) {
        guard Thread.isMainThread, !dismissed, !hiding else { return }
        held = false
        hiding = true
        timeout?.cancel()
        timeout = nil
        autoHide?.cancel()
        autoHide = nil
        removeObservers()
        guard let view = controller?.view, animated, duration > 0 else { finish(); return }
        UIView.animate(withDuration: duration, animations: { view.alpha = 0 }) { [weak self] _ in self?.finish() }
    }
    private func finish() {
        controller?.view.removeFromSuperview()
        controller = nil
        owner = nil
        hiding = false
        dismissed = true
    }
    private func removeObservers() {
        if let value = visibleObserver { NotificationCenter.default.removeObserver(value) }
        if let value = hiddenObserver { NotificationCenter.default.removeObserver(value) }
        visibleObserver = nil
        hiddenObserver = nil
        rootObservation?.invalidate()
        rootObservation = nil
    }
    // Native fixture diagnostics; deliberately absent from the JavaScript API.
    public static func state() -> String {
        let value = shared
        let state = value.failed ? "failed" : value.dismissed ? "hidden" : value.hiding ? "hiding" :
            value.controller != nil ? "visible" : value.prepared ? "waiting" : "unprepared"
        let info: [String: Any] = ["state": state, "held": value.held,
            "visible": value.controller?.view.superview != nil,
            "observers": value.visibleObserver != nil || value.hiddenObserver != nil || value.rootObservation != nil,
            "timeout": value.timeout != nil]
        return String(data: try! JSONSerialization.data(withJSONObject: info), encoding: .utf8)!
    }
}
