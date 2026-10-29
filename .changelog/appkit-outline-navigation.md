### Heading navigation on AppKit

Experimental AppKit Outline now has native heading seeks and uncontrolled
scroll spy. Supply the native scroll viewport when the navigation sits outside
its scroll ancestor. Header offsets, controlled selection, click-scroll opt-out
and reduced-motion seeks have source implementations.

```tsx
import { Outline, type HostElement } from '@octane-xplat/ui'
export function Contents({ scroll }: { scroll: { current: HostElement | null } }) {
	return <Outline items={[{ id: 'intro', label: 'Introduction', level: 1 }]}
		scrollContainerRef={scroll} offset={24} />
}
```

Actual native seeks, animation completion, scroll spy, input/VoiceOver and
packaged consumers remain unqualified. Completion uses a quiet timer fallback.
See the [content-display guide](https://octane-xplat.goddardai.org/app/content-display#outline-from-markdown-or-a-rendered-tree).
