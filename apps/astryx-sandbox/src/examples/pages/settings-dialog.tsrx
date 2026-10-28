// Port of upstream templates/pages/settings-dialog/page.tsx (Astryx 0.6.4,
// MIT) — route /templates/settings-dialog/.
// CONDENSED PORT: upstream ships ~2600 lines with per-panel row inventories;
// this preserves the same shell contract (inline Dialog, SideNav groups,
// keyboard-navigable settings search, narrow tab strip, SettingsCard/
// SettingsRow row model, per-panel controls) with a representative row set
// per panel. Rows stack at 480px via the panel container the same way
// upstream's @container query does — approximated with flexWrap.
// GAPS: SideNav item description slot is not public (labels only, as
// upstream); `Dialog isInline` has no public equivalent — rendered inside a
// centered host like the dialog template; `IconButton` → `Button isIconOnly`.
import { useId, useMemo, useState } from 'octane'
import {
	Avatar, Badge, Banner, Button, Card, Center, CheckboxInput, Dialog,
	Divider, Heading, HStack, Icon, Layout, LayoutContent, LayoutPanel,
	Link, List, ListItem, ProgressBar, SegmentedControl,
	SegmentedControlItem, SelectableCard, Selector, SideNav, SideNavItem,
	SideNavSection, StackItem, Switch, Tab, TabList, Text, TextInput,
	useMediaQuery, VStack,
} from '@octane-xplat/ui'

const NARROW_VIEWPORT = '(max-width: 640px)'
const noop = () => {}

type PanelId =
	| 'profile' | 'security' | 'billing' | 'appearance' | 'notifications'
	| 'shortcuts' | 'language' | 'privacy' | 'integrations' | 'developer'

interface PanelConfig {
	id: PanelId
	label: string
	description: string
	icon: string
}

const PANEL_GROUPS: { label: string; panels: PanelConfig[] }[] = [
	{
		label: 'Account',
		panels: [
			{ id: 'profile', label: 'Profile', description: 'How you appear to everyone else in the workspace.', icon: 'sandbox-user-circle' },
			{ id: 'security', label: 'Login & security', description: 'Sign-in methods and the devices signed in right now.', icon: 'sandbox-lock-closed' },
			{ id: 'billing', label: 'Billing', description: 'Your plan, seats, and where invoices are sent.', icon: 'sandbox-credit-card' },
		],
	},
	{
		label: 'Preferences',
		panels: [
			{ id: 'appearance', label: 'Appearance', description: 'Theme and density for this browser.', icon: 'sandbox-paint-brush' },
			{ id: 'notifications', label: 'Notifications', description: 'What reaches you, and where it arrives.', icon: 'sandbox-bell' },
			{ id: 'shortcuts', label: 'Keyboard shortcuts', description: 'Rebind or switch off any shortcut on this surface.', icon: 'sandbox-command-line' },
			{ id: 'language', label: 'Language & region', description: 'Language, formats, and time zone.', icon: 'sandbox-globe-alt' },
		],
	},
	{
		label: 'Advanced',
		panels: [
			{ id: 'privacy', label: 'Privacy', description: 'What you share, and what we keep.', icon: 'sandbox-shield-check' },
			{ id: 'integrations', label: 'Connected apps', description: 'Services with access to this workspace.', icon: 'sandbox-puzzle-piece' },
			{ id: 'developer', label: 'Developer', description: 'API access and pre-release features.', icon: 'sandbox-code-bracket' },
		],
	},
]

const PANELS: PanelConfig[] = PANEL_GROUPS.flatMap((group) => group.panels)
const DEFAULT_PANEL: PanelId = 'profile'

const panelConfig = (id: PanelId): PanelConfig =>
	PANELS.find((panel) => panel.id === id) ?? PANELS[0]

interface SearchableSetting {
	title: string
	description: string
	panel: PanelId
	icon: string
}

