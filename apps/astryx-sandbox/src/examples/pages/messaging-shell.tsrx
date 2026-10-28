// Port of upstream templates/pages/messaging-shell/page.tsx (Astryx 0.6.4,
// MIT) — route /templates/messaging-shell/.
// GAPS: IconButton `onClick` → `clickAction`; TextInput `startIcon` takes
// rendered icon content; ToothIcon → sandbox-cog.
import { useState } from 'octane'
import {
	Avatar, AvatarStatusDot, Badge, Divider, EmptyState, Heading, HStack,
	Icon, IconButton, Layout, LayoutContent, LayoutPanel, List, ListItem,
	Stack, StackItem, StatusDot, Text, TextInput, Timestamp, useMediaQuery,
	VStack,
} from '@octane-xplat/ui'
import {
	ChatComposer, ChatLayout, ChatMessage, ChatMessageBubble,
	ChatMessageList, ChatMessageMetadata, ChatSystemMessage,
} from '@octane-xplat/ui/chat'

const styles: Record<string, any> = {
	root: { height: '100dvh', width: '100%' },
	rail: {
		height: '100%',
		alignItems: 'center',
		paddingTop: 'var(--spacing-3)',
		paddingBottom: 'var(--spacing-3)',
	},
	railSpacer: { flex: 1 },
	sidebar: { height: '100%', minHeight: 0 },
	sidebarHeader: {
		alignItems: 'center',
		paddingInline: 'var(--spacing-3)',
		paddingBlock: 'var(--spacing-3)',
	},
	sidebarSearch: {
		paddingInline: 'var(--spacing-3)',
		paddingBottom: 'var(--spacing-2)',
	},
	sidebarScroll: {
		minHeight: 0,
		overflowY: 'auto',
		paddingInline: 'var(--spacing-2)',
		paddingBottom: 'var(--spacing-3)',
	},
	sectionGap: { marginTop: 'var(--spacing-4)' },
	streamColumn: { height: '100%', minHeight: 0 },
	streamHeader: {
		alignItems: 'center',
		paddingInline: 'var(--spacing-4)',
		paddingBlock: 'var(--spacing-3)',
	},
	streamTopic: { minWidth: 0 },
	chatArea: { minHeight: 0, display: 'flex', flexDirection: 'column' },
	chatFill: { flex: 1, minHeight: 0 },
	threadColumn: { height: '100%', minHeight: 0 },
	threadHeader: {
		alignItems: 'center',
		paddingInline: 'var(--spacing-3)',
		paddingBlock: 'var(--spacing-2)',
	},
	threadScroll: {
		minHeight: 0,
		overflowY: 'auto',
		paddingInline: 'var(--spacing-3)',
		paddingBlock: 'var(--spacing-3)',
	},
	threadComposer: { padding: 'var(--spacing-3)' },
}

type Presence = 'online' | 'busy' | 'offline'

const USERS: Record<string, { name: string }> = {
	mira: { name: 'Mira Chen' },
	devon: { name: 'Devon Park' },
	sasha: { name: 'Sasha Ortiz' },
	you: { name: 'Riley Quinn' },
}

const CHANNELS = [
	{ id: 'design-systems', name: 'design-systems', topic: 'Component APIs, tokens, and release coordination', unread: 0 },
	{ id: 'frontend-guild', name: 'frontend-guild', topic: 'Cross-team frontend practices', unread: 4 },
	{ id: 'releases', name: 'releases', topic: 'Release announcements and rollbacks', unread: 12 },
	{ id: 'random', name: 'random', topic: 'Everything else', unread: 0 },
]

const DIRECT_MESSAGES: { id: string; userId: string; presence: Presence; unread: number }[] = [
	{ id: 'dm-mira', userId: 'mira', presence: 'online', unread: 0 },
	{ id: 'dm-devon', userId: 'devon', presence: 'busy', unread: 2 },
	{ id: 'dm-sasha', userId: 'sasha', presence: 'offline', unread: 0 },
]

// AvatarStatusDot supports success | neutral | error (no warning).
const PRESENCE_VARIANT: Record<Presence, 'success' | 'error' | 'neutral'> = {
	online: 'success',
	busy: 'error',
	offline: 'neutral',
}

const PRESENCE_LABEL: Record<Presence, string> = {
	online: 'Online',
	busy: 'Busy',
	offline: 'Offline',
}

interface StreamMessage {
	id: string
	userId: string
	time: number
	bubbles: string[]
}

