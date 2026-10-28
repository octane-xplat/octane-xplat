// Port of upstream HoverCard/HoverCardInlineTextHoverCard.tsx (Astryx 0.6.4, MIT).
import { HoverCard, Text, VStack } from '@octane-xplat/ui'

const content = { maxWidth: 200 }

export function HoverCardInlineTextHoverCard() @{
	<Text type="body">
		The component uses a{' '}
		<HoverCard
			content={
				<VStack gap={1} style={content}>
					<Text type="label">Focus trap</Text>
					<Text type="body" color="secondary">
						A pattern that keeps keyboard focus inside a container, preventing it from moving to
						elements outside. Used in dialogs and modals to ensure accessibility.
					</Text>
				</VStack>
			}
			placement="above"
		>
			focus trap
		</HoverCard>{' '}
		to keep keyboard navigation inside the{' '}
		<HoverCard
			content={
				<VStack gap={1} style={content}>
					<Text type="label">Modal dialog</Text>
					<Text type="body" color="secondary">
						An overlay that blocks interaction with the rest of the page until the user responds.
						Uses the native HTML dialog element for built-in accessibility and backdrop support.
					</Text>
				</VStack>
			}
			placement="above"
		>
			modal dialog
		</HoverCard>
		.
	</Text>
}
