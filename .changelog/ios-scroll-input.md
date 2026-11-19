### Pause iOS scroll input during ancestor drags

Use `suspendScrollInput` to hold scrolling in place while an ancestor is being dragged. It works on mounted Mason content on iOS. Scrolling resumes after the last caller releases its lock. Requires `@octane-xplat/nativescript-mason-core` 1.0.0-beta.8 or later.

```ts
import { suspendScrollInput } from '@octane-xplat/ui/ios'

export function beginContentDrag(loadedContentHost: object) {
  const release = suspendScrollInput(loadedContentHost)
  return release // Call on release, cancellation, or before detaching the content.
}
```

[Pause iOS scrolling during an ancestor drag](https://octane-xplat.goddardai.org/primitives#pause-ios-user-scrolling-during-an-ancestor-drag)
