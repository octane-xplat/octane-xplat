// Port of upstream Popover/PopoverHookUsage.tsx (Astryx 0.6.4, MIT).
import { Button, Card, Center, Text, usePopover, VStack } from '@octane-xplat/ui'

export function PopoverHookUsage() @{
	const popover = usePopover({ dialogLabel: 'Quick actions' })
	return (
		<Center style={{ height: 240 }}>
			<VStack gap={2}>
				<Button label="Open actions" ref={popover.triggerRef} clickAction={popover.toggle} {...(popover.triggerProps as any)} />
				{popover.render(
					<Card width={220} padding={3} variant="transparent">
						<VStack gap={2}>
							<Text type="body" style={{ fontWeight: 600 }}>Quick actions</Text>
							<Button label="Create task" size="sm" />
							<Button label="Share report" variant="secondary" size="sm" />
						</VStack>
					</Card>,
					{ placement: 'below', alignment: 'center' },
				)}
			</VStack>
		</Center>
	)
}
