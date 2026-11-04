### Markdown plugin protocol — syntax, transforms, and typed renderers

`Markdown` gains the Astryx 0.7.4 extension protocol: one ordered `plugins` list of `createMarkdownPlugin()` entries driving syntax → transform → render. Custom syntax contributes typed, frozen extension nodes through both the canonical AST and the incremental/streaming parser; transforms run in registration order with immutable input; plugin renderers resolve per node with decline/throw/pending fallbacks that keep the readable source text. All eight target helpers ship alongside: text transforms, semantic fences, source decorations, frontmatter, soft breaks, source lines, heading links, and `createMarkdownRemarkTransform` — the synchronous Remark adapter that round-trips a mutable MDAST copy against the supported subset and fails closed on anything unrepresentable — plus `MarkdownPluginNodeRenderer` for single-node adoption.

```tsx
import { Markdown, markdownSoftBreaksPlugin } from '@octane-xplat/ui/markdown'

<Markdown plugins={[markdownSoftBreaksPlugin]}>{source}</Markdown>
```

See [Markdown plugins](https://octane-xplat.goddardai.org/markdown#plugins) for the protocol contract and helper inventory.
