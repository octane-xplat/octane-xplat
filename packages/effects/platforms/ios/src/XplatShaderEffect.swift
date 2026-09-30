import SwiftUI
import UIKit

/// Registry mapping effect names to stitchable shader constructors.
///
/// Stitchable shaders resolve statically — `ShaderLibrary.<name>` is a
/// compile-time symbol — so runtime name dispatch needs a table. The leaf's
/// bundled shaders register themselves via `XplatBundledShaders.install()`
/// on first mount; apps and packages can register more entries from any
/// Swift file in the app target:
///
///   XplatShaderEffectRegistry.register("sheen", kind: .color) { args in
///       ShaderLibrary.octaneSheen(
///           .float(args.f("time")), .float2(args.size), .float(args.f("intensity"))
///       )
///   }
///
/// `args` carries everything the JS side sent as `args`, plus `time`
/// (seconds since the host mounted, injected per frame when `animate` is
/// on) and `size` (the host's CGSize) inserted under those keys.
public enum XplatShaderEffectRegistry {
	public enum Kind: String {
		case distortion, color, layer
	}
	public typealias Factory = ([String: Any]) -> Shader
	static var factories: [String: (kind: Kind, factory: Factory)] = [:]

	public static func register(_ name: String, kind: Kind, _ factory: @escaping Factory) {
		factories[name] = (kind, factory)
	}
}

extension Dictionary where Key == String, Value == Any {
	func f(_ key: String) -> Float {
		(self[key] as? NSNumber)?.floatValue ?? 0
	}
	var size: CGSize {
		(self["size"] as? CGSize) ?? .zero
	}
}

final class XplatShaderEffectModel: ObservableObject {
	@Published var effect = ""
	@Published var viewId = ""
	@Published var animate = true
	@Published var maxSampleOffset = CGSize.zero
	@Published var args: [String: Any] = [:]
}

struct XplatShaderEffectView: View {
	@ObservedObject var model: XplatShaderEffectModel

	/// `time` stays small: TimelineView hands absolute dates, and feeding
	/// seconds-since-2001 straight into a float uniform quantises the
	/// animation into visible steps.
	private let start = Date()

	var body: some View {
		TimelineView(.animation(paused: !model.animate)) { context in
			GeometryReader { geometry in
				shaderApplied(to: content, time: context.date.timeIntervalSince(start), size: geometry.size)
			}
		}
	}

	private var content: NativeScriptView {
		NativeScriptView(id: model.viewId)
	}

	@ViewBuilder
	private func shaderApplied<V: View>(to base: V, time: TimeInterval, size: CGSize) -> some View {
		let merged = shaderArguments(time: time, size: size)
		if let entry = XplatShaderEffectRegistry.factories[model.effect] {
			let shader = entry.factory(merged)
			switch entry.kind {
			case .distortion:
				base.distortionEffect(shader, maxSampleOffset: model.maxSampleOffset)
			case .layer:
				base.layerEffect(shader, maxSampleOffset: model.maxSampleOffset)
			default:
				base.colorEffect(shader)
			}
		} else {
			base
		}
	}

	private func shaderArguments(time: TimeInterval, size: CGSize) -> [String: Any] {
		var merged = model.args
		merged["time"] = time
		merged["size"] = size
		return merged
	}
}

@objc(XplatShaderEffectProvider)
public class XplatShaderEffectProvider: UIViewController, SwiftUIProvider {
	private let model = XplatShaderEffectModel()

	public required init() {
		super.init(nibName: nil, bundle: nil)
	}

	public required init?(coder: NSCoder) {
		super.init(coder: coder)
	}

	public override func viewDidLoad() {
		super.viewDidLoad()
		XplatBundledShaders.install()
		setupSwiftUIView(content: XplatShaderEffectView(model: model))
	}

	public func updateData(data: NSDictionary) {
		if let name = data["effect"] as? String { model.effect = name }
		if let viewId = data["viewId"] as? String { model.viewId = viewId }
		if let animate = data["animate"] as? NSNumber { model.animate = animate.boolValue }
		if let args = data["args"] as? NSDictionary { model.args = args.nsToSwiftDictionary }
		if let offset = data["maxSampleOffset"] as? NSDictionary,
			let width = offset["width"] as? NSNumber,
			let height = offset["height"] as? NSNumber {
			model.maxSampleOffset = CGSize(width: width.doubleValue, height: height.doubleValue)
		}
	}

	public var onEvent: ((NSDictionary) -> Void)?
}
