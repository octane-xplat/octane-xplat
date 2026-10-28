// Port of upstream templates/pages/form-two-column/page.tsx (Astryx 0.6.4,
// MIT) — route /templates/form-two-column/.
// GAPS: Selector `options` takes {value,label} pairs and `onValueChange`
// (upstream string[] + onChange); Button `onClick` → `clickAction`.
import { useState } from 'octane'
import {
	AspectRatio, Button,
	Heading, Card, Center, Divider, Grid, HStack, Link, Section,
	Selector, Text, TextArea, TextInput, Token, VStack,
} from '@octane-xplat/ui'

const ILLUSTRATION_URL = '/template-assets/light-working-vertical-2.png'

const INQUIRY_REASONS = [
	'New business',
	'General inquiry',
	'Press & media',
	'Partnerships',
	'Product feedback',
	'Technical support',
	'Other',
]

const BUDGET_OPTIONS = [
	'Under $10k',
	'$10k – $50k',
	'$50k – $100k',
	'$100k – $500k',
	'$500k+',
	'Not sure yet',
].map((label) => ({ value: label, label }))

const CONTACT_COLUMNS = [
	{ label: 'General inquiries', email: 'hello@company.com' },
	{ label: 'New business', email: 'newbiz@company.com' },
	{ label: 'Press & partnerships', email: 'press@company.com' },
]

// AspectRatio has no objectFit/radius prop and there's no Image primitive
// (upstream #2582), so the cover photo is styled directly. overflow:hidden
// masks the cover crop to the rounded corners.
const pageStyle = {
	minHeight: '100%',
} as const
const illustrationImg = {
	width: '100%',
	height: '100%',
	objectFit: 'cover',
	borderRadius: 'var(--radius-container)',
	overflow: 'hidden',
} as const

export function FormTwoColumnTemplate() @{
	const [fullName, setFullName] = useState('')
	const [email, setEmail] = useState('')
	const [company, setCompany] = useState('')
	const [jobTitle, setJobTitle] = useState('')
	const [phone, setPhone] = useState('')
	const [inquiryReason, setInquiryReason] = useState('')
	const [budget, setBudget] = useState<string | null>(null)
	const [details, setDetails] = useState('')
	const [submitted, setSubmitted] = useState(false)

	const errors = submitted
		? {
				fullName: !fullName.trim() ? 'Required' : undefined,
				email: !email.trim() ? 'Required' : undefined,
				details: !details.trim() ? 'Required' : undefined,
			}
		: {}

	<Center style={pageStyle}>
		<Section maxWidth={1100} width="100%" padding={10} variant="transparent">
			<VStack gap={10}>
				{/* Two-column; stacks to one column below ~520px. */}
				<Grid style={{gap: 'var(--spacing-10)'}} columns={{ minWidth: 320 }}>
					<VStack gap={6}>
						<VStack gap={3}>
							<Heading type="display-1" level={1}>
								Let's work together
							</Heading>
							<Text type="body" color="secondary">
								Tell us what you're working on and we'll help you
								figure out the best path forward.
							</Text>
						</VStack>
						<AspectRatio ratio={4 / 3}>
							<img
								src={ILLUSTRATION_URL}
								alt="Two people working at a desk"
								style={illustrationImg}
							/>
						</AspectRatio>
					</VStack>

					<Card padding={8}>
						<VStack gap={4}>
							<Text type="label">Your details</Text>
							<TextInput
								label="Full name"
								isLabelHidden
								placeholder="Full name*"
								value={fullName}
								onChange={setFullName}
								status={errors.fullName ? { type: 'error', message: errors.fullName } : undefined}
							/>
							<Grid style={{gap: 'var(--spacing-3)'}} columns={{ minWidth: 180 }} >
								<TextInput
									label="Email"
									isLabelHidden
									placeholder="Email*"
									value={email}
									onChange={setEmail}
									status={errors.email ? { type: 'error', message: errors.email } : undefined}
								/>
								<TextInput
									label="Company name"
									isLabelHidden
									placeholder="Company name"
									value={company}
									onChange={setCompany}
								/>
							</Grid>
							<Grid style={{gap: 'var(--spacing-3)'}} columns={{ minWidth: 180 }} >
								<TextInput
									label="Job title"
									isLabelHidden
									placeholder="Job title"
									value={jobTitle}
									onChange={setJobTitle}
								/>
								<TextInput
									label="Phone number"
									isLabelHidden
									placeholder="Phone number"
									value={phone}
									onChange={setPhone}
								/>
							</Grid>

							<VStack gap={2}>
								<Text type="label">What are you reaching out about?</Text>
								<HStack gap={2} wrap="wrap">
									{INQUIRY_REASONS.map((reason) => (
										<Token
											key={reason}
											label={reason}
											color={inquiryReason === reason ? 'blue' : 'default'}
											onClick={() => setInquiryReason((prev) => (prev === reason ? '' : reason))}
										/>
									))}
								</HStack>
							</VStack>
							<Selector
								label="Budget range"
								options={BUDGET_OPTIONS}
								value={budget}
								onValueChange={setBudget}
								placeholder="Select a budget range..."
							/>
							<TextArea
								label="Project details"
								isLabelHidden
								placeholder="Project details*"
								value={details}
								onChange={setDetails}
								status={errors.details ? { type: 'error', message: errors.details } : undefined}
							/>
							{/* hAlign="stretch" = full-width button workaround; Button
							    has no full-width prop (upstream #2600). */}
							<VStack hAlign="stretch">
								<Button
									label="Let's connect"
									variant="primary"
									clickAction={() => setSubmitted(true)}
								/>
							</VStack>
						</VStack>
					</Card>
				</Grid>

				{/* Contact strip; stacks below ~440px. */}
				<VStack gap={6}>
					<Divider />
					<Grid style={{gap: 'var(--spacing-6)'}} columns={{ minWidth: 200 }} >
						{CONTACT_COLUMNS.map((col) => (
							<VStack key={col.label} gap={1} hAlign="center">
								<Text type="supporting" color="secondary">
									{col.label}
								</Text>
								<Link href={`mailto:${col.email}`}>
									{col.email}
								</Link>
							</VStack>
						))}
					</Grid>
				</VStack>
			</VStack>
		</Section>
	</Center>
}
