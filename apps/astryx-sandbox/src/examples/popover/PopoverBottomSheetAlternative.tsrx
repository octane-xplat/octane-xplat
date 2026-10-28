// Port of upstream Popover/PopoverBottomSheetAlternative.tsx (Astryx 0.6.4, MIT).
import { useState } from 'octane'
import {
	BottomSheet,
	Button,
	Heading,
	Icon,
	List,
	ListItem,
	Section,
	Text,
	VStack,
} from '@octane-xplat/ui'

const PROJECT_ACTIONS = [
	['sandbox-user', 'Assign owner', 'Route follow-up to a teammate.'],
	['sandbox-tag', 'Add label', 'Group this item with related work.'],
	['sandbox-calendar', 'Set due date', 'Pick a reminder for review.'],
] as const

export function PopoverBottomSheetAlternative() @{
	const [isOpen, setIsOpen] = useState(false)
	return (
		<>
			<Button label="Open project actions" clickAction={() => setIsOpen(true)} />
			<BottomSheet isOpen={isOpen} onOpenChange={setIsOpen} label="Project actions" height="hug">
				<Section padding={4}>
					<VStack gap={3}>
						<VStack gap={1}>
							<Heading level={3}>Project actions</Heading>
							<Text type="supporting" color="secondary">
								Use this modal touch surface when the task should move away from its trigger and
								stay close to the bottom edge.
							</Text>
						</VStack>
						<List density="spacious">
							{PROJECT_ACTIONS.map(([icon, label, description]) => (
								<ListItem
									key={label}
									label={label}
									description={description}
									startContent={<Icon name={icon as any} size={20} />}
									onPress={() => setIsOpen(false)}
								/>
							))}
						</List>
					</VStack>
				</Section>
			</BottomSheet>
		</>
	)
}
