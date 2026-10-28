# Own AppKit typeahead focus and search requests

ID: appkit-typeahead-focus
Targets: macos
Related APIs: BaseTypeahead, Typeahead, TypeaheadInputHandle, SearchSource, hasEntriesOnFocus, hasAutoFocus

## Starting point

A people/label search in an ordinary form, matching ComponentsDemo's Typeahead
and the sandbox's token-entry examples. Native support remains experimental.

## Acceptance criteria

- AC1: Connect existing focus/bootstrap and autofocus flags. Retain stable native attachment, current live handles and owned blur, native enabled/editable state and inherited blocking. Keep field-leave blur separate from moving into inline results.
- AC2: Invalidate responses immediately on new queries before debounce, source changes, field leave, native ref replacement and teardown. Observe latest callbacks/options, request abort, current keyed selection and callback reentry; retired work cannot reopen results or act after unmount. Typeahead edit reports one query and readonly controls omit clear/edit changes.
- AC3: Separate authored source/fake dispatch from actual native input/editor/IME/focus/blur/click/notification ordering, layout, keyboard/listbox accessibility and packaging. Keep missing keyboard selection/consumer keydown/AX relationships/announcements explicit.

## Documentation

- AC1: [AppKit typeahead guide](../../../docs/app/search-selection.md#bootstrap-appkit-typeahead-results-on-focus), [container](../../../packages/ui/src/BaseTypeahead.macos.tsrx), [view](../../../packages/ui/src/BaseTypeaheadView.macos.tsrx), [authored cases](../../../packages/ui/src/typeahead-focus.macos.mobile.test.tsrx) and [manual fixture](../../../examples/probes/typeahead-focus.macos.tsrx). All cases unrun.
- AC2: The same guide/cases cover current request ownership and callback teardown. Source inspection includes Typeahead's wrapper; no other target leaf or shared runner changed.
- AC3: [Target note](../parity/appkit-progress.md#appkit-typeahead-focus-and-search-request-ownership) records exact deferred commands and remaining gates. Results retain the existing inline presentation, without claiming native popup/keyboard/AX parity.
