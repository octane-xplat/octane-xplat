import Foundation
import UIKit
import os

/// Included only in the isolated animation benchmark build.
@objc(AnimationQualityTrace)
@objcMembers public final class AnimationQualityTrace: NSObject {
    private static let log = OSLog(subsystem: "org.octanexplat.animation", category: "Quality")
    private static let poster = OSSignposter(subsystem: "org.octanexplat.animation", category: "Quality")
    private static var animation: OSSignpostIntervalState?
    private static var frame: OSSignpostIntervalState?

    public static func beginScenario(_ scenario: String) {
        end()
        os_signpost(.event, log: log, name: "ScenarioName", "%{public}@", scenario as NSString)
        animation = poster.beginAnimationInterval("Scenario")
    }
    public static func end() {
        if let state = animation { poster.endInterval("Scenario", state) }
        animation = nil
    }
    public static func environment() -> NSDictionary {
        return [
            "maximumFramesPerSecond": UIScreen.main.maximumFramesPerSecond,
            "lowPowerMode": ProcessInfo.processInfo.isLowPowerModeEnabled,
            "thermalState": ProcessInfo.processInfo.thermalState.rawValue,
            "reduceMotion": UIAccessibility.isReduceMotionEnabled
        ]
    }
    public static func beginFrame() {
        frame = poster.beginInterval("JSFrame")
    }
    public static func endFrame() {
        if let state = frame { poster.endInterval("JSFrame", state) }
        frame = nil
    }
}
