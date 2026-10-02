# Navigation

Register screens once during app startup. A route names a screen and a stack;
web turns it into a URL, while native presents the screen in the app's navigation.
Put components in `.tsrx` files.

```tsrx
import { defineRoutes, registerRoutes, Text } from '@octane-xplat/ui'

function Home() { return <Text>Home</Text> }
function Settings() { return <Text>Settings</Text> }

registerRoutes(defineRoutes([
  { path: '/', screen: Home },
  { path: '/settings', screen: Settings },
]))
```

After registering `settings`, use `NavLink` for a screen link or `pushRoute`
in an event handler. `Link` accepts a URL, including an external website.

```tsrx
import { HStack, Link, NavLink, Pressable, Text, pushRoute } from '@octane-xplat/ui'

export function SettingsLinks() {
  const settings = { stack: 'root', name: 'settings', params: {} }
  return <HStack>
    <NavLink route={settings}><Text>Settings</Text></NavLink>
    <Pressable onPress={() => pushRoute(settings)}><Text>Open settings</Text></Pressable>
    <Link href="https://octane-xplat.goddardai.org"><Text>Documentation</Text></Link>
  </HStack>
}
```

Use `useRoute` to read the current screen and `useCanGoBack` to decide whether
to offer a back button. Pass the same stack name to `popRoute`.

```tsrx
import { Pressable, Text, useRoute, useCanGoBack, popRoute } from '@octane-xplat/ui'

export function NavigationStatus() {
  const route = useRoute('root')
  const canGoBack = useCanGoBack('root')
  return <>
    <Text>{route?.name ?? 'Home'}</Text>
    <Pressable disabled={!canGoBack} onPress={() => popRoute('root')}>
      <Text>Back</Text>
    </Pressable>
  </>
}
```

Prefer string IDs in route params: generated route helpers use string params,
and IDs make URLs shareable. The low-level router JSON-encodes object params
on web with a warning; do not rely on it to carry application state. With a
registered `/projects/:id` screen, navigate using the project ID:

```ts
import { pushRoute } from '@octane-xplat/ui'

pushRoute({ stack: 'root', name: 'projects/:id', params: { id: '42' } })
```

Named tab stacks keep each tab's navigation separate. `Tabs` renders the tab's
initial content; pushing a route into that stack opens it inside the tab pane.
The screen below assumes `settings` is already registered.

```tsrx
import { Tabs, Text, Pressable, pushRoute } from '@octane-xplat/ui'

export function AppTabs() {
  return <Tabs tabs={[
    { title: 'Home', stack: 'home', render: () => <Text>Home</Text> },
    { title: 'Account', stack: 'account', render: () =>
      <Pressable onPress={() => pushRoute({ stack: 'account', name: 'settings', params: {} })}>
        <Text>Settings</Text>
      </Pressable> },
  ]} />
}
```

For loaders, deep links, route config, and generated route types, see the
[navigation guide](https://octane-xplat.goddardai.org/navigation).
