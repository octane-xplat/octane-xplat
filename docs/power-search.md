# Structured search

`PowerSearch` is controlled by `filters`. It searches configured fields, opens
an editor for a selected field/operator/value suggestion, and reports each
change as `add`, `edit`, or `remove` with the affected index.

```tsx
import { PowerSearch, createPowerSearchConfig } from '@octane-xplat/ui'
import { useState } from 'octane'

const { config, applyFilters } = createPowerSearchConfig([
  { key: 'title', type: 'string', label: 'Title' },
  { key: 'year', type: 'number', label: 'Year' },
] as const)

function SearchBooks({ books }) {
  const [filters, setFilters] = useState([])
  const visibleBooks = applyFilters(filters, books)

  return <>
    <PowerSearch config={config} filters={filters} onChange={setFilters} />
    <BookList books={visibleBooks} />
  </>
}
```

## Field definitions and local filtering

The simplified definition types are `string`, `number`, `boolean`, `date`,
`enum`, `enum_list`, and `string_list`. For full control, provide a
`PowerSearchConfig` with field and operator definitions directly. Custom token
and editor components can be supplied through `components` by operator value
type.

Client-side `applyFilters` implements string, numeric, absolute date, enum,
and list comparisons; time, relative-date, entity, custom, and nested values
are not locally evaluated. Use a server-side query for those values.

## Portable implementation and upstream seams

The portable implementation provides a controlled token bar, field/operator
suggestions, add/edit/remove flows, clear-all, and a text value editor. English
catalog strings are built in; there is no provider hook for app localization
at this time. The built-in editor handles text, numeric, list, enum, relative
date text, and absolute dates (ISO date input on web, text entry on native).
Date ranges, entity lists, nested values, and app-specific custom values need
an override in `components`.

Native selection uses the shared input and anchored popover. The sibling
Typeahead and Tokenizer APIs are available in the shared UI barrel, but
PowerSearch still uses a local field-suggestion composition rather than those
components. Token wrapping follows the field's normal layout and the native
imperative focus handle focuses and blurs the shared input. Web and AppKit
expose focus/blur handles. Popover
placement currently uses the standard collision policy; the upstream
400–720 CSS-pixel editor sizing and opening-control edge latching are not
implemented. `maxOperatorMenuItems` is accepted for source compatibility but
currently has no effect because this implementation does not show a separate
operator-value suggestion menu. The upstream ref object is adapted to a
callback `handleRef` with `focusTypeahead` and `blurTypeahead`; native focuses
the shared input rather than a separate tokenizer. `statusVariant` controls
attached or detached status styling. AppKit displays its popover content inline
rather than in a positioned floating layer.
