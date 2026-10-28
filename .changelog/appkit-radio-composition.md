### Radio choices on AppKit

RadioList now supports RadioListItem children alongside options, with one
selection owner, descriptions/trailing content and Field metadata. Native rows
have explicit radio names and checked state.

```tsx
import { RadioList, RadioListItem } from '@octane-xplat/ui'

export function Plan() {
	return <RadioList label="Plan" defaultValue="free">
		<RadioListItem value="free" label="Free" description="Personal use" />
		<RadioListItem value="team" label="Team" />
	</RadioList>
}
```

Native input, VoiceOver and layout remain unqualified; radio arrow navigation
and roving Tab remain gaps. See [radio choices](https://octane-xplat.goddardai.org/app/components#radio-choices-on-appkit).
