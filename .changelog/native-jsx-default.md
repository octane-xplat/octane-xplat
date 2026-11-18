### Omit the JSX source comment in native component-only leaves

Lint now accepts native TSRX leaves that render shared components without a JSX source comment. Keep the first-line `@jsxImportSource @octane-xplat/jsx` comment on TSRX files that use native host elements such as `masonview` or `label`.

```tsrx
import { Text } from '@octane-xplat/ui'

export function Status() {
  return <Text>Ready</Text>
}
```

[Set up JSX types for platform files](https://octane-xplat.goddardai.org/module-resolution#typescript)
