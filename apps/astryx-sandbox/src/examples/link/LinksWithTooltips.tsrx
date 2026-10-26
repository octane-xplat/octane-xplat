// Port of upstream Link/LinksWithTooltips.tsx (Astryx 0.6.4, MIT).
import { HStack, Link } from '@octane-xplat/ui'

export function LinksWithTooltips() @{
	<HStack gap={4} vAlign="center">
		<Link href="#" tooltip="Configure your account settings" isStandalone>Settings</Link>
		<Link href="#" tooltip="View and edit your profile" isStandalone>Profile</Link>
		<Link href="#" tooltip="Get help and support" color="secondary" isStandalone>Help</Link>
	</HStack>
}
