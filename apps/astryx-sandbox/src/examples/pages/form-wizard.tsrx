// Port of upstream templates/pages/form-wizard/page.tsx (Astryx 0.6.4, MIT) —
// route /templates/form-wizard/.
// GAPS: NumberInput `isIntegerOnly` → `step={1}`; CheckboxInput `status` prop
// has no equivalent — the terms error is rendered as a Text row instead.
import { useMemo, useState } from 'octane'
import {
	Badge, Banner, Button, Card, CheckboxInput, CheckboxList,
	CheckboxListItem, Divider, Field, FormLayout, Grid, Heading, HStack,
	Icon, Layout, LayoutContent, LayoutFooter, LayoutHeader, MetadataList,
	MetadataListItem, NumberInput, RadioList, RadioListItem, SelectableCard,
	Selector, StackItem, Step, Stepper, Switch, Text, TextArea, TextInput,
	VStack,
} from '@octane-xplat/ui'

const STEPS = [
	{ label: 'Workspace' },
	{ label: 'Team', isOptional: true },
	{ label: 'Plan' },
	{ label: 'Review' },
]

const REGIONS = [
	{ value: 'us-east', label: 'US East (N. Virginia)' },
	{ value: 'us-west', label: 'US West (Oregon)' },
	{ value: 'eu-central', label: 'EU Central (Frankfurt)' },
	{ value: 'ap-southeast', label: 'Asia Pacific (Singapore)' },
]

const ROLE_LABELS: Record<string, string> = {
	admin: 'Admin',
	member: 'Member',
	guest: 'Guest',
}

const PLANS = [
	{ id: 'starter', label: 'Starter', pricePerSeat: 0, seatLimit: 5, description: 'Up to 5 members, 3 projects, community support.' },
	{ id: 'growth', label: 'Growth', pricePerSeat: 24, seatLimit: 250, description: 'Unlimited projects, integrations, and standard support.' },
	{ id: 'scale', label: 'Scale', pricePerSeat: 48, seatLimit: 2000, description: 'Advanced controls, a 99.9% SLA, and a dedicated CSM.' },
]

const ADDONS = [
	{ id: 'sso', label: 'SSO / SAML', price: 3, description: 'Single sign-on through Okta, Entra ID, or Google.' },
	{ id: 'audit', label: 'Audit log export', price: 2, description: 'Stream workspace audit events to your SIEM.' },
	{ id: 'regions', label: 'Extra regions', price: 4, description: 'Replicate workspace data to a second region.' },
]

const SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/
const TAKEN_SLUGS = ['acme', 'northwind', 'demo', 'terrace']
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const money = (n: number) => `$${n.toFixed(0)}`

const footerZone = { minWidth: 120 } as const

