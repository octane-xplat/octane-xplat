// Port of upstream templates/pages/settings-sidebar/page.tsx (Astryx 0.6.4,
// MIT) — route /templates/settings-sidebar/.
// GAPS: none — nav↔detail two-view mobile pattern, ExpandableRow edit
// affordance, and TabList sections map 1:1. Unimplemented nav entries fall
// back to the Personal info pane upstream-style (they render no detail).
import { useState } from 'octane'
import {
	Badge, Button, Card, Center, Divider, Heading, HStack, Icon, Layout,
	LayoutContent, LayoutHeader, LayoutPanel, Link, List, ListItem, Selector, StackItem,
	Switch, Tab, TabList, Text, TextInput, useMediaQuery, VStack,
} from '@octane-xplat/ui'

const sideNavPadding = {
	paddingBlock: 'var(--spacing-4)',
	paddingInline: 'var(--spacing-3)',
} as const
const sideNavHeading = { marginInline: 'var(--spacing-4)' } as const
const rowPadding = { paddingBlock: 'var(--spacing-3)' } as const
const fillViewport = { height: '100dvh' } as const
const iconBox = { borderRadius: 'var(--radius-element)', backgroundColor: 'var(--color-background-muted)' } as const

const NAV_ITEMS = [
	{ label: 'Personal information', icon: 'sandbox-user' },
	{ label: 'Login & security', icon: 'sandbox-lock-closed' },
	{ label: 'Privacy', icon: 'sandbox-shield-check' },
	{ label: 'Notifications', icon: 'sandbox-bell' },
	{ label: 'Taxes', icon: 'sandbox-document-text' },
	{ label: 'Payments', icon: 'sandbox-credit-card' },
	{ label: 'Languages & currency', icon: 'sandbox-globe-alt' },
	{ label: 'Travel for work', icon: 'sandbox-briefcase' },
]

interface InfoRow {
	label: string
	value: string
	action: string
}

const LOGIN_ROWS: InfoRow[] = [
	{ label: 'Password', value: 'Not created', action: 'Create' },
]

const SOCIAL_ROWS: InfoRow[] = [
	{ label: 'Google', value: 'Connected', action: 'Disconnect' },
]

const DEVICE_ROWS = [
	{ label: 'OS X 10.15.7 · Chrome', badge: 'CURRENT SESSION', location: 'McKinney, Texas · March 30, 2026 at 19:31', action: undefined },
	{ label: 'Windows 11 · Edge', badge: undefined, location: 'Austin, Texas · March 28, 2026 at 08:12', action: 'Log out' },
	{ label: 'iPhone 15 · Safari', badge: undefined, location: 'McKinney, Texas · March 27, 2026 at 21:44', action: 'Log out' },
]

const LANGUAGES = [
	{ label: 'English (Canada)', value: 'en-CA' },
	{ label: 'English (US)', value: 'en-US' },
	{ label: 'Français', value: 'fr' },
	{ label: 'Español', value: 'es' },
]

const CURRENCIES = [
	{ label: 'Canadian dollar (CAD)', value: 'CAD' },
	{ label: 'US dollar (USD)', value: 'USD' },
	{ label: 'Euro (EUR)', value: 'EUR' },
]

const TIMEZONES = [
	{ label: 'Eastern Time (ET)', value: 'ET' },
	{ label: 'Central Time (CT)', value: 'CT' },
	{ label: 'Pacific Time (PT)', value: 'PT' },
	{ label: 'Greenwich Mean Time (GMT)', value: 'GMT' },
]

function InfoRowItem(props: InfoRow) @{
	<>
		<HStack hAlign="between" vAlign="start" style={rowPadding}>
			<VStack gap={0}>
				<Text type="body" weight="semibold">
					{props.label}
				</Text>
				<Text type="supporting" color="secondary">
					{props.value}
				</Text>
			</VStack>
			{props.action ? <Link href="#">{props.action}</Link> : null}
		</HStack>
		<Divider />
	</>
}

function ExpandableRow(props: {
	label: string
	value: string
	children: any
	isExpanded: boolean
	onEdit: () => void
	onCancel: () => void
	onSave: () => void
}) @{
	<>
		{props.isExpanded ? (
			<VStack gap={4} style={rowPadding}>
				<Text type="body" weight="semibold">
					{props.label}
				</Text>
				{props.children}
				<HStack gap={2}>
					<Button label="Save" variant="primary" clickAction={props.onSave} />
					<Button label="Cancel" variant="ghost" clickAction={props.onCancel} />
				</HStack>
			</VStack>
		) : (
			<HStack hAlign="between" vAlign="start" style={rowPadding}>
				<VStack gap={0}>
					<Text type="body" weight="semibold">
						{props.label}
					</Text>
					<Text type="supporting" color="secondary">
						{props.value}
					</Text>
				</VStack>
				<Button label="Edit" variant="link" size="sm" clickAction={props.onEdit} />
			</HStack>
		)}
		<Divider />
	</>
}

