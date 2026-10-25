// Port of upstream ToggleButton/ToggleButtonShowcase.tsx (Astryx 0.6.4, MIT).
import { ToggleButton, Icon } from '@octane-xplat/ui'
import { useState } from 'octane'

export function ToggleButtonShowcase() @{
	const [bookmarked, setBookmarked] = useState(false)
	<ToggleButton label="Bookmark" isPressed={bookmarked} onPressedChange={setBookmarked}>
		<Icon name="sandbox-bookmark" size={16} />
	</ToggleButton>
}
