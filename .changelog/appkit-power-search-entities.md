### Select entity filters on native macOS

The experimental AppKit PowerSearch editor now selects entities from a search
source, removes/clears selections and supports optional free entries. Configured
paste splitting uses a separate **Add entries** action and keeps the draft intact
if a lookup fails. Apps still own entity matching; native input and accessibility
qualification is pending.

```ts
import type { EntityListOperatorValue } from '@octane-xplat/ui'
const tags: EntityListOperatorValue = {
	type: 'entity_list', isArbitraryStringAllowed: true, tokenization: {},
}
```

See [AppKit entity filters](https://github.com/octane-xplat/octane-xplat/blob/main/docs/app/power-search.md#edit-native-appkit-entity-filters).
