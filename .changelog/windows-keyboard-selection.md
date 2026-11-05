---
hype: 50
---

### Use native keyboard selection in more Windows controls

Experimental Windows menus, panel tabs, and single-choice Selectors now use native input and accessibility for the supported configurations.

Dropdown menus support native menu-item input and automation for flat action rows while keeping the shared button and row content:

```tsx
import { DropdownMenu } from '@octane-xplat/ui'

export function Actions() {
  return <DropdownMenu button={{ label: 'Actions' }} items={[
    { type: 'action', key: 'open', label: 'Open', onSelect: () => console.log('Open') },
    { type: 'action', key: 'remove', label: 'Remove', isDisabled: true },
  ]} />
}
```

Other row kinds, keep-open or compound menus, sheet presentation, and custom surface settings retain the shared view and its input limits. See [Windows action menus](https://octane-xplat.goddardai.org/platform/windows-setup#action-menu-candidate).

Panel tabs expose native tab-selection automation, use one Tab stop, and select enabled tabs with Left/Right, Home, and End. Your component continues to own selection and panel rendering:

```tsx
import { useState } from 'octane'
import { Tab, TabList, Text } from '@octane-xplat/ui'

export function Panels() {
  const [tab, setTab] = useState('overview')
  return <>
    <TabList role="tablist" layout="fill" value={tab} onChange={setTab}>
      <Tab value="overview" label="Overview" />
      <Tab value="details" label="Details" />
    </TabList>
    <Text>{tab === 'overview' ? 'Overview panel' : 'Details panel'}</Text>
  </>
}
```

See [Windows panel tabs](https://octane-xplat.goddardai.org/platform/windows-setup#panel-tabs-candidate) for the platform, overflow, and accessibility limits.

Single-choice Selectors support F4 or click to open, arrow keys to preview, Enter to commit, and Escape to cancel, with native option selection and accessibility:

```tsx
import { useState } from 'octane'
import { Selector } from '@octane-xplat/ui'

export function Choice() {
  const [value, setValue] = useState<string | null>('first')
  return <Selector selectionMode="single" value={value} onValueChange={setValue}
    options={[{ value: 'first', label: 'First' }, { value: 'third', label: 'Third' }]} />
}
```

Search, multiple selection, clear controls, empty lists, and groups retain the shared native view and its input limits. See [Windows Selectors](https://octane-xplat.goddardai.org/platform/windows-setup#single-selection-candidate).
