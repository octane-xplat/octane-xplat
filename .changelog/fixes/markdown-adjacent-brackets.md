### Keep bracketed text separate from Markdown links

A closed bracket marker before a link no longer becomes part of the link's
label. This also keeps source citations independent of nearby links.

```tsx
import { Markdown } from '@octane-xplat/ui/markdown'

<Markdown text={'[note] Read the [guide](https://example.com/guide).'} />
```

[Markdown guide](https://octane-xplat.goddardai.org/app/content-display#markdown-documents)
