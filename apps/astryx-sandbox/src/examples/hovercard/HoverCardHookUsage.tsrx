// Port of upstream HoverCard/HoverCardHookUsage.tsx (Astryx 0.6.4, MIT).
import { Button, Center, Text, useHoverCard, VStack } from '@octane-xplat/ui'

export function HoverCardHookUsage() @{
	const hoverCard = useHoverCard({
		placement: 'below',
		delay: 100,
		isDefaultOpen: true,
		label: 'Alex Morgan',
	})

	<Center height={220}>
		<Button
			label="Hover profile"
			ref={hoverCard.ref}
			web={{
				'aria-haspopup': 'dialog',
				'aria-controls': hoverCard.isOpen ? hoverCard.id : undefined,
				'aria-expanded': hoverCard.isOpen,
			}}
		/>
		{hoverCard.renderHoverCard(
			<VStack gap={1}>
				<Text type="body" weight="bold">
					Alex Morgan
				</Text>
				<Text type="body" color="secondary">
					Staff designer · Product systems
				</Text>
				<Text type="body" color="secondary">
					Owns interaction patterns for overlays and navigation.
				</Text>
			</VStack>,
			{ placement: 'below', alignment: 'center' },
		)}
	</Center>
}
