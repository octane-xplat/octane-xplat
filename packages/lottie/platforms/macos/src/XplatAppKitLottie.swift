import AppKit
import Foundation

@objc(XplatLottieAdapter)
public final class XplatLottieAdapter: NSObject {
  @objc public let nativeView: LottieAnimationView
  @objc public var onLoaded: ((Double) -> Void)?
  @objc public var onEnded: (() -> Void)?
  @objc public var onError: ((String) -> Void)?

  private var constraints: [NSLayoutConstraint] = []
  private weak var mountedHost: NSView?
  private var loadGeneration: UInt64 = 0
  private var download: URLSessionDataTask?
  private var repeats = false
  private var disposed = false

  @objc public override init() {
    nativeView = LottieAnimationView(configuration: LottieConfiguration(renderingEngine: .mainThread))
    super.init()
    nativeView.backgroundBehavior = .pause
    nativeView.contentMode = .scaleAspectFit
  }

  @objc public var durationMs: Double {
    (nativeView.animation?.duration ?? 0) * 1000
  }

  @objc public var progress: Double {
    get { Double(nativeView.realtimeAnimationProgress) }
    set { seekTo(newValue) }
  }

  @objc public var isPlaying: Bool {
    nativeView.isAnimationPlaying
  }

  @objc public var isLooping: Bool {
    nativeView.loopMode == .loop
  }

  @objc public var speed: Double {
    get { Double(nativeView.animationSpeed) }
    set {
      if newValue.isFinite {
        nativeView.animationSpeed = CGFloat(newValue)
      }
    }
  }

  @objc public var loop: Bool {
    get { repeats }
    set {
      repeats = newValue
      nativeView.loopMode = newValue ? .loop : .playOnce
    }
  }

  @objc public var fit: String {
    get {
      switch nativeView.contentMode {
      case .scaleAspectFill: return "cover"
      case .scaleToFill: return "fill"
      default: return "contain"
      }
    }
    set {
      switch newValue {
      case "cover": nativeView.contentMode = .scaleAspectFill
      case "fill": nativeView.contentMode = .scaleToFill
      default: nativeView.contentMode = .scaleAspectFit
      }
    }
  }

  @objc public func mountIn(_ host: NSView) {
    guard !disposed, mountedHost !== host else { return }
    unmountView()

    nativeView.translatesAutoresizingMaskIntoConstraints = false
    host.addSubview(nativeView)
    constraints = [
      nativeView.leadingAnchor.constraint(equalTo: host.leadingAnchor),
      nativeView.trailingAnchor.constraint(equalTo: host.trailingAnchor),
      nativeView.topAnchor.constraint(equalTo: host.topAnchor),
      nativeView.bottomAnchor.constraint(equalTo: host.bottomAnchor),
    ]
    NSLayoutConstraint.activate(constraints)
    mountedHost = host
  }

  @objc public func loadJSON(_ json: String) {
    decode(Data(json.utf8))
  }

  @objc public func loadFile(_ pathOrURL: String) {
    let fileURL: URL
    if pathOrURL.hasPrefix("file://"), let parsed = URL(string: pathOrURL), parsed.isFileURL {
      fileURL = parsed
    } else if pathOrURL.hasPrefix("/") {
      fileURL = URL(fileURLWithPath: pathOrURL)
    } else {
      fail("AppKit Lottie file paths must be absolute paths or file:// URLs.")
      return
    }

    beginLoad()
    let generation = loadGeneration
    DispatchQueue.global(qos: .userInitiated).async { [weak self] in
      do {
        let data = try Data(contentsOf: fileURL)
        self?.decode(data, generation: generation)
      } catch {
        self?.report(error, generation: generation)
      }
    }
  }

  @objc public func loadURL(_ address: String) {
    guard let url = URL(string: address), url.scheme?.lowercased() == "https" else {
      fail("AppKit Lottie URLs must use https://.")
      return
    }

    beginLoad()
    let generation = loadGeneration
    download = URLSession.shared.dataTask(with: url) { [weak self] data, response, error in
      if let error {
        self?.report(error, generation: generation)
        return
      }

      if let response = response as? HTTPURLResponse, !(200..<300).contains(response.statusCode) {
        self?.reportMessage("Lottie request failed with HTTP \(response.statusCode).", generation: generation)
        return
      }

      guard let data else {
        self?.reportMessage("Lottie request returned no data.", generation: generation)
        return
      }

      self?.decode(data, generation: generation)
    }
    download?.resume()
  }

  @objc public func clear() {
    beginLoad()
    nativeView.stop()
    nativeView.animation = nil
  }

  @objc public func play() {
    guard !disposed, nativeView.animation != nil else { return }
    nativeView.loopMode = repeats ? .loop : .playOnce
    nativeView.play { [weak self] finished in
      guard finished, let self, !self.disposed else { return }
      self.onEnded?()
    }
  }

  @objc public func pause() {
    nativeView.pause()
  }

  @objc public func stop() {
    nativeView.stop()
  }

  @objc public func seekTo(_ value: Double) {
    guard value.isFinite, nativeView.animation != nil else { return }
    let next = CGFloat(min(1, max(0, value)))
    if nativeView.isAnimationPlaying {
      nativeView.play(fromProgress: next, toProgress: 1, loopMode: repeats ? .loop : .playOnce) { [weak self] finished in
        guard finished, let self, !self.disposed else { return }
        self.onEnded?()
      }
    } else {
      nativeView.currentProgress = next
    }
  }

  @objc public func dispose() {
    guard !disposed else { return }
    disposed = true
    beginLoad()
    nativeView.stop()
    nativeView.animation = nil
    unmountView()
    onLoaded = nil
    onEnded = nil
    onError = nil
  }

  private func beginLoad() {
    loadGeneration &+= 1
    download?.cancel()
    download = nil
    nativeView.stop()
    nativeView.animation = nil
  }

  private func decode(_ data: Data, generation: UInt64? = nil) {
    if generation == nil {
      beginLoad()
    }
    let expectedGeneration = generation ?? loadGeneration
    DispatchQueue.global(qos: .userInitiated).async { [weak self] in
      do {
        let animation = try LottieAnimation.from(data: data)
        DispatchQueue.main.async { [weak self] in
          guard let self, !self.disposed, self.loadGeneration == expectedGeneration else { return }
          self.nativeView.stop()
          self.nativeView.animation = animation
          self.onLoaded?(animation.duration * 1000)
        }
      } catch {
        self?.report(error, generation: expectedGeneration)
      }
    }
  }

  private func fail(_ message: String) {
    beginLoad()
    reportMessage(message, generation: loadGeneration)
  }

  private func report(_ error: Error, generation: UInt64) {
    reportMessage(error.localizedDescription, generation: generation)
  }

  private func reportMessage(_ message: String, generation: UInt64) {
    DispatchQueue.main.async { [weak self] in
      guard let self, !self.disposed, self.loadGeneration == generation else { return }
      self.onError?(message)
    }
  }

  private func unmountView() {
    NSLayoutConstraint.deactivate(constraints)
    constraints = []
    nativeView.removeFromSuperview()
    mountedHost = nil
  }
}
