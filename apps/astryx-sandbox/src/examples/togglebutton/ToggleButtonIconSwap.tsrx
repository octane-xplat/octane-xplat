// Port of upstream ToggleButton/ToggleButtonIconSwap.tsx (Astryx 0.6.4, MIT).
import { ToggleButton, Icon } from '@octane-xplat/ui'
import { useState } from 'octane'

export function ToggleButtonIconSwap() @{
	const [muted, setMuted] = useState(false)
	const [subscribed, setSubscribed] = useState(false)

	<div style={{ display: 'flex', gap: 8 }}>
		<ToggleButton
			label={muted ? 'Unmute notifications' : 'Mute notifications'}
			isPressed={muted}
			onPressedChange={setMuted}
			icon={<Icon name="sandbox-bell" size={16} />}
			pressedIcon={<Icon name="sandbox-bell-slash" size={16} />}
		/>
		<ToggleButton
			label={subscribed ? 'Remove bookmark' : 'Bookmark'}
			isPressed={subscribed}
			onPressedChange={setSubscribed}
			icon={<Icon name="sandbox-bookmark" size={16} />}
			pressedIcon={<Icon name="sandbox-bookmark-solid" size={16} />}
		/>
	</div>
}
