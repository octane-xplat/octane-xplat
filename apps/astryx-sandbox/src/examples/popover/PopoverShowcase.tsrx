// Port of upstream Popover/PopoverShowcase.tsx (Astryx 0.6.4, MIT).
// Upstream trigger-children + content prop → anchor ref + children panel.
import { useRef, useState } from 'octane'
import { Button, Divider, Heading, Popover, Text, VStack } from '@octane-xplat/ui'

export function PopoverShowcase() @{
	const anchor = useRef(null)
	const [isOpen, setIsOpen] = useState(false)
	return (
		<>
			<Button ref={anchor} label="Settings" clickAction={() => setIsOpen(true)} />
			<Popover
				anchor={anchor}
				open={isOpen}
				onDismiss={() => setIsOpen(false)}
				placement="bottom"
				style={{ width: 280 }}
			>
				<VStack gap={3} style={{ padding: 'var(--spacing-4)' }}>
					<Heading level={4}>Settings</Heading>
					<Divider />
					<Text type="body">Notifications, dark mode, and sound preferences.</Text>
				</VStack>
			</Popover>
		</>
	)
}
