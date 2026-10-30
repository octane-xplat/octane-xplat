# Primitive implementation constraints

Use the [component guide](../../../docs/app/components.md) and
[primitive skill reference](../../skills/octane-xplat/references/primitives.md)
for supported APIs. This note carries implementation constraints that are easy
to lose when changing the native driver. It does not duplicate the API inventory
or retain superseded prop sketches.

## Driver semantics

Read [driver semantics](../../skills/octane-xplat/references/primitives/driver-semantics.md)
before changing parenting, slots, event aliases, or native prop writes. Text
children require a text host; arbitrary layouts do not render bare text. Native
props assign view properties, not DOM attributes. A prop write can echo an event;
the driver's pending-write suppression owns that echo, not ad hoc leaf guards.

Native portals distinguish component-owned hosts from ownerless services. Use
[portal boundaries](portal-boundaries.md) for root selection, context, and lifetime.
A TSRX expression tail is a statement; output needs a node such as a fragment.
The missing diagnostic is tracked by [Octane #1258](https://github.com/octanejs/octane/issues/1258).

## Liquid Glass measurement

Core 9.1.3's `LiquidGlass`/`LiquidGlassContainer.onMeasure` zero effective padding
and border before delegating. Parents pass border-box sizes, so this measures
content too wide and layout then clips it. Local subclasses in
`packages/ui/src/ios/` call the base GridLayout/AbsoluteLayout measure paths
while retaining core's local-coordinate layout and transform normalization.
Remove these overrides when core drops the padding-zeroing behavior; upstream
tracking is [#11561](https://github.com/NativeScript/NativeScript/issues/11561)
and [#11562](https://github.com/NativeScript/NativeScript/pull/11562).

The foreign-parent → Mason-child max-content case is separate (Xplat #38): an
auto-width glass can retain a padding-only size after a Mason child initially
reports zero. Give that glass a definite width until the measurement bridge is
fixed. Geometry tests do not establish interactive child touch delivery.
Current API, fallback, and interaction defaults belong in the
[Liquid Glass guide](../../../docs/app/liquid-glass.md).

## VirtualList evidence boundaries

Use the [VirtualList guide](../../../docs/app/virtual-list.md) for the supported
windowing/scroll contract and [RecyclingList design](../../design/recycling-list.md)
for lifecycle ownership. Keyed windowing is not native view recycling. Preserve
row identity, viewport anchoring during prepend/remeasure, scroll-unit conversion,
and cleanup independently of throughput work.

A mounted row does not establish that an out-of-window seek put it in the
viewport. Measure visible coverage and readiness latency separately. JavaScript
poll intervals are not frame pacing; bounded mounted counts are not process
memory measurements. Variable-height momentum, hardware input, and long-session
memory require their own target evidence.

The [native host integration](masonkit-layout-evaluation.md#native-host-integration)
contract applies when list fixtures change engine packages or aliases.

## Accessibility busy state

Core 9.1.3's `AccessibilityState` is one enum
(`selected | checked | unchecked | disabled`), not independent ARIA booleans; it
has no `busy` member. `nativeAccessibilityState` in `escape-props.ts` ignores
unsupported states and selects the strongest mapped state. The native Button
uses disabled state plus `accessibilityValue: 'Loading'` while busy. Revisit the
mapping if upstream adds a busy state or per-platform traits. Screen-reader
behavior still requires actual assistive-technology verification.

## Evidence lookup

Historical list profiles, driver experiments, and original design sketches are
preserved under Silo `local_artifacts` key `.agents/docs/notes/primitive-notes.md`.
Use [operational evidence](../exploration.md#operational-evidence) for lookup;
consult current qualification rows rather than treating a historical pass as
current performance or accessibility support.
