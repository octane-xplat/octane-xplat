// Port of upstream ToggleButtonGroup/ToggleButtonGroupShowcase.tsx (Astryx 0.6.4, MIT).
import { ToggleButtonGroup, ToggleButton, Icon } from '@octane-xplat/ui'
import { useState } from 'octane'

export function ToggleButtonGroupShowcase() @{
	const [alignment, setAlignment] = useState<string | null>('left')

	<ToggleButtonGroup label="Alignment" value={alignment} onChange={setAlignment}>
		<ToggleButton value="left" label="Align left">
			<Icon name="sandbox-align-left" size={16} />
		</ToggleButton>
		<ToggleButton value="center" label="Align center">
			<Icon name="sandbox-align-center" size={16} />
		</ToggleButton>
		<ToggleButton value="right" label="Align right">
			<Icon name="sandbox-align-right" size={16} />
		</ToggleButton>
	</ToggleButtonGroup>
}
