/** @jsxImportSource @nativescript-community/octane */
import { ShaderEffect } from '@octane-xplat/effects/ios';
import { Row, Screen, Text, View } from '@octane-xplat/ui';
import { useEffect } from 'octane';

// Swift class from apps/mobile/App_Resources/iOS/src — maps effect names
// onto the app-owned stitchable functions in OctaneShaders.metal.
declare const OctaneShaderEffects: any;

/** Stitchable-Metal probe — each card is real framework content (View/Text
 *  subtree) wrapped in a ShaderEffect that applies the named app shader.
 *  Sweep reads: 'effect-sheen'/'effect-haze' hosts. */
export function EffectsDemo() @{
	useEffect(() => {
		OctaneShaderEffects?.install?.();
	}, []);

	<Screen className="vx-app flex-1 gap-4">
		<Text className="text-xl font-semibold">Shader effects</Text>
		<Row className="gap-4">
			<ShaderEffect
				id="effect-sheen"
				effect="sheen"
				args={{ intensity: 0.8 }}
				style={{ width: 140, height: 80 }}
			>
				<View style={{ width: 140, height: 80, backgroundColor: '#1a1a2e' }}>
					<Text style={{ color: '#FF415A' }}>ember sheen</Text>
				</View>
			</ShaderEffect>
			<ShaderEffect
				id="effect-haze"
				effect="heatHaze"
				args={{ intensity: 1.0 }}
				maxSampleOffset={{ width: 8, height: 8 }}
				style={{ width: 140, height: 80 }}
			>
				<View style={{ width: 140, height: 80, backgroundColor: '#2e1a1a' }}>
					<Text style={{ color: '#fff' }}>heat haze</Text>
				</View>
			</ShaderEffect>
		</Row>
		<Text className="text-sm text-muted">
			Each card's subtree renders into a SwiftUI-hosted view with a
			stitchable Metal shader applied (iOS 17+). Shaders live in the
			app's App_Resources — see OctaneShaders.metal.
		</Text>
	</Screen>;
}
