# Software keyboard ownership

Decision #119 defines the ownership boundary for keyboard avoidance, scrolling,
sticky controls, and chat integration. The [keyboard evidence record](../docs/keyboard.md)
owns platform qualification and upstream limitations.

## Package boundary

`@octane-xplat/platform` owns a synchronous, renderer-independent registry keyed
by the actual host window. `@octane-xplat/ui` supplies compatibility adapters for
its existing keyboard APIs. An opt-in `@octane-xplat/keyboard` leaf owns the
additional native tracking lifecycle and keyboard-aware components. Its direct
workspace dependencies can include both platform and ui; neither package
depends on the keyboard leaf.

| Owner | Responsibility |
| --- | --- |
| platform | Window state, subscriptions, driver activation and replacement; no DOM or SDK objects in shared implementation code |
| ui | Existing inset/avoidance compatibility, safe-area consumption, and bottom-overlay bindings |
| keyboard | UIKit tracking views/display links, Android inset-animation and focused-input observation, web viewport/input adapters, and their component bindings |
| sheet and other presentations | Preserve their host lifecycle and platform avoidance; consumers bind through the actual presented content window |

This leaf owns a separate OS observation lifecycle, rather than extracting
dependency-free UI solely because its API is specialized. It does not adopt
React Native, Reanimated, keyboard-view discovery, delegate replacement, or
method swizzling. Existing asynchronous desktop host messages are unsuitable
for the synchronous movement path.

## Measurements and state

A window identity is opaque to shared code: UIWindow on iOS, the owning decor
root on Android (including dialog roots), and the actual owner window for DOM
and AppKit adapters. Never substitute the foreground Activity for a supplied
dialog host. Compatibility reads with no supplied host may use the current
application window; host-bound components resolve their own window.

Geometry uses device-independent window coordinates. Time metadata uses
milliseconds. Actual measured frames and destination frames are distinct; a
destination notification must not become a fabricated sequence of current
frames. Unknown geometry is distinct from a measured hidden keyboard.

```ts
// Internal measurement model; not a proposed consumer import surface.
type Rect = { x: number; y: number; width: number; height: number }
type FrameSource = 'unknown' | 'destination' | 'native-frames'
type Phase = 'idle' | 'start' | 'move' | 'interactive' | 'end'
interface KeyboardMeasurement {
	currentFrame: Rect | null
	targetFrame: Rect | null
	source: FrameSource
	phase: Phase
	timestampMs: number
	durationMs: number | null
}
```

Focused-input identity, bounds, and available caret bounds are a separate stream
in the same window scope. Observation does not collect input text. Input removal,
window replacement, and host detachment invalidate the corresponding identity.
Capabilities distinguish input-box geometry from caret geometry and discrete
notifications from measured movement. Interactive and floating-keyboard support
must be qualified separately from ordinary opening and closing.

## Ownership and cleanup

Every active window has one selected observation driver. Multiple readers share
it, including readers from separate Octane roots. Installing the optional driver
replaces the compatibility observer for active windows; releasing the final
activation restores the fallback when readers remain. Repeated activation of
the same driver must not restart it. Old-generation callbacks cannot update a
replacement driver or a released window.

The first consumer attaches the source; the final consumer releases it and its
retained native references. Releasing a subscription is idempotent. Subscribers
receive available current state, including a keyboard already open when the
native adapter can measure it. A host changing windows releases its former
ownership before binding the replacement.

Android window-mode leases belong to the consumers requesting resize behavior,
independently of observation-driver replacement. Restore a captured mode only
when the current mode is still the leased value; another owner's write wins.
Read-only tracking must not mutate an unrelated Activity or dialog window.

## Layout and animation

Native movement bindings update owned host properties directly. Component
rendering and settled state subscriptions must not be the animation clock.
Properties restored on unbind are limited to those still owned by the binding;
foreign transform/style writes must survive cleanup.

Avoidance is computed for the actual host rectangle, with safe-area space,
ancestor avoidance, and actual native resizing consumed once. Declaring
`adjustResize` is insufficient evidence that a host was resized. Preserve the
existing meaning of `keyboardVerticalOffset`; coordinate conversion is separate.

Container avoidance, focused-input scrolling, and sticky positioning remain
distinct policies over the same measurements. Scrollable range and content
position are distinct too: extending the range must keep every item reachable
without unnecessary child-layout changes. Any inset implementation must account
for native scroll range/clamping semantics, not just assign an inset.

Chat uses one end-of-content definition for follow policy and jump-to-latest
state. Composer growth, streaming output, history prepend, and keyboard changes
preserve the selected reading anchor. Native presentations continue owning their
system avoidance; the keyboard adapter compensates only for remaining overlap.

## Compatibility and qualification

Existing `KeyboardAvoiding`, `useKeyboardInset`, and overlay behavior remain
available without installing the leaf. The hardware-key `useKeyboard` retains
its existing meaning. Disabled consumers retain their layout wrapper without
starting keyboard observation or acquiring an Android resize lease.

New platform variants expose identical names and public types. Web viewport
changes are not proof of an IME; unavailable caret geometry is explicit. Desktop
software-keyboard behavior remains neutral unless an actual supported mechanism
is demonstrated. A capability and its documented behavior must agree.

The initial native probes establish callback bridges, window/input geometry,
iOS opening presentation samples and simulator touch delivery, Android IME
animation callbacks, and AppKit neutral behavior. They do not qualify the final
components. Interrupted/interactive transitions, already-open attachment,
floating keyboards, resize/navigation configurations, presentation windows,
scroll hit-testing, and cross-feature journeys remain implementation gates.
