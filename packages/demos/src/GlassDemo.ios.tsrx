/** @jsxImportSource @nativescript-community/octane */
import { Absolute, HStack, Pressable, Screen, Text, View } from '@octane-xplat/ui';
import { useSignal$ } from 'octane/signals/client';
import { LiquidGlass, LiquidGlassContainer } from '@octane-xplat/ui/ios';

/** Liquid Glass probes — iOS 26+ renders real UIGlassEffect material,
 *  iOS<26 renders system material blur (the merge container stays inert).
 *  Liquid Glass is iOS-authentic: the
 *  components live in @octane-xplat/ui/ios (this leaf is `.ios.tsrx`; web
 *  and Android resolve the shared `GlassDemo.tsrx` fallback instead).
 *  The colored slab behind each glass view is what the material diffracts —
 *  without it glass reads as plain translucency.
 *  Sweep reads: 'glass-regular'/'glass-prop' hosts and their native
 *  UIVisualEffectView roots. */
export function GlassDemo() @{
	const presses$ = useSignal$(0);

	<Screen className="vx-app flex-1 gap-4">
		<Text className="text-xl font-semibold">Liquid Glass</Text>

		{/* Non-interactive glass — child controls do not opt into touch tracking. */}
		<Absolute style={{ height: 140 }}>
			<HStack className="gap-2">
				<View style={{ width: 60, height: 60, backgroundColor: '#e91e63' }} />
				<View style={{ width: 60, height: 60, backgroundColor: '#22c55e' }} />
				<View style={{ width: 60, height: 60, backgroundColor: '#3b82f6' }} />
			</HStack>
			<LiquidGlass id="glass-regular" style={{ margin: 24, padding: 16, borderRadius: 16 }}>
				<Text>regular · non-interactive</Text>
			</LiquidGlass>
		</Absolute>

		<Absolute style={{ height: 100 }}>
			<HStack className="gap-2">
				<View style={{ width: 60, height: 60, backgroundColor: '#f59e0b' }} />
				<View style={{ width: 60, height: 60, backgroundColor: '#8b5cf6' }} />
			</HStack>
			<LiquidGlass id="glass-clear" variant="clear" style={{ margin: 16, padding: 16, borderRadius: 16 }}>
				<Text>clear variant</Text>
			</LiquidGlass>
		</Absolute>

		<Absolute style={{ height: 100 }}>
			<View style={{ backgroundColor: '#0ea5e9' }} />
			<LiquidGlass id="glass-tinted" tint="#dc262688" style={{ margin: 16, padding: 16, borderRadius: 16 }}>
				<Text>tinted glass</Text>
			</LiquidGlass>
		</Absolute>

		{/* Glass as a wrapping element — the shared `glass` prop was fake
		    parity and is gone; the container is the opt-in shape. */}
		<Absolute style={{ height: 100 }}>
			<HStack className="gap-2">
				<View style={{ width: 60, height: 60, backgroundColor: '#e91e63' }} />
				<View style={{ width: 60, height: 60, backgroundColor: '#22c55e' }} />
			</HStack>
			<LiquidGlass id="glass-prop" style={{ margin: 16, padding: 16, borderRadius: 16 }}>
				<Text>glass element</Text>
			</LiquidGlass>
		</Absolute>

		<LiquidGlass id="glass-controls" className="p-4 rounded-xl">
			<Pressable onPress={() => presses$.set(presses$.get() + 1)}>
				<Text>Default glass child: {String(presses$.get())}</Text>
			</Pressable>
		</LiquidGlass>
		<LiquidGlass id="glass-interactive-controls" interactive className="p-4 rounded-xl">
			<Pressable onPress={() => presses$.set(presses$.get() + 1)}>
				<Text>Interactive glass child: {String(presses$.get())}</Text>
			</Pressable>
		</LiquidGlass>

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
