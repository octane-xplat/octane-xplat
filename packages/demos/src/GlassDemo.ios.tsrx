/** @jsxImportSource @octane-xplat/jsx */
import { Absolute, Center, HStack, Pressable, Screen, Text, View, VStack } from '@octane-xplat/ui'
import { useSignal$ } from 'octane/signals/client'
import { LiquidGlass, LiquidGlassContainer } from '@octane-xplat/ui/ios'

const GLYPH_SIZES = [20, 36, 52]

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
  const presses$ = useSignal$(0)
  const glyphStep$ = useSignal$(0)
  const glyphVisible$ = useSignal$(true)
  const glyphSize = GLYPH_SIZES[glyphStep$.get() % GLYPH_SIZES.length]

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
      <LiquidGlass
        id="glass-clear"
        variant="clear"
        style={{ margin: 16, padding: 16, borderRadius: 16 }}
      >
        <Text>clear variant</Text>
      </LiquidGlass>
    </Absolute>

    <Absolute style={{ height: 100 }}>
      <View style={{ backgroundColor: '#0ea5e9' }} />
      <LiquidGlass
        id="glass-tinted"
        tint="#dc262688"
        style={{ margin: 16, padding: 16, borderRadius: 16 }}
      >
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

    {/* Centered dynamic content — the glass host lays children out with
	    core GridLayout, not Mason flex, so centering styles on the glass
	    element itself do not apply. `glass-centered` lets a `Center`
	    child own flex layout inside the glass; `glass-sibling` keeps the
	    glass childless beside a sized `Center` sibling. Both re-center
	    the glyph on every size change and after hide/reveal. */}
    <HStack className="gap-4" vAlign="center">
      <LiquidGlass id="glass-centered" style={{ width: 140, height: 84, borderRadius: 20 }}>
        <Center>
          @if (glyphVisible$.get()) {
            <View
              id="glass-centered-glyph"
              style={{
                width: glyphSize,
                height: glyphSize,
                borderRadius: glyphSize / 2,
                backgroundColor: '#7c3aed',
              }}
            />
          } @else {
            <Text className="text-sm">hidden</Text>
          }
        </Center>
      </LiquidGlass>
      <Absolute style={{ width: 140, height: 84 }}>
        <LiquidGlass id="glass-sibling" style={{ width: 140, height: 84, borderRadius: 20 }} />
        <Center id="glass-sibling-center" style={{ width: 140, height: 84 }}>
          @if (glyphVisible$.get()) {
            <View
              id="glass-sibling-glyph"
              style={{
                width: glyphSize,
                height: glyphSize,
                borderRadius: glyphSize / 2,
                backgroundColor: '#0ea5e9',
              }}
            />
          } @else {
            <Text className="text-sm">hidden</Text>
          }
        </Center>
      </Absolute>
      <VStack className="gap-2">
        <Pressable onPress={() => glyphStep$.set(glyphStep$.get() + 1)}>
          <Text>Cycle glyph size</Text>
        </Pressable>
        <Pressable onPress={() => glyphVisible$.set(!glyphVisible$.get())}>
          <Text>Hide / reveal glyph</Text>
        </Pressable>
      </VStack>
    </HStack>

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
      <LiquidGlass
        id="glass-a"
        left={20}
        top={20}
        style={{ width: 120, height: 48, borderRadius: 24 }}
      >
        <Text style={{ padding: 12 }}>merge A</Text>
      </LiquidGlass>
      <LiquidGlass
        id="glass-b"
        left={120}
        top={40}
        style={{ width: 120, height: 48, borderRadius: 24 }}
      >
        <Text style={{ padding: 12 }}>merge B</Text>
      </LiquidGlass>
    </LiquidGlassContainer>
  </Screen>
}
