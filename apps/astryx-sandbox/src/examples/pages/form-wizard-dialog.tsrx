// Port of upstream templates/pages/form-wizard-dialog/page.tsx (Astryx
// 0.6.4, MIT) — route /templates/form-wizard-dialog/.
// GAPS: upstream wraps the flow in a real Dialog (`isInline` pins it for the
// template preview); Octane Dialog keeps isOpen/onOpenChange — `isInline`
// has no public equivalent so the dialog renders inside a Centered host.
// Toast `showToast` → `useToast` (ToastProvider exists upstream too).
import { useState } from 'octane'
import {
	Banner, Button, Center, CheckboxList, CheckboxListItem, DateInput,
	Dialog, DialogHeader, Divider, Field, FieldStatus, FormLayout, HStack,
	Layout, LayoutContent, LayoutFooter, LayoutHeader, MetadataList,
	MetadataListItem, MultiSelector, RadioList, RadioListItem,
	SegmentedControl, SegmentedControlItem, Selector, StackItem, Step,
	Stepper, Switch, TextArea, TextInput, TimeInput, useToast, VStack,
} from '@octane-xplat/ui'

const STEPS = ['Report', 'Schedule', 'Delivery']

const DATASETS = [
	{ value: 'pipeline', label: 'Sales pipeline' },
	{ value: 'revenue', label: 'Revenue and bookings' },
	{ value: 'churn', label: 'Churn and retention' },
	{ value: 'support', label: 'Support tickets' },
	{ value: 'usage', label: 'Product usage' },
]

const SECTIONS = [
	{ value: 'summary', label: 'Executive summary', description: 'Headline numbers and week-over-week change.' },
	{ value: 'charts', label: 'Trend charts', description: 'Twelve-week series for each headline metric.' },
	{ value: 'breakdown', label: 'Segment breakdown', description: 'Split by region, plan, and account size.' },
	{ value: 'anomalies', label: 'Anomaly callouts', description: 'Metrics more than two standard deviations off trend.' },
]

const RECIPIENTS = [
	{ value: 'exec', label: 'exec-staff@northwind.dev' },
	{ value: 'sales', label: 'Sales leadership (9 people)' },
	{ value: 'finance', label: 'finance@northwind.dev' },
	{ value: 'amara', label: 'Amara Diallo' },
	{ value: 'felix', label: 'Felix Tran' },
]

const TIMEZONES = [
	{ value: 'pt', label: 'Pacific Time (PT)' },
	{ value: 'et', label: 'Eastern Time (ET)' },
	{ value: 'gmt', label: 'Greenwich Mean Time (GMT)' },
	{ value: 'cet', label: 'Central European Time (CET)' },
]

const WEEKDAYS = [
	{ value: 'mon', label: 'Monday' },
	{ value: 'tue', label: 'Tuesday' },
	{ value: 'wed', label: 'Wednesday' },
	{ value: 'thu', label: 'Thursday' },
	{ value: 'fri', label: 'Friday' },
]

const blockedMessage = (count: number) =>
	count === 1
		? 'One problem above needs fixing first.'
		: `${count} problems above need fixing first.`

