# Routing transition engines

The portable request selects a typed name. Each platform leaf supplies an effect
or an explicit skipped fallback. Preparation, route commitment and animation
settlement are separate milestones; a visual failure does not undo commitment.
See [the app guide](../../../docs/app/navigation.md#animate-browser-navigation)
and [qualification commands](../navigation-checks.md).

## Browser CSR

The host stages a hidden candidate, then starts View Transitions after guards,
loaders and renderer readiness. It claims the route inside the update callback,
flushes visible DOM, applies history/head/scroll effects and reports commitment.
Animation has its own `finished` result. A later navigation interrupts motion;
it cannot make an obsolete callback current again.

The [View Transitions specification](https://drafts.csswg.org/css-view-transitions-1/#view-transitions-enhancement)
requires skipped transitions to execute the update callback. Xplat therefore
rechecks request version, mounted owner and disposal inside that callback.
Unsupported typed CSS effects and reduced-motion preferences skip animation.
The production Chromium fixture covers actual callback timing, reverse CSS
types, modal background identity and overlapping effects. No SSR host is needed.

## NativeScript Frame

The installed package is NativeScript Core **9.1.3**, with the repository patch
in `packages/cli/patches/@nativescript__core@9.1.3.patch`. The published package's
`gitHead` is **45b3b99afd89f19e799da84203aa19d673f7b20a**; its
[pinned metadata](https://github.com/NativeScript/NativeScript/blob/45b3b99afd89f19e799da84203aa19d673f7b20a/packages/core/package.json)
confirms that version. The source cache labeled 9.1.3 contained 9.1.4-next.0
metadata, so it was not used as version-matched proof. Exact-commit source was
fetched separately before implementation. Local patches remain part of runtime
qualification; upstream source alone is not an executed Xplat test.

A native definition creates a `NavigationTransition` once per opened Frame
entry. Its custom `Transition` instance stays with NativeScript's entry. The
[iOS Frame](https://github.com/NativeScript/NativeScript/blob/45b3b99afd89f19e799da84203aa19d673f7b20a/packages/core/ui/frame/index.ios.ts)
selects the departing controller's recorded transition on Back. Android
[creates and retains reverse animators](https://github.com/NativeScript/NativeScript/blob/45b3b99afd89f19e799da84203aa19d673f7b20a/packages/core/ui/frame/fragment.transitions.android.ts)
when preparing the native transition. The pinned iOS Frame invokes
`iosNavigatedController`; overriding the older `animateIOSTransition` method
alone does not instrument or implement that engine hook, despite its continued
presence in declarations. The maintained native fixture tests the current hook.
Xplat leaves this reversal with the engine;
it does not rerun an application factory for Back or rewrite private caches.

The helper imports NativeScript options from the explicit declaration entry. A
NodeNext consumer could not resolve `NavigationTransition` through Core's root
re-exports; skipped dependency checks hid that error and weakened the callback
return. The maintained published-consumer fixture rejects asynchronous factories
and preserves NativeScript option fields without importing its runtime.

NativeScript's `navigatedTo` receipt confirms the native Page and navigation
operation. By that point the native animation may already have completed, so
native commitment and `finished` can settle together. They remain separate API
results. Factory failures select unanimated navigation and return a failed motion
result after successful commitment. Reduced motion is sampled when selecting an
entry's effect; the engine owns replay of that retained effect on Back.

## Modal and rendered-pane subsets

**Verified upstream source limit:** Android custom modal transitions are not
implemented in this pinned NativeScript release. Its
[`ModalTransition` class](https://github.com/NativeScript/NativeScript/blob/45b3b99afd89f19e799da84203aa19d673f7b20a/packages/core/ui/transition/modal-transition.android.ts)
reports unsupported behavior, and the Android modal-view path does not consume
`ShowModalOptions.transition`. On iOS the option runs through the
`SharedTransition` engine, which does not map the flat router-owned value
vocabulary. Xplat therefore presents routed modals with `animated: false` and
never passes `ShowModalOptions.transition`; this is a deliberate local
workaround, not upstream support.

The `view` option on `defineNativeTransition` is the qualified local path for
routed modal surfaces and retained rendered panes. After `showModal` returns
`animated: false` (or a pane mounts), the router applies the flat starting
values (`opacity`, `translateX`/`translateY`, `scaleX`/`scaleY`, `rotate`) as
View properties on a router-owned wrapper — the modal's GridLayout host or the
pane's `masonview`, which is MasonKit's `View` and therefore an
`@nativescript/core` `View` — then runs the SDK `Animation` engine to neutral.
Dismissal, replacement or disposal interrupts and restores neutral values.
Unspecified axes start at neutral. Built-in `fade` animates content opacity for
240 ms. Native GTK and NativeScript-for-Windows resolve the unsuffixed
skip executor and report `skipped`/`unsupported` for `view` definitions; no VM
qualifies the Windows path.

## AppKit retained-pane executor

`defineAppKitTransition` animates the incoming retained NSView wrapper after its
visible renderer receipt. It reuses UI's `createAnimatedValue` and the existing
AppKit property writer, with explicit numeric samples and disabled implicit
layer actions. It adds no dependencies. Each flow owns a coordinator and its
native wrapper refs; replacement, outlet removal and instance disposal stop
controllers, restore neutral values and settle `finished`. Back selects the
leaving entry's stored definition while animating the retained incoming view.
Refresh skips motion. Routed AppKit modals run the same coordinator on the
surface's content `NSView` (the `createContentRoot` target) after `show()`;
close/dispose interrupts. This is incoming linear motion, not
outgoing snapshots, interactive Back or custom panel presentation.

**Observed bridge limit, 2026-10-20:** in the installed macOS
NativeScript/JavaScriptCore host (pinned `nativescriptRuntimes` commit
`5b697b393152f973dd392851fd72dacf03a7a0c9` in the checksum-verified host
manifest), `NSAnimationContext.runAnimationGroupCompletionHandler`
with `view.animator().alphaValue = 1` completed its callback without moving a
mounted view from opacity 0.2. The probe enabled layers and read native, layer
and presentation opacity; all remained 0.2. Artifacts:
`research/routing-cutover/appkit-route-animation-probe-2.log` and
`appkit-route-animation.macos.tsrx`. This is runtime evidence for that exact
property-proxy path, not proof that all AppKit/Core Animation APIs fail. No
upstream patch is added. The numeric controller is the qualified local path;
retest the proxy assignment before replacing it after a host upgrade.

`node apps/macos/test/verify-routing.mjs` passed 202 checks with the new
public-import fixture. New assertions read intermediate native opacity,
settled identity/translation, separate commitment/completion, reverse Back,
replacement, failure, concurrent flows and owner disposal. Deterministic tests
also cover invalid values, reduced-motion changes and stale timer cleanup.
These are native property/controlled-callback checks, without OS input,
screenshots or frame-pacing qualification. Scheduling uses 16ms main-run-loop
timers rather than a display link.
