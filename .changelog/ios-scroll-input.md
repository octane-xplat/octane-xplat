### Pause iOS scroll input during ancestor drags

Pause iOS user scrolling while an ancestor drag owns the content. `suspendScrollInput` stops scrolling in the mounted Mason subtree, preserves its current position, and restores prior input flags after every lock owner releases. It requires `@octane-xplat/nativescript-mason-core` 1.0.0-beta.8 or later, which publishes the required native setter.

```ts
import { suspendScrollInput } from '@octane-xplat/ui/ios'

export function beginContentDrag(loadedContentHost: object) {
  return suspendScrollInput(loadedContentHost)
}
```

See [iOS scroll input suspension](https://octane-xplat.goddardai.org/app/primitives#pause-ios-user-scrolling-during-an-ancestor-drag) for native prerequisites and cleanup.
