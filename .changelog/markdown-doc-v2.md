---
hype: 75
---

### Markdown document format is now the recursive Astryx-aligned AST

`Markdown` now parses with the full Astryx 0.7.4 grammar — nested lists and blockquotes, tables with alignment, reference-style links, escapes and `&entity;` references, hard breaks, and CommonMark emphasis resolution — and the `MdDoc` AST exchanged with `xplat routes`, `parseMdDoc`, and `createMarkdownStreamParser` is a recursive, JSON-serializable tree (`v: 2`, `type`-tagged nodes) instead of the flattened v1 shape. Unsafe link and image destinations (`javascript:`, `vbscript:`, `data:text/html`) stay literal text. Validate externally-supplied documents with the new `assertMdDoc` helper.

```ts
import { parseMdDoc } from '@octane-xplat/ui/markdown'

const document = parseMdDoc('# Hello')
// { kind: 'octane-xplat/md', v: 2,
//   children: [{ type: 'heading', depth: 1,
//     children: [{ type: 'text', value: 'Hello' }] }] }
```

Two grammar changes to note: the parser no longer produces Setext headings (`Title` over `===`/`---` stays a paragraph, matching the reference), and a bare `- ` marker while streaming renders as text until item content arrives.

See [Markdown documents](https://octane-xplat.goddardai.org/content-display#markdown-documents) for the grammar coverage and streaming contract.
