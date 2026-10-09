# `@octane-xplat/pager`

A paged horizontal swipe container for Octane Xplat apps — onboarding flows,
media galleries. Each page fills the host; the user swipes between pages.

```sh
pnpm add @octane-xplat/pager
```

```tsx
import { useState } from 'octane'
import { Text } from '@octane-xplat/ui'
import { Pager } from '@octane-xplat/pager'

export function Onboarding() {
	const [page, setPage] = useState(0)
	return (
		<Pager
			items={['Pack', 'Travel']}
			page={page}
			onPageChange={setPage}
			renderItem={(title) => <Text>{title}</Text>}
			renderEmpty={() => <Text>No pages</Text>}
		/>
	)
}
```

It follows the platform-list contract — `items` + `renderItem`, no children;
each page is a full-host-size cell. `onPageChange` fires on settled user
swipes; programmatic `page` writes don't echo back. `renderEmpty` covers the
empty list.

There is no built-in page indicator. Compose one from `HStack` + `Text`
driven by the `page` state:

```tsx
import { HStack, Text } from '@octane-xplat/ui'

;<HStack>
	{titles.map((title, index) => (
		<Text>{index === page ? '●' : '○'}</Text>
	))}
</HStack>
```

## Platform support

- **iOS/Android** — `@nativescript-community/ui-pager` (ViewPager2 on Android,
  a paging `UICollectionView` on iOS)
- **Web** — a scroll-snap scroller
- **macOS** — an entry exists

Per-target limits are recorded in
[known limits](../../docs/verify/known-limits.md). Exercised by
[`PagerDemo`](../demos/src/PagerDemo.tsrx).
