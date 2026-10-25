// Port of upstream ToggleButton/ToggleButtonGroup.tsx (Astryx 0.6.4, MIT).
import { ToggleButtonGroup as ToggleGroup, ToggleButton, Icon } from '@octane-xplat/ui'
import { useState } from 'octane'

export function ToggleButtonGroup() @{
	const [formats, setFormats] = useState<string[]>(['bold'])
	<ToggleGroup type="multiple" label="Text formatting" value={formats} onChange={setFormats}>
		<ToggleButton value="bold" label="Bold"><Icon name="sandbox-bold" size={16} /></ToggleButton>
		<ToggleButton value="italic" label="Italic"><Icon name="sandbox-italic" size={16} /></ToggleButton>
		<ToggleButton value="underline" label="Underline"><Icon name="sandbox-underline" size={16} /></ToggleButton>
	</ToggleGroup>
}
