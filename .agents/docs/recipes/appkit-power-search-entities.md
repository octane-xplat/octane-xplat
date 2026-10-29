# Select AppKit entity filters from search and pasted entries

ID: appkit-power-search-entities
Targets: macos
Related APIs: PowerSearch, PowerSearchFilterEditor, EntityListOperatorValue, Tokenizer

## Starting point

The AppKit built-in editor explicitly rejected entity_list despite its shared
searchSource/tokenization contract. The repository PowerSearch demo exercises
string/number filters; assignee/customer selection is an explicit common-app
demand assumption beyond that demo. Existing Tokenizer owns native selection and
search, so the new target form reuses it without shared API or dependency changes.

## Acceptance criteria

- AC1: Route entity_list into controlled Tokenizer selection, source lookup, custom rows, optional arbitrary strings, removal/clear and read-only behavior. Preserve source draft rows; store only id/label/optional top-level string photo, deduplicated by exact ID. Explain missing-source behavior and app/backend matching.
- AC2: Offer configured paste splitting through a separate explicit Add entries action. Trim/deduplicate tokens, optionally sort by JS string order, use comma/newline by default, exclude regex captures/zero-width matches. Resolve serially with fresh request signals, exact ID then unique case-sensitive label, no fuzzy/ambiguous automatic picks. Publish all entries atomically; preserve drafts and show generic invalid-regex/lookup/match errors.
- AC3: Retain rapid edits; current filter/field/operator/source/tokenization revision, read-only, Cancel and unmount retire pending work. Block edit/repeat/Apply while pending, guard bulk marked-text, never discard unprocessed pasted text on Apply. One draft saves once, consumer throw permits retry. Cancellation must discard ignored-signal late results.
- AC4: Maintain seven model and five mocked-control editor cases plus an idle fixture, all unrun. Reconcile public guide, Octane skill, feature note and exact deferred commands. Clearly retain native control/input/IME/AX/focus/popover/source timing/consumer qualification and web/mobile entity/nested/custom parity gaps; close no evidence gate.

## Documentation

- AC1–AC4: [Public entity workflow](../../../docs/app/power-search.md#edit-native-appkit-entity-filters), Octane primitives reference, feature note and [target progress](../parity/appkit-progress.md#appkit-powersearch-entity-form).
- AC1–AC3: [Value/batch cases](../../../packages/ui/src/components/forms/power-search-entities.macos.mobile.test.ts) and [mocked-control editor cases](../../../packages/ui/src/components/forms/power-search-entity-editor.macos.mobile.test.tsrx), authored but unrun. Mock controls do not prove native input/selection/IME/AX.
- AC4: [Idle manual fixture](../../../examples/probes/power-search-entities.macos.tsrx), authored but unrun. It mounts controls only and applies no filter automatically.
