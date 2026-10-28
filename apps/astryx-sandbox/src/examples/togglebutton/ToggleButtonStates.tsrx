// Port of upstream ToggleButton/ToggleButtonStates.tsx (Astryx 0.6.4, MIT).
import { ToggleButton, Stack, Icon } from '@octane-xplat/ui'
import { useState } from 'octane'

export function ToggleButtonStates() @{
	const [unchecked, setUnchecked] = useState(false)
	const [checked, setChecked] = useState(true)
	const [loading, setLoading] = useState(false)

	<Stack direction="horizontal" gap={2}>
		<ToggleButton label="Favorite" isPressed={unchecked} onPressedChange={setUnchecked}>
			<Icon name="sandbox-heart" size={16} />
		</ToggleButton>
		<ToggleButton label="Favorited" isPressed={checked} onPressedChange={setChecked}>
			<Icon name="sandbox-heart" size={16} />
		</ToggleButton>
		<ToggleButton label="Loading" isPressed={loading} onPressedChange={setLoading} isLoading>
			<Icon name="sandbox-heart" size={16} />
		</ToggleButton>
		<ToggleButton label="Disabled" isDisabled>
			<Icon name="sandbox-heart" size={16} />
		</ToggleButton>
		<ToggleButton label="Disabled pressed" isPressed isDisabled>
			<Icon name="sandbox-heart" size={16} />
		</ToggleButton>
	</Stack>
}
