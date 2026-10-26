// Port of upstream Popover/PopoverConfirmAction.tsx (Astryx 0.6.4, MIT).
import { useRef, useState } from 'octane'
import { Button, Heading, HStack, Popover, Text, VStack } from '@octane-xplat/ui'

export function PopoverConfirmAction() @{
	const anchor = useRef(null)
	const [isOpen, setIsOpen] = useState(false)
	return (
		<>
			<Button ref={anchor} label="Delete project" variant="destructive" clickAction={() => setIsOpen(true)} />
			<Popover anchor={anchor} open={isOpen} onDismiss={() => setIsOpen(false)} placement="bottom" style={{ width: 300 }}>
				<VStack gap={3} style={{ padding: 'var(--spacing-4)' }}>
					<Heading level={4}>Delete project?</Heading>
					<Text type="body">This will permanently delete the project and all its data. This action cannot be undone.</Text>
					<HStack gap={2} justify="end">
						<Button label="Delete" variant="destructive" clickAction={() => setIsOpen(false)} />
						<Button label="Cancel" variant="ghost" clickAction={() => setIsOpen(false)} />
					</HStack>
				</VStack>
			</Popover>
		</>
	)
}
