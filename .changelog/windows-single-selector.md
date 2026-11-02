### Choose a Windows option with the keyboard or mouse

Experimental Windows single-choice Selectors now use native option selection and accessibility while keeping the shared trigger and option content. Open with F4 or a click, preview with arrow keys, commit with Enter, and cancel with Escape:

```tsx
import { useState } from 'octane'
import { Selector } from '@octane-xplat/ui'

export function Choice() {
  const [value, setValue] = useState<string | null>('first')
  return <Selector selectionMode="single" value={value} onValueChange={setValue}
    options={[{ value: 'first', label: 'First' }, { value: 'third', label: 'Third' }]} />
}
```

Search, multiple selection, clear controls, empty lists and groups retain the shared native view and its input limits. See the [Windows Selector guide](https://octane-xplat.goddardai.org/platform/windows-setup#single-selection-candidate) for the experimental support boundary.
