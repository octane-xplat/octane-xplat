---
hype: 40
---

### Choose what opens in a secondary GTK window

Set a resolver from `@octane-xplat/linux-gtk/host` to choose the component that `openWindow` renders for a request.

```ts
import { setWindowContentResolver } from '@octane-xplat/linux-gtk/host'
import { openWindow } from '@octane-xplat/ui'
import { PreviewWindow } from './PreviewWindow'

setWindowContentResolver(() => PreviewWindow)
openWindow({ title: 'Preview' })
```

[Linux GTK host exports](https://octane-xplat.goddardai.org/package-linux-gtk-renderer#exports)
