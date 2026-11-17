# Qualify smooth-corner behavior

> Check smooth-corner geometry, clipping, layout, packing, and native behavior before widening platform support.

Run these checks before widening SmoothCorners support or changing its geometry, clipping, layout, or resource ownership. Use the [package guide](../../docs/packages/package-smooth-corners.md) for app code and supported inputs.

## Check geometry, types, and packing

The host suite checks finite geometry, density scaling, portable colors, invalid inputs, overflow ownership, inside borders, native outline initialization, and explicit unsupported renderer failures. Type checks include public misuse cases; the dependent check may also reveal failures outside this package.

```sh
bun run turbo run test pack:check --filter=@octane-xplat/smooth-corners
bun run turbo run typecheck --filter=...@octane-xplat/smooth-corners
```

## Check real browsers

The browser suite checks computed styles, percentage and class sizing, transforms, opacity, child hit-testing, authored overflow removal, resize, and shadow separation. The packed suite runs the same behavior from a tarball in an isolated consumer with pinned dependencies. Both are local checks outside lightweight PR CI; they do not capture images.

```sh
bun run turbo run test:e2e test:packed:web --filter=@octane-xplat/smooth-corners
XPLAT_WEB_BROWSER=firefox bun run turbo run test:e2e --filter=@octane-xplat/smooth-corners
XPLAT_WEB_BROWSER=webkit bun run turbo run test:e2e --filter=@octane-xplat/smooth-corners
```

Use the existing installed browser engines. A missing engine is unavailable evidence, not a pass.

## Check native runtimes

Reserve the selected physical device or simulator and native build capacity with the host resource broker before invoking native tasks. Pass an existing device ID explicitly; the package tasks never create or select devices. The Android task checks Mason border ownership, resize, overflow and synthetic native touch dispatch. iOS runtime behavior, disposal, background changes and broader layout remain separate qualifications. Native dispatch is separate from OS input.

```sh
bun run turbo run test:android --filter=@octane-xplat/smooth-corners -- --device DEVICE_SERIAL
bun run turbo run test:ios --filter=@octane-xplat/smooth-corners -- --device SIMULATOR_UDID
bun run turbo run test:macos-runtime --filter=@octane-xplat/smooth-corners
```

The Android OS-input task sends real `adb shell input tap` events to the owned probe app. It checks corner access before clipping, corner exclusion while hidden, center access while hidden, and restored corner access after removing clipping. It requires an unlocked device with the probe app focused; it does not unlock the device or tap another app.

```sh
bun run turbo run test:android-input --filter=@octane-xplat/smooth-corners -- --device DEVICE_SERIAL
```

Record the exact revision, target, device/API/density, artifact, assertions, and limitations in Silo. Geometry, native mask reads, OS input, accessibility, pixel parity, and dense-panel performance are separate evidence. Current fixtures do not qualify all of those areas. Native GTK and Windows adapters remain unsupported; do not promote package import/build results into support claims.

## Mason core beta.11 Android binding

Mason core 1.0.0-beta.11's `setSmoothCorners` helper reads `native.style`. On the NativeScript Android probe host, the Mason view exposes `getStyle()` while `style` is undefined; the published helper throws before applying a setting. The canonical Mason patch resolves `getStyle()` as a fallback. The Android integration fixture must pass before dropping this hunk. This observation does not establish the behavior of other runtimes or iOS.
