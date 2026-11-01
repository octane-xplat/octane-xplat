### Build Linux apps with the complete UI kit

The GTK target now supports the full `@octane-xplat/ui` surface, not just
`Text` and `Pressable`. Inputs and fields, popovers and menus, dialogs,
sheets and toasts, navigation and app chrome, collections and data tables,
typeahead and search, date and color pickers, rich text, icons, and `WebView`
all render through the Linux GTK renderer with the same props and types as
the native barrel. Pure utilities — theme tokens, i18n, sources, table and
calendar helpers — work too.

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
