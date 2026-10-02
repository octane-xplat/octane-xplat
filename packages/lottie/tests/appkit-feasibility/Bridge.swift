import AppKit

// Investigation only: upstream sources are compiled into this same module.
@objc(XplatLottieFeasibility)
public final class XplatLottieFeasibility: NSObject {
    private var player: LottieAnimationView?
    @objc public var finished = 0
    @objc public var cancelled = 0
    @objc public var onCompletion: ((Bool) -> Void)?

    @objc public func loadJSON(_ json: String) -> String? {
        do {
            let animation = try LottieAnimation.from(data: Data(json.utf8))
            player = LottieAnimationView(animation: animation,
                configuration: LottieConfiguration(renderingEngine: .mainThread))
            return nil
        } catch { return String(describing: error) }
    }
    @objc public var view: NSView? { player }
    @objc public var durationMs: Double { (player?.animation?.duration ?? 0) * 1000 }
    @objc public var progress: Double { Double(player?.realtimeAnimationProgress ?? 0) }
    @objc public var playing: Bool { player?.isAnimationPlaying ?? false }
    @objc public var speed: Double {
        get { Double(player?.animationSpeed ?? 0) }
        set { player?.animationSpeed = CGFloat(newValue) }
    }
    @objc public var looping: Bool {
        get { player?.loopMode == .loop }
        set { player?.loopMode = newValue ? .loop : .playOnce }
    }
    @objc public func seek(_ value: Double) { player?.currentProgress = CGFloat(value) }
    @objc public func play() {
        player?.play { [weak self] done in
            guard let self else { return }
            if done { self.finished += 1 } else { self.cancelled += 1 }
            self.onCompletion?(done)
        }
    }
    @objc public func pause() { player?.pause() }
    @objc public func stop() { player?.stop() }
    @objc public func dispose() {
        onCompletion = nil
        player?.stop()
        player?.removeFromSuperview()
        player = nil
    }
}
