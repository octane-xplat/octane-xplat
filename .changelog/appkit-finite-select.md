### AppKit multiple-option presentation

AppKit Selector now passes multiple mode to its view, including MultiSelector's
checkbox/select-all presentation. Blocked/pending rows reject selection, and
custom option/single-value renderers receive native text hosts.

```tsx
import { MultiSelector } from '@octane-xplat/ui'

export function Channels() {
	return <MultiSelector options={[{ value: 'email', label: 'Email' }, { value: 'push', label: 'Push' }]}
		defaultValue={['email']} hasSelectAll />
}
```

Popup keyboard/focus, layout and VoiceOver remain unqualified. See [AppKit selection](https://octane-xplat.goddardai.org/app/search-selection#appkit-finite-option-selection).