const SEARCHABLE_SETTINGS: SearchableSetting[] = [
	{ title: 'Display name', description: 'The name shown on your posts and comments', panel: 'profile', icon: 'sandbox-user-circle' },
	{ title: 'Two-factor authentication', description: 'Require a second step when signing in', panel: 'security', icon: 'sandbox-key' },
	{ title: 'Active sessions', description: 'Devices currently signed in to this account', panel: 'security', icon: 'sandbox-computer-desktop' },
	{ title: 'Plan', description: 'Your current subscription and seat count', panel: 'billing', icon: 'sandbox-credit-card' },
	{ title: 'Invoice email', description: 'Where receipts and invoices are sent', panel: 'billing', icon: 'sandbox-envelope' },
	{ title: 'Theme', description: 'Light, dark, or system appearance', panel: 'appearance', icon: 'sandbox-paint-brush' },
	{ title: 'Density', description: 'How much fits on screen at once', panel: 'appearance', icon: 'sandbox-bars-4' },
	{ title: 'Email notifications', description: 'Product updates and weekly digest', panel: 'notifications', icon: 'sandbox-envelope' },
	{ title: 'Push notifications', description: 'Mentions and direct messages', panel: 'notifications', icon: 'sandbox-bell' },
	{ title: 'Keyboard shortcuts', description: 'Rebind or disable shortcuts', panel: 'shortcuts', icon: 'sandbox-command-line' },
	{ title: 'Language', description: 'Interface language and locale', panel: 'language', icon: 'sandbox-globe-alt' },
	{ title: 'Time zone', description: 'Dates and times shown in this zone', panel: 'language', icon: 'sandbox-clock' },
	{ title: 'Profile visibility', description: 'Who outside the workspace can see you', panel: 'privacy', icon: 'sandbox-eye' },
	{ title: 'Connected apps', description: 'Third-party services with access', panel: 'integrations', icon: 'sandbox-puzzle-piece' },
	{ title: 'API keys', description: 'Personal access tokens for the API', panel: 'developer', icon: 'sandbox-key' },
	{ title: 'Beta features', description: 'Pre-release capabilities to try early', panel: 'developer', icon: 'sandbox-beaker' },
]

interface SettingsState {
	displayName: string
	handle: string
	pronouns: string
	twoFactor: boolean
	sessionAlerts: boolean
	plan: string
	seats: number
	invoiceEmail: string
	theme: string
	density: string
	font: string
	emailNotifications: boolean
	pushNotifications: boolean
	digest: boolean
	language: string
	region: string
	timezone: string
	publicProfile: boolean
	searchIndexing: boolean
	betaFeatures: boolean
	apiAccess: boolean
}

const INITIAL_SETTINGS: SettingsState = {
	displayName: 'Alex Johnson',
	handle: '@alexj',
	pronouns: 'unspecified',
	twoFactor: true,
	sessionAlerts: true,
	plan: 'growth',
	seats: 8,
	invoiceEmail: 'billing@northwind.dev',
	theme: 'system',
	density: 'comfortable',
	font: 'system',
	emailNotifications: true,
	pushNotifications: true,
	digest: false,
	language: 'en-US',
	region: 'us',
	timezone: 'ET',
	publicProfile: false,
	searchIndexing: true,
	betaFeatures: false,
	apiAccess: true,
}

const LANGUAGES = [
	{ value: 'en-US', label: 'English (US)' },
	{ value: 'en-CA', label: 'English (Canada)' },
	{ value: 'fr', label: 'Français' },
	{ value: 'es', label: 'Español' },
	{ value: 'de', label: 'Deutsch' },
]

const REGIONS = [
	{ value: 'us', label: 'United States' },
	{ value: 'ca', label: 'Canada' },
	{ value: 'uk', label: 'United Kingdom' },
	{ value: 'de', label: 'Germany' },
]

const TIMEZONES = [
	{ value: 'ET', label: 'Eastern Time (ET)' },
	{ value: 'CT', label: 'Central Time (CT)' },
	{ value: 'PT', label: 'Pacific Time (PT)' },
	{ value: 'GMT', label: 'Greenwich Mean Time (GMT)' },
]

