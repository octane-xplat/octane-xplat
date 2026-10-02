# `@octane-xplat/pager`

```sh
pnpm add @octane-xplat/pager
```

Paged horizontal swipe container for Octane xplat apps — onboarding flows,
media galleries. iOS/Android run `@nativescript-community/ui-pager`
(ViewPager2 on Android, a paging `UICollectionView` on iOS); web is a
scroll-snap scroller; a macOS entry exists.

```tsx
import { useState } from 'octane'
import { Text } from '@octane-xplat/ui'
import { Pager } from '@octane-xplat/pager'

export function Onboarding() {
	const [index, setIndex] = useState(0)
	return (
		<Pager
			items={['Pack', 'Travel']}
			page={index}
			onPageChange={setIndex}
			renderItem={(title) => <Text>{title}</Text>}
			renderEmpty={() => <Text>No pages</Text>}
		/>
	)
}
```

It follows the platform-list contract — `items` + `renderItem`, no
children; each page is a full-host-size cell. `onPageChange` fires on
settled user swipes; programmatic `page` writes don't echo back. No page
indicator is built in — compose dots from `HStack` + `View` driven by the
`page` state. `renderEmpty` covers the empty list.

```tsx
import { useState } from 'octane'
import { HStack, Text } from '@octane-xplat/ui'
import { Pager } from '@octane-xplat/pager'

export function Pages() {
	const titles = ['Pack', 'Travel']
	const [page, setPage] = useState(0)
	return (
		<>
			<Pager
				items={titles}
				page={page}
				onPageChange={setPage}
				renderItem={(title) => <Text>{title}</Text>}
				renderEmpty={() => <Text>No pages</Text>}
			/>
			<HStack>
				{titles.map((title, index) => (
					<Text>{index === page ? '●' : '○'}</Text>
				))}
			</HStack>
		</>
	)
}
```

Per-target limits are recorded in
[known limits](../../docs/known-limits.md). Exercised by
[`PagerDemo`](../demos/src/PagerDemo.tsrx).
