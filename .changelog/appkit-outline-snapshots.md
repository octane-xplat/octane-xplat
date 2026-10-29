### Heading snapshots on AppKit

Experimental AppKit can now derive Outline items from a native content root
when the renderer heading-reader bridge is installed. The hook snapshots IDs,
current heading text and levels; it does not observe later content mutations.
Native discovery and packaged-consumer qualification remain pending.

```tsx
import { useOutlineFromView } from '@octane-xplat/ui/macos'
import { Outline } from '@octane-xplat/ui'
export function Contents({ root }: { root: object }) {
	const items = useOutlineFromView(root)
	return <Outline items={items} hasScrollOnClick={false} />
}
```

Older hosts still report unsupported. Native navigation has a separate source
implementation and remains unqualified. See the [content-display guide](https://octane-xplat.goddardai.org/app/content-display#outline-from-markdown-or-a-rendered-tree).
