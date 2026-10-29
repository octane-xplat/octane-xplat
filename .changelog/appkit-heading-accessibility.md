### Heading metadata on AppKit

Experimental AppKit Heading now forwards its level to native accessibility.
Its accessible title follows plain and rich text updates while visible contents
stay intact. Display typography remains independent of the semantic level.

```tsx
import { Heading } from '@octane-xplat/ui'
export function Title({ title }: { title: string }) {
	return <Heading level={2} type="display-2">{title}</Heading>
}
```

Native setter behavior and VoiceOver heading navigation, announcements and updates
remain unqualified. See the [text guide](https://octane-xplat.goddardai.org/app/components#text).
