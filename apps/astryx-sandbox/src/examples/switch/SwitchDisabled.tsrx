// Port of upstream Switch/SwitchDisabled.tsx (Astryx 0.6.4, MIT).
import { Switch } from '@octane-xplat/ui'
import { useState } from 'octane'

export function SwitchDisabled() @{
	const [value, setValue] = useState(false)
	<Switch label="Premium feature" description="Upgrade to enable this option" value={value} onChange={setValue} isDisabled />
}