const SHORTCUTS = [
	{ id: 'palette', action: 'Command palette', chord: '⌘K' },
	{ id: 'search', action: 'Search', chord: '⌘F' },
	{ id: 'newdoc', action: 'New document', chord: '⌘N' },
	{ id: 'mute', action: 'Mute notifications', chord: '⌘⇧M' },
	{ id: 'theme', action: 'Toggle theme', chord: '⌘⇧L' },
]

const INTEGRATIONS = [
	{ name: 'Slack', description: 'Posts workspace activity to #northwind-ops.', status: 'Connected' },
	{ name: 'Figma', description: 'Embeds design files inside documents.', status: 'Connected' },
	{ name: 'Linear', description: 'Creates work items from selections.', status: 'Not connected' },
]

const ROW_STACK = '@container settings-panel (max-width: 480px)'

function SettingsCard(props: { title?: string; children: any }) @{
	<VStack gap={1.5}>
		{props.title != null ? (
			<Text type="supporting" weight="semibold" color="secondary">
				{props.title}
			</Text>
		) : null}
		<Card padding={0} width="100%" variant="muted">
			<VStack gap={0}>
				{(Array.isArray(props.children) ? props.children : [props.children]).map((row, index) => (
					<VStack key={index} gap={0}>
						{index > 0 ? <Divider variant="subtle" /> : null}
						{row}
					</VStack>
				))}
			</VStack>
		</Card>
	</VStack>
}

function SettingsRow(props: {
	title: string
	description?: any
	icon: string
	control?: any
	detail?: any
	titleAccessory?: any
}) @{
	<VStack padding={4} gap={2}>
		<HStack gap={3} vAlign="start" wrap="wrap">
			<StackItem size="fill">
				<HStack gap={2} vAlign="start">
					<Icon name={props.icon} size={16} color="secondary" />
					<VStack gap={0.5}>
						<HStack gap={2} vAlign="center">
							<Text type="label">{props.title}</Text>
							{props.titleAccessory}
						</HStack>
						{props.description != null ? (
							<Text type="supporting" color="secondary">
								{props.description}
							</Text>
						) : null}
					</VStack>
				</HStack>
			</StackItem>
			{props.control}
		</HStack>
		{props.detail != null ? props.detail : null}
	</VStack>
}

function useSettingsSearch(onSelectPanel: (panel: PanelId) => void) {
	const [query, setQuery] = useState('')
	const [activeIndex, setActiveIndex] = useState(0)

	const normalized = query.trim().toLowerCase()
	const isActive = normalized.length > 0

	const results = useMemo(
		() =>
			isActive
				? SEARCHABLE_SETTINGS.filter(
						(s) =>
							s.title.toLowerCase().includes(normalized) ||
							s.description.toLowerCase().includes(normalized) ||
							panelConfig(s.panel).label.toLowerCase().includes(normalized),
					)
				: [],
		[normalized, isActive],
	)

	return {
		query,
		setQuery,
		isActive,
		results,
		activeIndex,
		setActiveIndex,
		selectResult: (setting: SearchableSetting) => onSelectPanel(setting.panel),
	}
}

type SettingsSearch = ReturnType<typeof useSettingsSearch>
type UpdateSetting = (key: keyof SettingsState, value: unknown) => void

function SettingsSearchInput(props: { search: SettingsSearch }) @{
	<div
		onKeyDown={(e: KeyboardEvent) => {
			if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
				e.preventDefault()
				const delta = e.key === 'ArrowDown' ? 1 : -1
				props.search.setActiveIndex((i: number) =>
					Math.max(0, Math.min(props.search.results.length - 1, i + delta)),
				)
			} else if (e.key === 'Enter') {
				const setting = props.search.results[props.search.activeIndex]
				if (setting) {props.search.selectResult(setting)}
			} else if (e.key === 'Escape' && props.search.query) {
				e.stopPropagation()
				props.search.setQuery('')
			}
		}}
	>
		<TextInput
			label="Search settings"
			isLabelHidden
			placeholder="Search settings"
			value={props.search.query}
			onChange={(v) => {
				props.search.setQuery(v)
				props.search.setActiveIndex(0)
			}}
			startIcon={<Icon name="sandbox-magnifying-glass" size={16} />}
		/>
	</div>
}

