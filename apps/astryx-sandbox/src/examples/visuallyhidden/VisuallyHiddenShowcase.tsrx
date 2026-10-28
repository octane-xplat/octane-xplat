// Port of upstream VisuallyHidden/VisuallyHiddenShowcase.tsx (Astryx 0.6.4, MIT).
// Heroicon paths map to the sandbox icon registry; upstream `aria-live`
// maps to accessibilityLiveRegion.
import { Card, HStack, Icon, IconButton, Text, VisuallyHidden, VStack } from '@octane-xplat/ui'

const actions = [
	{ label: 'Download', icon: 'sandbox-arrow-down-tray' },
	{ label: 'Share', icon: 'sandbox-share' },
	{ label: 'Delete', icon: 'sandbox-trash' },
] as const

/**
 * VisuallyHidden is invisible by design, so this hero teaches the concept by
 * contrast: the icon-only buttons are all a sighted user sees, while the
 * caption spells out the accessible name each one exposes. A live
 * <VisuallyHidden> region below announces the same names to assistive tech,
 * so the demo genuinely exercises the component it documents.
 */
export function VisuallyHiddenShowcase() {
	return (
		<VStack gap={5} hAlign="center">
			<HStack gap={6} vAlign="stretch" wrap="wrap" hAlign="center">
				<Card variant="muted">
					<VStack gap={4} hAlign="center">
						<Text type="supporting" color="secondary">
							What you see
						</Text>
						<HStack gap={2}>
							{actions.map(({ label, icon }) => (
								<IconButton
									key={label}
									label={label}
									icon={<Icon name={icon} />}
									variant="ghost"
								/>
							))}
						</HStack>
					</VStack>
				</Card>

				<Card variant="muted">
					<VStack gap={4} hAlign="start">
						<HStack gap={2} vAlign="center">
							<Icon name="sandbox-speaker-wave" size={16} />
							<Text type="supporting" color="secondary">
								What a screen reader hears
							</Text>
						</HStack>
						<VStack gap={2}>
							{actions.map(({ label }) => (
								<Text key={label} type="body">
									{label}, button
								</Text>
							))}
						</VStack>
					</VStack>
				</Card>
			</HStack>

			{/* A real live region: silent to sighted users, announced by AT. */}
			<VisuallyHidden as="div" accessibilityLiveRegion="polite">
				Actions available: Download, Share, Delete.
			</VisuallyHidden>
		</VStack>
	)
}
