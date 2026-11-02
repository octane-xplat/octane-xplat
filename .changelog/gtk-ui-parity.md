### Build Linux apps with the complete UI kit

The GTK target now exports the shared `@octane-xplat/ui` surface, with one public type entrypoint across platforms. Inputs and fields, popovers and menus, dialogs, sheets and toasts, navigation and app chrome, collections and data tables, typeahead and search, date and color pickers, rich text, icons, and `WebView` all render through the Linux GTK renderer with the same props and types as the native barrel. Pure utilities — theme tokens, i18n, sources, table and calendar helpers — work too.

```tsx
import { Stack, Text, DateInput, Table, proportional } from '@octane-xplat/ui'

export function Roster({ people, start, setStart }) {
  return (
    <Stack gap={4}>
      <DateInput label="Start" value={start} onChange={setStart} />
      <Table
        data={people}
        idKey="id"
        columns={[{ key: 'name', header: 'NAME', width: proportional(1) }]}
      />
    </Stack>
  )
}
```

[Linux GTK guide](https://octane-xplat.goddardai.org/linux-gtk)

The public tooltip hook supports separate position and interaction refs,
controlled visibility, and placement overrides on GTK. Embedded WebView pages
can send JSON values through `postToHost` to the host's `onMessage` callback.

```tsx
import { View, Text, WebView, useTooltip } from '@octane-xplat/ui'

export function Help() {
  const tooltip = useTooltip({ placement: 'below', alignment: 'start' })
  return (
    <View>
      <View ref={tooltip.ref}><Text>Help</Text></View>
      {tooltip.renderTooltip('Open the embedded guide')}
      <WebView src="https://example.com/help" onMessage={(event) => console.log(event.data)} />
    </View>
  )
}
```

```ts
// In the embedded page's bundle:
import { postToHost } from '@octane-xplat/ui'
postToHost({ type: 'ready' })
```

[WebView messaging](https://octane-xplat.goddardai.org/linux-gtk#embed-web-content)