function SettingsSearchResults(props: {
	results: SearchableSetting[]
	activeIndex: number
	onSelect: (setting: SearchableSetting) => void
}) @{
	if (props.results.length === 0) {
		return (
			<VStack padding={3}>
				<Text type="supporting" color="secondary">
					No settings match — try a different search.
				</Text>
			</VStack>
		)
	}
	<List density="compact">
		{props.results.map((setting, i) => (
			<ListItem
				key={setting.title}
				label={setting.title}
				description={`${setting.description} · ${panelConfig(setting.panel).label}`}
				startContent={<Icon name={setting.icon} size={16} color="secondary" />}
				isSelected={i === props.activeIndex}
				onPress={() => props.onSelect(setting)}
			/>
		))}
	</List>
}

function SettingsSideNav(props: {
	titleId: string
	search: SettingsSearch
	activePanel: PanelId
	onSelectPanel: (panel: PanelId) => void
}) @{
	<SideNav style={{ width: 240 }}>
		<SideNavSection title="Settings">
			<VStack padding={3}>
				<SettingsSearchInput search={props.search} />
			</VStack>
		</SideNavSection>
		{props.search.isActive ? (
			<SideNavSection title="Search results">
				<SettingsSearchResults
					results={props.search.results}
					activeIndex={props.search.activeIndex}
					onSelect={props.search.selectResult}
				/>
			</SideNavSection>
		) : (
			PANEL_GROUPS.map((group) => (
				<SideNavSection key={group.label} title={group.label}>
					{group.panels.map((panel) => (
						<SideNavItem
							key={panel.id}
							label={panel.label} icon={<Icon name={panel.icon} size={16} />}
							isSelected={panel.id === props.activePanel}
							onClick={() => props.onSelectPanel(panel.id)}
						/>
					))}
				</SideNavSection>
			))
		)}
	</SideNav>
}

function SettingsPanelHeading(props: { panel: PanelId }) @{
	const config = panelConfig(props.panel)
	<VStack gap={1}>
		<HStack gap={2} vAlign="center">
			<Icon name={config.icon} size={20} color="secondary" />
			<Heading level={2}>{config.label}</Heading>
		</HStack>
		<Text type="supporting" color="secondary">
			{config.description}
		</Text>
	</VStack>
}

function ProfilePanel(props: { settings: SettingsState; update: UpdateSetting }) @{
	<>
		<SettingsCard title="Identity">
			<SettingsRow
				title="Avatar"
				description="Shown next to your name everywhere in the workspace."
				icon="sandbox-user-circle"
				control={<Avatar name={props.settings.displayName} size="md" />}
			/>
			<SettingsRow
				title="Display name"
				description="The name shown on your posts and comments."
				icon="sandbox-identification"
				control={
					<TextInput
						label="Display name" isLabelHidden width={192}
						value={props.settings.displayName}
						onChange={(v) => props.update('displayName', v)}
					/>
				}
			/>
			<SettingsRow
				title="Handle"
				description="Your unique workspace handle."
				icon="sandbox-at-symbol"
				control={
					<TextInput
						label="Handle" isLabelHidden width={192}
						value={props.settings.handle}
						onChange={(v) => props.update('handle', v)}
					/>
				}
			/>
			<SettingsRow
				title="Pronouns"
				description="Optional — shown on your profile."
				icon="sandbox-tag"
				control={
					<Selector
						label="Pronouns" isLabelHidden width={192}
						options={[
							{ value: 'unspecified', label: 'Not specified' },
							{ value: 'she-her', label: 'she/her' },
							{ value: 'he-him', label: 'he/him' },
							{ value: 'they-them', label: 'they/them' },
						]}
						value={props.settings.pronouns}
						onValueChange={(v) => props.update('pronouns', v)}
					/>
				}
			/>
		</SettingsCard>
	</>
}

