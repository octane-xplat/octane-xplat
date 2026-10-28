// Port of upstream BottomSheet/BottomSheetSwitcherShowcase.tsx (Astryx 0.6.4, MIT).
// RadioListItem children adapted to RadioList options.
import { useState } from 'octane'
import {
	BottomSheet,
	BottomSheetSwitcher,
	Button,
	CheckboxInput,
	Divider,
	Heading,
	HStack,
	RadioList,
	Section,
	Text,
	VStack,
} from '@octane-xplat/ui'

function OverviewSheet(props: { onCancel: () => void; onContinue: () => void }) @{
	<BottomSheet sheetId="overview" label="Set up notifications" height="hug">
		<Section padding={4}>
			<VStack gap={4}>
				<VStack gap={1}>
					<Heading level={3}>Set up notifications</Heading>
					<Text type="supporting" color="secondary">
						Step 1 of 3
					</Text>
				</VStack>
				<Divider />
				<Text type="supporting" color="secondary">
					Stay informed about activity that matters without checking back throughout the day.
				</Text>
				<VStack gap={3}>
					<VStack gap={1}>
						<Text type="label">Important activity</Text>
						<Text type="supporting" color="secondary">
							Know when someone mentions you or needs your attention.
						</Text>
					</VStack>
					<VStack gap={1}>
						<Text type="label">Timely reminders</Text>
						<Text type="supporting" color="secondary">
							Get a reminder before work reaches its due date.
						</Text>
					</VStack>
					<VStack gap={1}>
						<Text type="label">Useful summaries</Text>
						<Text type="supporting" color="secondary">
							Catch up on anything you may have missed.
						</Text>
					</VStack>
				</VStack>
				<HStack gap={2} justify="end">
					<Button label="Cancel" variant="secondary" clickAction={props.onCancel} />
					<Button label="Continue" clickAction={props.onContinue} />
				</HStack>
			</VStack>
		</Section>
	</BottomSheet>
}

function FrequencySheet(props: { onBack: () => void; onContinue: () => void }) @{
	const [frequency, setFrequency] = useState('daily')

	<BottomSheet sheetId="frequency" label="Notification frequency" height="hug">
		<Section padding={4}>
			<VStack gap={4}>
				<VStack gap={1}>
					<Heading level={3}>How often?</Heading>
					<Text type="supporting" color="secondary">
						Step 2 of 3
					</Text>
				</VStack>
				<Divider />
				<RadioList
					label="Notification frequency"
					isLabelHidden
					value={frequency}
					onValueChange={setFrequency}
					options={[
						{ value: 'immediately', label: 'Immediately' },
						{ value: 'daily', label: 'Daily' },
						{ value: 'weekly', label: 'Weekly' },
					]}
				/>
				<HStack gap={2} justify="end">
					<Button label="Back" variant="secondary" clickAction={props.onBack} />
					<Button label="Continue" clickAction={props.onContinue} />
				</HStack>
			</VStack>
		</Section>
	</BottomSheet>
}

function ChannelsSheet(props: { onBack: () => void; onFinish: () => void }) @{
	const [email, setEmail] = useState(true)
	const [push, setPush] = useState(true)
	const [sms, setSms] = useState(false)

	<BottomSheet sheetId="channels" label="Notification channels" height="hug">
		<Section padding={4}>
			<VStack gap={4}>
				<VStack gap={1}>
					<Heading level={3}>Where should we notify you?</Heading>
					<Text type="supporting" color="secondary">
						Step 3 of 3
					</Text>
				</VStack>
				<Divider />
				<Text type="supporting" color="secondary">
					Choose any combination. You can change these preferences later.
				</Text>
				<VStack gap={2}>
					<CheckboxInput label="Email" value={email} onChange={setEmail} />
					<CheckboxInput label="Push notifications" value={push} onChange={setPush} />
					<CheckboxInput label="Text messages" value={sms} onChange={setSms} />
				</VStack>
				<HStack gap={2} justify="end">
					<Button label="Back" variant="secondary" clickAction={props.onBack} />
					<Button label="Finish" clickAction={props.onFinish} />
				</HStack>
			</VStack>
		</Section>
	</BottomSheet>
}

export function BottomSheetSwitcherShowcase() @{
	const [activeSheet, setActiveSheet] = useState<string | null>(null)
	return (
		<>
			<Button label="Set up notifications" clickAction={() => setActiveSheet('overview')} />
			<BottomSheetSwitcher activeSheet={activeSheet} onActiveSheetChange={setActiveSheet}>
				<OverviewSheet
					onCancel={() => setActiveSheet(null)}
					onContinue={() => setActiveSheet('frequency')}
				/>
				<FrequencySheet
					onBack={() => setActiveSheet('overview')}
					onContinue={() => setActiveSheet('channels')}
				/>
				<ChannelsSheet
					onBack={() => setActiveSheet('frequency')}
					onFinish={() => setActiveSheet(null)}
				/>
			</BottomSheetSwitcher>
		</>
	)
}
