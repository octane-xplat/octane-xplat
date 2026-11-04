### Markdown renders through the full Astryx 0.7.4 surface

`Markdown` now matches the Astryx 0.7.4 component: raw source moves from a `text` prop to `children` (`data` for baked documents is unchanged), `isStreaming` smooths bursts internally, and new props control layout, citations, links, and extensions — `display`, `contentWidth`, `contentAlign`, `citationStyle`, `autolink`, `onLinkClick`, `components` (ten renderer slots), `inlinePlugins`, and `plugins`.

```tsx
import { Markdown } from '@octane-xplat/ui/markdown'

// Before: <Markdown text={source} isStreaming />
// After: pass the raw accumulated string — smoothing is built in.
<Markdown isStreaming sources={{ a: { title: 'Docs', url: 'https://example.com' } }}>
  {source}
</Markdown>
```

Do not compose `useStreamingText` into `isStreaming` — the text would reveal twice. Renderer overrides receive the same data the default part reads; plugins add ordered syntax, immutable transforms, and typed renderers. See [Markdown](https://octane-xplat.goddardai.org/markdown) for the full surface and migration notes.
