# Shape a panel without changing child overflow

ID: smooth-corners
Targets: web, ios, android, macos
Related APIs: @octane-xplat/smooth-corners, SmoothCorners, CornerOptions, SmoothBorderConfig, SmoothShadowConfig, SmoothAndroidConfig

## Starting point

A configured Xplat app uses a supported web, mobile Mason, or AppKit host. Native Windows and GTK have no supported adapters. The developer needs a shared curve with independently controlled descendant clipping. Pixel parity, OS input and accessibility require their own qualification; native mask reads are not substitutes.

## Requirements

- Generate continuous, squircle, superellipse, clothoid and circular corners in logical units, including per-corner configurations.
- Preserve background painting and inside borders through updates and resizing.
- Keep child overflow visible by default and respect authored hidden overflow without clipping the component's own shadow.
- Distinguish custom shadows from Android elevation and reject invalid inputs or unsupported native renderers clearly.
- Preserve parent placement and owned-resource cleanup; arrange children with an inner shared layout.

## Acceptance criteria

- AC1: Valid corner configurations generate finite, closed geometry at small and ordinary sizes; invalid radii, smoothing, exponents and dimensions fail consistently. Device density scales the complete native geometry once.
- AC2: Background updates and resize retain the exact shaped surface and inside border. Removing the border or unmounting restores component-owned decorative resources without clearing another owner's replacements.
- AC3: Visible overflow permits descendants outside the shape; hidden overflow clips them to the same curve. Removing an authored inline or class rule restores visible overflow. Record native dispatch, OS input and pixels as separate evidence.
- AC4: Web/iOS/AppKit custom shadows accept the documented inputs; web honors spread. Android custom shadow requests fail clearly and explicit elevation follows its native outline. Unsupported native Windows/GTK rendering fails clearly.
- AC5: Typed dynamic styles, parent placement and inner shared layouts follow the public contract. Packed declarations reject removed flex-container props and string styles. Runtime lifecycle and performance qualification remain distinct from compilation.

## Documentation

- AC1: [Valid inputs](../../../docs/packages/package-smooth-corners.md#valid-inputs-and-unsupported-hosts), [geometry checks](../../../packages/smooth-corners/tests/path.test.mts), [validation cases](../../../packages/smooth-corners/tests/validation.test.mts), and [Android host regressions](../../../packages/smooth-corners/tests/overflow.test.mts).
- AC2: [Shape a panel](../../../docs/packages/package-smooth-corners.md#shape-a-panel), [Android runtime fixture](../../../packages/smooth-corners/tests/clipping.android.tsrx), [iOS runtime fixture](../../../packages/smooth-corners/tests/clipping.ios.tsrx), and [host ownership regressions](../../../packages/smooth-corners/tests/overflow.test.mts).
- AC3: [Clip content](../../../docs/packages/package-smooth-corners.md#clip-an-image-or-other-content), [browser hit-testing suite](../../../packages/smooth-corners/e2e/overflow.web.mts), [authored mobile classes](../../../apps/harness/src/tests/smooth-corners-overflow.spec.tsrx), and the native runtime fixtures above. Gap: pixel parity and full OS-input/accessibility qualification are separate work.
- AC4: [Choose a shadow](../../../docs/packages/package-smooth-corners.md#choose-a-shadow), [AppKit fixture](../../../packages/smooth-corners/tests/surface.macos.tsrx), [validation](../../../packages/smooth-corners/tests/validation.test.mts), and [unsupported renderer cases](../../../packages/smooth-corners/tests/unsupported.test.mts). Gap: native Windows/GTK adapters and custom Android shadows are unsupported.
- AC5: [Arrange content](../../../docs/packages/package-smooth-corners.md#arrange-content-and-set-a-border), [public type checks](../../../packages/smooth-corners/tests/public-types.ts), and [layout helper cases](../../../packages/smooth-corners/tests/layout-child.test.mts). Gap: dense-panel performance and the complete layout/platform matrix need qualification before broad production claims.
