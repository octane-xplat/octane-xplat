// Port of upstream ToggleButton/ToggleButtonLabel.tsx (Astryx 0.6.4, MIT).
import { ToggleButton } from '@octane-xplat/ui'
import { useState } from 'octane'

export function ToggleButtonLabel() @{
	const [showDetails, setShowDetails] = useState(true)

	<ToggleButton label="Show details" isPressed={showDetails} onPressedChange={setShowDetails} />
}
