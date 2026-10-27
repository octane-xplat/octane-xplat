### Keep the dictation stop button usable

`ChatDictationButton` now composes the shared icon-only Button at its requested
size. Starting dictation no longer collapses the web stop target when the
microphone icon disappears. Browser capability and OS speech support remain
separate requirements.

```tsx
import { ChatDictationButton, useChatDictation } from '@octane-xplat/ui/chat'

function DictationButton() {
	const dictation = useChatDictation()
	return <ChatDictationButton dictation={dictation} size="md" />
}
```

[Chat components and platform limits](https://octane-xplat.goddardai.org/app/components#chat)
