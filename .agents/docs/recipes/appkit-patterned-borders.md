# Paint patterned borders on native AppKit boxes

ID: appkit-patterned-borders
Targets: macos
Related APIs: border-style, border-width, border-radius, FileInput, CAShapeLayer, Mason

## Starting point

A native AppKit app has a bounded box or FileInput dropzone whose shared CSS
requests a dashed/dotted border. Source presence is not native painting proof.

## Requirements

Keep border style, width, radius and side coloring coherent across initial
layout, resize and removal. State the supported subset and qualification limits.

## Acceptance criteria

- AC1: Resolve border-style box shorthand, per-side longhands and border edge shorthand ordering; paint width-scaled dashed/dotted native strokes with one rounded path for uniform patterns and independently clipped paths/colors/widths for mixed sides. Preserve the solid fast path and clear obsolete stroke/mask/cache state on removal. Use the maintained FileInput dropzone CSS as a source integration case.
- AC2: None/hidden sides paint nothing and consume zero border width in Mason. Removing style restores the existing implicit solid behavior for explicit width-only native styles. Resolve only border keys, without coercing unrelated objects or inherited dictionary names.
- AC3: Own box-frame observation across setup failure, replacement, late handles, update failure and teardown. Capture native cleanup, retire callbacks before native effects, preserve newer owners and attempt a handle's release once even on failure; retain shared notification-enable flags and distinguish helper models from real host lifetime.
- AC4: Reconcile public styling guide, renderer README, Octane guidance, feature note and target note with twelve authored source cases, an idle fixture and exact deferred commands. Keep non-solid outlines explicit; leave dash/NSNumber/scale/corners/antialiasing/resize/shadow/clipping/input/AX/memory/installed/pixel gates open.
- AC5: Paint double/groove/ridge/inset/outset as per-side filled bands on the same layers: double thirds (solid below width 3), 3D halves/sides darkened with Chromium's rule (black to dark grey; pattern colors keep base). Hide or remove extra band layers on style changes, uniform-pattern switches and teardown, warn once only for unknown styles, and document straight inner band edges at rounded corners and the unqualified native paint.

## Documentation

- AC1: [AppKit border guide](../../../docs/app/styling.md#appkit-borders), [renderer subset](../../../packages/macos-renderer/README.md#patterned-borders), [paint/CSS models](../../../packages/macos-renderer/test/style-reconcile.test.ts) and [style model](../../../packages/macos-renderer/test/border-styles.test.ts).
- AC2: [Guide](../../../docs/app/styling.md#appkit-borders), [pure resolver](../../../packages/macos-renderer/src/border-styles.ts) and [Mason model](../../../packages/macos-renderer/test/mason-style.test.ts).
- AC3: [Renderer ownership](../../../packages/macos-renderer/README.md#patterned-borders), [owner models](../../../packages/macos-renderer/test/box-frame-owner.test.ts) and [target note](../exploration.md#operational-evidence).
- AC4: [Idle fixture](../../../examples/probes/border-styles.macos.tsrx), [fixture CSS](../../../examples/probes/border-styles.macos.css), [skill](../../skills/octane-xplat/references/styling.md#appkit-patterned-borders), [feature note](../../../.changelog/appkit-patterned-borders.md) and [target note](../exploration.md#operational-evidence). All source tests, native fixture/compiler/build/OS/AX/visual/installed qualification remain unrun.
- AC5: [Decorative borders](../../../packages/macos-renderer/README.md#decorative-borders), [AppKit border guide](../../../docs/app/styling.md#appkit-borders), [band models](../../../packages/macos-renderer/test/border-styles.test.ts), [paint models](../../../packages/macos-renderer/test/style-reconcile.test.ts) and [target note](../exploration.md#operational-evidence). Gap: tests, native band geometry, shading under appearance changes, rounded-corner joins and pixels have not run.
