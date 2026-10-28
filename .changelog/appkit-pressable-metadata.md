### AppKit action identifiers

AppKit Pressable and Button now forward testID and accessible. Concrete native
hosts map testID to an accessibility identifier, keeping CSS IDs and spoken
labels separate.

```tsx
import { Button } from '@octane-xplat/ui'

export function Save({ save }: { save(): void }) {
	return <Button id="save-control" testID="draft.save" label="Save changes" clickAction={save} />
}
```

Native selector replay and VoiceOver remain unqualified. See
[AppKit identifiers](https://octane-xplat.goddardai.org/testing/test-identifiers#appkit-source-implementation).
