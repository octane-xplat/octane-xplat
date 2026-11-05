---
hype: 75
---

### Render richer Markdown and add custom syntax

`Markdown` now follows Astryx 0.7.4, with nested lists and blockquotes, aligned tables, reference links, citations, renderer overrides, and built-in streaming smoothing.

**Breaking change:** pass raw source through `children` instead of `text`; `data` still accepts pre-parsed documents. Pass the accumulated source directly to `isStreaming` without `useStreamingText`, or the text will reveal twice.

```tsx
import { Markdown } from '@octane-xplat/ui/markdown'

// Before: <Markdown text={source} isStreaming />
// After: pass the raw accumulated string — smoothing is built in.
<Markdown isStreaming sources={{ a: { title: 'Docs', url: 'https://example.com' } }}>
  {source}
</Markdown>
```

**Breaking change:** the `MdDoc` document format used by `xplat routes`, `parseMdDoc`, and `createMarkdownStreamParser` moves from the flattened v1 format to a recursive, JSON-serializable v2 tree. Update stored documents and code that reads their nodes.

```ts
import { parseMdDoc } from '@octane-xplat/ui/markdown'

const document = parseMdDoc('# Hello')
// { kind: 'octane-xplat/md', v: 2,
//   children: [{ type: 'heading', depth: 1,
//     children: [{ type: 'text', value: 'Hello' }] }] }
```

Setext headings (`Title` above `===` or `---`) now remain paragraphs. A bare `- ` stays text while streaming until item content arrives. Unsafe link and image destinations stay literal text.

An ordered `plugins` list adds custom syntax, immutable transforms, and typed renderers to parsing and streaming. Helpers cover text transforms, semantic fences, source decorations, frontmatter, soft breaks, source lines, heading links, and synchronous Remark transforms.

```tsx
import { Markdown, markdownSoftBreaksPlugin } from '@octane-xplat/ui/markdown'

<Markdown plugins={[markdownSoftBreaksPlugin]}>{source}</Markdown>
```

See [Markdown and migration notes](https://octane-xplat.goddardai.org/markdown), [document format and grammar](https://octane-xplat.goddardai.org/content-display#markdown-documents), and [plugin contracts and helpers](https://octane-xplat.goddardai.org/markdown#plugins).
