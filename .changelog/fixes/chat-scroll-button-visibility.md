### Hide inactive chat scroll buttons on web

`ChatLayoutScrollButton` now removes its button when `isVisible` is false,
so hidden controls cannot receive clicks or keyboard focus. This matches the
native component's behavior.

```tsx
import { ChatLayoutScrollButton } from '@octane-xplat/ui/chat'

<ChatLayoutScrollButton isVisible={false} onPress={() => {}} />
```

[Chat components](https://octane-xplat.goddardai.org/app/components#chat)
