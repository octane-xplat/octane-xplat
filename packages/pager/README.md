# `@octane-xplat/pager`

Paged horizontal swipe container for Octane xplat apps — onboarding flows,
media galleries. iOS/Android run `@nativescript-community/ui-pager`
(ViewPager2 on Android, a paging `UICollectionView` on iOS); web is a
scroll-snap scroller; a macOS entry exists.

```sh
pnpm add @octane-xplat/pager
```

```tsx
import { Pager } from '@octane-xplat/pager'

;<Pager
	items={pages}
	renderItem={(page) => <PageCard page={page} />}
	page={index} // controlled — pair with onPageChange, or drop for uncontrolled
	onPageChange={(i) => setIndex(i)}
/>
```

It follows the platform-list contract — `items` + `renderItem`, no
children; each page is a full-host-size cell. `onPageChange` fires on
settled user swipes; programmatic `page` writes don't echo back. No page
indicator is built in — compose dots from `Row` + `View` driven by the
`page` state. `renderEmpty` covers the empty list.

Per-target limits are recorded in
[known limits](../../docs/known-limits.md). Exercised by
[`PagerDemo`](../demos/src/PagerDemo.tsrx).