function SecurityPanel(props: { settings: SettingsState; update: UpdateSetting }) @{
	<>
		<SettingsCard title="Sign-in">
			<SettingsRow
				title="Two-factor authentication"
				description="Require a second step when signing in."
				icon="sandbox-key"
				titleAccessory={<Badge variant={props.settings.twoFactor ? 'success' : 'warning'} label={props.settings.twoFactor ? 'On' : 'Off'} />}
				control={
					<Switch
						label="Two-factor authentication" isLabelHidden
						value={props.settings.twoFactor}
						onChange={(v) => props.update('twoFactor', v)}
					/>
				}
			/>
			<SettingsRow
				title="Session alerts"
				description="Email me when a new device signs in."
				icon="sandbox-bell"
				control={
					<Switch
						label="Session alerts" isLabelHidden
						value={props.settings.sessionAlerts}
						onChange={(v) => props.update('sessionAlerts', v)}
					/>
				}
			/>
		</SettingsCard>
		<SettingsCard title="Active sessions">
			<SettingsRow
				title="MacBook Pro · Chrome"
				description="McKinney, Texas · this device"
				icon="sandbox-computer-desktop"
				titleAccessory={<Badge variant="success" label="Current" />}
			/>
			<SettingsRow
				title="iPhone 15 · Safari"
				description="Last active 2 hours ago"
				icon="sandbox-device-phone-mobile"
				control={<Link href="#">Sign out</Link>}
			/>
		</SettingsCard>
	</>
}

function BillingPanel(props: { settings: SettingsState; update: UpdateSetting }) @{
	<>
		<SettingsCard title="Plan">
			<SettingsRow
				title="Growth plan"
				description="8 seats · $24 per seat, billed monthly."
				icon="sandbox-credit-card"
				control={<Button label="Change plan" variant="secondary" size="sm" clickAction={() => {}} />}
			/>
			<SettingsRow
				title="Seat usage"
				icon="sandbox-user-group"
				detail={
					<VStack gap={1}>
						<ProgressBar label="Seats used" isLabelHidden value={80} />
						<Text type="supporting" color="secondary">8 of 10 seats in use.</Text>
					</VStack>
				}
			/>
		</SettingsCard>
		<SettingsCard title="Invoices">
			<SettingsRow
				title="Invoice email"
				description="Receipts and renewal notices go here."
				icon="sandbox-envelope"
				control={
					<TextInput
						label="Invoice email" isLabelHidden width={192}
						value={props.settings.invoiceEmail}
						onChange={(v) => props.update('invoiceEmail', v)}
					/>
				}
			/>
		</SettingsCard>
	</>
}