export function FormWizardTemplate() @{
	const [step, setStep] = useState(0)
	// Steps the user has tried to advance past. Errors stay silent until a step
	// has been attempted so nothing flashes while a field is still being filled.
	const [attempted, setAttempted] = useState<ReadonlySet<number>>(new Set())

	// Step 1 — workspace
	const [name, setName] = useState('Northwind Robotics')
	const [slug, setSlug] = useState('northwind-robotics')
	const [region, setRegion] = useState('us-east')
	const [visibility, setVisibility] = useState('invite')

	// Step 2 — team
	const [invites, setInvites] = useState('marin@northwind.dev, ola@northwind.dev')
	const [role, setRole] = useState('member')
	const [sendNow, setSendNow] = useState(true)
	const [inviteNote, setInviteNote] = useState('')

	// Step 3 — plan
	const [planId, setPlanId] = useState('growth')
	const [seats, setSeats] = useState<number | null>(8)
	const [addons, setAddons] = useState<string[]>(['audit'])
	const [digest, setDigest] = useState(true)

	// Step 4 — review
	const [acceptedTerms, setAcceptedTerms] = useState(false)

	const emails = useMemo(
		() =>
			invites
				.split(/[\n,;]+/)
				.map((e) => e.trim())
				.filter(Boolean),
		[invites],
	)
	const invalidEmails = emails.filter((e) => !EMAIL_PATTERN.test(e))

	const plan = PLANS.find((p) => p.id === planId) ?? PLANS[0]
	const addonCostPerSeat = ADDONS.filter((a) => addons.includes(a.id)).reduce(
		(sum, a) => sum + a.price,
		0,
	)
	const seatCount = seats ?? 0
	const monthlyTotal = (plan.pricePerSeat + addonCostPerSeat) * seatCount

	// One rule set, read by the Next button, the Stepper tint, and the review
	// step's issue list. Keyed by step index so a step's validity is a lookup.
	const errorsByStep = useMemo<Array<Record<string, string>>>(() => {
		const workspace: Record<string, string> = {}
		if (!name.trim()) {
			workspace.name = 'Enter a name for the workspace.'
		}
		if (!slug.trim()) {
			workspace.slug = 'Enter a URL for the workspace.'
		} else if (!SLUG_PATTERN.test(slug)) {
			workspace.slug =
				'Use lowercase letters, numbers, and hyphens, starting and ending with a letter or number.'
		} else if (TAKEN_SLUGS.includes(slug)) {
			workspace.slug = `terrace.app/${slug} is already taken.`
		}

		const team: Record<string, string> = {}
		if (invalidEmails.length > 0) {
			team.invites = `Not a valid email address: ${invalidEmails.join(', ')}`
		}

		const planStep: Record<string, string> = {}
		if (seatCount < 1) {
			planStep.seats = 'Add at least one seat.'
		} else if (seatCount > plan.seatLimit) {
			planStep.seats = `${plan.label} allows up to ${plan.seatLimit} seats.`
		}

		const review: Record<string, string> = {}
		if (!acceptedTerms) {
			review.terms = 'Accept the terms to create the workspace.'
		}
		return [workspace, team, planStep, review]
	}, [name, slug, invalidEmails, seatCount, plan, acceptedTerms])

	/** Errors to render for a step: only once the user has tried to leave it. */
	const shownErrors = (index: number) => (attempted.has(index) ? errorsByStep[index] : {})
	const currentErrors = shownErrors(step)
	const isLastStep = step === STEPS.length - 1

	// Steps other than the current one that still have unresolved problems —
	// surfaced on the review step so nothing hides behind a panel.
	const outstanding = STEPS.map((s, i) => ({
		label: s.label,
		index: i,
		issues: Object.values(errorsByStep[i]),
	})).filter((s) => s.index !== step && s.issues.length > 0)

	const markAttempted = (index: number) =>
		setAttempted((prev) => (prev.has(index) ? prev : new Set(prev).add(index)))

	const goNext = () => {
		markAttempted(step)
		const [firstProblem] = Object.keys(errorsByStep[step])
		if (firstProblem) {
			return
		}
		setStep((s) => Math.min(STEPS.length - 1, s + 1))
	}

	// Skip declines the step outright rather than asserting it is done — it
	// clears what the step collected so a half-filled optional step does not
	// ride along invisibly into the review.
	const goSkip = () => {
		setInvites('')
		setInviteNote('')
		setStep((s) => Math.min(STEPS.length - 1, s + 1))
	}

	const goTo = (index: number) => {
		// Leaving a step forward is an assertion that it is done; leaving it
		// backward is not, so only mark it when moving on.
		if (index > step) {
			markAttempted(step)
		}
		setStep(index)
	}

	<Layout
		height="fill"
		contentWidth={880}
		header={
			<LayoutHeader padding={6} hasDivider>
				<VStack gap={6}>
					<HStack gap={3} vAlign="center">
						<StackItem size="fill">
							<Heading level={1}>Create workspace</Heading>
						</StackItem>
						<Button label="Cancel" variant="ghost" clickAction={() => {}} />
					</HStack>
					<Stepper
						activeStep={step}
						orientation="horizontal"
						onStepClick={goTo} accessibilityLabel="Create workspace progress"
						indicatorPosition="on-track"
					>
						{STEPS.map((s, i) => (
							<Step
								key={s.label}
								step={i}
								label={s.label}
								isOptional={s.isOptional}
								status={Object.keys(shownErrors(i)).length > 0 ? 'error' : undefined}
							/>
						))}
					</Stepper>
				</VStack>
			</LayoutHeader>
		}
		content={
			<LayoutContent>
				{step === 0 ? (
					<VStack gap={5}>
						<VStack gap={1}>
							<Heading level={2}>Workspace details</Heading>
							<Text type="supporting" color="secondary">
								Name your workspace and pick where its data lives. The region
								is permanent — moving data later means a migration.
							</Text>
						</VStack>
						<FormLayout defaultOptionality="optional">
							<TextInput
								label="Workspace name"
								isRequired
								value={name}
								onChange={(v) => setName(v ?? '')}
								placeholder="Acme Inc."
								status={currentErrors.name ? { type: 'error', message: currentErrors.name } : undefined}
							/>
							<TextInput
								label="Workspace URL"
								isRequired
								value={slug}
								onChange={(v) => setSlug(v ?? '')}
								placeholder="acme"
								description={`terrace.app/${slug.trim() || 'your-workspace'}`}
								status={currentErrors.slug ? { type: 'error', message: currentErrors.slug } : undefined}
							/>
							<Selector
								label="Data region"
								options={REGIONS}
								value={region}
								onValueChange={(v) => setRegion(v ?? '')}
								description="Where projects, files, and audit logs are stored at rest."
							/>
							<RadioList label="Who can join" value={visibility} onValueChange={(v) => setVisibility(v ?? '')}>
								<RadioListItem
									value="invite"
									label="Invite only"
									description="Members join by invitation — the workspace stays invisible to everyone else."
								/>
								<RadioListItem
									value="domain"
									label="Anyone at northwind.dev"
									description="Teammates with a verified northwind.dev email can find and join this workspace."
								/>
								<RadioListItem
									value="link"
									label="Anyone with the link"
									description="A shareable link lets anyone join — least secure, use for open communities."
								/>
							</RadioList>
						</FormLayout>
					</VStack>
				) : null}

				{step === 1 ? (
					<VStack gap={5}>
						<VStack gap={1}>
							<Heading level={2}>Invite your team</Heading>
							<Text type="supporting" color="secondary">
								Send invitations now or later — every field on this step is optional.
							</Text>
						</VStack>
						<FormLayout defaultOptionality="optional">
							<TextArea
								label="Email addresses"
								rows={3}
								value={invites}
								onChange={(v) => setInvites(v ?? '')}
								placeholder="name@northwind.dev, comma or newline separated"
								status={currentErrors.invites ? { type: 'error', message: currentErrors.invites } : undefined}
							/>
							<RadioList label="Role for invited members" value={role} onValueChange={(v) => setRole(v ?? '')}>
								<RadioListItem value="admin" label="Admin" description="Can manage members, billing, and workspace settings." />
								<RadioListItem value="member" label="Member" description="Can create and edit projects and files." />
								<RadioListItem value="guest" label="Guest" description="Can view and comment on shared projects only." />
							</RadioList>
							<Switch
								label="Send invites as soon as the workspace is created"
								description="Turn this off to create the workspace now and send invites yourself later."
								value={sendNow}
								onChange={(v) => setSendNow(v ?? '')}
								labelPosition="start"
								labelSpacing="spread"
							/>
							{sendNow ? (
								<TextArea
									label="Add a note to the invite"
									rows={2}
									maxLength={280}
									value={inviteNote}
									onChange={(v) => setInviteNote(v ?? '')}
									placeholder="We're moving planning off email — join us here."
								/>
							) : null}
						</FormLayout>
					</VStack>
				) : null}

				{step === 2 ? (
					<VStack gap={5}>
						<VStack gap={1}>
							<Heading level={2}>Choose a plan</Heading>
							<Text type="supporting" color="secondary">
								Billed monthly per seat. Change plans or add capabilities at
								any time from workspace settings.
							</Text>
						</VStack>
						<FormLayout defaultOptionality="optional">
							<Field label="Plan" isGroupLabel>
								<Grid columns={{ minWidth: 200 }} style={{ gap: 'var(--spacing-3)' }}>
									{PLANS.map((p) => (
										<SelectableCard
											key={p.id}
											label={`${p.label} plan`}
											isSelected={planId === p.id}
											onChange={() => setPlanId(p.id)}
											padding={4}
										>
											<VStack gap={2}>
												<HStack gap={2} vAlign="center" hAlign="between">
													<Text type="label">{p.label}</Text>
													{p.id === 'growth' ? <Badge variant="success" label="Recommended" /> : null}
												</HStack>
												<Text type="large" weight="bold">
													{p.pricePerSeat === 0 ? 'Free' : `${money(p.pricePerSeat)}/seat`}
												</Text>
												<Text type="supporting" color="secondary">
													{p.description}
												</Text>
											</VStack>
										</SelectableCard>
									))}
								</Grid>
							</Field>
							<NumberInput
								label="Seats"
								value={seats}
								onValueChange={(v) => setSeats(v ?? 0)}
								min={1}
								max={plan.seatLimit}
								step={1}
								description={`Includes you. ${plan.label} allows up to ${plan.seatLimit}.`}
								status={currentErrors.seats ? { type: 'error', message: currentErrors.seats } : undefined}
							/>
							<CheckboxList
								label="Add-ons"
								description="Billed per seat alongside the plan."
								value={addons}
								onValueChange={(v) => setAddons(v ?? '')}
							>
								{ADDONS.map((a) => (
									<CheckboxListItem
										key={a.id}
										value={a.id}
										label={`${a.label} — ${money(a.price)}/seat`}
										description={a.description}
									/>
								))}
							</CheckboxList>
							<Divider />
							<Switch
								label="Weekly usage digest"
								description="Email admins a summary of seats and activity every Monday."
								value={digest}
								onChange={(v) => setDigest(v ?? '')}
								labelPosition="start"
								labelSpacing="spread"
							/>
						</FormLayout>
						<Card variant="muted" padding={5}>
							<HStack gap={3} vAlign="center" hAlign="between">
								<VStack gap={0.5}>
									<Text type="label">Estimated monthly cost</Text>
									<Text type="supporting" color="secondary">
										{seatCount} {seatCount === 1 ? 'seat' : 'seats'} ×{' '}
										{money(plan.pricePerSeat + addonCostPerSeat)}
										{addonCostPerSeat > 0
											? ` (${money(plan.pricePerSeat)} plan + ${money(addonCostPerSeat)} add-ons)`
											: ''}
									</Text>
								</VStack>
								<Text type="display-3">{money(monthlyTotal)}</Text>
							</HStack>
						</Card>
					</VStack>
				) : null}

				{step === 3 ? (
					<VStack gap={5}>
						<VStack gap={1}>
							<Heading level={2}>Review and create</Heading>
							<Text type="supporting" color="secondary">
								Nothing is saved until you create the workspace. Use the steps
								above to go back and edit.
							</Text>
						</VStack>

						{outstanding.length > 0 ? (
							<Banner
								status="error"
								title={`${outstanding.length} ${outstanding.length === 1 ? 'step needs' : 'steps need'} attention`}
							>
								<VStack gap={2}>
									{outstanding.map((s) => (
										<VStack key={s.label} gap={1}>
											<Text type="supporting">
												<Text type="inherit" weight="bold">
													{s.label}
												</Text>
												: {s.issues.join(' ')}
											</Text>
										</VStack>
									))}
									<HStack gap={2}>
										<Button
											label={`Go to ${outstanding[0].label}`}
											variant="secondary"
											size="sm"
											clickAction={() => setStep(outstanding[0].index)}
										/>
									</HStack>
								</VStack>
							</Banner>
						) : null}

						<MetadataList orientation="vertical">
							<MetadataListItem label="Workspace name">
								{name.trim() || '—'}
							</MetadataListItem>
							<MetadataListItem label="Workspace URL">
								terrace.app/{slug.trim() || '—'}
							</MetadataListItem>
							<MetadataListItem label="Data region">
								{REGIONS.find((r) => r.value === region)?.label ?? region}
							</MetadataListItem>
							<MetadataListItem label="Who can join">
								{visibility === 'invite'
									? 'Invite only'
									: visibility === 'domain'
										? 'Anyone at northwind.dev'
										: 'Anyone with the link'}
							</MetadataListItem>
							<MetadataListItem label="Invitations">
								{emails.length === 0
									? 'None'
									: `${emails.length} ${emails.length === 1 ? 'person' : 'people'} as ${ROLE_LABELS[role]}${sendNow ? '' : ', sent later'}`}
							</MetadataListItem>
							<MetadataListItem label="Plan">
								{plan.pricePerSeat === 0
									? `${plan.label} (Free)`
									: `${plan.label} · ${money(plan.pricePerSeat)}/seat`}
							</MetadataListItem>
							<MetadataListItem label="Add-ons">
								{addons.length === 0
									? 'None'
									: ADDONS.filter((a) => addons.includes(a.id)).map((a) => a.label).join(', ')}
							</MetadataListItem>
							<MetadataListItem label="Estimated monthly cost">
								{money(monthlyTotal)} · {seatCount} {seatCount === 1 ? 'seat' : 'seats'}
							</MetadataListItem>
						</MetadataList>

						<Divider />

						<VStack gap={1}>
							<CheckboxInput
								label="I agree to the Terms of Service and the Data Processing Addendum"
								value={acceptedTerms}
								onChange={(v) => setAcceptedTerms(v ?? '')}
							/>
							{currentErrors.terms ? (
								<Text type="supporting" style={{ color: 'var(--color-text-error, #d92d20)' }}>
									{currentErrors.terms}
								</Text>
							) : null}
						</VStack>
					</VStack>
				) : null}
			</LayoutContent>
		}
		footer={
			<LayoutFooter>
				<HStack gap={3} vAlign="center">
					<StackItem size="fill" style={footerZone}>
						{STEPS[step].isOptional ? (
							<Button label="Skip" variant="ghost" clickAction={goSkip} />
						) : null}
					</StackItem>
					<Text type="supporting" color="secondary">
						{step + 1} of {STEPS.length}
					</Text>
					<StackItem size="fill" style={footerZone}>
						<HStack gap={3} hAlign="end">
							<Button
								label="Back"
								variant="secondary"
								isDisabled={step === 0}
								clickAction={() => setStep((s) => Math.max(0, s - 1))}
							/>
							<Button
								label={isLastStep ? 'Create workspace' : 'Next'}
								variant="primary"
								// Never disabled: pressing it is how a step reveals what is
								// wrong. A dead button with no explanation is a dead end.
								clickAction={goNext}
							/>
						</HStack>
					</StackItem>
				</HStack>
			</LayoutFooter>
		}
	/>
}
