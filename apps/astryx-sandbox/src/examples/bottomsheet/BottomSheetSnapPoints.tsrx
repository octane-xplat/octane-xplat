// Port of upstream BottomSheet/BottomSheetSnapPoints.tsx (Astryx 0.6.4, MIT).
import { useState } from 'octane'
import {
	BottomSheet,
	Button,
	Divider,
	Heading,
	HStack,
	Icon,
	Item,
	Text,
	VStack,
} from '@octane-xplat/ui'

import type { BottomSheetSnapPoint } from '@octane-xplat/ui'

const SNAP_POINTS: BottomSheetSnapPoint[] = ['96px', '50%']
const steps = [
	['sandbox-map-pin', 'Head northeast on Mission St', 'Toward 3rd St', '350 ft'],
	[
		'sandbox-arrow-right',
		'Turn right onto 3rd St',
		'Pass Yerba Buena Gardens on your left',
		'0.2 mi',
	],
	['sandbox-arrow-up', 'Continue onto Kearny St', 'Stay in the right lane', '0.4 mi'],
	['sandbox-arrow-left', 'Turn left onto Market St', 'Cable car crossing ahead', '0.6 mi'],
	['sandbox-arrow-right', 'Bear right onto Sutter St', 'Toward the Financial District', '0.3 mi'],
	['sandbox-arrow-up', 'Continue on Sansome St', 'Four blocks, past Pine St', '0.5 mi'],
	[
		'sandbox-uturn-left',
		'Make a U-turn at Washington St',
		'Construction detour until March',
		'150 ft',
	],
	[
		'sandbox-arrow-right',
		'Turn right onto Battery St',
		'Follow signs for the Embarcadero',
		'0.4 mi',
	],
	['sandbox-arrow-left', 'Turn left onto Sacramento St', 'Toward the waterfront', '0.2 mi'],
	['sandbox-arrow-right', 'Turn right onto The Embarcadero', 'Bay Bridge on your right', '0.5 mi'],
	['sandbox-arrow-up', 'Continue past Pier 14', 'Ferry terminal signage begins here', '0.3 mi'],
	['sandbox-flag', 'Arrive at the Ferry Building', 'Parking garage entrance on Washington St', '—'],
] as const

export function BottomSheetSnapPoints() @{
	const [isOpen, setIsOpen] = useState(false)
	return (
		<>
			<VStack gap={3} align="start">
				<Text type="body">
					This sheet has two extra stops: half the viewport, and a 96px peek. Drag the handle down
					to collapse it, then back up — it rests at each stop instead of following your finger.
				</Text>
				<Button label="Show directions" clickAction={() => setIsOpen(true)} />
			</VStack>
			<BottomSheet
				isOpen={isOpen}
				onOpenChange={setIsOpen}
				label="Directions to the Ferry Building"
				height="tall"
				snapPoints={SNAP_POINTS as any}
			>
				<VStack gap={4} style={{ padding: 'var(--spacing-4)' }}>
					<VStack gap={1}>
						<Heading level={3}>Ferry Building</Heading>
						<HStack gap={2}>
							<Text type="label">18 min</Text>
							<Text type="supporting">3.7 mi · arrive 9:41 AM</Text>
						</HStack>
					</VStack>
					<Divider />
					<VStack gap={0}>
						{steps.map(([icon, label, detail, distance]) => (
							<Item
								key={label}
								startContent={<Icon name={icon as any} size={16} />}
								label={label}
								description={detail}
								endContent={<Text type="supporting">{distance}</Text>}
							/>
						))}
					</VStack>
					<Divider />
					<Button label="Start" clickAction={() => setIsOpen(false)} variant="primary" />
				</VStack>
			</BottomSheet>
		</>
	)
}
