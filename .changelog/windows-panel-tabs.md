### Use native selection and keyboard input in Windows panel tabs

Experimental Windows panel tabs now expose native tab-selection automation,
use one Tab stop, and select enabled tabs with Left/Right, Home and End.
Selection stays controlled by your component, which also renders the panel:

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

The experimental host's broader platform, overflow and accessibility limits
still apply. See [Windows panel tabs](https://octane-xplat.goddardai.org/platform/windows-setup#panel-tabs-candidate).
