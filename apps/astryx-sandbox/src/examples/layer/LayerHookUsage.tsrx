// Port of upstream Layer/LayerHookUsage.tsx (Astryx 0.6.4, MIT).
import { Button, Card, Center, Text, useLayer, VStack } from '@octane-xplat/ui'

export function LayerHookUsage() @{
	const layer = useLayer({ mode: 'context', lightDismiss: true })
	return (
		<Center style={{ height: 220 }}>
			<VStack gap={2}>
				<Button
					label={layer.isOpen ? 'Hide layer' : 'Show layer'}
					ref={layer.ref}
					clickAction={layer.isOpen ? layer.hide : layer.show}
				/>
				{layer.render(
					<Card padding={3}>
						<VStack gap={1}>
							<Text type="body" style={{ fontWeight: 600 }}>
								Anchored content
							</Text>
							<Text type="body" color="secondary">
								useLayer provides positioning; you own semantics and surface.
							</Text>
						</VStack>
					</Card>,
					{ placement: 'below', alignment: 'center' },
				)}
			</VStack>
		</Center>
	)
}
