// Port of upstream templates/pages/form-wizard-vertical/page.tsx (Astryx
// 0.6.4, MIT) — route /templates/form-wizard-vertical/.
// GAPS: `FileInput` is not exported from the public package (recorded finding
// — the cover upload is modeled by a toggle Button + Thumbnail preview);
// NumberInput `isIntegerOnly` → `step={1}`; CheckboxInput `status` → error
// Text row; focus-to-error navigation uses refs upstream — omitted here
// (Stepper error tint + FieldStatus carry the same feedback).
import { useMemo, useState } from 'octane'
import {
	Banner, Button, Card, CheckboxInput, CheckboxList, CheckboxListItem,
	DateInput, Divider, Field, FieldStatus, FormLayout, Heading, HStack,
	Icon, Layout, LayoutContent, LayoutFooter, LayoutHeader, LayoutPanel,
	MetadataList, MetadataListItem, MultiSelector, NumberInput, RadioList,
	RadioListItem, SegmentedControl, SegmentedControlItem, Selector,
	StackItem, StatusDot, Step, Stepper, Switch, Text, TextArea, TextInput,
	Thumbnail, useMediaQuery, VStack,
} from '@octane-xplat/ui'

const STEPS = [
	{
		label: 'Author profile',
		description: 'Create the profile readers see on your books.',
		help: ['Shared across every book you publish.', 'Edits here reach titles already on sale.', 'Readers see this before they see the book.'],
	},
	{
		label: 'Book details',
		description: 'Add the metadata that helps readers discover the book.',
		help: ['Everything here feeds search and the store page.', 'The cover and title are judged first.', 'All of it stays editable after publishing.'],
	},
	{
		label: 'Distribution',
		description: 'Choose where, when, and at what price the book goes on sale.',
		help: ['Territory and price take effect at release.', 'Moving a date earlier needs a fresh review.', 'Pre-orders open once the book clears review.'],
	},
	{
		label: 'Payouts and agreements',
		description: 'Link a payout account and accept the publishing terms.',
		help: ['Royalties accrue from the release date.', 'They pay out only once an account is linked.', 'Linking late delays the money, never loses it.'],
	},
	{
		label: 'Finalize and submit',
		description: 'Confirm the audio is ready and send the book for review.',
		help: ['Nothing is final until you submit.', 'Metadata stays editable during review.', 'Replacing the audio restarts the queue.'],
	},
]

const LANGUAGES = [
	{ value: 'en', label: 'English' },
	{ value: 'es', label: 'Spanish' },
	{ value: 'fr', label: 'French' },
	{ value: 'de', label: 'German' },
	{ value: 'pt', label: 'Portuguese' },
	{ value: 'ja', label: 'Japanese' },
]

const CATEGORIES = [
	{ value: 'mystery', label: 'Mystery & Thriller' },
	{ value: 'literary', label: 'Literary Fiction' },
	{ value: 'scifi', label: 'Science Fiction' },
	{ value: 'romance', label: 'Romance' },
	{ value: 'history', label: 'History' },
	{ value: 'biography', label: 'Biography & Memoir' },
	{ value: 'business', label: 'Business' },
	{ value: 'selfhelp', label: 'Self-help' },
]

const TERRITORIES = [
	{ value: 'us', label: 'United States' },
	{ value: 'ca', label: 'Canada' },
	{ value: 'uk', label: 'United Kingdom' },
	{ value: 'eu', label: 'European Union' },
	{ value: 'au', label: 'Australia & New Zealand' },
	{ value: 'jp', label: 'Japan' },
]

const CURRENCIES = [
	{ value: 'usd', label: 'USD — US Dollar' },
	{ value: 'eur', label: 'EUR — Euro' },
	{ value: 'gbp', label: 'GBP — British Pound' },
]

const AGREEMENTS = [
	{ value: 'distribution', label: 'Distribution Agreement', description: 'Grants non-exclusive rights to distribute in the territories you selected.' },
	{ value: 'content', label: 'Content Policy', description: 'Confirms the recording is yours to publish and meets the content guidelines.' },
	{ value: 'tax', label: 'Tax certification (W-9 / W-8BEN)', description: 'Required before the first payout can be released.' },
]

const COVER_SRC = '/template-assets/illustrative-vertical-1.png'

