#include <metal_stdlib>
#include <SwiftUI/SwiftUI_Metal.h>
using namespace metal;

// Stitchable shaders for SwiftUI's `.distortionEffect` / `.colorEffect` (iOS 17+).
// SwiftUI supplies the leading parameters — `position` for a distortion, plus
// `color` for a colour effect — and appends the arguments passed at the call
// site in `OctaneLogo.swift`.

/// Rising heat haze.
///
/// A distortion shader maps a destination pixel back to the source pixel it
/// should sample, so the returned offset reads as the image bending. Amplitude
/// is weighted by `base^2` (1 at the bottom, 0 at the top) so the mark shimmers
/// like air over hot metal instead of wobbling as a rigid block, and the two
/// waves use incommensurate frequencies so the pattern never visibly repeats.
[[ stitchable ]] float2 octaneHeatHaze(float2 position, float time, float2 size, float intensity) {
	float2 uv = position / size;
	float base = 1.0 - uv.y;
	float wave = sin(uv.y * 26.0 - time * 3.1) * 0.6
	           + sin(uv.y * 11.0 - time * 1.9 + uv.x * 4.0) * 0.4;
	float amp = 2.4 * base * base * intensity;
	return position + float2(wave * amp, 0.0);
}

/// Ember sheen sweeping diagonally across the ink.
///
/// SwiftUI hands colour effects premultiplied alpha, so the colour has to be
/// un-premultiplied before mixing and re-premultiplied on the way out —
/// blending straight into premultiplied RGB would bleed the highlight into the
/// transparent surround and halo the glyph edges.
[[ stitchable ]] half4 octaneSheen(float2 position, half4 color, float time, float2 size, float intensity) {
	if (color.a < 0.004h) {
		return color;
	}
	half3 rgb = color.rgb / color.a;

	float2 uv = position / size;
	float sweep = fract(time * 0.22);
	float d = (uv.x * 0.85 + (1.0 - uv.y) * 0.35) - (sweep * 1.8 - 0.4);
	float band = exp(-(d * d) * 42.0);

	half3 ember = half3(1.0h, 0.255h, 0.353h); // the logo's #FF415A accent
	half3 gold = half3(1.0h, 0.72h, 0.36h);
	half3 hot = mix(ember, gold, half(band));

	half glow = half(band) * half(intensity);
	rgb = mix(rgb, hot, glow * 0.9h);
	rgb += half3(glow * 0.25h);

	return half4(saturate(rgb) * color.a, color.a);
}

/// Per-shard pseudo-random pair. Deterministic in the cell index, so a shard
/// keeps the same trajectory for the whole burst instead of jittering per frame.
static inline float2 shardNoise(float2 cell) {
	float3 a = fract(float3(cell.xyx) * float3(0.1031, 0.1030, 0.0973));
	a += dot(a, a.yzx + 33.33);
	return fract(float2((a.x + a.y) * a.z, (a.x + a.z) * a.y));
}

/// Ignition burst: the mark shatters outward and reassembles.
///
/// A layer effect (rather than a distortion) because each shard has to read
/// from somewhere else in the image: sampling `position - offset` with an
/// offset that is constant across a grid cell translates that whole cell as a
/// rigid chip, which is what reads as breaking apart. A distortion shader can
/// only nudge its own pixel, so it smears instead of shattering.
///
/// `progress` runs 0 -> 1 once per burst and the displacement rides
/// `sin(p * pi)`, so the shards fly out and land back exactly where they
/// started — no separate reassembly pass, and the mark cannot get stranded
/// mid-explosion if a frame is dropped.
[[ stitchable ]] half4 octaneShatter(float2 position, SwiftUI::Layer layer, float2 size, float progress) {
	if (progress <= 0.0001) {
		return layer.sample(position);
	}

	float p = clamp(progress, 0.0, 1.0);
	float fly = sin(p * M_PI_F);
	float ease = fly * fly;

	float2 cells = float2(22.0, 5.0);
	float2 cellSize = size / cells;
	float2 rnd = shardNoise(floor(position / cellSize));

	float2 centre = size * 0.5;
	float2 radial = (position - centre) / max(size.x * 0.5, 1.0);
	float2 dir = radial + (rnd - 0.5) * 0.9;
	float len = max(length(dir), 0.0001);
	dir /= len;

	// Capped so the outermost shards stay inside the host view; anything
	// travelling further is clipped by its bounds rather than fading out.
	float2 offset = dir * mix(22.0, 70.0, rnd.x) * ease;
	offset.y += (rnd.y - 0.5) * 42.0 * ease;
	float2 src = position - offset;

	// Chromatic split along the flight path — the shards read as moving fast
	// rather than merely being displaced.
	float split = ease * 3.5;
	half4 cr = layer.sample(src + dir * split);
	half4 cg = layer.sample(src);
	half4 cb = layer.sample(src - dir * split);
	half alpha = max(max(cr.a, cg.a), cb.a);
	if (alpha < 0.004h) {
		return half4(0.0h);
	}
	half3 rgb = half3(cr.r, cg.g, cb.b) / alpha;

	// Expanding shockwave ring, brightest just after the tap.
	float ring = exp(-pow((length(radial) - p * 1.5) * 5.0, 2.0)) * (1.0 - p);

	half3 ember = half3(1.0h, 0.255h, 0.353h);
	half3 gold = half3(1.0h, 0.78h, 0.35h);
	half heat = half(ease);
	// Ember-leaning, and only a partial mix: pushing all the way to `hot` turns
	// every shard the same flat gold and the mark stops being recognisable
	// mid-flight. Holding some ink back keeps them reading as burning pieces
	// of the logo.
	half3 hot = mix(ember, gold, heat * 0.75h);

	rgb = mix(rgb, hot, heat * 0.6h);
	rgb += half3(heat * 0.18h * half(rnd.x) + half(ring) * 0.45h);

	alpha *= 1.0h - heat * 0.2h;
	return half4(saturate(rgb) * alpha, alpha);
}
