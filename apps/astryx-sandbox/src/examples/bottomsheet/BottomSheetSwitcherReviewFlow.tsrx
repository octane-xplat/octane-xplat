// Port of upstream BottomSheet/BottomSheetSwitcherReviewFlow.tsx (Astryx 0.6.4, MIT).
import { useState } from 'octane'
import { BottomSheet, BottomSheetSwitcher, Button, Heading, HStack, Section, Text, VStack } from '@octane-xplat/ui'

export function BottomSheetSwitcherReviewFlow() @{
	const [activeSheet, setActiveSheet] = useState<string | null>(null)
	return (
		<>
			<Button label="Review settings" clickAction={() => setActiveSheet('review')} />
			<BottomSheetSwitcher activeSheet={activeSheet} onActiveSheetChange={setActiveSheet}>
				<BottomSheet sheetId="review" label="Review notification settings" height="hug" purpose="form">
					<Section padding={4}>
						<VStack gap={4}>
							<VStack gap={1}>
								<Heading level={3}>Review settings</Heading>
								<Text className="sb-type-supporting sb-color-secondary">Daily summaries will be sent by email.</Text>
							</VStack>
							<HStack gap={2} justify="end">
								<Button label="Cancel" variant="secondary" clickAction={() => setActiveSheet(null)} />
								<Button label="Continue" clickAction={() => setActiveSheet('confirm')} />
							</HStack>
						</VStack>
					</Section>
				</BottomSheet>
				<BottomSheet sheetId="confirm" label="Confirm settings" height="hug">
					<Section padding={4}>
						<VStack gap={4}>
							<VStack gap={1}>
								<Heading level={3}>Confirm settings</Heading>
								<Text className="sb-type-supporting sb-color-secondary">Your notification settings are ready to save.</Text>
							</VStack>
							<HStack gap={2} justify="end">
								<Button label="Back" variant="secondary" clickAction={() => setActiveSheet('review')} />
								<Button label="Save" clickAction={() => setActiveSheet(null)} />
							</HStack>
						</VStack>
					</Section>
				</BottomSheet>
			</BottomSheetSwitcher>
		</>
	)
}
