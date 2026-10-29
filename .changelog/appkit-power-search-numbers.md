### Validate numeric filters on native macOS

AppKit PowerSearch now rejects invalid numbers and enforces configured bounds
before saving. Scalar drafts follow the current filter, honor its default operator
and block stale or read-only saves. Native input and accessibility qualification
remains pending.

```ts
import type { IntegerOperatorValue } from '@octane-xplat/ui'
const year: IntegerOperatorValue = { type: 'integer', minValue: 1800, maxValue: 2100 }
// 1968 is valid; blank, NaN, fractions and out-of-range years do not save.
```

See [AppKit numeric filters](https://github.com/octane-xplat/octane-xplat/blob/main/docs/app/power-search.md#validate-native-appkit-numeric-filters).
