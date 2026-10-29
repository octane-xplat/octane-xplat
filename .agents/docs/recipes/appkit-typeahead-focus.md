# Own AppKit typeahead focus and search requests

ID: appkit-typeahead-focus
Targets: macos
Related APIs: BaseTypeahead, Typeahead, TypeaheadInputHandle, SearchSource, hasEntriesOnFocus, hasAutoFocus, onKeyDown

## Starting point

A people/label search in an ordinary form, matching ComponentsDemo's Typeahead
and the sandbox's token-entry examples. Native support remains experimental.

## Acceptance criteria

- AC1: Connect existing focus/bootstrap and autofocus flags. Retain stable native attachment, current live handles and owned blur, native enabled/editable state and inherited blocking. Keep field-leave blur separate from moving into result descendants.
- AC2: Invalidate responses immediately on new queries before debounce, source changes, field leave, native ref replacement and teardown. Observe latest callbacks/options, request abort, current keyed selection and callback reentry; retired work cannot reopen results or act after unmount. Typeahead edit reports one query and readonly controls omit clear/edit changes.
- AC3: Separate authored source/fake dispatch from actual native input/editor/IME/focus/blur/click/notification ordering, layout, keyboard/listbox accessibility and packaging. Separate keyboard/consumer callback and role/link source coverage from full AX behavior/announcements and native qualification.

- AC4: Only the current input/owned editor may handle keys. Notify the consumer first and honor preventDefault/current props/ref/window/focus and reentry. Unmodified arrows/Home/End highlight without committing, Enter selects, Escape consumes only an open list, and Tab/Shift+Tab close without cancelling traversal. Preserve modified/IME editing, reveal current keyed rows without focus transfer and qualify actual OS delivery separately.

- AC5: Expose native editable-combo/list/option roles, names and expanded state. Link the current same-window input/list and highlighted pending row independently of committed value; preserve baseline native metadata. Current row/window/visibility/blocking and teardown own cleanup. Request selected-children notifications without asserting actual VoiceOver hierarchy/announcements.

- AC6: Float suggestions through a same-window source portal, preserving declaring providers and input/result compound blur. Stage until current source commit; bound scrolling by current anchor/width/viewport/placement/direction. Retire replaced/stale native owners and honor controlled top-layer dismissal without focus transfer/restoration. Require the matching source-outlet host explicitly. Current readiness refreshes native links and reveals the highlighted mounted row only while the input owns focus.

## Documentation

- AC1: [AppKit typeahead guide](../../../docs/app/search-selection.md#bootstrap-appkit-typeahead-results-on-focus), [container](../../../packages/ui/src/components/forms/BaseTypeahead.macos.tsrx), [view](../../../packages/ui/src/components/forms/BaseTypeaheadView.macos.tsrx), [authored cases](../../../packages/ui/src/components/forms/typeahead-focus.macos.mobile.test.tsrx) and [manual fixture](../../../examples/probes/typeahead-focus.macos.tsrx). All cases unrun.
- AC2: The same guide/cases cover current request ownership and callback teardown. Source inspection includes Typeahead's wrapper; no other target leaf or shared runner changed.
- AC3: [Target note](../parity/appkit-progress.md#appkit-typeahead-focus-and-search-request-ownership) records exact deferred commands and remaining gates. Results now have the separate source-owned portal below; native popup/keyboard/AX parity remains unqualified.

- AC4: [AppKit key guide](../../../docs/app/search-selection.md#choose-appkit-typeahead-results-with-keys), [policy](../../../packages/ui/src/components/forms/typeahead-keys.macos.ts), seven [policy cases](../../../packages/ui/src/components/forms/typeahead-keys.macos.test.ts), five [wiring cases](../../../packages/ui/src/components/forms/typeahead-keys.macos.mobile.test.tsrx) and [manual fixture](../../../examples/probes/typeahead-keys.macos.tsrx), all unrun. Native input/repeat/IME/Tab/layer/reveal/AX and packaging remain unqualified.

- AC5: [Role/link guide](../../../docs/app/search-selection.md#expose-appkit-suggestion-roles-and-relationships), [relationship owner](../../../packages/ui/src/components/forms/typeahead-accessibility.macos.ts), four [renderer cases](../../../packages/macos-renderer/test/common-control-accessibility.test.ts), ten [relationship cases](../../../packages/ui/src/components/forms/typeahead-accessibility.macos.test.ts), five [view cases](../../../packages/ui/src/components/forms/typeahead-accessibility.macos.mobile.test.tsrx) and [manual fixture](../../../examples/probes/typeahead-accessibility.macos.tsrx), all unrun. [Target note](../parity/appkit-progress.md#appkit-typeahead-native-roles-and-relationships) records exact deferred commands and full native AX/announcement qualification limits.

- AC6: [Floating result guide](../../../docs/app/search-selection.md#float-appkit-search-suggestions), [private controller](../../../packages/ui/src/components/forms/typeahead-layer.macos.ts), [source portal](../../../packages/ui/src/components/forms/TypeaheadResults.macos.tsrx), sixteen [controller/focus cases](../../../packages/ui/src/components/forms/typeahead-layer.macos.test.ts), four [source-portal cases](../../../packages/ui/src/components/forms/typeahead-results.macos.mobile.test.tsrx), three [readiness cases](../../../packages/ui/src/components/forms/typeahead-result-ready.macos.mobile.test.tsrx) and [manual fixture](../../../examples/probes/typeahead-results.macos.tsrx), all unrun. [Target note](../parity/appkit-progress.md#appkit-source-owned-floating-typeahead-results) records deferred commands and native qualification limits. Generic Popover/useLayer roots and Tokenizer's outer unfocusedLayer editor remain separate limitations.
