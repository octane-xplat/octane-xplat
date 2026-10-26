// Port of upstream IconButton/IconButtonShowcase.tsx (Astryx 0.6.4, MIT).
import { Icon, IconButton } from '@octane-xplat/ui'

export function IconButtonShowcase() @{
	return <IconButton label="Settings" icon={<Icon name="sandbox-wrench" color="inherit" />} />
}