const MESSAGES_BY_CHANNEL: Record<string, StreamMessage[]> = {
	'design-systems': [
		{
			id: 'm1', userId: 'mira', time: Date.parse('2026-06-30T09:12:00+00:00'),
			bubbles: [
				'Morning! The Timestamp component now supports a `system_date` format — worth switching the audit log over.',
				'I put the migration notes in the wiki under Decisions.',
			],
		},
		{
			id: 'm2', userId: 'devon', time: Date.parse('2026-06-30T09:15:00+00:00'),
			bubbles: ['Nice. Does that unblock the incident console timeline work?'],
		},
		{
			id: 'm3', userId: 'you', time: Date.parse('2026-06-30T09:17:00+00:00'),
			bubbles: [
				'It does — I will pick that up after the template review.',
				'One question on the List density defaults, will start a thread.',
			],
		},
		{
			id: 'm4', userId: 'sasha', time: Date.parse('2026-06-30T09:24:00+00:00'),
			bubbles: ['Heads up: the token sync job ran clean overnight, no drift between core and the theme packages.'],
		},
		{
			id: 'm5', userId: 'mira', time: Date.parse('2026-06-30T09:26:00+00:00'),
			bubbles: ['Great — closing out the drift task then.'],
		},
	],
	'frontend-guild': [
		{
			id: 'g1', userId: 'devon', time: Date.parse('2026-06-30T08:40:00+00:00'),
			bubbles: ['Guild sync moved to Thursday this week to avoid the release freeze.'],
		},
		{
			id: 'g2', userId: 'you', time: Date.parse('2026-06-30T08:44:00+00:00'),
			bubbles: ['Works for me — agenda doc is updated.'],
		},
	],
}

interface ThreadReply {
	id: string
	userId: string
	time: number
	text: string
}

const THREAD_ROOT: ThreadReply = {
	id: 't0', userId: 'you', time: Date.parse('2026-06-30T09:17:30+00:00'),
	text: 'One question on the List density defaults — should channel sidebars use compact or balanced? The spec shows both.',
}

const THREAD_REPLIES: ThreadReply[] = [
	{
		id: 't1', userId: 'mira', time: Date.parse('2026-06-30T09:19:00+00:00'),
		text: 'Compact for navigation surfaces. Balanced is for content lists where descriptions carry weight.',
	},
	{
		id: 't2', userId: 'devon', time: Date.parse('2026-06-30T09:21:00+00:00'),
		text: 'Agreed — the sidebar rows here are a good reference implementation.',
	},
]

const RAIL_ITEMS = [
	{ id: 'home', label: 'Home', icon: 'sandbox-home' },
	{ id: 'dms', label: 'Direct messages', icon: 'sandbox-chat-bubble-left-right' },
	{ id: 'activity', label: 'Activity', icon: 'sandbox-bell' },
	{ id: 'saved', label: 'Saved items', icon: 'sandbox-bookmark' },
]

function StreamMessageGroup(props: { message: StreamMessage }) @{
	const isSelf = props.message.userId === 'you'
	const user = USERS[props.message.userId]
	const lastIndex = props.message.bubbles.length - 1

	<ChatMessage
		sender={isSelf ? 'user' : 'assistant'}
		avatar={isSelf ? undefined : <Avatar name={user.name} size="md" />}
	>
		{props.message.bubbles.map((text, index) => (
			<ChatMessageBubble
				key={`${props.message.id}-${index}`}
				group={
					props.message.bubbles.length === 1
						? undefined
						: index === 0
							? 'first'
							: index === lastIndex
								? 'last'
								: 'middle'
				}
				name={!isSelf && index === 0 ? user.name : undefined}
				metadata={
					index === lastIndex ? (
						<ChatMessageMetadata
							timestamp={<Timestamp value={props.message.time} format="time" valueUnit="unix-milliseconds" />}
						/>
					) : undefined
				}
			>
				{text}
			</ChatMessageBubble>
		))}
	</ChatMessage>
}

