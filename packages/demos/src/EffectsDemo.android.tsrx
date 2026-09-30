/** @jsxImportSource @nativescript-community/octane */
import { ShaderEffect } from '@octane-xplat/effects/android';
import { Screen, Text, View } from '@octane-xplat/ui';

// AGSL heat haze — same effect as the iOS leaf's bundled octaneHeatHaze,
// ported to Android's runtime-shader dialect. The view's content samples
// through `content.eval`.
const HAZE = `
uniform shader content;
uniform float2 size;
uniform float time;

half4 main(float2 fragCoord) {
	float2 uv = fragCoord / size;
	float base = 1.0 - uv.y;
	float wave = sin(uv.y * 26.0 - time * 3.1) * 0.6
	           + sin(uv.y * 11.0 - time * 1.9 + uv.x * 4.0) * 0.4;
	float amp = 2.4 * base * base;
	return content.eval(fragCoord + float2(wave * amp, 0.0));
}
`;

/** RuntimeShader probe — the card's subtree renders through a RenderEffect
 *  (AGSL, API 33+). Sweep reads: 'effect-haze' host. */
export function EffectsDemo() @{
	<Screen className="vx-app flex-1 gap-4">
		<Text className="text-xl font-semibold">Shader effects</Text>
		<ShaderEffect
			id="effect-haze"
			source={HAZE}
			style={{ width: 300, height: 80 }}
		>
			<View style={{ width: 300, height: 80, backgroundColor: '#2e1a1a' }}>
				<Text style={{ color: '#fff' }}>heat haze (AGSL)</Text>
			</View>
		</ShaderEffect>
		<Text className="text-sm text-muted">
			AGSL RuntimeShader via RenderEffect — Android 13+ only; older
			devices render the subtree untouched.
		</Text>
	</Screen>;
}
