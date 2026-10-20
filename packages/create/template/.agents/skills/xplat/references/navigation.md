# Navigation

Routes are files under `src/app`, not registered lists. A `[param]` segment
becomes a typed `:param`. Write screens in `.tsrx` files and type callbacks
with the generated `routes.gen.contracts` module:

```tsrx
// src/app/items/[id].tsrx
import { Text } from '@octane-xplat/ui'
import type { RouteProps, RouteLoaderArgs } from '../../routes.gen.contracts'

export function loader({ params }: RouteLoaderArgs<'/items/:id'>) {
  return { title: 'Item ' + params.id }
}

export function screen(props: RouteProps<'/items/:id'>) {
  return <Text>{props.data.title}</Text>
}
```

Regenerate the catalog after adding or renaming route files (the dev and
build commands also run it):

```sh
pnpm exec xplat routes --dir src/app
```

Import the generated client once in your entry module and place `RouteOutlet`
around the content that forms the home screen — the starter's `App` keeps its
own content and wraps it:

```tsrx
// src/App.tsrx
import './routes.gen'
import { NavLink, RouteOutlet, Text } from '@octane-xplat/ui'

export function App() {
  return <RouteOutlet>
    <Text>My collection</Text>
    <NavLink to="/items/:id" params={{ id: 'coat' }}><Text>Open coat</Text></NavLink>
  </RouteOutlet>
}
```

Use `NavLink` for a screen link or `useRouter()` in an event handler.
Destinations are objects: a declared `to` pattern plus `params`. `Link`
accepts a URL, including an external website.

```tsrx
// src/SettingsLinks.tsrx
import { HStack, Link, Pressable, Text } from '@octane-xplat/ui'
import { useRouter } from '@octane-xplat/ui/routing'

export function SettingsLinks() {
  const navigation = useRouter()
  return <HStack>
    <Pressable onPress={() => navigation.push({ to: '/items/:id', params: { id: '42' } })}>
      <Text>Open item</Text>
    </Pressable>
    <Link href="https://octane-xplat.goddardai.org"><Text>Documentation</Text></Link>
  </HStack>
}
```

`router.push` returns a result, not void: check `status === 'committed'`,
then `await result.finished` only when animation settlement matters.
`router.back()` pops one entry, `router.dismiss()` closes a modal,
`useCanGoBack` gates a Back control, and `useRouterState()` reads the current
route's declared `to` pattern. `router.navigateUrl(url)` admits an incoming
absolute or relative URL.

```tsrx
// src/NavigationStatus.tsrx
import { Pressable, Text } from '@octane-xplat/ui'
import { useCanGoBack, useRouter, useRouterState } from '@octane-xplat/ui/routing'

export function NavigationStatus() {
  const navigation = useRouter()
  const route = useRouterState().route
  const canGoBack = useCanGoBack()
  return <>
    <Text>{route?.to ?? 'Home'}</Text>
    <Pressable disabled={!canGoBack} onPress={() => navigation.back()}>
      <Text>Back</Text>
    </Pressable>
  </>
}
```

A guard runs in `beforeLoad` before the attempted route commits: return context
values, `redirect({ to, params, search })`, or throw `RouteForbidden`. Type the
args with the route's generated `RouteGuardArgs`:

```tsrx
// src/app/items/[id].tsrx
import { redirect } from '@octane-xplat/ui/routing'
import type { RouteGuardArgs } from '../../routes.gen.contracts'

export function beforeLoad({ params }: RouteGuardArgs<'/items/:id'>) {
  if (params.id === 'old-coat') redirect({ to: '/items/:id', params: { id: 'coat' } })
  return { checked: true }
}
```

Prefer string IDs in params: generated contracts type params as strings and
IDs make URLs shareable. Search is validated per route with `validateSearch`
(return `as const`); screens update it with `useUpdateSearch()` inside a
component via the route's `getRouteApi` accessor.

```ts
// src/app/items/[id].tsrx — search schema for the same route file
export function validateSearch(raw: { tab?: unknown }) {
  const tab = raw.tab ?? 'details'
  if (tab !== 'details' && tab !== 'activity') {
    throw new Error('Invalid tab')
  }
  return { tab } as const
}
```

```tsrx
// src/ActivityFilter.tsrx
import { Button } from '@octane-xplat/ui'
import { getRouteApi } from '@octane-xplat/ui/routing'

const item = getRouteApi('/items/:id')

export function ActivityFilter() {
  const updateSearch = item.useUpdateSearch()
  return <Button label="Show activity" clickAction={() => {
    void updateSearch(previous => ({ ...previous, tab: 'activity' }))
  }} />
}
```

Named stacks keep each tab's history separate: declare `"stacks": ["catalog",
"account"]` in `xplat.routes.json`, render `Tabs`, and address a stack with
`stack:` in the destination or `router.forStack(name)`:

```ts
await router.forStack('catalog').push({ to: '/items/:id', params: { id: 'coat' } })
```

`presentation: 'modal'` on a destination (or a `+modal` route-file suffix)
opens an owned modal flow the host dismisses as one surface.

For deep links, transitions, file-route details, and generated contracts, see
the [navigation guide](https://octane-xplat.goddardai.org/navigation).
