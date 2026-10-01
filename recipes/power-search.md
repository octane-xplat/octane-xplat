# Build a structured search field

ID: power-search
Targets: web, ios, android, macos
Related APIs: PowerSearch, PowerSearchConfig, PowerSearchFilter, createPowerSearchConfig, usePowerSearchConfig

## Starting point

The app has a collection or query endpoint and needs users to combine field,
operator, and value filters. The reader knows controlled component state.

## Requirements

- Describe configured fields/operators and keep active filters in app state.
- Let users find a field or value suggestion, add/edit/remove filters, and clear the active set.
- Apply filters to local data where supported, and route unsupported value types to a custom editor or server query.
- Keep labels and edits usable on touch and keyboard targets.

## Acceptance criteria

- AC1: A controlled PowerSearch example shows config creation, change handling, and applying active filters.
- AC2: The guide explains field definitions, custom configs, value-type overrides, and local-filter limits.
- AC3: The guide states native/web focus, typeahead, localization, date editor, and popover sizing coverage.

## Documentation

- AC1: [Structured search guide example](../docs/power-search.md#structured-search) and the maintained [PowerSearch demo](../packages/demos/src/PowerSearchDemo.tsrx).
- AC2: [Field definitions and filter limits](../docs/power-search.md#field-definitions-and-local-filtering).
- AC3: [Portable implementation and upstream seams](../docs/power-search.md#portable-implementation-and-upstream-seams).