function AppearancePanel(props: { settings: SettingsState; update: UpdateSetting }) @{
	<>
		<VStack gap={1.5}>
			<Text type="supporting" weight="semibold" color="secondary">Theme</Text>
			<HStack gap={3} wrap="wrap">
				{[
					{ value: 'light', label: 'Light', bg: '#f7f7f5', fg: '#111' },
					{ value: 'dark', label: 'Dark', bg: '#19191b', fg: '#f5f5f4' },
					{ value: 'system', label: 'System', bg: 'linear-gradient(105deg,#f7f7f5 50%,#19191b 50%)', fg: '#555' },
				].map((scheme) => (
					<SelectableCard
						key={scheme.value}
						label={`${scheme.label} theme`}
						isSelected={props.settings.theme === scheme.value}
						onChange={() => props.update('theme', scheme.value)}
						padding={3}
						width={160}
					>
						<VStack gap={2}>
							<div style={{
								height: 64, borderRadius: 'var(--radius-element)',
								background: scheme.bg, border: '1px solid var(--color-border)',
								display: 'flex', alignItems: 'center', justifyContent: 'center',
								color: scheme.fg, fontSize: 11,
							}}>
								Aa
							</div>
							<Text type="label">{scheme.label}</Text>
						</VStack>
					</SelectableCard>
				))}
			</HStack>
		</VStack>
		<SettingsCard title="Layout">
			<SettingsRow
				title="Density"
				description="How much fits on screen at once."
				icon="sandbox-bars-4"
				control={
					<SegmentedControl
						label="Density"
						value={props.settings.density}
						onValueChange={(v) => props.update('density', v)}
						size="sm"
					>
						<SegmentedControlItem value="compact" label="Compact" />
						<SegmentedControlItem value="comfortable" label="Comfortable" />
						<SegmentedControlItem value="spacious" label="Spacious" />
					</SegmentedControl>
				}
			/>
			<SettingsRow
				title="Interface font"
				description="The typeface for labels and controls."
				icon="sandbox-language"
				control={
					<Selector
						label="Font" isLabelHidden width={192}
						options={[
							{ value: 'system', label: 'System default' },
							{ value: 'inter', label: 'Inter' },
							{ value: 'mono', label: 'Monospace' },
						]}
						value={props.settings.font}
						onValueChange={(v) => props.update('font', v)}
					/>
				}
			/>
		</SettingsCard>
	</>
}

function NotificationsPanel(props: { settings: SettingsState; update: UpdateSetting }) @{
	<SettingsCard title="Delivery">
		<SettingsRow
			title="Email notifications"
			description="Product updates and workspace announcements."
			icon="sandbox-envelope"
			control={
				<Switch label="Email notifications" isLabelHidden
					value={props.settings.emailNotifications}
					onChange={(v) => props.update('emailNotifications', v)} />
			}
		/>
		<SettingsRow
			title="Push notifications"
			description="Mentions and direct messages."
			icon="sandbox-bell"
			control={
				<Switch label="Push notifications" isLabelHidden
					value={props.settings.pushNotifications}
					onChange={(v) => props.update('pushNotifications', v)} />
			}
		/>
		<SettingsRow
			title="Weekly digest"
			description="A Monday summary of your workspace activity."
			icon="sandbox-calendar"
			control={
				<Switch label="Weekly digest" isLabelHidden
					value={props.settings.digest}
					onChange={(v) => props.update('digest', v)} />
			}
		/>
	</SettingsCard>
}

function ShortcutsPanel() @{
	const [overrides, setOverrides] = useState<Record<string, boolean>>({})
	<>
		<SettingsCard title="Workspace">
			{SHORTCUTS.map((shortcut) => (
				<SettingsRow
					key={shortcut.id}
					title={shortcut.action}
					icon="sandbox-command-line"
					control={
						overrides[shortcut.id] ? (
							<Badge variant="warning" label="Off" />
						) : (
							<Text type="label" color="secondary">
								{shortcut.chord}
							</Text>
						)
					}
					detail={
						<HStack gap={2}>
							<Button
								label={overrides[shortcut.id] ? 'Re-enable' : 'Rebind'}
								variant="ghost" size="sm"
								clickAction={() =>
									setOverrides((prev) => ({ ...prev, [shortcut.id]: !prev[shortcut.id] }))
								}
							/>
						</HStack>
					}
				/>
			))}
		</SettingsCard>
	</>
}

