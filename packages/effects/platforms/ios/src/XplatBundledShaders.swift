import SwiftUI

/// Registers the leaf's bundled stitchable shaders under the names
/// <ShaderEffect> uses. Plugin-dir `.metal` sources land in the app target's
/// Resources phase — the CLI only places recognised source extensions in
/// Sources — so the library ships precompiled: `OctaneShaders.metallib`
/// (device) / `OctaneShaders.sim.metallib` (simulator) under
/// `platforms/ios/Resources`, rebuilt by `scripts/build-metal.sh` from
/// `metal/OctaneShaders.metal`.
///
/// Called from `XplatShaderEffectProvider.viewDidLoad`, so registration is
/// in place before the first factory lookup — apps need no Swift code of
/// their own. Apps can still register additional names on
/// `XplatShaderEffectRegistry` with their own `ShaderLibrary`.
enum XplatBundledShaders {
	private static let library: ShaderLibrary? = {
		#if targetEnvironment(simulator)
		let resource = "OctaneShaders.sim"
		#else
		let resource = "OctaneShaders"
		#endif
		guard let url = Bundle.main.url(forResource: resource, withExtension: "metallib") else {
			return nil
		}
		return ShaderLibrary(url: url)
	}()

	private static var installed = false

	static func install() {
		guard !installed else { return }
		installed = true
		guard let library else { return }

		register(library, "heatHaze", kind: .distortion, function: "octaneHeatHaze") { fn, args in
			fn(.float(args.f("time")), .float2(args.size), .float(args.f("intensity")))
		}
		register(library, "sheen", kind: .color, function: "octaneSheen") { fn, args in
			fn(.float(args.f("time")), .float2(args.size), .float(args.f("intensity")))
		}
		register(library, "shatter", kind: .layer, function: "octaneShatter") { fn, args in
			fn(.float2(args.size), .float(args.f("progress")))
		}
	}

	private static func register(
		_ library: ShaderLibrary,
		_ name: String,
		kind: XplatShaderEffectRegistry.Kind,
		function: String,
		_ call: @escaping (ShaderFunction, [String: Any]) -> Shader
	) {
		let shaderFunction = library[dynamicMember: function]
		XplatShaderEffectRegistry.register(name, kind: kind) { args in
			call(shaderFunction, args)
		}
	}
}