export function SettingsSidebarTemplate() @{
	const isNarrow = useMediaQuery('(max-width: 768px)')
	const [mobileView, setMobileView] = useState<'nav' | 'detail'>('nav')
	const [activeNav, setActiveNav] = useState('Personal information')
	const [activeTab, setActiveTab] = useState('login')
	const [readReceipts, setReadReceipts] = useState(true)
	const [searchEngines, setSearchEngines] = useState(true)
	const [showCity, setShowCity] = useState(true)
	const [showTripType, setShowTripType] = useState(true)
	const [showStayLength, setShowStayLength] = useState(true)
	const [showServices, setShowServices] = useState(true)
	const [aiFeatures, setAiFeatures] = useState(true)

	const [expandedRow, setExpandedRow] = useState<string | null>(null)
	const [language, setLanguage] = useState('en-CA')
	const [currency, setCurrency] = useState('CAD')
	const [timezone, setTimezone] = useState('ET')

	const [legalName, setLegalName] = useState('Alex Johnson')
	const [preferredName, setPreferredName] = useState('')
	const [email, setEmail] = useState('a***n@example.com')
	const [phone, setPhone] = useState('+1 ***-***-0123')
	const [address, setAddress] = useState('')
	const [mailingAddress, setMailingAddress] = useState('')
	const [emergencyContact, setEmergencyContact] = useState('Provided')

	const selectNav = (label: string) => {
		setActiveNav(label)
		setMobileView('detail')
	}

	const navList = (
		<VStack gap={4} style={sideNavPadding}>
			<Heading level={2} style={sideNavHeading}>
				Account settings
			</Heading>
			<List density="spacious">
				{NAV_ITEMS.map((item) => (
					<ListItem
						key={item.label}
						label={item.label}
						startContent={<Icon name={item.icon} />}
						endContent={isNarrow ? <Icon name="sandbox-chevron-right" size={16} color="secondary" /> : undefined}
						isSelected={!isNarrow && activeNav === item.label}
						onPress={() => selectNav(item.label)}
					/>
				))}
			</List>
			<Divider />
			<List density="spacious">
				<ListItem
					label="Professional hosting tools"
					startContent={<Icon name="sandbox-wrench-screwdriver" />}
					onPress={() => {}}
				/>
			</List>
		</VStack>
	)

	if (isNarrow && mobileView === 'nav') {
		return (
			<Layout
				height="fill"
				style={fillViewport}
				content={<LayoutContent padding={2}>{navList}</LayoutContent>}
			/>
		)
	}

	const expandable = (
		label: string,
		value: string,
		key: string,
		field: any,
	) => (
		<ExpandableRow
			label={label}
			value={value}
			isExpanded={expandedRow === key}
			onEdit={() => setExpandedRow(key)}
			onCancel={() => setExpandedRow(null)}
			onSave={() => setExpandedRow(null)}
		>
			{field}
		</ExpandableRow>
	)

	<Layout
		height="fill"
		style={fillViewport}
		start={
			isNarrow ? undefined : (
				<LayoutPanel width={280} hasDivider>
					{navList}
				</LayoutPanel>
			)
		}
		header={
			isNarrow ? (
				<LayoutHeader padding={3} hasDivider>
					<HStack gap={2} vAlign="center">
						<Button
							label="Back"
							variant="ghost" size="sm"
							icon={<Icon name="sandbox-chevron-left" size={16} />}
							clickAction={() => setMobileView('nav')}
						/>
						<Heading level={3}>{activeNav}</Heading>
					</HStack>
				</LayoutHeader>
			) : undefined
		}
		content={
			<LayoutContent padding={isNarrow ? 4 : 8}>
				<VStack gap={6}>

					{activeNav === 'Login & security' ? (
						<VStack gap={6}>
							{!isNarrow ? <Heading level={2}>Login &amp; security</Heading> : null}
							<TabList value={activeTab} onChange={(v) => setActiveTab(v ?? '')} hasDivider>
								<Tab value="login" label="Login" />
								<Tab value="shared" label="Shared access" />
							</TabList>

							{activeTab === 'login' ? (
								<VStack gap={8}>
									<VStack gap={0}>
										<Heading level={3}>Login</Heading>
										<Divider />
										{LOGIN_ROWS.map((row) => (
											<InfoRowItem key={row.label} {...row} />
										))}
									</VStack>
									<VStack gap={0}>
										<Heading level={3}>Social accounts</Heading>
										<Divider />
										{SOCIAL_ROWS.map((row) => (
											<InfoRowItem key={row.label} {...row} />
										))}
									</VStack>
									<VStack gap={0}>
										<Heading level={3}>Device history</Heading>
										<Divider />
										{DEVICE_ROWS.map((device, i) => (
											<HStack key={i} gap={3} vAlign="start" style={rowPadding}>
												<Icon name="sandbox-computer-desktop" />
												<StackItem size="fill">
													<VStack gap={0}>
														<HStack gap={2} vAlign="center">
															<Text type="body" weight="semibold">{device.label}</Text>
															{device.badge ? <Badge label={device.badge} /> : null}
														</HStack>
														<Text type="supporting" color="secondary">
															{device.location}
														</Text>
													</VStack>
												</StackItem>
												{device.action ? <Link href="#">{device.action}</Link> : null}
											</HStack>
										))}
										<Divider />
									</VStack>
									<VStack gap={0}>
										<Heading level={3}>Account</Heading>
										<Divider />
										<HStack hAlign="between" vAlign="start" style={rowPadding}>
											<VStack gap={0}>
												<Text type="body" weight="semibold">
													Deactivate your account
												</Text>
												<Text type="supporting" color="secondary">
													This action cannot be undone
												</Text>
											</VStack>
											<Link href="#">Deactivate</Link>
										</HStack>
										<Divider />
									</VStack>
								</VStack>
							) : null}

							{activeTab === 'shared' ? (
								<VStack gap={8}>
									<VStack gap={2}>
										<Heading level={3}>Shared access</Heading>
										<Divider />
										<Text type="body" color="secondary">
											Review each request carefully before approving access.
											We&apos;ll email your employee or co-worker a 4-digit
											code that lets them log into your account with their
											trusted device.
										</Text>
									</VStack>
									<Card variant="muted">
										<HStack gap={4} vAlign="start">
											<Center width={48} height={48} style={iconBox}>
												<Icon name="sandbox-lock-closed" />
											</Center>
											<VStack gap={1}>
												<Text type="body" weight="bold">
													Adding devices from people you trust
												</Text>
												<Text type="body" color="secondary">
													When you approve a request, you grant someone full
													access to your account. They&apos;ll be able to
													change reservations and send messages on your
													behalf.
												</Text>
											</VStack>
										</HStack>
									</Card>
								</VStack>
							) : null}
						</VStack>
					) : null}

					{activeNav === 'Languages & currency' ? (
						<VStack gap={6}>
							{!isNarrow ? <Heading level={2}>Languages &amp; currency</Heading> : null}
							<VStack gap={0}>
								{expandable(
									'Language', 'English (Canada)', 'language',
									<Selector label="Language" isLabelHidden options={LANGUAGES} value={language} onValueChange={(v) => setLanguage(v ?? '')} />,
								)}
								{expandable(
									'Currency', 'Canadian dollar (CAD)', 'currency',
									<Selector label="Currency" isLabelHidden options={CURRENCIES} value={currency} onValueChange={(v) => setCurrency(v ?? '')} />,
								)}
								{expandable(
									'Time zone', 'Eastern Time (ET)', 'timezone',
									<Selector label="Time zone" isLabelHidden options={TIMEZONES} value={timezone} onValueChange={(v) => setTimezone(v ?? '')} />,
								)}
							</VStack>
						</VStack>
					) : null}

					{activeNav === 'Personal information' ? (
						<VStack gap={6}>
							{!isNarrow ? <Heading level={2}>Personal info</Heading> : null}
							<VStack gap={0}>
								{expandable(
									'Legal name', legalName, 'legalName',
									<TextInput label="Legal name" isLabelHidden value={legalName} onChange={(v) => setLegalName(v ?? '')} />,
								)}
								{expandable(
									'Preferred name', preferredName || 'Not provided', 'preferredName',
									<TextInput label="Preferred name" isLabelHidden value={preferredName} onChange={(v) => setPreferredName(v ?? '')} />,
								)}
								{expandable(
									'Email address', email, 'email',
									<TextInput label="Email address" isLabelHidden value={email} onChange={(v) => setEmail(v ?? '')} />,
								)}
								{expandable(
									'Phone number', phone, 'phone',
									<TextInput label="Phone number" isLabelHidden value={phone} onChange={(v) => setPhone(v ?? '')} />,
								)}
								<InfoRowItem label="Government ID" value="Provided" action="Edit" />
								{expandable(
									'Address', address || 'Not provided', 'address',
									<TextInput label="Address" isLabelHidden value={address} onChange={(v) => setAddress(v ?? '')} />,
								)}
								{expandable(
									'Mailing address', mailingAddress || 'Not provided', 'mailingAddress',
									<TextInput label="Mailing address" isLabelHidden value={mailingAddress} onChange={(v) => setMailingAddress(v ?? '')} />,
								)}
								{expandable(
									'Emergency contact', emergencyContact, 'emergencyContact',
									<TextInput label="Emergency contact" isLabelHidden value={emergencyContact} onChange={(v) => setEmergencyContact(v ?? '')} />,
								)}
							</VStack>
						</VStack>
					) : null}

					{activeNav === 'Privacy' ? (
						<VStack gap={6}>
							{!isNarrow ? <Heading level={2}>Privacy</Heading> : null}
							<VStack gap={8}>
								<VStack gap={0}>
									<Heading level={3}>Messages</Heading>
									<VStack style={rowPadding}>
										<Switch
											label="Show people when I've read their messages."
											value={readReceipts}
											onChange={(v) => setReadReceipts(v ?? '')}
											labelPosition="start" labelSpacing="spread"
										/>
									</VStack>
									<HStack hAlign="between" vAlign="center" style={rowPadding}>
										<Text type="body" weight="semibold">Blocked people</Text>
										<Link href="#">View</Link>
									</HStack>
									<Divider />
								</VStack>

								<VStack gap={0}>
									<Heading level={3}>Listings</Heading>
									<VStack style={rowPadding}>
										<Switch
											label="Include my listing(s) in search engines"
											description="Turning this on means search engines, like Google, will display your listing page(s) in search results."
											value={searchEngines}
											onChange={(v) => setSearchEngines(v ?? '')}
											labelPosition="start" labelSpacing="spread"
										/>
									</VStack>
									<Divider />
								</VStack>

								<VStack gap={4}>
									<Heading level={3}>Reviews</Heading>
									<Text type="supporting" color="secondary">
										Choose what&apos;s shared when you write a review.{' '}
										<Link href="#">Learn more</Link>
									</Text>
									<VStack gap={4}>
										<Switch
											label="Show my home city and country"
											description="Ex: City and country"
											value={showCity} onChange={(v) => setShowCity(v ?? '')}
											labelPosition="start" labelSpacing="spread"
										/>
										<Switch
											label="Show my trip type"
											description="Ex: Stayed with kids or pets"
											value={showTripType} onChange={(v) => setShowTripType(v ?? '')}
											labelPosition="start" labelSpacing="spread"
										/>
										<Switch
											label="Show my length of stay"
											description="Ex: A few nights, about a week, etc."
											value={showStayLength} onChange={(v) => setShowStayLength(v ?? '')}
											labelPosition="start" labelSpacing="spread"
										/>
										<Switch
											label="Show my booked services"
											description="Ex: Gourmet brunch or tasting menu"
											value={showServices} onChange={(v) => setShowServices(v ?? '')}
											labelPosition="start" labelSpacing="spread"
										/>
									</VStack>
								</VStack>

								<VStack gap={4}>
									<Heading level={3}>Data privacy</Heading>
									<Card>
										<HStack hAlign="between" vAlign="center">
											<Text type="body">Request my personal data</Text>
											<Link href="#">Request</Link>
										</HStack>
									</Card>
									<Switch
										label="Help improve AI-powered features"
										description="When this is on, we use your data to develop and improve AI models."
										value={aiFeatures} onChange={(v) => setAiFeatures(v ?? '')}
										labelPosition="start" labelSpacing="spread"
									/>
									<Card>
										<HStack hAlign="between" vAlign="center">
											<Text type="body">Delete my account</Text>
											<Link href="#">Delete</Link>
										</HStack>
									</Card>
									<Card variant="muted">
										<HStack gap={4} vAlign="start">
											<Center width={48} height={48} style={iconBox}>
												<Icon name="sandbox-shield-check" />
											</Center>
											<VStack gap={1}>
												<Text type="body" weight="bold">Committed to privacy</Text>
												<Text type="supporting" color="secondary">
													We&apos;re committed to keeping your data protected.
													See details in our <Link href="#">Privacy Policy</Link>.
												</Text>
											</VStack>
										</HStack>
									</Card>
								</VStack>
							</VStack>
						</VStack>
					) : null}
				</VStack>
			</LayoutContent>
		}
	/>
}