function LanguagePanel(props: { settings: SettingsState; update: UpdateSetting }) @{
	<SettingsCard title="Formats">
		<SettingsRow
			title="Language"
			description="The interface language for this workspace."
			icon="sandbox-globe-alt"
			control={
				<Selector label="Language" isLabelHidden width={192}
					options={LANGUAGES} value={props.settings.language}
					onValueChange={(v) => props.update('language', v)} />
			}
		/>
		<SettingsRow
			title="Region"
			description="Date and number formats follow this region."
			icon="sandbox-map-pin"
			control={
				<Selector label="Region" isLabelHidden width={192}
					options={REGIONS} value={props.settings.region}
					onValueChange={(v) => props.update('region', v)} />
			}
		/>
		<SettingsRow
			title="Time zone"
			description="Timestamps display in this zone."
			icon="sandbox-clock"
			control={
				<Selector label="Time zone" isLabelHidden width={192}
					options={TIMEZONES} value={props.settings.timezone}
					onValueChange={(v) => props.update('timezone', v)} />
			}
		/>
	</SettingsCard>
}

function PrivacyPanel(props: { settings: SettingsState; update: UpdateSetting }) @{
	<>
		<SettingsCard title="Visibility">
			<SettingsRow
				title="Public profile"
				description="Anyone with the link can view your profile page."
				icon="sandbox-eye"
				control={
					<Switch label="Public profile" isLabelHidden
						value={props.settings.publicProfile}
						onChange={(v) => props.update('publicProfile', v)} />
				}
			/>
			<SettingsRow
				title="Search indexing"
				description="Allow search engines to index your public profile."
				icon="sandbox-magnifying-glass"
				control={
					<Switch label="Search indexing" isLabelHidden
						value={props.settings.searchIndexing}
						onChange={(v) => props.update('searchIndexing', v)} />
				}
			/>
		</SettingsCard>
		<SettingsCard title="Your data">
			<SettingsRow
				title="Export your data"
				description="A download of everything we hold about you."
				icon="sandbox-arrow-down-tray"
				control={<Button label="Request export" variant="secondary" size="sm" clickAction={() => {}} />}
			/>
			<SettingsRow
				title="Delete your data"
				description="Removes your profile and content permanently."
				icon="sandbox-trash"
				control={<Button label="Delete account" variant="destructive" size="sm" clickAction={() => {}} />}
			/>
		</SettingsCard>
	</>
}

function IntegrationsPanel() @{
	<SettingsCard title="Connected services">
		{INTEGRATIONS.map((integration) => (
			<SettingsRow
				key={integration.name}
				title={integration.name}
				description={integration.description}
				icon="sandbox-puzzle-piece"
				titleAccessory={integration.status === 'Connected' ? <Badge variant="success" label="Connected" /> : undefined}
				control={
					<Button
						label={integration.status === 'Connected' ? 'Manage' : 'Connect'}
						variant={integration.status === 'Connected' ? 'secondary' : 'primary'}
						size="sm"
						clickAction={() => {}}
					/>
				}
			/>
		))}
	</SettingsCard>
}

function DeveloperPanel(props: { settings: SettingsState; update: UpdateSetting }) @{
	<>
		<SettingsCard title="API access">
			<SettingsRow
				title="API access"
				description="Allow scripts to act on your behalf via the REST API."
				icon="sandbox-key"
				control={
					<Switch label="API access" isLabelHidden
						value={props.settings.apiAccess}
						onChange={(v) => props.update('apiAccess', v)} />
				}
			/>
			<SettingsRow
				title="Personal access token"
				description="Ends in …4f2c. Created March 2, 2026."
				icon="sandbox-identification"
				control={<Button label="Regenerate" variant="secondary" size="sm" clickAction={() => {}} />}
			/>
		</SettingsCard>
		<SettingsCard title="Pre-release">
			<SettingsRow
				title="Beta features"
				description="Try pre-release capabilities before they ship."
				icon="sandbox-beaker"
				control={
					<Switch label="Beta features" isLabelHidden
						value={props.settings.betaFeatures}
						onChange={(v) => props.update('betaFeatures', v)} />
				}
			/>
		</SettingsCard>
	</>
}

