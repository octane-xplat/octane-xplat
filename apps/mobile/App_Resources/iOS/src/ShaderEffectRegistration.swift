import SwiftUI

// Registers the app's stitchable shaders (OctaneShaders.metal) by name for
// @octane-xplat/effects' <ShaderEffect>. Names are runtime strings because
// ShaderLibrary lookups are compile-time — registration is the dispatch
// table. Called lazily from the demo leaf: JS reaches the class by its
// @objc name via globals.
@objc(OctaneShaderEffects)
public final class OctaneShaderEffects: NSObject {
	@objc public static func install() {
		XplatShaderEffectRegistry.register("heatHaze", kind: .distortion) { args in
			ShaderLibrary.octaneHeatHaze(
				.float(args.f("time")), .float2(args.size), .float(args.f("intensity"))
			)
		}
		XplatShaderEffectRegistry.register("sheen", kind: .color) { args in
			ShaderLibrary.octaneSheen(
				.float(args.f("time")), .float2(args.size), .float(args.f("intensity"))
			)
		}
		XplatShaderEffectRegistry.register("shatter", kind: .layer) { args in
			ShaderLibrary.octaneShatter(
				.float2(args.size), .float(args.f("progress"))
			)
		}
	}
}
