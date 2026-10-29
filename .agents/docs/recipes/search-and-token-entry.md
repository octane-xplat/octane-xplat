# Search and enter selected values

ID: search-and-token-entry
Targets: web, ios, android, macos
Related APIs: @octane-xplat/ui, Select, Selector, MultiSelector, SelectOption, hasSelectAll, triggerDisplay, changeAction, SearchableItem, SearchSource, createStaticSource, BaseTypeahead, Typeahead, TypeaheadItem, Token, Tokenizer, ComplexSelector, ComplexSelectorRenderProps, CommandPalette, CommandPaletteItem, CommandPaletteMenuItem, hasEntriesOnFocus, minQueryLength, maxMenuItems, hasCreate, tokenOverflowBehavior, htmlName, ref

## Starting point

An app already uses `@octane-xplat/ui` and needs users to find one or more values, create free-text values, or choose from a custom popup. Linux WebKitGTK uses the web implementation; the GJS/GTK renderer has a separate curated UI surface. macOS remains experimental.

## Requirements

Provide local or remote searchable values with a stable identity, present useful empty and disabled states, keep the selected values controlled by the app, and explain native event and HTML form boundaries.

## Acceptance criteria

- AC1: A reader can build a `SearchSource` for static or remote items, show optional bootstrap results, group results, and bound/debounce queries while stale async responses are discarded.
- AC2: A reader can use `Typeahead` with controlled selection, accessible field text, clear/edit/restore behavior, custom result content, and a disabled reason.
- AC3: A reader can use `Tokenizer` to add, remove, cap, create, and overflow tokens, and knows which fields serialize into a browser form.
- AC4: A reader can use `ComplexSelector`'s named render context to render custom content, commit values, close the surface, and reflect/revert an asynchronous action.
- AC5: A reader can account for web/AppKit key-event subsets and web form inputs, the mobile remove-button fallback, portable `ref`, and experimental macOS support.

- AC6: A reader can use finite-list Selector with `selectionMode` tied to a string-or-null single value or string-array multiple value, or use the `MultiSelector` multiple preset, with local grouped filtering, filtered enabled-item bulk selection, pending/rejected commits, form submission, and explicit native keyboard limits.

- AC7: A reader can build a static or remote CommandPalette with groups, disabled entries, loading/empty/error states, cancellation and close/reopen cleanup, and understands desktop highlight versus mobile tap/submit behavior, macOS modal dismissal and focus return, and keyboard-highlight scrolling.

## Documentation

- AC1: AppKit focus/request source scope is documented in [bootstrap on focus](../../../docs/app/search-selection.md#bootstrap-appkit-typeahead-results-on-focus); fourteen authored target cases and native qualification require separate execution evidence. [Build a search source](../../../docs/app/search-selection.md#supply-search-results) and [the maintained demo](../../../packages/demos/src/ComponentsDemo.tsrx).
- AC2: [Choose one result](../../../docs/app/search-selection.md#choose-one-result) and [the parity fixture](../../../packages/ui/src/components/forms/Typeahead.parity.tsrx).
- AC3: [Choose many or create values](../../../docs/app/search-selection.md#choose-many-or-create-values) and [the parity fixture](../../../packages/ui/src/components/forms/Tokenizer.parity.tsrx).
- AC4: [Build a custom picker](../../../docs/app/search-selection.md#build-a-custom-picker).
- AC5: [Platform boundaries](../../../docs/app/search-selection.md#platform-boundaries) and [known limits](../../../docs/testing/known-limits.md).

- AC6: [Choose from a finite list](../../../docs/app/search-selection.md#choose-from-a-finite-list), [UI API migrations](../../../docs/app/ui-api-migrations.md#selection-and-menu-rows), [ComponentsDemo](../../../packages/demos/src/ComponentsDemo.tsrx), and [the Select probe](../../../examples/probes/select.tsrx).

- AC7: [Search commands across targets](../../../docs/app/command-palette.md), [maintained demo](../../../packages/demos/src/ComponentsDemo.tsrx), and [platform boundaries](../../../docs/app/command-palette.md#platform-boundaries-and-verification), and [the nonvisual AppKit host case](../../../packages/ui/tests/command-palette-host.macos.tsrx).

## GTK coverage

SelectorOption's standalone presentation part is available from the curated
GTK root. Its icon/text layout and native metadata do not qualify AC6's
finite-list popup, filtering, selection or async commit workflow; Selector and
MultiSelector remain unavailable there. See
[GTK option content](../../../docs/platform/linux-gtk.md#present-option-content)
and the maintained
[GTK part case](../../../packages/linux-gtk-renderer/test/fixtures/src/ui-selector-option-main.ts).
The remaining search/token criteria have no GTK workflow execution.