function SettingsPanelBody(props: { panel: PanelId; settings: SettingsState; update: UpdateSetting }) {
	switch (props.panel) {
		case 'profile': return <ProfilePanel settings={props.settings} update={props.update} />
		case 'security': return <SecurityPanel settings={props.settings} update={props.update} />
		case 'billing': return <BillingPanel settings={props.settings} update={props.update} />
		case 'appearance': return <AppearancePanel settings={props.settings} update={props.update} />
		case 'notifications': return <NotificationsPanel settings={props.settings} update={props.update} />
		case 'shortcuts': return <ShortcutsPanel />
		case 'language': return <LanguagePanel settings={props.settings} update={props.update} />
		case 'privacy': return <PrivacyPanel settings={props.settings} update={props.update} />
		case 'integrations': return <IntegrationsPanel />
		case 'developer': return <DeveloperPanel settings={props.settings} update={props.update} />
		default: return null
	}
}

function SettingsPanelTabs(props: { activePanel: PanelId; onSelectPanel: (panel: PanelId) => void }) @{
	<HStack
		gap={1}
		isScrollable
		paddingInline={3}
		paddingBlock={2}
		style={{ flexWrap: 'nowrap' }}
	>
		{PANELS.map((panel) => (
			<Button
				key={panel.id}
				label={panel.label}
				icon={<Icon name={panel.icon} size={16} />}
				variant={panel.id === props.activePanel ? 'secondary' : 'ghost'}
				size="sm"
				clickAction={() => props.onSelectPanel(panel.id)}
			/>
		))}
	</HStack>
}

export function SettingsDialogTemplate() @{
	const [activePanel, setActivePanel] = useState<PanelId>(DEFAULT_PANEL)
	const [settings, setSettings] = useState<SettingsState>(INITIAL_SETTINGS)
	const titleId = useId()

	const isNarrow = useMediaQuery(NARROW_VIEWPORT)

	const update: UpdateSetting = (key, value) => {
		setSettings((current) => ({ ...current, [key]: value }))
	}

	const selectPanel = (panel: PanelId) => {
		setActivePanel(panel)
		search.setQuery('')
	}

	const search = useSettingsSearch((panel) => {
		selectPanel(panel)
	})

	const panelBody = (
		<VStack gap={6} padding={5}>
			<SettingsPanelHeading panel={activePanel} />
			<SettingsPanelBody panel={activePanel} settings={settings} update={update} />
		</VStack>
	)

	<Center height="100dvh">
		<Dialog
			isOpen
			onOpenChange={noop}
			purpose="form"
			width={1120}
			padding={0}
			aria-labelledby={titleId}
			style={{ height: 'min(800px, calc(100dvh - 2rem))' }}
		>
			{isNarrow ? (
				<VStack gap={0} height="100%">
					<HStack gap={2} vAlign="center" paddingInline={3} paddingBlock={3}>
						<StackItem size="fill">
							<Text type="label" id={titleId}>Settings</Text>
						</StackItem>
						<Button label="Close" variant="ghost" size="sm" isIconOnly icon={<Icon name="sandbox-x-mark" size={16} />} clickAction={noop} />
					</HStack>
					<Divider />
					<VStack paddingInline={3} paddingBlock={2}>
						<SettingsSearchInput search={search} />
					</VStack>
					{search.isActive ? (
						<VStack paddingInline={3} isScrollable>
							<SettingsSearchResults
								results={search.results}
								activeIndex={search.activeIndex}
								onSelect={search.selectResult}
							/>
						</VStack>
					) : (
						<>
							<SettingsPanelTabs activePanel={activePanel} onSelectPanel={selectPanel} />
							<Divider />
							<StackItem size="fill">
								<LayoutContent>{panelBody}</LayoutContent>
							</StackItem>
						</>
					)}
				</VStack>
			) : (
				<Layout
					start={
						<SettingsSideNav
							titleId={titleId}
							search={search}
							activePanel={activePanel}
							onSelectPanel={selectPanel}
						/>
					}
					content={<LayoutContent>{panelBody}</LayoutContent>}
				/>
			)}
		</Dialog>
	</Center>
}
