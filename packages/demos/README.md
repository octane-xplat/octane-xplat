# `@xplat/demos`

Seam-by-seam demo screens for the xplat harness — the maintained examples
that each framework feature points at. Private; never published. The
[`@xplat/app`](../app/README.md) harness routes to them, and the evidence
capture sweep renders them for fixtures.

Two groups:

- **Standalone examples** — `Counter`, `Stopwatch`, `Todo`, `TicTacToe`,
  `WatchFace`, `Dialer`, `Weather`, `VirtualList`, `Reorder`.
- **Feature demos** — one per seam: `LayoutDemo`, `ListDemo`,
  `ScrollBoxDemo`, `PullRefreshDemo`, `ControlsDemo`, `ModalDemo`,
  `OverlayDemo`, `SegmentedDemo`, `SearchDemo`, `PropsDemo`,
  `ReactiveProbe`, `AnimShowcase`, `DeviceDemo`, `AuthDemo`, `PushDemo`,
  `CanvasDemo`, `CameraDemo`, `VideoDemo`, `LottieDemo`,
  `AnimatedImageDemo`, `EffectsDemo`, `GlassDemo`, `PagerDemo`,
  `RichTextDemo`, `RichTextEditorDemo`, `TiptapEditorDemo`, `TiptapProbe`,
  `WebViewDemo`, plus `variant-demos` for the platform-authentic leaves
  (picker, context-menu, sheet, date-picker).

`DEMOS`, `RENDER`, and `Gallery` form the catalog the harness browses;
`hosted-demos.*` is the per-target demo registry. Platform splits use the
standard suffixes (`DeviceDemo.mobile.tsrx`, `EffectsDemo.ios/.android/
.macos.tsrx`, `index.macos.ts`).

When a demo shows a behavior the framework must keep, promote it into a
maintained test — see [`docs/testing.md`](../../docs/testing.md).
