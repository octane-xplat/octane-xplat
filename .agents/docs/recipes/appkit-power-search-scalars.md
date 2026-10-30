# Keep AppKit text drafts current and validate numeric filters

ID: appkit-power-search-scalars
Targets: macos
Related APIs: PowerSearchFilterEditor, IntegerOperatorValue, FloatOperatorValue, PowerSearchField

## Starting point

The maintained PowerSearch demo filters book titles and publication years. Source
review found unchecked Number(text) saved NaN, blank zero and out-of-bound/fractional
integers; useState(initialText) retained the preceding filter's draft. This is
source evidence only, not an observed native failure. Common text/number filters
take priority over custom/nested editor expansion.

## Acceptance criteria

- AC1: Numeric Apply accepts finite decimal/scientific input; rejects blank/nondecimal/partial/nonfinite input, unsafe/fractional integers and inclusive-bound violations. Invalid/nonfinite/reversed configured bounds block saving, never clamp. Display units/bounds; document dot decimal and exact-integer limits.
- AC2: Keep rapid scalar changes before render, reset on current filter/field/operator replacement, reject stale/readonly/unmounted/marked-text saves and stale changes. Submit once per draft before consumer reentry, release on consumer throw. Cancel retires the session without saving.
- AC3: Missing operator uses configured default, then first; unknown explicit field/operator disables Apply without silently choosing another filter. Matching scalar type owns seeding/conversion. Invalid absolute dates render without a conversion exception; calendar/time precision and other scalar validation remain separate gaps.
- AC4: Maintain five model/five mocked-control scalar cases and an idle fixture. Reconcile public/skill/feature/target guidance, exact deferred commands and source-vs-runtime limits; do not close the broader editor or native qualification gate.

## Documentation

- AC1–AC4: [Public numeric/scalar workflow](../../../docs/app/power-search.md#validate-native-appkit-numeric-filters), Octane primitives reference, feature note and [target note](../exploration.md#operational-evidence).
- AC1: [Numeric model cases](../../../packages/ui/src/components/forms/power-search-number.macos.mobile.test.ts).
- AC2–AC3: [Mocked-control editor cases](../../../packages/ui/src/components/forms/power-search-scalar-editor.macos.mobile.test.tsrx); not native control/input proof.
- AC4: [Manual fixture](../../../examples/probes/power-search-scalars.macos.tsrx); mounts only, applies no filter automatically.
