/** @jsxImportSource @nativescript-community/octane */
import { Row, Screen, Text, View, Stack } from '@octane-xplat/ui';
import { LiquidGlass, LiquidGlassContainer } from '@octane-xplat/ui/ios';

/** Liquid Glass probes — iOS 26+ renders real UIGlassEffect material,
 *  iOS<26 renders the inert layouts. Liquid Glass is iOS-authentic: the
 *  components live in @octane-xplat/ui/ios (this leaf is `.ios.tsrx`; web
 *  and Android resolve the shared `GlassDemo.tsrx` fallback instead).
 *  The colored slab behind each glass view is what the material diffracts —
 *  without it glass reads as plain translucency.
 *  Sweep reads: 'glass-regular'/'glass-prop' hosts and their native
 *  UIVisualEffectView roots. */
export function GlassDemo() @{
	<Screen className="vx-app flex-1 gap-4">
		<Text className="text-xl font-semibold">Liquid Glass</Text>

		{/* Interactive glass — the element root IS the effect view. */}
		<Stack style={{ height: 140 }}>
			<Row className="gap-2">
				<View style={{ width: 60, height: 60, backgroundColor: '#e91e63' }} />
				<View style={{ width: 60, height: 60, backgroundColor: '#22c55e' }} />
				<View style={{ width: 60, height: 60, backgroundColor: '#3b82f6' }} />
			</Row>
			<LiquidGlass id="glass-regular" style={{ margin: 24, padding: 16, borderRadius: 16 }}>
				<Text>regular · interactive</Text>
			</LiquidGlass>
		</Stack>

		<Stack style={{ height: 100 }}>
			<Row className="gap-2">
				<View style={{ width: 60, height: 60, backgroundColor: '#f59e0b' }} />
				<View style={{ width: 60, height: 60, backgroundColor: '#8b5cf6' }} />
			</Row>
			<LiquidGlass id="glass-clear" variant="clear" style={{ margin: 16, padding: 16, borderRadius: 16 }}>
				<Text>clear variant</Text>
			</LiquidGlass>
		</Stack>

		<Stack style={{ height: 100 }}>
			<View style={{ backgroundColor: '#0ea5e9' }} />
			<LiquidGlass id="glass-tinted" tint="#dc262688" style={{ margin: 16, padding: 16, borderRadius: 16 }}>
				<Text>tinted glass</Text>
			</LiquidGlass>
		</Stack>

		{/* Glass as a wrapping element — the shared `glass` prop was fake
		    parity and is gone; the container is the opt-in shape. */}
		<Stack style={{ height: 100 }}>
			<Row className="gap-2">
				<View style={{ width: 60, height: 60, backgroundColor: '#e91e63' }} />
				<View style={{ width: 60, height: 60, backgroundColor: '#22c55e' }} />
			</Row>
			<LiquidGlass id="glass-prop" style={{ margin: 16, padding: 16, borderRadius: 16 }}>
				<Text>glass element</Text>
			</LiquidGlass>
		</Stack>

		{/* Merged-glass region — siblings morph together across spacing.
		    AbsoluteLayout host: children position via left/top. */}
		<LiquidGlassContainer id="glass-container" spacing={16} style={{ height: 120 }}>
			<LiquidGlass id="glass-a" left={20} top={20} style={{ width: 120, height: 48, borderRadius: 24 }}>
				<Text style={{ padding: 12 }}>merge A</Text>
			</LiquidGlass>
			<LiquidGlass id="glass-b" left={120} top={40} style={{ width: 120, height: 48, borderRadius: 24 }}>
				<Text style={{ padding: 12 }}>merge B</Text>
			</LiquidGlass>
		</LiquidGlassContainer>
	</Screen>
}
