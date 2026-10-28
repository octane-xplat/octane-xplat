### Radio choices on AppKit

RadioList now supports RadioListItem children alongside options, with one
selection owner, descriptions/trailing content and Field metadata. Native rows
have explicit radio names and checked state. Ordinary form groups now request
selection after Arrow/Home/End focus, respect RTL horizontal keys and use owned
roving Tab exclusions when the native bridges are available.

```tsx
import { RadioList, RadioListItem } from '@octane-xplat/ui'

export function Plan() {
	return <RadioList label="Plan" defaultValue="free">
		<RadioListItem value="free" label="Free" description="Personal use" />
		<RadioListItem value="team" label="Team" />
	</RadioList>
}
```

Native input/Tab/focus/reveal, VoiceOver and layout remain unqualified;
toolbar-specific radio navigation remains unsupported. See [radio choices](https://octane-xplat.goddardai.org/app/components#radio-choices-on-appkit).
