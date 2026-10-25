// Port of upstream Popover/PopoverKeyboardShortcuts.tsx (Astryx 0.6.4, MIT).
import { useRef, useState } from 'octane'
import { Button, Divider, Heading, HStack, Kbd, Popover, Text, VStack } from '@octane-xplat/ui'

const shortcuts = [
	{ key: '⌘K', action: 'Command palette' },
	{ key: '⌘/', action: 'Toggle sidebar' },
	{ key: '⌘.', action: 'Quick actions' },
]

export function PopoverKeyboardShortcuts() @{
	const anchor = useRef(null)
	const [isOpen, setIsOpen] = useState(false)
	return (
		<>
			<Button ref={anchor} label="Shortcuts" clickAction={() => setIsOpen(true)} />
			<Popover anchor={anchor} open={isOpen} onDismiss={() => setIsOpen(false)} placement="bottom" style={{ width: 260 }}>
				<VStack gap={2} style={{ padding: 'var(--spacing-4)' }}>
					<Heading level={4}>Keyboard shortcuts</Heading>
					<Divider />
					{shortcuts.map((s) => (
						<HStack key={s.key} gap={3}>
							<Kbd>{s.key}</Kbd>
							<Text className="sb-type-body">{s.action}</Text>
						</HStack>
					))}
				</VStack>
			</Popover>
		</>
	)
}
