### Minimize and restore desktop windows

Ask the desktop to minimize an existing window and bring it back with its content still mounted.

```ts
import { windows } from '@octane-xplat/desktop'

const inspector = windows.open({ title: 'Inspector' })
inspector.minimize()

// From a later user action:
inspector.restore()
```

See [Minimize an open window](https://octane-xplat.goddardai.org/package-desktop#minimize-an-open-window) for platform behavior.