export function MessagingShellTemplate() @{
	const [selectedChannelId, setSelectedChannelId] = useState('design-systems')
	const [selectedDmId, setSelectedDmId] = useState<string | null>(null)
	const [isThreadOpen, setIsThreadOpen] = useState(true)
	const [searchQuery, setSearchQuery] = useState('')

	// Responsive contract: >1024px four columns; <=1024 thread hidden;
	// <=768 sidebar also hidden.
	const isThreadHidden = useMediaQuery('(max-width: 1024px)')
	const isSidebarHidden = useMediaQuery('(max-width: 768px)')

	const selectedChannel = CHANNELS.find((c) => c.id === selectedChannelId) ?? CHANNELS[0]
	const messages = MESSAGES_BY_CHANNEL[selectedChannel.id] ?? []

	const normalizedQuery = searchQuery.trim().toLowerCase()
	const visibleChannels = CHANNELS.filter((c) => c.name.toLowerCase().includes(normalizedQuery))
	const visibleDms = DIRECT_MESSAGES.filter((dm) => USERS[dm.userId].name.toLowerCase().includes(normalizedQuery))

	const showThreadPanel = isThreadOpen && !isThreadHidden

	const workspaceRail = (
		<VStack gap={2} style={styles.rail}>
			<Avatar name="Astryx HQ" size="md" />
			{RAIL_ITEMS.map((item) => (
				<IconButton
					key={item.id}
					label={item.label}
					tooltip={item.label}
					icon={<Icon name={item.icon} size={16} color="inherit" />}
					variant={item.id === 'home' ? 'secondary' : 'ghost'}
					clickAction={() => {}}
				/>
			))}
			<div style={styles.railSpacer} />
			<IconButton
				label="Settings"
				tooltip="Settings"
				icon={<Icon name="sandbox-cog" size={16} color="inherit" />}
				variant="ghost"
				clickAction={() => {}}
			/>
			<Avatar
				name={USERS.you.name}
				size="md"
				status={<AvatarStatusDot variant="success" label="Online" />}
			/>
		</VStack>
	)

	const channelSidebar = (
		<Stack direction="vertical" style={styles.sidebar}>
			<HStack gap={2} style={styles.sidebarHeader}>
				<StackItem size="fill">
					<Heading level={5}>Astryx HQ</Heading>
				</StackItem>
				<IconButton
					label="New message"
					tooltip="New message"
					icon={<Icon name="sandbox-pencil-square" size={16} color="inherit" />}
					variant="ghost"
					size="sm"
					clickAction={() => {}}
				/>
			</HStack>
			<div style={styles.sidebarSearch}>
				<TextInput
					label="Jump to"
					isLabelHidden
					size="sm"
					placeholder="Jump to..."
					startIcon={<Icon name="sandbox-magnifying-glass" />}
					value={searchQuery}
					onChange={setSearchQuery}
				/>
			</div>
			<StackItem size="fill" style={styles.sidebarScroll}>
				<List
					density="compact"
					hasDividers={false}
					header={
						<Text type="label" size="sm" color="secondary">
							Channels
						</Text>
					}
				>
					{visibleChannels.map((channel) => (
						<ListItem
							key={channel.id}
							label={channel.name}
							isSelected={selectedDmId === null && channel.id === selectedChannelId}
							onPress={() => {
								setSelectedChannelId(channel.id)
								setSelectedDmId(null)
							}}
							startContent={
								<Icon name="sandbox-hashtag" size={16} color="secondary" />
							}
							endContent={
								channel.unread > 0 ? (
									<Badge label={String(channel.unread)} variant="neutral" />
								) : undefined
							}
						/>
					))}
				</List>
				<div style={styles.sectionGap}>
					<List
						density="compact"
						hasDividers={false}
						header={
							<Text type="label" size="sm" color="secondary">
								Direct messages
							</Text>
						}
					>
						{visibleDms.map((dm) => (
							<ListItem
								key={dm.id}
								label={USERS[dm.userId].name}
								isSelected={selectedDmId === dm.id}
								onPress={() => setSelectedDmId(dm.id)}
								startContent={
									<Avatar
										name={USERS[dm.userId].name}
										size="sm"
										status={
											<AvatarStatusDot
												variant={PRESENCE_VARIANT[dm.presence]}
												label={PRESENCE_LABEL[dm.presence]}
											/>
										}
									/>
								}
								endContent={
									dm.unread > 0 ? (
										<Badge label={String(dm.unread)} variant="neutral" />
									) : undefined
								}
							/>
						))}
					</List>
				</div>
			</StackItem>
		</Stack>
	)

	const messageStream = (
		<Stack direction="vertical" style={styles.streamColumn}>
			<HStack gap={3} style={styles.streamHeader}>
				<Icon name="sandbox-hashtag" size={16} color="secondary" />
				<Heading level={5}>{selectedChannel.name}</Heading>
				<StackItem size="fill" style={styles.streamTopic}>
					<Text type="supporting" color="secondary" maxLines={1}>
						{selectedChannel.topic}
					</Text>
				</StackItem>
				<StatusDot variant="success" label="12 online" />
				<IconButton
					label="Members"
					tooltip="Members"
					icon={<Icon name="sandbox-user-group" size={16} color="inherit" />}
					variant="ghost"
					size="sm"
					clickAction={() => {}}
				/>
			</HStack>
			<Divider />
			<StackItem size="fill" style={styles.chatArea}>
				<div style={styles.chatFill}>
					<ChatLayout
						composer={
							<ChatComposer
								placeholder={`Message #${selectedChannel.name}`}
								onSubmit={() => {}}
							/>
						}
						emptyState={
							<EmptyState
								icon={<Icon name="sandbox-inbox" size={24} />}
								title="No messages yet"
								description="Start the conversation — messages posted here are visible to the whole channel."
							/>
						}
					>
						{messages.length > 0 ? (
							<ChatMessageList density="balanced">
								<ChatSystemMessage variant="divider">
									Tuesday, June 30
								</ChatSystemMessage>
								<ChatSystemMessage>
									Sasha Ortiz joined #{selectedChannel.name}
								</ChatSystemMessage>
								{messages.map((message) => (
									<StreamMessageGroup key={message.id} message={message} />
								))}
							</ChatMessageList>
						) : null}
					</ChatLayout>
				</div>
			</StackItem>
		</Stack>
	)

	const threadPanel = (
		<Stack direction="vertical" style={styles.threadColumn}>
			<HStack gap={2} style={styles.threadHeader}>
				<StackItem size="fill">
					<HStack gap={2} style={{ alignItems: 'baseline' }}>
						<Text weight="semibold">Thread</Text>
						<Text type="supporting" color="secondary">
							#{selectedChannel.name}
						</Text>
					</HStack>
				</StackItem>
				<IconButton
					label="Close thread"
					tooltip="Close thread"
					icon={<Icon name="sandbox-x-mark" size={16} color="inherit" />}
					variant="ghost"
					size="sm"
					clickAction={() => setIsThreadOpen(false)}
				/>
			</HStack>
			<Divider />
			<StackItem size="fill" style={styles.threadScroll}>
				<ChatMessageList density="compact">
					<ChatMessage
						sender="assistant"
						avatar={<Avatar name={USERS[THREAD_ROOT.userId].name} size="md" />}
					>
						<ChatMessageBubble
							name={USERS[THREAD_ROOT.userId].name}
							metadata={
								<ChatMessageMetadata
									timestamp={<Timestamp value={THREAD_ROOT.time} format="time" valueUnit="unix-milliseconds" />}
								/>
							}
						>
							{THREAD_ROOT.text}
						</ChatMessageBubble>
					</ChatMessage>
					<ChatSystemMessage variant="divider">
						{THREAD_REPLIES.length} replies
					</ChatSystemMessage>
					{THREAD_REPLIES.map((reply) => (
						<ChatMessage
							key={reply.id}
							sender="assistant"
							avatar={<Avatar name={USERS[reply.userId].name} size="md" />}
						>
							<ChatMessageBubble
								name={USERS[reply.userId].name}
								metadata={
									<ChatMessageMetadata
										timestamp={<Timestamp value={reply.time} format="time" valueUnit="unix-milliseconds" />}
									/>
								}
							>
								{reply.text}
							</ChatMessageBubble>
						</ChatMessage>
					))}
				</ChatMessageList>
			</StackItem>
			<div style={styles.threadComposer}>
				<ChatComposer
					density="compact"
					placeholder="Reply in thread..."
					onSubmit={() => {}}
				/>
			</div>
		</Stack>
	)

	<div style={styles.root}>
		<Layout
			height="fill"
			start={
				<>
					<LayoutPanel width={68} padding={0}>
						{workspaceRail}
					</LayoutPanel>
					{!isSidebarHidden ? (
						<LayoutPanel width={260} padding={0}>
							{channelSidebar}
						</LayoutPanel>
					) : null}
				</>
			}
			end={
				showThreadPanel ? (
					<LayoutPanel width={340} padding={0}>
						{threadPanel}
					</LayoutPanel>
				) : undefined
			}
			content={<LayoutContent padding={0}>{messageStream}</LayoutContent>}
		/>
	</div>
}
