# Motion compatibility

The behavioral reference is `@octanejs/motion` source package version 0.1.56,
inspected from Octane main on 2026-09-29. Its UPSTREAM.md pins Motion 12.42.2
(commit `40e8756c63b258c9dd07de9501cb788410eefb02`). This package pins
`motion-dom@12.42.2` and bundles its pure numeric generators and interpolation.
The adapter is original code; it does not copy upstream's DOM host factory.

| Contract                                         | Upstream reference under packages/motion                          | Xplat implementation / evidence                                                                   |
| ------------------------------------------------ | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Initial and changing targets, equal destinations | src/index.ts; tests/conformance/rerender.test.ts, effects.test.ts | Compiled wrappers over UI; components.web.test.tsrx                                               |
| Numeric spring/tween samples                     | Motion's motion-dom animation/generators                          | Reused generators; engine.test.ts compares irregular-time samples                                 |
| Stable value, subscriptions, style replacement   | src/useMotionValue.ts; tests/conformance/motionValue.test.ts      | Numeric adapter with native clock; components.web.test.tsrx                                       |
| Spring set versus jump; follow source            | src/useSpring.ts; tests/conformance/useSpring.test.ts             | Owned spring interception and cleanup; hook tests                                                 |
| Derived numeric values                           | src/useTransform.ts; tests/conformance/useTransform.test.ts       | Upstream interpolation, direct subscriptions; hook tests                                          |
| Config and reduced motion                        | src/context.ts; tests/conformance/reducedMotionConfig.test.ts     | Context inheritance; transforms settle immediately, opacity may animate                           |
| Exit lifecycle                                   | src/index.ts; tests/conformance/exit.test.ts                      | Deliberate live-subtree retention on both leaves; presence.web.test.tsrx and native presence test |
| Retained hosts on native                         | Not a DOM binding concern                                         | components.mobile.test.tsrx uses the universal object driver                                      |

Source links: [Octane motion](https://github.com/octanejs/octane/tree/main/packages/motion),
[upstream ledger](https://github.com/octanejs/octane/blob/main/packages/motion/UPSTREAM.md),
[Motion pin](https://github.com/motiondivision/motion/tree/40e8756c63b258c9dd07de9501cb788410eefb02).

## Deliberate boundaries

- Numeric values only. No CSS strings, keyframe arrays, variants, layout,
  gesture presets, declarative drag, or broad framework-neutral re-export.
- Host APIs use shared UI names rather than DOM tags. Existing UI props remain
  available; motion owns transform channels and opacity. Put pre-existing CSS
  transforms on an outer container. Conflicting writers are errors.
- `set` on a plain value stops its current animation, making gesture takeover
  explicit and immediate. A spring value intercepts `set`; `jump` stops and snaps.
- MotionConfig defaults to `reducedMotion="never"`, matching the reference;
  choose `user` for system preferences. Config does not cross separate roots and
  does not alter imperative value.animate calls: consult useReducedMotion there.
- Timing uses a platform clock. NativeScript exposes frame scheduling through a
  module; Motion's scheduler captures a global rAF and its values use browser
  timing globals. The numeric adapter avoids changing application globals.
- The same generator runs on web/native. WAAPI and native Animation acceleration
  are deferred until interruption and transform composition preserve this contract.
- Springs are physical (not duration/bounce based); duration belongs to tweens.
  Default declarative transition is a 0.3-second easeInOut tween. Targets are
  absolute; scale multiplies scaleX/scaleY. Opacity is clamped to 0–1 at the host. Reduced transforms have no delay.

## Presence divergence

`Presence present={...}` retains actual components and their state/subscriptions
until all registered exits finish. Upstream's `AnimatePresence` is a passthrough
and exiting DOM hosts clone themselves during cleanup. We deliberately do not
reuse that path or claim its cleanup timing. Presence renders an explicit View
wrapper, blocks interaction during exit, and restores interaction on reversal.
An ancestor unmount always disposes immediately. Nested boundaries are independent.

## Verification limits

Unit and DOM tests establish bounded behavior, not full Framer Motion parity.
Universal object-driver tests establish retention and lifecycle without an OS.
Partial device observations are recorded in the
[motion v1 validation matrix](../../docs/animation-notes.md). After the
platform split, an isolated iOS 26.5 MotionProbe run verified pan completion
and cancellation, Presence focus/reversal/removal, and live Reduce Motion,
including immediate transform settlement. The API 35 Android emulator verified
tween/spring completion, cancellation, disposal, pan phase delivery, focus
release on Presence exit, and live reduced-motion observation. Changing
`animator_duration_scale` to `0` while mounted changed the probe state to
reduced, and a subsequent idle snapshot showed the `-100` tween destination;
deleting the setting restored the default and the state returned to normal.
The idle snapshot does not establish frame-accurate settlement time. Its
injected pan release reported zero velocity, and the accessibility runner did
not reach idle during reversal, so those checks remain open. Physical Android
CPH2551 evidence covers app launch and the target retarget only; the handset is
currently disconnected. The physical iPhone IPA
installed but did not launch because the phone was locked. The normal iOS mobile
entry currently aborts in `AuthSessionPresentationAnchor` with
`NativeClass is not defined`, so the latest simulator and emulator runs used a
temporary direct MotionProbe entry. Background/resume and frame pacing remain
uncharacterized. Native preference observation polls at 500 ms while subscribed
and refreshes on resume; Android reads `animator_duration_scale`.
