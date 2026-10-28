// Port of upstream Switch/SwitchShowcase.tsx (Astryx 0.6.4, MIT).
import { Switch } from '@octane-xplat/ui'
import { useState } from 'octane'

export function SwitchShowcase() @{
	const [enabled, setEnabled] = useState(true)

	<Switch label="Enable notifications" value={enabled} onChange={setEnabled} />
}
