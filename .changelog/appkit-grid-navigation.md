### Navigate GridList rows with keys on AppKit

AppKit `GridList` now implements arrow/Home/End navigation with one roving Tab
stop. Enter activates a row; Space selects it, and Shift+Space extends a range
without selecting disabled keys. Focused rows scroll into view.

```tsx
import { GridList, Text } from '@octane-xplat/ui'

export function Files() {
	return <GridList items={[{ id: 'notes' }, { id: 'draft' }]} columns={2}
		selectionMode="multiple" renderItem={(item) => <Text>{item.id}</Text>}
		onAction={(key) => console.log('open', key)} />
}
```

Use `keyboardNavigationBehavior="tab"` for cells containing interactive
controls. The custom selector-based `useGridList` hook and Shift+click ranges
remain unavailable on AppKit. Actual OS input, scrolling, accessibility and
packaging remain unqualified. See [AppKit GridList](https://octane-xplat.goddardai.org/app/components#gridlist-on-appkit).
