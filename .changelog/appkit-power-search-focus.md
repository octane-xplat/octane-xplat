Experimental AppKit PowerSearch now waits for its first native input attachment
when initial focus is requested. User activity, a newer focus owner, blocking,
filter editing and removal cancel stale requests.

```tsx
import { PowerSearch, createPowerSearchConfig } from '@octane-xplat/ui'
const { config } = createPowerSearchConfig([{ key: 'title', type: 'string' }] as const)
export function Search() {
	return <PowerSearch config={config} filters={[]} onChange={() => {}} hasAutoFocus />
}
```

Native focus, IME, modal and packaging behavior remain unqualified. See
[initial AppKit search focus](https://octane-xplat.goddardai.org/app/power-search#request-initial-appkit-search-focus).
