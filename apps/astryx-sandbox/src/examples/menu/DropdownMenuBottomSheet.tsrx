// Port of upstream DropdownMenu/DropdownMenuBottomSheet.tsx (Astryx 0.6.4, MIT).
import { useState } from 'octane'
import { DropdownMenu, Text, useMediaQuery, VStack } from '@octane-xplat/ui'
import { menuItems } from './helpers'

const COMPACT_TOUCH_QUERY = '(max-width: 639px) and (pointer: coarse) and (hover: none)'

const ACTIONS = [
	{ label: 'Edit project', icon: 'sandbox-pencil-square' },
	{ label: 'Duplicate project', icon: 'sandbox-document-duplicate' },
	{ label: 'Share project', icon: 'sandbox-share' },
	{ label: 'Archive project', icon: 'sandbox-box' },
] as const

export function DropdownMenuBottomSheet() @{
	const [lastAction, setLastAction] = useState<string | null>(null)
	const isCompactTouch = useMediaQuery(COMPACT_TOUCH_QUERY)
	return (
		<VStack gap={3} align="start">
			<DropdownMenu
				label="Project actions"
				button={{ label: 'Project actions' }}
				presentation={isCompactTouch ? 'bottom-sheet' : 'popover'}
				items={menuItems(ACTIONS.map(({ label, icon }) => ({ label, icon, onClick: () => setLastAction(label) })))}
			/>
			{lastAction && <Text type="supporting" color="secondary">Last action: {lastAction}</Text>}
		</VStack>
	)
}
