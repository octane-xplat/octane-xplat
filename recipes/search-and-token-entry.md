# Search and enter selected values

ID: search-and-token-entry
Targets: web, ios, android, macos
Related APIs: @octane-xplat/ui, Select, Selector, MultiSelector, SelectOption, hasSelectAll, triggerDisplay, changeAction, SearchableItem, SearchSource, createStaticSource, BaseTypeahead, Typeahead, TypeaheadItem, Token, Tokenizer, ComplexSelector, CommandPalette, CommandPaletteItem, CommandPaletteMenuItem, hasEntriesOnFocus, minQueryLength, maxMenuItems, hasCreate, tokenOverflowBehavior, htmlName, ref

## Starting point

An app already uses `@octane-xplat/ui` and needs users to find one or more values, create free-text values, or choose from a custom popup. Linux uses the web implementation; macOS remains experimental.

## Requirements

Provide local or remote searchable values with a stable identity, present useful empty and disabled states, keep the selected values controlled by the app, and explain native event and HTML form boundaries.

## Acceptance criteria

- AC1: A reader can build a `SearchSource` for static or remote items, show optional bootstrap results, group results, and bound/debounce queries while stale async responses are discarded.
- AC2: A reader can use `Typeahead` with controlled selection, accessible field text, clear/edit/restore behavior, custom result content, and a disabled reason.
- AC3: A reader can use `Tokenizer` to add, remove, cap, create, and overflow tokens, and knows which fields serialize into a browser form.
- AC4: A reader can use `ComplexSelector` to render custom content, commit values, close the surface, and reflect/revert an asynchronous action.
- AC5: A reader can account for web-only key events and form inputs, the native remove-button fallback, portable `ref`, and experimental macOS support.

- AC6: A reader can use a finite-list Selector or MultiSelector with local grouped filtering, filtered enabled-item bulk selection, pending/rejected commits, form submission, and explicit native keyboard limits.

- AC7: A reader can build a static or remote CommandPalette with groups, disabled entries, loading/empty/error states, cancellation and close/reopen cleanup, and understands desktop highlight versus mobile tap/submit behavior.

## Documentation

- AC1: [Build a search source](../docs/search-selection.md#supply-search-results) and [the maintained demo](../packages/demos/src/ComponentsDemo.tsrx).
- AC2: [Choose one result](../docs/search-selection.md#choose-one-result) and [the parity fixture](../packages/app/src/parity/fixtures.tsrx).
- AC3: [Choose many or create values](../docs/search-selection.md#choose-many-or-create-values) and [the parity fixture](../packages/app/src/parity/fixtures.tsrx).
- AC4: [Build a custom picker](../docs/search-selection.md#build-a-custom-picker).
- AC5: [Platform boundaries](../docs/search-selection.md#platform-boundaries) and [known limits](../docs/known-limits.md).

- AC6: [Choose from a finite list](../docs/search-selection.md#choose-from-a-finite-list), [ComponentsDemo](../packages/demos/src/ComponentsDemo.tsrx), and [the Select probe](../examples/probes/select.tsrx).

- AC7: [Search commands across targets](../docs/command-palette.md), [maintained demo](../packages/demos/src/ComponentsDemo.tsrx), and [platform boundaries](../docs/command-palette.md#platform-boundaries-and-verification).
