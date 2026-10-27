### Rich Markdown and streamed assistant text

Markdown now renders tables, task markers, strikethrough, source citations and
syntax-highlighted code. Compact spacing and shifted heading levels fit chat
responses. `useStreamingText` smooths cumulative text and settles immediately
when streaming ends or the browser requests reduced motion.

```tsx
import { Markdown, useStreamingText } from '@octane-xplat/ui/markdown'

export function Response({ text, streaming }: { text: string; streaming: boolean }) {
	const displayed = useStreamingText(text, streaming, { speed: 'fast' })
	return <Markdown text={displayed} isStreaming={streaming} density="compact" headingLevelStart={3} />
}
```

[Content display guide](https://octane-xplat.goddardai.org/app/content-display#markdown-documents)
