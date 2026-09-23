# Overlays — Modal, sheet, RootLayout

Three overlay mechanisms, all verified on both targets.

## `Modal` component

```tsrx
<Modal open={open} onClose={...} fullscreen>...children...</Modal>
```

- Web: `<dialog>` + `showModal()` — browser top-layer.
- Native: `showModal` on a second root — children mount their own Octane
  root (no shared context with presenter; store state crosses via module
  stores). Verified: declarative open/close, text assertions in the modal
  tree, theme class absent (see styling/root-boundaries.md).

## `openSheet(Component, props)` / `closeSheet()`

`platform/sheet.native.ts` — a `ContentView` bottom-docked in the
`RootLayout`, `rl.open(host, { shadeCover, animation })`. Content is
parameterized — any component renders in the sheet root (`openSheet(renderDemo)`
shows a demo in a sheet — verified as "sheet hosts demo" sweep check).
Web twin: stub + console.log (sheet is unimplemented on web — a real web
sheet needs design work; the seam exists).

## `openOverlay()` / `closeOverlay()`

`platform/overlay.native.ts` — RootLayout.open with a dedicated host view
for z-order overlay + `shadeCover`. Same shape as sheet, different
semantics (floating vs bottom-anchored).

## The `rl.open()` promise rule (release-only fatal, now fixed)

`RootLayout.open()` returns a **Promise that rejects** when the view is
already attached (`hasChild`). An unhandled rejection = fatal JS exception
on release builds. Both leaf fns now:

```ts
if ((rl as any).hasChild?.(host)) (rl as any).close(host);
(rl.open(host, opts) as Promise<unknown>).then(ok, err => log);
```

**Any new RootLayout.open caller must do the same** — close-before-open +
handle the promise. This was the one release-only crash the release sweep
caught.

## getRootLayout()

Works because `Screen` renders a `RootLayout` on native. `getRootLayout()`
returns null before the first screen mounts — guard it.
