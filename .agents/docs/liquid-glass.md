# LiquidGlass layout ownership

Read this when changing the iOS material adapter, Mason native hosting, or the
renderer recognition of custom layout containers. The app-facing contract and
examples live in [the material guide](../../docs/app/liquid-glass.md).

## One node, native effect root

LiquidGlass inherits the registered Mason view's `materialViewClass`. That
iOS-only capability creates a `MasonMaterialUIView`: a UIVisualEffectView that
owns one Mason node and defaults to block. The ordinary Mason measurement,
style helper, child list and layout application remain the layout engine.
The adapter fails explicitly if the installed engine lacks this capability;
do not restore a GridLayout fallback or forward selected layout styles.

UIKit children belong directly in the effect's `contentView`. Native insertion,
removal and logical-parent detection must treat this host as transparent. In
particular, a Mason child under contentView is not a new foreign-root layout.
A noninteractive decoration view shares the owning node solely to paint the
existing Mason background and border. It creates no second node, padding or
measurement pass. Its native child offset must stay consistent with indexed
insertion and reordering.

LiquidGlassContainer uses the same native root so its glass children retain
UIKit's direct effect-content hierarchy. Its layout gap and UIKit effect
grouping spacing remain separate settings. Do not insert another layout root
between the container's contentView and its glass children to correct geometry.

## Material, clipping and lifecycle

Native material corner shaping and CSS child overflow have separate jobs.
On iOS 26+, the native root uses UIKit corner configuration for circular corner
radii. Mason applies explicit overflow clipping to that root. An unconditional
radius mask would clip visible child overflow; an ancestor mask above a separate
effect sibling violates UIKit's supported effect hierarchy. Do not reintroduce
either workaround. Native corner configuration currently takes each resolved
horizontal radius and does not implement elliptical material corners. Older-system
material corner shaping also remains a gap. Neither is qualified by current
geometry tests; do not claim equivalent material shapes.

Keep NativeScript's native glass property helper for tint, variant, animation
and interaction changes. Earlier supported systems receive SystemMaterial blur
both at native creation and property replay. The grouping fallback is an inert
layout host. Default glass interaction remains false. Object tests and UIKit
hitTest checks cannot establish OS child-input delivery for either mode.

## Where to verify

- Adapter and effect replay: `packages/ui/tests/liquid-glass.ios.test.mjs`.
- Real component geometry, resize, intrinsic content and lifecycle:
  `packages/ui/tests/fixtures/liquid-glass.ios.tsrx`.
- Actual HID child presses: `tools/probe/liquid-glass-input.ios.mjs`.
- Native host geometry and clipping: the local Mason checkout's
  `tools/mason-core/ios-host-tests.swift`, focused `test.host.ios.material` target.
- Reader coverage: [LiquidGlass recipe](recipes/liquid-glass.md).

Use [the local core link](../../links/README.md) after rebuilding native source,
generated declarations and the package. Linking alone does not update an app's
native binary. Normal dependency pins must include the material capability
before the framework cutover can ship. Keep actual target results and outstanding
runtime gaps in Silo and local reports, separate from these implementation rules.
