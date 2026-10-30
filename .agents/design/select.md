# Finite selection contract

Select/MultiSelector own finite options. Remote search belongs in Typeahead,
free-text tokens in Tokenizer, custom dialogs in ComplexSelector, and structured
filters in PowerSearch. The [selection guide](../../docs/app/search-selection.md)
owns current public props and examples.

The shared DOM-free model owns controlled/default selection, visible-option
filtering, grouped rows, disabled/read-only guards, enabled-item select-all,
trigger summaries, and async commit lifecycle. Web owns composite focus and
active-descendant linkage, keyboard/IME behavior, and focus restoration. Native
surfaces own bounded results and explicit selected/disabled/loading feedback;
hardware-keyboard support requires a platform adapter and verification.

## Commit and rejection contract

Selection changes call `onValueChange` immediately. `changeAction` may settle
asynchronously; pending commits display optimistically and block another edit.
A rejected action restores the prior uncontrolled selection. For controlled
selection, restore only when the parent still holds the submitted value, so a
newer external value is not overwritten. `onChangeError` receives the rejection.
Loading supplied by the caller remains independent and does not prevent selecting
existing options. Closing or disabling a control hides its surface; disposal
prevents late callbacks.

```tsx
import { useState } from 'octane'
import { MultiSelector } from '@octane-xplat/ui'

export function Example() {
	const [regions, setRegions] = useState<string[]>([])
	return (
		<MultiSelector
			label="Regions"
			options={[{ value: 'sfo', label: 'San Francisco' }]}
			value={regions}
			onValueChange={setRegions}
			changeAction={async (next) => {
				console.log('Save', next)
			}}
			onChangeError={(error) => console.log(error)}
		/>
	)
}
```


## Verification

Exercise pending/rejection ordering, newer controlled values, filtering,
disabled-value retention, forms, close/reopen, and disposal. Distinguish model
checks, build/type evidence, synthetic handler probes, actual keyboard input,
and screen-reader verification. AppKit anchored Popover presentation uses native
close reconciliation before disposing its separate root. A direct import probe
does not establish that the full UI barrel resolves on a target.

Keep current gaps in Silo and the public guide; do not infer full Astryx parity
from the finite-list model. The original plan and test record are preserved under
`local_artifacts` key `.agents/design/select-implementation-plan.md`; use
[operational evidence](../docs/exploration.md#operational-evidence).
