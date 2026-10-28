// Port of upstream templates/pages/shell-side-nav/page.tsx (Astryx 0.6.4, MIT) —
// route /templates/shell-side-nav/.
// GAPS: `Icon icon={Cmp}` → registered `Icon name`; Stack has no
// onMouseEnter/onMouseLeave — the hover row wrapper is a plain div (the only
// hover-driven piece). MoreMenu `items` take {type:'action',key,label,onSelect}.
import { useState } from 'octane'
import {
	AppShell, Card, Divider, HStack, Icon, Layout, LayoutContent, LayoutFooter,
	MoreMenu, NavIcon, SideNav, SideNavHeading, SideNavItem, SideNavSection,
	StatusDot, VStack,
} from '@octane-xplat/ui'
import type { StatusDotVariant } from '@octane-xplat/ui'

type Conversation = {
	label: string
	status: StatusDotVariant
	statusLabel: string
}

type Workspace = {
	name: string
	icon: string
	chats: Conversation[]
}

const WORKSPACES: Workspace[] = [
	{
		name: 'Personal',
		icon: 'sandbox-user',
		chats: [
			{ label: 'Weekend trip planning', status: 'success', statusLabel: 'Active' },
			{ label: 'Recipe ideas for the week', status: 'neutral', statusLabel: 'Idle' },
			{ label: 'Book recommendations', status: 'warning', statusLabel: 'Needs review' },
			{ label: 'Home workout plan', status: 'neutral', statusLabel: 'Idle' },
		],
	},
	{
		name: 'Acme Corp',
		icon: 'sandbox-building-office-2',
		chats: [
			{ label: 'Q3 roadmap draft', status: 'accent', statusLabel: 'In progress' },
			{ label: 'Customer onboarding flow', status: 'success', statusLabel: 'Active' },
			{ label: 'Pricing strategy review', status: 'warning', statusLabel: 'Needs review' },
			{ label: 'Standup summary', status: 'neutral', statusLabel: 'Idle' },
		],
	},
	{
		name: 'Open Source',
		icon: 'sandbox-code',
		chats: [
			{ label: 'StyleX migration notes', status: 'accent', statusLabel: 'In progress' },
			{ label: 'Skeleton loading states', status: 'success', statusLabel: 'Active' },
			{ label: 'Accessibility audit', status: 'error', statusLabel: 'Blocked' },
			{ label: 'Release notes v4.0', status: 'neutral', statusLabel: 'Idle' },
		],
	},
]

const SELECTED_CHAT = 'StyleX migration notes'

const MESSAGES = [
	{ role: 'assistant', width: '78%', height: 104 },
	{ role: 'user', width: '48%', height: 48 },
	{ role: 'assistant', width: '64%', height: 132 },
	{ role: 'user', width: '38%', height: 40 },
]

function ConversationItem(props: {
	label: string
	status: StatusDotVariant
	statusLabel: string
	isSelected?: boolean
}) {
	const [isHovered, setIsHovered] = useState(false)
	const [isMenuOpen, setIsMenuOpen] = useState(false)
	const showMenu = isHovered || isMenuOpen

	return (
		<div onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
			<SideNavItem
				label={props.label}
				href="#"
				isSelected={props.isSelected}
				endContent={showMenu ? null : <StatusDot variant={props.status} label={props.statusLabel} />}
				actions={
					showMenu ? (
						<MoreMenu
							size="sm"
							label="Conversation options"
							onOpenChange={setIsMenuOpen}
							items={[
								{ type: 'action', key: 'pin', label: 'Pin', onSelect: () => {} },
								{ type: 'action', key: 'rename', label: 'Rename', onSelect: () => {} },
								{ type: 'action', key: 'archive', label: 'Archive', onSelect: () => {} },
								{ type: 'action', key: 'delete', label: 'Delete', onSelect: () => {} },
							]}
						/>
					) : null
				}
			/>
		</div>
	)
}

export function ShellSideNavTemplate() @{
	<AppShell
		contentPadding={0}
		style={{ height: '100%', minHeight: 0 }}
		sideNav={
			<SideNav
				collapsible
				resizable={{ defaultWidth: 300, minWidth: 220, maxWidth: 420 }}
				header={
					<SideNavHeading
						heading="AI Assistant"
						icon={<NavIcon icon={<Icon name="sandbox-sparkles" size={16} />} />}
						headingHref="#"
					/>
				}
				footer={
					<SideNavSection title="Account" isHeaderHidden>
						<SideNavItem label="Settings" icon={<Icon name="sandbox-cog" />} href="#" />
						<SideNavItem label="Sarah Chen" icon={<Icon name="sandbox-user-circle" />} href="#" />
					</SideNavSection>
				}
			>
				<SideNavSection title="Menu" isHeaderHidden>
					<SideNavItem label="New chat" icon={<Icon name="sandbox-plus" />} href="#" />
					<SideNavItem label="Search" icon={<Icon name="sandbox-magnifying-glass" />} href="#" />
					<SideNavItem label="Library" icon={<Icon name="sandbox-book-open" />} href="#" />
				</SideNavSection>
				<Divider />
				<SideNavSection title="Workspaces" isHeaderHidden>
					{WORKSPACES.map((workspace) => (
						<SideNavItem
							key={workspace.name}
							label={workspace.name}
							icon={<Icon name={workspace.icon} />}
							collapsible={{ defaultIsCollapsed: false }}
						>
							<VStack gap={0.5}>
								{workspace.chats.map((chat) => (
									<ConversationItem
										key={chat.label}
										label={chat.label}
										status={chat.status}
										statusLabel={chat.statusLabel}
										isSelected={chat.label === SELECTED_CHAT}
									/>
								))}
							</VStack>
						</SideNavItem>
					))}
				</SideNavSection>
			</SideNav>
		}
	>
		<Layout
			height="fill"
			contentWidth={768}
			content={
				<LayoutContent padding={6}>
					<VStack gap={5}>
						{MESSAGES.map((message, mi) => (
							<HStack
								key={mi}
								hAlign={message.role === 'assistant' ? 'start' : 'end'}
							>
								<Card
									variant="muted"
									padding={0}
									width={message.width}
									height={message.height}
								/>
							</HStack>
						))}
					</VStack>
				</LayoutContent>
			}
			footer={
				<LayoutFooter>
					<Card variant="muted" padding={0} width="100%" height={56} />
				</LayoutFooter>
			}
		/>
	</AppShell>
}