const CHAPTERS = [
	{ title: 'Prologue — The Last Train', duration: '11:04' },
	{ title: '1. What Margot Knew', duration: '38:22' },
	{ title: '2. The Second Letter', duration: '41:15' },
	{ title: '3. Aldergate', duration: '35:48' },
	{ title: '4. A Very Ordinary Tuesday', duration: '44:03' },
	{ title: 'Epilogue', duration: '09:37' },
]

const TOTAL_RUNTIME = '3 h 20 m'
const MIN_DESCRIPTION = 120
const MAX_CATEGORIES = 3

const usd = (n: number) => `$${n.toFixed(2)}`

export function FormWizardVerticalTemplate() @{
	const [step, setStep] = useState(1)
	const [attempted, setAttempted] = useState<ReadonlySet<number>>(new Set([0]))

	// Step 1 — author profile
	const [authorName, setAuthorName] = useState('Imogen Hale')
	const [penName, setPenName] = useState('')
	const [bio, setBio] = useState(
		'Imogen Hale writes the Aldergate Files, a series of quiet mysteries set in the Welsh borders.',
	)
	const [authorSite, setAuthorSite] = useState('imogenhale.co.uk')

	// Step 2 — book details
	const [title, setTitle] = useState('Words She Never Said')
	const [subtitle, setSubtitle] = useState('')
	const [edition, setEdition] = useState('')
	const [series, setSeries] = useState('The Aldergate Files')
	const [seriesNumber, setSeriesNumber] = useState<number | null>(2)
	// `hasCover` models the already-uploaded art; the FileInput substitute only
	// carries a *replacement*.
	const [hasCover, setHasCover] = useState(true)
	const [blurb, setBlurb] = useState(
		'When a letter arrives twenty years after it was posted, Margot Aldergate has to decide whether some words are better left unread — or whether silence was the real mistake all along.',
	)
	const [language, setLanguage] = useState('en')
	const [categories, setCategories] = useState<string[]>(['mystery', 'literary'])

	// Step 3 — distribution
	const [scope, setScope] = useState('worldwide')
	const [territories, setTerritories] = useState<string[]>(['us', 'uk', 'eu'])
	const [releaseDate, setReleaseDate] = useState<string | undefined>(undefined)
	const [price, setPrice] = useState<number | null>(18.99)
	const [salesModel, setSalesModel] = useState('both')
	const [isExplicit, setIsExplicit] = useState(false)
	const [allowsLending, setAllowsLending] = useState(true)

	// Step 4 — payouts and agreements
	const [isStripeLinked, setIsStripeLinked] = useState(false)
	const [currency, setCurrency] = useState('usd')
	const [accepted, setAccepted] = useState<string[]>([])

	// Step 5 — finalize
	const [isConfirmed, setIsConfirmed] = useState(false)
	const [isSubmitted, setIsSubmitted] = useState(false)

	const isNarrow = useMediaQuery('(max-width: 1024px)')

	const errorsByStep = useMemo<Array<Record<string, string>>>(() => {
		const profile: Record<string, string> = {}
		if (!authorName.trim()) {
			profile.authorName = 'Enter the name readers should see.'
		}
		if (bio.trim().length < 40) {
			profile.bio = 'Write at least a sentence or two — 40 characters minimum.'
		}

		const details: Record<string, string> = {}
		if (!title.trim()) {
			details.title = 'Enter the title as it should appear in the store.'
		}
		if (!hasCover) {
			details.cover = 'A book cannot go on sale without cover art.'
		}
		if (blurb.trim().length < MIN_DESCRIPTION) {
			details.blurb = `Descriptions need at least ${MIN_DESCRIPTION} characters. ${
				MIN_DESCRIPTION - blurb.trim().length
			} to go.`
		}
		if (categories.length === 0) {
			details.categories = 'Pick at least one category.'
		} else if (categories.length > MAX_CATEGORIES) {
			details.categories = `Pick at most ${MAX_CATEGORIES} categories.`
		}
		if (series.trim() && (seriesNumber ?? 0) < 1) {
			details.seriesNumber = 'Books in a series are numbered from 1.'
		}

		const distribution: Record<string, string> = {}
		if (scope === 'selected' && territories.length === 0) {
			distribution.territories = 'Choose at least one territory.'
		}
		if (!releaseDate) {
			distribution.releaseDate = 'Pick a release date.'
		}
		if ((price ?? 0) < 0.99 || (price ?? 0) > 99) {
			distribution.price = 'List price must be between $0.99 and $99.00.'
		}

		const payouts: Record<string, string> = {}
		if (!isStripeLinked) {
			payouts.stripe = 'Link a Stripe account to receive payouts.'
		}
		const missing = AGREEMENTS.filter((a) => !accepted.includes(a.value))
		if (missing.length > 0) {
			payouts.agreements = `Accept the ${missing.map((a) => a.label).join(', ')} to continue.`
		}

		const finalize: Record<string, string> = {}
		if (!isConfirmed) {
			finalize.confirm = 'Confirm the audio is final before submitting.'
		}

		return [profile, details, distribution, payouts, finalize]
	}, [
		authorName, bio, title, hasCover, blurb, categories, series,
		seriesNumber, scope, territories, releaseDate, price, isStripeLinked,
		accepted, isConfirmed,
	])

	const shownErrors = (index: number) => (attempted.has(index) ? errorsByStep[index] : {})
	const currentErrors = shownErrors(step)
	const isLastStep = step === STEPS.length - 1

	const markAttempted = (index: number) =>
		setAttempted((prev) => (prev.has(index) ? prev : new Set(prev).add(index)))

	const goNext = () => {
		markAttempted(step)
		if (Object.keys(errorsByStep[step]).length === 0 && !isLastStep) {
			setStep((s) => Math.min(STEPS.length - 1, s + 1))
		}
		if (isLastStep && Object.keys(errorsByStep[step]).length === 0) {
			setIsSubmitted(true)
		}
	}

	const stepper = (hasDescriptions: boolean) => (
		<Stepper
			activeStep={step}
			orientation={hasDescriptions ? 'vertical' : 'horizontal'}
			onStepClick={(index) => {
				if (index > step) {markAttempted(step)}
				setStep(index)
			}}
			accessibilityLabel="Publishing progress"

		>
			{STEPS.map((s, i) => (
				<Step
					key={s.label}
					step={i}
					label={s.label}
					description={hasDescriptions ? s.description : undefined}
					status={Object.keys(shownErrors(i)).length > 0 ? 'error' : undefined}
				/>
			))}
		</Stepper>
	)

	<Layout
		height="fill"
		header={
			<LayoutHeader padding={6} hasDivider>
				<HStack gap={3} vAlign="center" wrap="wrap">
					<StackItem size="fill">
						<HStack gap={2} vAlign="center">
							<Icon name="sandbox-book-open" size={20} color="secondary" />
							<Text type="label">Alder Press</Text>
						</HStack>
					</StackItem>
					<HStack gap={2}>
						<Button label="Cancel" variant="ghost" clickAction={() => {}} />
						<Button label="Save & exit" variant="secondary" clickAction={() => {}} />
					</HStack>
				</HStack>
				{isNarrow ? stepper(false) : null}
			</LayoutHeader>
		}
		start={
			isNarrow ? undefined : (
				<LayoutPanel width={280} padding={5}>
					<VStack gap={6}>
						{stepper(true)}
						<Card variant="muted" padding={4}>
							<VStack gap={2}>
								<Heading level={5}>
									{STEPS[step].label}
								</Heading>
								{STEPS[step].help.map((line) => (
									<HStack key={line} gap={2} vAlign="start">
										<Icon name="sandbox-information-circle" size={16} color="secondary" />
										<Text type="supporting" color="secondary">
											{line}
										</Text>
									</HStack>
								))}
							</VStack>
						</Card>
					</VStack>
				</LayoutPanel>
			)
		}
		content={
			<LayoutContent>
				<VStack gap={5}>
					<VStack gap={1}>
						<Heading level={1}>{STEPS[step].label}</Heading>
						<Text type="supporting" color="secondary">
							{STEPS[step].description}
						</Text>
					</VStack>

					{step === 0 ? (
						<FormLayout defaultOptionality="optional">
							<TextInput
								label="Display name" isRequired value={authorName} onChange={(v) => setAuthorName(v ?? '')}
								placeholder="Imogen Hale"
								status={currentErrors.authorName ? { type: 'error', message: currentErrors.authorName } : undefined}
							/>
							<TextInput
								label="Pen name" value={penName} onChange={(v) => setPenName(v ?? '')}
								description="Overrides your display name on this and future books."
							/>
							<TextArea
								label="Author bio" isRequired rows={4} value={bio} onChange={(v) => setBio(v ?? '')}
								status={currentErrors.bio ? { type: 'error', message: currentErrors.bio } : undefined}
							/>
							<TextInput
								label="Website" value={authorSite} onChange={(v) => setAuthorSite(v ?? '')}
								placeholder="you.com"
							/>
						</FormLayout>
					) : null}

					{step === 1 ? (
						<FormLayout defaultOptionality="optional">
							<TextInput
								label="Book title" isRequired value={title} onChange={(v) => setTitle(v ?? '')}
								status={currentErrors.title ? { type: 'error', message: currentErrors.title } : undefined}
							/>
							<VStack gap={2}>
								<Field
									label="Cover image"
									isRequired
									description="1600×2560 px recommended. Shown at thumbnail size in every store surface."
								>
									{hasCover ? (
										<HStack gap={4} vAlign="start" wrap="wrap">
											<Thumbnail src={COVER_SRC} label="Cover art for Words She Never Said" />
											<VStack gap={2}>
												<Text type="supporting" color="secondary">
													cover-final-v3.png · replaced art uploads in place
												</Text>
												<HStack gap={2}>
													<Button label="Crop image" variant="secondary" size="sm" clickAction={() => {}} />
													<Button label="Preview on device" variant="secondary" size="sm" clickAction={() => {}} />
													<Button label="Remove cover" variant="ghost" size="sm" clickAction={() => setHasCover(false)} />
												</HStack>
											</VStack>
										</HStack>
									) : (
										<VStack gap={2}>
											<Button
												label="Choose cover image"
												variant="secondary"
												icon={<Icon name="sandbox-arrow-up-tray" size={16} />}
												clickAction={() => setHasCover(true)}
											/>
											<Text type="supporting" color="secondary">
												PNG or JPEG up to 20 MB.
											</Text>
										</VStack>
									)}
								</Field>
								{currentErrors.cover ? (
									<FieldStatus type="error" variant="detached" message={currentErrors.cover} />
								) : null}
							</VStack>
							<TextInput
								label="Subtitle" value={subtitle} onChange={(v) => setSubtitle(v ?? '')}
								description="Shown beneath the title on the store page."
							/>
							<FormLayout direction="horizontal" defaultOptionality="optional">
								<TextInput
									label="Edition" value={edition} onChange={(v) => setEdition(v ?? '')}
									placeholder="2nd"
								/>
								<Selector
									label="Language" options={LANGUAGES} value={language} onValueChange={(v) => setLanguage(v ?? '')}
								/>
							</FormLayout>
							<FormLayout direction="horizontal" defaultOptionality="optional">
								<TextInput
									label="Series" value={series} onChange={(v) => setSeries(v ?? '')}
									description="Leave blank for a standalone book."
								/>
								<NumberInput
									label="Number in series" value={seriesNumber} onValueChange={(v) => setSeriesNumber(v ?? 0)}
									min={1} step={1}
									status={currentErrors.seriesNumber ? { type: 'error', message: currentErrors.seriesNumber } : undefined}
								/>
							</FormLayout>
							<TextArea
								label="Description" isRequired rows={5} maxLength={4000} value={blurb} onChange={(v) => setBlurb(v ?? '')}
								status={currentErrors.blurb ? { type: 'error', message: currentErrors.blurb } : undefined}
							/>
							<MultiSelector
								label="Categories" isRequired options={CATEGORIES} value={categories} onValueChange={(v) => setCategories(v ?? [])} triggerDisplay="badges"
								description={`Choose up to ${MAX_CATEGORIES}. The first one decides which charts the book appears in.`}
								status={currentErrors.categories ? { type: 'error', message: currentErrors.categories } : undefined}
							/>
						</FormLayout>
					) : null}

					{step === 2 ? (
						<FormLayout defaultOptionality="optional">
							<RadioList label="Where the book is sold" value={scope} onValueChange={(v) => setScope(v ?? '')}>
								<RadioListItem value="worldwide" label="Worldwide" description="Every territory the store sells in — recommended." />
								<RadioListItem value="selected" label="Selected territories" description="Pick the markets where you hold distribution rights." />
								<RadioListItem value="exclusive" label="Exclusive to this store" description="Higher royalty share for 12 months of exclusivity." />
							</RadioList>
							{scope === 'selected' ? (
								<MultiSelector
									label="Territories" options={TERRITORIES} value={territories} onValueChange={(v) => setTerritories(v ?? [])}
									triggerDisplay="badges"
									status={currentErrors.territories ? { type: 'error', message: currentErrors.territories } : undefined}
								/>
							) : null}
							<FormLayout direction="horizontal" defaultOptionality="optional">
								<DateInput
									label="Release date" isRequired value={releaseDate as never} onChange={(v) => setReleaseDate(v ?? '')}
									status={currentErrors.releaseDate ? { type: 'error', message: currentErrors.releaseDate } : undefined}
								/>
								<NumberInput
									label="List price" isRequired value={price} onValueChange={(v) => setPrice(v ?? 0)}
									min={0.99} max={99} step={0.01} units="$"
									description="Before local tax and store adjustments."
									status={currentErrors.price ? { type: 'error', message: currentErrors.price } : undefined}
								/>
							</FormLayout>
							<Field
								label="Sales model"
								isGroupLabel
								description={
									salesModel === 'purchase'
										? 'Readers buy the book outright at your list price.'
										: salesModel === 'subscription'
											? 'Included in the subscription catalog; you earn per minute listened.'
											: 'Available to buy and included in the subscription catalog.'
								}
							>
								<SegmentedControl label="Sales model" value={salesModel} onValueChange={(v) => setSalesModel(v ?? '')} layout="fill">
									<SegmentedControlItem value="purchase" label="Purchase" />
									<SegmentedControlItem value="subscription" label="Subscription" />
									<SegmentedControlItem value="both" label="Both" />
								</SegmentedControl>
							</Field>
							<Divider />
							<Switch
								label="Contains explicit content"
								description="Adds an advisory label and excludes the book from all-ages recommendations."
								value={isExplicit} onChange={(v) => setIsExplicit(v ?? '')}
								labelPosition="start" labelSpacing="spread"
							/>
							<Switch
								label="Allow library lending"
								description="Libraries can license the audiobook for time-limited loans."
								value={allowsLending} onChange={(v) => setAllowsLending(v ?? '')}
								labelPosition="start" labelSpacing="spread"
							/>
						</FormLayout>
					) : null}

					{step === 3 ? (
						<FormLayout defaultOptionality="optional">
							<Card padding={4}>
								<HStack gap={3} vAlign="center" wrap="wrap">
									<StackItem size="fill">
										<VStack gap={1}>
											<HStack gap={2} vAlign="center">
												<Text type="label">Stripe account</Text>
												<StatusDot
													variant={isStripeLinked ? 'success' : 'warning'}
													label={isStripeLinked ? 'Linked' : 'Not linked'}
												/>
											</HStack>
											<Text type="supporting" color="secondary">
												{isStripeLinked
													? 'Payouts go to Imogen Hale · **** 4417, on the 15th of each month.'
													: 'Royalties are held until an account is linked. Linking takes about two minutes.'}
											</Text>
										</VStack>
									</StackItem>
									<Button
										label={isStripeLinked ? 'Manage' : 'Connect Stripe'}
										variant={isStripeLinked ? 'secondary' : 'primary'}
										clickAction={() => setIsStripeLinked((v) => !v)}
									/>
								</HStack>
							</Card>
							{currentErrors.stripe ? (
								<FieldStatus type="error" variant="detached" message={currentErrors.stripe} />
							) : null}
							<Selector
								label="Payout currency" options={CURRENCIES} value={currency} onValueChange={(v) => setCurrency(v ?? '')}
								description="Converted at payout; the list price stays in the store currency."
							/>
							<CheckboxList
								label="Agreements" isRequired value={accepted} onValueChange={(v) => setAccepted(v ?? '')} density="compact"
								status={currentErrors.agreements ? { type: 'error', message: currentErrors.agreements } : undefined}
							>
								{AGREEMENTS.map((a) => (
									<CheckboxListItem key={a.value} value={a.value} label={a.label} description={a.description} />
								))}
							</CheckboxList>
						</FormLayout>
					) : null}

					{step === 4 ? (
						<FormLayout defaultOptionality="optional">
							<VStack gap={4}>
								<VStack gap={2}>
									<Heading level={3}>Chapters · {TOTAL_RUNTIME}</Heading>
									<VStack gap={1}>
										{CHAPTERS.map((chapter) => (
											<HStack key={chapter.title} hAlign="between">
												<Text type="body">{chapter.title}</Text>
												<Text type="supporting" color="secondary">
													{chapter.duration}
												</Text>
											</HStack>
										))}
									</VStack>
								</VStack>
								<Divider />
								<MetadataList columns="multi">
									<MetadataListItem label="Title" icon={<Icon name="sandbox-book-open" size={16} />}>
										{title.trim() || '—'}
									</MetadataListItem>
									<MetadataListItem label="Author" icon={<Icon name="sandbox-user" size={16} />}>
										{penName.trim() || authorName.trim() || '—'}
									</MetadataListItem>
									<MetadataListItem label="Series" icon={<Icon name="sandbox-rectangle-stack" size={16} />}>
										{series.trim() ? `${series.trim()}, book ${seriesNumber}` : 'Standalone'}
									</MetadataListItem>
									<MetadataListItem label="Language" icon={<Icon name="sandbox-language" size={16} />}>
										{LANGUAGES.find((l) => l.value === language)?.label ?? language}
									</MetadataListItem>
									<MetadataListItem label="Categories" icon={<Icon name="sandbox-tag" size={16} />}>
										{categories.length === 0
											? '—'
											: CATEGORIES.filter((c) => categories.includes(c.value)).map((c) => c.label).join(', ')}
									</MetadataListItem>
									<MetadataListItem label="Availability" icon={<Icon name="sandbox-globe-alt" size={16} />}>
										{scope === 'worldwide' ? 'Worldwide' : scope === 'exclusive' ? 'Exclusive, 12 months' : `${territories.length} territories`}
									</MetadataListItem>
									<MetadataListItem label="Release date" icon={<Icon name="sandbox-calendar" size={16} />}>
										{releaseDate ?? '—'}
									</MetadataListItem>
									<MetadataListItem label="List price" icon={<Icon name="sandbox-currency-dollar" size={16} />}>
										{usd(price ?? 0)}
									</MetadataListItem>
									<MetadataListItem label="Advisory" icon={<Icon name="sandbox-exclamation-triangle" size={16} />}>
										{isExplicit ? 'Explicit content' : 'None'}
									</MetadataListItem>
									<MetadataListItem label="Library lending" icon={<Icon name="sandbox-building-library" size={16} />}>
										{allowsLending ? 'Allowed' : 'Not allowed'}
									</MetadataListItem>
								</MetadataList>
								<Divider />
								<VStack gap={1}>
									<CheckboxInput
										label="The uploaded audio is final and matches the chapter list"
										value={isConfirmed}
										onChange={(v) => setIsConfirmed(v ?? '')}
									/>
									{currentErrors.confirm ? (
										<Text type="supporting" style={{ color: 'var(--color-text-error, #d92d20)' }}>
											{currentErrors.confirm}
										</Text>
									) : null}
								</VStack>
							</VStack>
						</FormLayout>
					) : null}

					{isSubmitted ? (
						<Banner
							status="success"
							title="Sent for review"
							description="The book enters the review queue now. Metadata stays editable while it is reviewed."
						/>
					) : null}
				</VStack>
			</LayoutContent>
		}
		footer={
			<LayoutFooter>
				<HStack gap={3} vAlign="center">
					<StackItem size="fill" />
					<Text type="supporting" color="secondary">
						{step + 1} of {STEPS.length}
					</Text>
					<HStack gap={3}>
						<Button
							label="Back" variant="secondary" isDisabled={step === 0}
							clickAction={() => {
								markAttempted(step)
								setStep((s) => Math.max(0, s - 1))
							}}
						/>
						<Button
							label={isLastStep ? 'Submit for review' : 'Continue'}
							variant="primary"
							clickAction={goNext}
						/>
					</HStack>
				</HStack>
			</LayoutFooter>
		}
	/>
}
