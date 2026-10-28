// Port of upstream templates/pages/contact-form/page.tsx (Astryx 0.6.4, MIT) —
// route /templates/contact-form/.
// GAPS: Selector `options` takes {value,label} pairs and `onValueChange`
// (upstream string[] + onChange); Button `onClick` → `clickAction`.
import { useState } from 'octane'
import {
	Banner, Button, Card, Center, CheckboxInput, Divider, Grid, HStack, Icon,
	Link, RadioList, RadioListItem, Section, Selector, Text, TextArea,
	TextInput, Token, VStack,
} from '@octane-xplat/ui'

const CAMPAIGN_GOALS = [
	'Brand Awareness',
	'Product Sampling',
	'Product Launch',
	'Event Promotion',
	'Retail / In-Store',
	'Trade Show',
	'Influencer Activation',
	'Community Building',
	'Seasonal Campaign',
	'Other',
]

const LAUNCH_OPTIONS = [
	'Within 30 days',
	'1–3 months',
	'3–6 months',
	'6–12 months',
	'12+ months',
].map((label) => ({ value: label, label }))

const BUDGET_OPTIONS = [
	'Under $5K/mo',
	'$5K–$15K/mo',
	'$15K–$50K/mo',
	'$50K–$100K/mo',
	'$100K+/mo',
].map((label) => ({ value: label, label }))

const WHY_US = [
	{
		icon: 'sandbox-rocket-launch',
		title: 'We move fast for you',
		description: 'We cut through the noise and get straight to the work.',
	},
	{
		icon: 'sandbox-adjustments-horizontal',
		title: 'We build around you',
		description: "We tailor everything to what you're trying to achieve.",
	},
	{
		icon: 'sandbox-hand-raised',
		title: 'We show up for you',
		description: 'A dedicated team that knows your brand and wants to win.',
	},
]

export function ContactFormTemplate() @{
	const [fullName, setFullName] = useState('')
	const [email, setEmail] = useState('')
	const [company, setCompany] = useState('')
	const [phone, setPhone] = useState('')
	const [goals, setGoals] = useState<string[]>([])
	const [timeline, setTimeline] = useState<string | null>(null)
	const [budget, setBudget] = useState<string | null>(null)
	const [message, setMessage] = useState('')
	const [hearAboutUs, setHearAboutUs] = useState('')
	const [isDecider, setIsDecider] = useState<boolean | 'indeterminate'>(false)
	const [submitted, setSubmitted] = useState(false)

	const errors = submitted
		? {
				fullName: !fullName.trim() ? 'Required' : undefined,
				email: !email.trim() ? 'Required' : undefined,
				company: !company.trim() ? 'Required' : undefined,
				phone: !phone.trim() ? 'Required' : undefined,
				goals: goals.length === 0 ? 'Pick at least one' : undefined,
				timeline: !timeline ? 'Required' : undefined,
				budget: !budget ? 'Required' : undefined,
			}
		: {}

	const toggleGoal = (goal: string) =>
		setGoals((prev) => (prev.includes(goal) ? prev.filter((g) => g !== goal) : [...prev, goal]))

	<Center axis="horizontal">
		<VStack hAlign="center" width="100%">
			<Section maxWidth={800} padding={6} paddingBlock={10} variant="section">
				<VStack gap={6}>
					{/* Header */}
					<VStack gap={2} hAlign="center">
						<Text type="display-1" weight="bold">
							Let's work together
						</Text>
						<Text type="body" color="secondary">
							Tell us a bit about what you're working on — we'd love to help.
						</Text>
					</VStack>

					{/* Why work with us */}
					<VStack gap={5}>
						<Grid style={{gap: 'var(--spacing-4)'}} columns={{ minWidth: 200 }} >
							{WHY_US.map((item) => (
								<Card key={item.title}>
									<VStack gap={3}>
										<Icon name={item.icon} size={24} color="accent" />
										<VStack gap={1}>
											<Text type="body" weight="bold">
												{item.title}
											</Text>
											<Text type="supporting" color="secondary">
												{item.description}
											</Text>
										</VStack>
									</VStack>
								</Card>
							))}
						</Grid>
					</VStack>

					{/* Your details */}
					<VStack gap={5}>
						<Grid style={{gap: 'var(--spacing-4)'}} columns={{ minWidth: 260 }} >
							<TextInput
								label="Full Name"
								placeholder="Full Name"
								value={fullName}
								onChange={setFullName}
								status={errors.fullName ? { type: 'error', message: errors.fullName } : undefined}
							/>
							<TextInput
								label="Email"
								placeholder="you@company.com"
								value={email}
								onChange={setEmail}
								status={errors.email ? { type: 'error', message: errors.email } : undefined}
							/>
						</Grid>
						<Grid style={{gap: 'var(--spacing-4)'}} columns={{ minWidth: 260 }} >
							<TextInput
								label="Company"
								placeholder="Company"
								value={company}
								onChange={setCompany}
								status={errors.company ? { type: 'error', message: errors.company } : undefined}
							/>
							<TextInput
								label="Phone"
								placeholder="Phone number"
								value={phone}
								onChange={setPhone}
								status={errors.phone ? { type: 'error', message: errors.phone } : undefined}
							/>
						</Grid>
					</VStack>

					<Divider />

					{/* Your project */}
					<VStack gap={5}>
						<VStack gap={2}>
							<Text type="label" color="secondary">
								What are you going for?
							</Text>
							<HStack gap={2} wrap="wrap">
								{CAMPAIGN_GOALS.map((goal) => (
									<Token
										key={goal}
										label={goal}
										color={goals.includes(goal) ? 'blue' : 'default'}
										onClick={() => toggleGoal(goal)}
									/>
								))}
							</HStack>
							{errors.goals ? <Banner status="error" title={errors.goals} /> : null}
						</VStack>

						<Selector
							label="When are you thinking?"
							placeholder="When are you thinking of launching?"
							options={LAUNCH_OPTIONS}
							value={timeline}
							onValueChange={setTimeline}
							status={errors.timeline ? { type: 'error', message: errors.timeline } : undefined}
						/>

						<Selector
							label="Ballpark budget?"
							placeholder="What's your rough monthly budget?"
							options={BUDGET_OPTIONS}
							value={budget}
							onValueChange={setBudget}
							status={errors.budget ? { type: 'error', message: errors.budget } : undefined}
						/>

						<RadioList
							label="How did you hear about us?"
							value={hearAboutUs}
							onValueChange={setHearAboutUs}
						>
							<RadioListItem label="Social media" value="social" />
							<RadioListItem label="Word of mouth" value="word-of-mouth" />
							<RadioListItem label="Search engine" value="search" />
							<RadioListItem label="Event or conference" value="event" />
							<RadioListItem label="Other" value="other" />
						</RadioList>

						<TextArea
							label="Anything else?"
							placeholder="Tell us whatever else is on your mind..."
							value={message}
							onChange={setMessage}
						/>

						<CheckboxInput
							label="I'm a budget decision-maker"
							value={isDecider}
							onChange={setIsDecider}
						/>
					</VStack>

					{/* Submit */}
					<VStack gap={3}>
						<Button
							label="Submit"
							variant="primary"
							size="lg"
							clickAction={() => setSubmitted(true)}
						/>
						<HStack gap={1} hAlign="center">
							<Text type="supporting" color="secondary">
								By submitting you agree to our{' '}
								<Link href="#">
									Privacy Policy
								</Link>
								.
							</Text>
						</HStack>
					</VStack>
				</VStack>
			</Section>
		</VStack>
	</Center>
}
