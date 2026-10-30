# Cycle through AppKit screen regions

ID: appkit-landmark-navigation
Targets: macos
Related APIs: useLandmark, LandmarkProps, FocusScope

## Starting point

An AppKit screen contains navigation, primary content and supporting regions.
The public landmark hook should offer a region-key source path without escaping
modal containment or converting empty regions into Tab stops.

## Acceptance criteria

- AC1: AppKit selects its dedicated hook with identical public role/label/ref types. Register native roots through owned refs and programmatic focus claims; missing dispatch/monitor/focus bridge preserves semantic forwarding. No direct app hook callers were found, so demand is an explicit multi-region-navigation assumption.
- AC2: F6/Shift+F6 cycle native view order in the event window; use the innermost current region, map field editors, skip native hidden/disabled/detached roots and nested registered descendants when picking a region's first control. Fall back to the region and request native reveal only if ownership still matches after focus.
- AC3: Respect the active FocusScope boundary, focused-handler cancellation, composition/modifiers, native rejection and focus reentry. Duplicate registrations share a monitor and unregister independently; last-root removal and HMR dispose release monitors and focus claims. Cross-window routing never activates another window.
- AC4: Maintain six model, one containment-query and two compiler cases plus nested/empty/hidden/unmounted/contained manual regions. Distinguish source/syntax evidence from OS F6/IME/Tab, focus/scroll/AX, HMR and clean installed-consumer qualification; document native-order differences and unqualified AX landmark semantics.

## Documentation

- AC1–AC4: [Region guide](../../../docs/app/navigation-ui.md#move-between-appkit-screen-regions), Octane navigation reference, feature note and [target note](../exploration.md#operational-evidence).
- AC2–AC4: [Routing/compiler cases](../../../packages/ui/src/internal/accessibility/landmark-state.macos.test.ts), [containment query](../../../packages/ui/src/internal/accessibility/focus-scope-state.macos.test.ts) and [manual fixture](../../../examples/probes/landmark.macos.tsrx), all unrun. Native dispatch callbacks are not OS input proof.
