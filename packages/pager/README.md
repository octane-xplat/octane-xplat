# `@octane-xplat/pager`

A paged horizontal swipe container for Octane Xplat apps — onboarding flows,
media galleries. Each page fills the host; the user swipes between pages.

```sh
bun add @octane-xplat/pager
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
- **macOS / AppKit (experimental)** — source implementation using the UI
  package’s native `ScrollableArea`. Pages render eagerly; native layout,
  scrolling/momentum, focus, accessibility and packaged use remain unqualified.
  Use a bounded page count and an explicit viewport size. Requires
  `@octane-xplat/ui >=0.18.0 <1`.

For the experimental AppKit implementation, give the viewport a size.
`defaultPage` seeds uncontrolled state once; `page` owns controlled state.
Programmatic writes do not call `onPageChange`. User scroll requests snap after
live tracking and a quiet interval; the callback waits for the measured native
offset to reach the page boundary. RTL follows the nearest UI direction
provider, and scrolling honors the native reduced-motion preference.

```tsx
import { Pager } from '@octane-xplat/pager'
import { Text } from '@octane-xplat/ui'

export function TravelPages() {
	return <Pager items={['Pack', 'Travel']} defaultPage={1}
		style={{ width: 320, height: 160 }}
		renderItem={(title) => <Text>{title}</Text>} />
}
```

The macOS export avoids loading the mobile pager plugin. This is source
evidence; the package still declares its existing mobile dependency. Source
cases and the [manual AppKit fixture](../../examples/probes/pager.macos.tsrx)
have been authored but have not run. No desktop parity gate is closed.

Per-target limits are recorded in
[known limits](https://octane-xplat.goddardai.org/known-limits). Exercised by
[`PagerDemo`](https://github.com/octane-xplat/octane-xplat/blob/main/packages/demos/src/PagerDemo.tsrx).
