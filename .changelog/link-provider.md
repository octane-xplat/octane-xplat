### LinkProvider + useLinkComponent: swap link elements for a whole subtree

`LinkProvider` sets the default link component for every link-capable
component beneath it — `Link`, `NavLink`, `SideNav`, `TopNav`, `TabList`,
`Breadcrumbs`, and `TreeList` rows with `href`. Point it at your router's
link once and navigation lands through your framework instead of full page
loads. A per-component `as` prop still wins, and injected components receive
`to={href}` so React Router-style links work next to `href` readers.
Destinations pass through `isSafeDestination` before reaching the injected
component — an unsafe URL renders an inert anchor rather than invoking the
router.

```tsx
import { LinkProvider } from '@octane-xplat/ui'
import { RouterLink } from './router'

<LinkProvider component={RouterLink}>
	<SideNav items={items} />
</LinkProvider>
```

[Routing](https://octane-xplat.dev/app/routing/)
