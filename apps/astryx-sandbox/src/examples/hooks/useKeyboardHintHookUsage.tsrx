// Port of upstream Hooks/useKeyboardHintHookUsage.tsx (Astryx 0.6.4, MIT).
// FINDING: upstream's ephemeral "← → to navigate" keyboard hint inside
// Toolbar is powered by a `useKeyboardHint` hook with no public equivalent
// in @octane-xplat/ui — the toolbar renders and navigates, but the hint
// affordance is absent. Recorded in docs/coverage.md rather than faked
// app-locally.
import { Button, Card, Icon, Section, Text, Toolbar, VStack } from '@octane-xplat/ui'

export function useKeyboardHintHookUsage() @{
	<Card style={{ width: 420 }}>
		<Toolbar
			label="Text formatting"
			dividers={['bottom']}
			startContent={
				<>
					<Button label="Bold" variant="ghost" icon={<Icon name="sandbox-bold" />} isIconOnly />
					<Button label="Italic" variant="ghost" icon={<Icon name="sandbox-italic" />} isIconOnly />
					<Button
						label="Underline"
						variant="ghost"
						icon={<Icon name="sandbox-underline" />}
						isIconOnly
					/>
				</>
			}
		/>
		<Section>
			<VStack gap={1}>
				<Text type="body" weight="bold">
					Keyboard-friendly by default
				</Text>
				<Text type="supporting" color="secondary">
					Tab into the toolbar with your keyboard and Toolbar shows an ephemeral "← → to navigate"
					hint — powered by useKeyboardHint — so sighted keyboard users learn that arrows move
					within the group.
				</Text>
			</VStack>
		</Section>
	</Card>
}
