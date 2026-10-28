// Port of upstream templates/pages/settings/page.tsx (Astryx 0.6.4, MIT) —
// route /templates/settings/.
// GAPS: Typeahead `startIcon` takes rendered icon content (upstream icon
// component); `type="password"` → `secure`; Button `onClick` → `clickAction`.
import { useState } from 'octane'
import {
	Button, CheckboxInput, createStaticSource, Divider, Grid, Heading,
	HStack, Icon, Layout, LayoutContent, LayoutHeader, LayoutPanel, List,
	ListItem, StackItem, Tab, TabList, Text, TextInput, Typeahead,
	useMediaQuery, VStack,
} from '@octane-xplat/ui'

const NAV_ITEMS = [
	'Profile',
	'Account',
	'Members',
	'Billing',
	'Invoices',
	'API',
]

const SETTINGS_ITEMS = [
	{ id: '1', label: 'Username' },
	{ id: '2', label: 'First name' },
	{ id: '3', label: 'Last name' },
	{ id: '4', label: 'Email address' },
	{ id: '5', label: 'Change password' },
	{ id: '6', label: 'Data Export Access' },
	{ id: '7', label: 'Allow Admin to Add Members' },
	{ id: '8', label: 'Two-Factor Authentication' },
]

const settingsSearchSource = createStaticSource(SETTINGS_ITEMS)

export function SettingsTemplate() @{
	const isNarrow = useMediaQuery('(max-width: 768px)')
	const [activeNav, setActiveNav] = useState('Profile')
	const [username, setUsername] = useState('nicol43')
	const [firstName, setFirstName] = useState('Stephanie')
	const [lastName, setLastName] = useState('Nicol')
	const [email, setEmail] = useState('stephanie_nicol@mail.com')
	const [currentPw, setCurrentPw] = useState('password123')
	const [newPw, setNewPw] = useState('password123')
	const [confirmPw, setConfirmPw] = useState('password123')
	const [dataExport, setDataExport] = useState<boolean | 'indeterminate'>(false)
	const [adminMembers, setAdminMembers] = useState<boolean | 'indeterminate'>(false)
	const [twoFactor, setTwoFactor] = useState<boolean | 'indeterminate'>(false)
	const [searchValue, setSearchValue] = useState<{ id: string; label: string } | null>(null)

	<Layout
		height="fill"
		contentWidth={1440}
		header={
			<LayoutHeader hasDivider>
				<HStack vAlign="center">
					<StackItem size="fill">
						<Heading level={1}>Settings</Heading>
					</StackItem>
					<Typeahead
						label="Search"
						isLabelHidden
						placeholder="Search settings..."
						searchSource={settingsSearchSource}
						value={searchValue}
						onChange={setSearchValue}
						hasEntriesOnFocus
						startIcon={<Icon name="sandbox-magnifying-glass" />}
					/>
				</HStack>
			</LayoutHeader>
		}
		start={
			isNarrow ? undefined : (
				<LayoutPanel hasDivider={false} width={260} padding={2}>
					<List density="balanced">
						{NAV_ITEMS.map((item) => (
							<ListItem
								key={item}
								label={item}
								isSelected={activeNav === item}
								onPress={() => setActiveNav(item)}
							/>
						))}
					</List>
				</LayoutPanel>
			)
		}
		content={
			<LayoutContent padding={4}>
				<VStack gap={4}>
					{/* Mobile: the sidebar nav collapses to a horizontal, centered
					    tab bar above the content. */}
					{isNarrow ? (
						<VStack hAlign="center">
							<TabList value={activeNav} onChange={setActiveNav}>
								{NAV_ITEMS.map((item) => (
									<Tab key={item} value={item} label={item} />
								))}
							</TabList>
						</VStack>
					) : null}
					<Grid style={{gap: 'var(--spacing-10)'}} columns={{ minWidth: 320 }} >
						<VStack gap={1}>
							<Heading level={3}>Basic information</Heading>
							<Text type="supporting" color="secondary">
								View and update your personal details and account information.
							</Text>
						</VStack>
						<VStack gap={4}>
							<TextInput label="Username" value={username} onChange={setUsername} />
							<TextInput label="First name" value={firstName} onChange={setFirstName} />
							<TextInput label="Last name" value={lastName} onChange={setLastName} />
							<TextInput label="Email address" value={email} onChange={setEmail} />
							<HStack>
								<Button label="Save" variant="primary" clickAction={() => {}} />
							</HStack>
						</VStack>
					</Grid>

					<Divider />

					<Grid style={{gap: 'var(--spacing-10)'}} columns={{ minWidth: 320 }} >
						<VStack gap={1}>
							<Heading level={3}>Change password</Heading>
							<Text type="supporting" color="secondary">
								Update your password to keep your account secure.
							</Text>
						</VStack>
						<VStack gap={4}>
							<TextInput label="Verify current password" secure value={currentPw} onChange={setCurrentPw} />
							<TextInput label="New password" secure value={newPw} onChange={setNewPw} />
							<TextInput label="Confirm password" secure value={confirmPw} onChange={setConfirmPw} />
							<HStack>
								<Button label="Save" variant="primary" clickAction={() => {}} />
							</HStack>
						</VStack>
					</Grid>

					<Divider />

					<Grid style={{gap: 'var(--spacing-10)'}} columns={{ minWidth: 320 }} >
						<VStack gap={1}>
							<Heading level={3}>Advanced settings</Heading>
							<Text type="supporting" color="secondary">
								Configure detailed account preferences and security options.
							</Text>
						</VStack>
						<VStack gap={5}>
							<CheckboxInput
								label="Data Export Access"
								description="Allow export of personal data and backups."
								value={dataExport}
								onChange={setDataExport}
							/>
							<CheckboxInput
								label="Allow Admin to Add Members"
								description="Admins can invite and manage members."
								value={adminMembers}
								onChange={setAdminMembers}
							/>
							<CheckboxInput
								label="Enable Two-Factor Authentication"
								description="Require 2FA for added account security."
								value={twoFactor}
								onChange={setTwoFactor}
							/>
							<HStack>
								<Button label="Save" variant="primary" clickAction={() => {}} />
							</HStack>
						</VStack>
					</Grid>
				</VStack>
			</LayoutContent>
		}
	/>
}