export function FormWizardDialogTemplate() @{
	const showToast = useToast()

	const [step, setStep] = useState(0)
	const [attempted, setAttempted] = useState<ReadonlySet<number>>(new Set())

	const [name, setName] = useState('')
	const [dataset, setDataset] = useState('pipeline')
	const [sections, setSections] = useState<string[]>(['summary', 'charts'])
	const [note, setNote] = useState('')

	const [cadence, setCadence] = useState('weekly')
	const [weekday, setWeekday] = useState('mon')
	const [time, setTime] = useState<string | undefined>('08:00')
	const [timezone, setTimezone] = useState('pt')
	const [startDate, setStartDate] = useState<string | undefined>(undefined)

	const [recipients, setRecipients] = useState<string[]>(['exec'])
	const [format, setFormat] = useState('pdf')
	const [skipEmpty, setSkipEmpty] = useState(true)

	const resetDraft = () => {
		setStep(0)
		setAttempted(new Set())
		setName('')
		setDataset('pipeline')
		setSections(['summary', 'charts'])
		setNote('')
		setCadence('weekly')
		setWeekday('mon')
		setTime('08:00')
		setTimezone('pt')
		setStartDate(undefined)
		setRecipients(['exec'])
		setFormat('pdf')
		setSkipEmpty(true)
	}

	const handleOpenChange = (isOpen: boolean) => {
		if (!isOpen) {
			resetDraft()
		}
	}

	const errorsByStep: Array<Record<string, string>> = [
		{
			...(name.trim() ? {} : { name: 'Give the report a name.' }),
			...(sections.length === 0 ? { sections: 'Include at least one section.' } : {}),
		},
		{
			...(time ? {} : { time: 'Pick a send time.' }),
			...(startDate ? {} : { startDate: 'Pick a start date.' }),
		},
		{
			...(recipients.length === 0 ? { recipients: 'Add at least one recipient.' } : {}),
		},
	]

	const shownErrors = (index: number) => (attempted.has(index) ? errorsByStep[index] : {})
	const currentErrors = shownErrors(step)
	const isLastStep = step === STEPS.length - 1

	const cadenceSummary =
		cadence === 'daily'
			? `Every weekday at ${time ?? '—'}`
			: cadence === 'weekly'
				? `${WEEKDAYS.find((d) => d.value === weekday)?.label ?? weekday}s at ${time ?? '—'}`
				: `1st of the month at ${time ?? '—'}`

	const goNext = () => {
		setAttempted((prev) => new Set(prev).add(step))
		if (Object.keys(errorsByStep[step]).length !== 0) {
			return
		}
		if (!isLastStep) {
			setStep((s) => s + 1)
			return
		}
		showToast({
			body: `${name.trim()} is scheduled · ${cadenceSummary}`,
			uniqueID: 'report-scheduled',
		})
		resetDraft()
	}

	<Center height="100dvh">
		<Dialog
			isOpen
			onOpenChange={handleOpenChange}
			width={620}
			purpose="form"
		>
			<Layout
				height="fill"
				header={
					<>
						<DialogHeader
							title="Schedule a report"
							onOpenChange={handleOpenChange}
							hasDivider={false}
						/>
						<LayoutHeader hasDivider={false}>
							<Stepper
								activeStep={step}
								orientation="horizontal" accessibilityLabel="Report setup progress"
							>
								{STEPS.map((label, i) => (
									<Step
										key={label}
										step={i}
										label={label}
										status={Object.keys(shownErrors(i)).length > 0 ? 'error' : undefined}
									/>
								))}
							</Stepper>
						</LayoutHeader>
					</>
				}
				content={
					<LayoutContent>
						{step === 0 ? (
							<FormLayout defaultOptionality="optional">
								<TextInput
									label="Report name"
									isRequired
									value={name}
									onChange={(v) => setName(v ?? '')}
									placeholder="Weekly pipeline review"
									description="Used as the email subject line."
									status={currentErrors.name ? { type: 'error', message: currentErrors.name } : undefined}
								/>
								<Selector
									label="Dataset"
									options={DATASETS}
									value={dataset}
									onValueChange={(v) => setDataset(v ?? '')}
								/>
								<CheckboxList
									label="Sections to include"
									value={sections}
									onValueChange={(v) => setSections(v ?? '')}

									status={currentErrors.sections ? { type: 'error', message: currentErrors.sections } : undefined}
								>
									{SECTIONS.map((section) => (
										<CheckboxListItem
											key={section.value}
											value={section.value}
											label={section.label}
											description={section.description}
										/>
									))}
								</CheckboxList>
							</FormLayout>
						) : null}

						{step === 1 ? (
							<FormLayout defaultOptionality="optional">
								<Field label="How often" isGroupLabel>
									<SegmentedControl
										label="How often"
										value={cadence}
										onValueChange={(v) => setCadence(v ?? '')}
										layout="fill"
									>
										<SegmentedControlItem value="daily" label="Weekdays" />
										<SegmentedControlItem value="weekly" label="Weekly" />
										<SegmentedControlItem value="monthly" label="Monthly" />
									</SegmentedControl>
								</Field>
								{cadence === 'weekly' ? (
									<Selector
										label="Day of the week"
										options={WEEKDAYS}
										value={weekday}
										onValueChange={(v) => setWeekday(v ?? '')}
									/>
								) : null}
								<FormLayout direction="horizontal" defaultOptionality="optional">
									<TimeInput
										label="Send at"
										isRequired
										value={time as never}
										onChange={(v) => setTime(v ?? '')}
										status={currentErrors.time ? { type: 'error', message: currentErrors.time } : undefined}
									/>
									<Selector
										label="Time zone"
										options={TIMEZONES}
										value={timezone}
										onValueChange={(v) => setTimezone(v ?? '')}
									/>
								</FormLayout>
								<DateInput
									label="First run"
									isRequired
									value={startDate as never}
									onChange={(v) => setStartDate(v ?? '')}
									status={currentErrors.startDate ? { type: 'error', message: currentErrors.startDate } : undefined}
								/>
								<Banner
									status="info"
									title={cadenceSummary}
									description="Data is cut at the send time, so a report at 08:00 covers everything up to 08:00."
								/>
							</FormLayout>
						) : null}

						{step === 2 ? (
							<FormLayout defaultOptionality="optional">
								<MultiSelector
									label="Recipients"
									isRequired
									options={RECIPIENTS}
									value={recipients}
									onValueChange={(v) => setRecipients(v ?? [])}
									triggerDisplay="badges"
									description="Groups resolve at send time, so new members are included automatically."
									status={currentErrors.recipients ? { type: 'error', message: currentErrors.recipients } : undefined}
								/>
								<RadioList label="Attachment format" value={format} onValueChange={(v) => setFormat(v ?? '')} size="sm">
									<RadioListItem value="pdf" label="PDF" description="Best for reading. Charts render as images." />
									<RadioListItem value="csv" label="CSV" description="Raw rows, no charts or summary." />
									<RadioListItem value="both" label="Both" description="PDF in the body, CSV attached." />
								</RadioList>
								<Switch
									label="Skip the send when there is no new data"
									value={skipEmpty}
									onChange={(v) => setSkipEmpty(v ?? '')}
									labelPosition="start"
									labelSpacing="spread"
								/>
								<TextArea
									label="Note in the email"
									rows={2}
									maxLength={200}
									value={note}
									onChange={(v) => setNote(v ?? '')}
									placeholder="Numbers are provisional until finance closes the month."
								/>
								<Divider />
								<MetadataList columns="single">
									<MetadataListItem label="Report">
										{name.trim() || 'Untitled'}
									</MetadataListItem>
									<MetadataListItem label="Runs">
										{cadenceSummary}{' '}
										{TIMEZONES.find((t) => t.value === timezone)?.label.match(/\(([^)]+)\)/)?.[1] ?? ''}
									</MetadataListItem>
									<MetadataListItem label="Sent to">
										{recipients.length === 0
											? '—'
											: `${recipients.length} ${recipients.length === 1 ? 'recipient' : 'recipients'}`}
									</MetadataListItem>
								</MetadataList>
							</FormLayout>
						) : null}
					</LayoutContent>
				}
				footer={
					<LayoutFooter>
						<HStack gap={2} vAlign="center">
							<Button
								label="Back"
								variant="secondary"
								isDisabled={step === 0}
								clickAction={() => setStep((s) => Math.max(0, s - 1))}
							/>
							<StackItem size="fill" />
							{Object.keys(currentErrors).length > 0 ? (
								<FieldStatus
									type="error"
									variant="detached"
									message={blockedMessage(Object.keys(currentErrors).length)}
								/>
							) : null}
							<Button
								label={isLastStep ? 'Schedule report' : 'Continue'}
								variant="primary"
								clickAction={goNext}
							/>
						</HStack>
					</LayoutFooter>
				}
			/>
		</Dialog>
	</Center>
}
