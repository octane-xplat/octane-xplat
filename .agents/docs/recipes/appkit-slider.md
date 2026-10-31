# Adjust an AppKit setting or range

ID: appkit-slider
Targets: macos
Related APIs: Slider, Field

## Starting point

A settings screen with a scalar volume and a bounded price range.

## Requirements

Adjust scalar or range values on AppKit with bounded steps, per-thumb keyboard
access and owned drag previews.

## Acceptance criteria

- AC1: Scalar and pair values respect explicit bounds, positive steps and noncrossing thumbs. Uncontrolled changes persist; controlled changes request parent feedback. Define omitted-step, equal-bound and invalid-number behavior. A drag preview accepts matching normalized starting/latest-requested parent feedback; other parent values, control-mode/limits/shape changes or blocking retire it. Keys/adjustments retire the preview; equal normalized writes do not signal reset.
- AC2: Delta drags select the nearest thumb; each thumb exposes separate keyboard and accessibility adjustments. Disabled/read-only Field state blocks changes, including retained handlers. Retained keys/adjustments use current values, limits, steps and callbacks, reject detached hosts and callback reentry, and release claims on callback errors. Distinguish handler dispatch from OS input, focus and VoiceOver evidence.
- AC3: Marks and text/hover readouts preserve fractional values and custom formatting; metadata, classes and inline CSS styles survive. Report native layout, tooltip timing and pixel qualification separately.

## Documentation

- AC1: [AppKit Slider](../../../docs/app/components.md#slider-on-appkit), [value rules](../../../packages/ui/src/components/forms/slider-values.macos.ts) and [authored source regressions](../../../packages/ui/src/components/forms/slider.macos.mobile.test.tsrx). Three additional [drag-owner cases](../../../packages/ui/src/components/forms/slider.macos.mobile.test.tsrx) cover external replacement, matching feedback versus contract changes and keyboard interruption. Tests require execution evidence.
- AC2: [Native implementation](../../../packages/ui/src/components/forms/Slider.macos.tsrx) and [maintained fixture](../../../examples/probes/slider.macos.tsrx). Three additional [source cases](../../../packages/ui/src/components/forms/slider.macos.mobile.test.tsrx) cover retained current handlers, blocking/detachment and reentry/error cleanup; all require separate execution evidence. OS input, focus and accessibility require separate target qualification.
- AC3: [Examples and limits](../../../docs/app/components.md#slider-on-appkit) and the same source regressions. Hover, layout, pixels, packaging and runtime probes are deferred.
