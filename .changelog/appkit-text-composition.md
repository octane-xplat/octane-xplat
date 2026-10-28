### Readable text composition on AppKit

Experimental AppKit now composes nested Text and RichText as styled runs under
one text owner. Text inside Heading uses that owner too. RichText purpose
imports share the root leaf, and RichTextSpan.text now displays its explicit
value without duplicating child content. Root text hosts retain parent-layout
props; native layout and accessibility qualification remain pending.

```tsx
import { RichText, RichTextSpan, Text } from '@octane-xplat/ui'
export function Notice() {
	return <>
		<Text>Read <Text weight="bold">carefully</Text>.</Text>
		<RichText><RichTextSpan text="Ready to review" /></RichText>
	</>
}
```

Per-span press hit testing remains unimplemented. See the
[text component guide](https://octane-xplat.goddardai.org/app/components#text).
