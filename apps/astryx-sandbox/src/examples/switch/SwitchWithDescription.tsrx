// Port of upstream Switch/SwitchWithDescription.tsx (Astryx 0.6.4, MIT).
import { Switch } from '@octane-xplat/ui'
import { useState } from 'octane'

export function SwitchWithDescription() @{
	const [value, setValue] = useState(false)
	<Switch label="Dark mode" description="Switch to a darker color scheme." value={value} onChange={setValue} />
}
