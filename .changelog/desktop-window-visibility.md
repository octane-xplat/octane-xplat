### Reuse an open desktop window

Show, hide, and request keyboard focus for an existing native window on AppKit, GTK, and the experimental NativeScript Windows host. Hiding a window keeps its content mounted.

```ts
import { windows } from '@octane-xplat/desktop'

const inspector = windows.open({ title: 'Inspector' })
inspector.hide()
inspector.show()
```

See [Show an existing window](https://octane-xplat.goddardai.org/package-desktop#show-an-existing-window) for an Inspector that opens only once.
