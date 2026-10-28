// Port of upstream ToggleButton/ToggleButtonColor.tsx (Astryx 0.6.4, MIT).
import { ToggleButton, Stack, Icon } from '@octane-xplat/ui'
import { useState } from 'octane'

export function ToggleButtonColor() @{
	const [a, setA] = useState(false)
	const [b, setB] = useState(false)
	const [c, setC] = useState(false)
	const [d, setD] = useState(false)

	<Stack direction="horizontal" gap={2}>
		<ToggleButton label="Like accent" isPressed={a} onPressedChange={setA} color="accent">
			<Icon name="sandbox-heart" size={16} />
		</ToggleButton>
		<ToggleButton label="Like success" isPressed={b} onPressedChange={setB} color="success">
			<Icon name="sandbox-heart" size={16} />
		</ToggleButton>
		<ToggleButton label="Like warning" isPressed={c} onPressedChange={setC} color="warning">
			<Icon name="sandbox-heart" size={16} />
		</ToggleButton>
		<ToggleButton label="Like error" isPressed={d} onPressedChange={setD} color="error">
			<Icon name="sandbox-heart" size={16} />
		</ToggleButton>
	</Stack>
}
