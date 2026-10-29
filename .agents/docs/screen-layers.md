# Screen composition contract

Resolution of [#46](https://github.com/octane-xplat/octane-xplat/issues/46):
`Screen` participates in its parent's layout. Retained screens must use
explicit same-cell layers, as shown in the [public guide](../../docs/app/primitives.md#layer-a-screen-over-retained-content).
The native RootLayout hosts presented overlays; it does not make the Screen
itself an overlay. No automatic reparenting or column-sibling overlay behavior
is introduced. This preserves ordinary layout ownership across web and native.

Source evidence: `packages/ui/src/components/layout/Screen.tsrx` renders a RootLayout with one
Mason content child; `Screen.web.tsrx` renders an ordinary div. ScreenProps
has no row/col placement surface. View wrappers carry placement on the native
Mason boundary and on web.

## Consumer evidence and limits

The supplied Opals evidence reports iPhone 18 Pro simulator, iOS 27,
402 × 874 pt. With MasonKit beta.126, a retained library kept a 539 pt slot
and the player stage began at y=601 with height 874; the confirmation began
at y=911. Beta.110 instead produced stage y=84 with the same height. These
are consumer geometry observations, not a minimal upstream flex-shrink
regression or proof of its cause. No Mason patch is carried for this issue.

Opals verified View layers at row=0,col=0 inside a single-cell Grid on linked
Xplat `e4374a880`: stage y=0–874 and confirmation y=310–564. Its custom inset
Page also needed app-specific negative safe-area margins on the layer wrapper.
Those margins are not a general framework recipe. Same-cell placement covers
the parent's bounds; it cannot repair an already offset or inset app host.
Custom Page/Frame safe-area behavior remains outside this resolution.

## Maintained fixture

UI contributors own [screen-layers.tsrx](../../examples/probes/screen-layers.tsrx)
and its CSS as the retained diagnostic case for this contract. It retains a
flexing library with a 539-unit minimum, mounts a player inside the later
same-cell View, checks both layers and the stage against host bounds, checks
confirmation/control containment, then closes and reopens the player. It
checks library object identity across both cycles. It deliberately does not
pin the unsupported column composition's version-dependent shrink result.

```sh
pnpm probe doctor
pnpm probe run examples/probes/screen-layers.tsrx --target web
pnpm probe run examples/probes/screen-layers.tsrx --target ios --device DEVICE_UDID --watch
pnpm probe run examples/probes/screen-layers.tsrx --target android --device DEVICE_ID --watch
```

Reserve native build/device resources and boot an owned simulator before the
iOS run. Geometry uses window-space coordinates on these three targets;
macOS/Linux are explicitly excluded from this fixture. Passing programmatic
presses checks render lifecycle, not OS hit-testing, focus isolation, or
accessibility. No screenshots are required.

## Verification for this change

On 2026-10-23, the probe passed on Chromium: both layers and the player stage
matched the probe host at (8, 8), 1264 × 539 CSS px, and the confirmation and
Cancel control stayed within it through two open/close cycles. This verifies
same-cell layout against the available host, not a full-window browser shell.
The fixture CSS explicitly makes the web Screen a flex column.

The docs build, recipe/link check, TSX snippet parsing, and fixture formatting
checks passed. iOS and Android were not run in this checkout; native runtime
evidence remains the supplied Opals measurements above. The local resource
broker timed out during availability inspection, and the probe doctor found
no authorized Android device. No screenshots or OS input checks were performed.
