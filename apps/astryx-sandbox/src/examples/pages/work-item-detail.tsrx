// Port of upstream templates/pages/work-item-detail/page.tsx (Astryx 0.6.4,
// MIT) — route /templates/work-item-detail/.
// GAPS: `SearchableSelector` (labels) → `MultiSelector`; details panel uses
// LayoutPanel/Dialog (same narrow→dialog contract); `ClickableCard` →
// plain Card + Link target noted upstream as navigational only.
import { useState } from 'octane'
import {
	Avatar, AvatarGroup, Badge, Breadcrumbs, Button, Card, CheckboxListItem,
	Dialog, DialogHeader, Divider, Heading, HStack, Icon, Layout,
	LayoutContent, LayoutHeader, LayoutPanel, Link, List, ListItem,
	MetadataList, MetadataListItem, MultiSelector, ProgressBar, Section,
	Selector, StackItem, StatusDot, Text, TextArea, Timestamp, Token,
	useMediaQuery, VStack, pixel } from '@octane-xplat/ui'

const STATUS_OPTIONS = [
	{ value: 'todo', label: 'To Do', icon: <StatusDot variant="neutral" label="To Do" /> },
	{ value: 'in_progress', label: 'In Progress', icon: <StatusDot variant="accent" label="In Progress" /> },
	{ value: 'in_review', label: 'In Review', icon: <StatusDot variant="warning" label="In Review" /> },
	{ value: 'done', label: 'Done', icon: <StatusDot variant="success" label="Done" /> },
]

const ASSIGNEE_OPTIONS = [
	{ value: 'priya-shah', label: 'Priya Shah', icon: <Avatar name="Priya Shah" size="xsm" /> },
	{ value: 'marcus-chen', label: 'Marcus Chen', icon: <Avatar name="Marcus Chen" size="xsm" /> },
	{ value: 'sofia-alvarez', label: 'Sofia Alvarez', icon: <Avatar name="Sofia Alvarez" size="xsm" /> },
]

const PRIORITY_BADGE: Record<string, { label: string; variant: 'red' | 'orange' | 'yellow' | 'neutral' }> = {
	high: { label: 'High', variant: 'red' },
	mid: { label: 'Mid', variant: 'orange' },
	low: { label: 'Low', variant: 'yellow' },
	none: { label: 'None', variant: 'neutral' },
}

const LABEL_OPTIONS = [
	{ value: 'onboarding', label: 'Onboarding', color: 'purple' as const },
	{ value: 'q1-goal', label: 'Q1 goal', color: 'blue' as const },
	{ value: 'growth', label: 'Growth', color: 'green' as const },
]

interface Subtask {
	id: number
	title: string
	isDone: boolean
	assignee: string
	due: string
}

const SUBTASKS: Subtask[] = [
	{ id: 1, title: 'Audit current onboarding flow and note friction points', isDone: true, assignee: 'Priya Shah', due: '2026-03-04' },
	{ id: 2, title: 'Interview five recent sign-ups about their first-run experience', isDone: true, assignee: 'Marcus Chen', due: '2026-03-06' },
	{ id: 3, title: 'Draft revised welcome sequence with three variants', isDone: false, assignee: 'Priya Shah', due: '2026-03-11' },
	{ id: 4, title: 'Review copy with content design and legal', isDone: false, assignee: 'Sofia Alvarez', due: '2026-03-13' },
	{ id: 5, title: 'Ship variant A to 10% of new accounts and measure activation', isDone: false, assignee: 'Marcus Chen', due: '2026-03-18' },
]

const ATTACHMENTS = [
	{ id: 'audit-notes', kind: 'link', title: 'Onboarding audit notes', subtitle: 'docs.example.com', href: '#' },
	{ id: 'funnel-dashboard', kind: 'link', title: 'Sign-up funnel dashboard', subtitle: 'analytics.example.com', href: '#' },
	{ id: 'welcome-screen', kind: 'image', title: 'welcome-screen-v3.png', subtitle: '1.4 MB · Added 2 days ago', href: '#' },
	{ id: 'transcripts', kind: 'file', title: 'Interview transcripts.pdf', subtitle: '820 KB · Added 3 days ago', href: '#' },
]

const ATTACHMENT_ICONS: Record<string, string> = {
	link: 'sandbox-link',
	image: 'sandbox-photo',
	file: 'sandbox-document',
}

const ACTIVITY = [
	{ id: 1, kind: 'event' as const, author: 'Sofia Alvarez', time: '2026-03-02T14:12:00Z', body: 'created this task' },
	{ id: 2, kind: 'comment' as const, author: 'Priya Shah', time: '2026-03-03T09:41:00Z', body: 'Finished the audit — three biggest friction points are the account form length, the empty first-run dashboard, and the tour tooltip cluster on step two. Full notes in the linked doc.' },
	{ id: 3, kind: 'event' as const, author: 'Marcus Chen', time: '2026-03-03T15:20:00Z', body: 'changed status from To Do to In Progress' },
	{ id: 4, kind: 'comment' as const, author: 'Marcus Chen', time: '2026-03-04T10:05:00Z', body: 'Interviews wrapped. A consistent theme: people expect a personalized starting workspace and get an empty one. Suggest we scope a template step into variant A.' },
	{ id: 5, kind: 'event' as const, author: 'Sofia Alvarez', time: '2026-03-04T16:48:00Z', body: 'assigned this task to Priya Shah' },
]

const LINKED_ITEMS = [
	{ id: 'PLT-188', title: 'First-run checklist experiment readout' },
	{ id: 'PLT-204', title: 'Onboarding metrics baseline dashboard' },
]

const WATCHERS = ['Priya Shah', 'Marcus Chen', 'Sofia Alvarez']

const SECTION_PADDING = 0

const optionFor = (options: { value: string; label: string; icon?: any }[], value: string) =>
	options.find((o) => o.value === value) ?? options[0]

function SectionHeader(props: { title: string; level?: 3 | 4; action?: any }) @{
	<HStack gap={3} vAlign="center">
		<StackItem size="fill">
			<Heading level={props.level ?? 4}>
				{props.title}
			</Heading>
		</StackItem>
		{props.action}
	</HStack>
}

function PersonRow(props: { name: string }) @{
	<HStack gap={2} vAlign="center">
		<Avatar name={props.name} size="xsm" />
		<Text type="body">{props.name}</Text>
	</HStack>
}

function PriorityBadge(props: { value: string }) @{
	const meta = PRIORITY_BADGE[props.value] ?? PRIORITY_BADGE.none
	<Badge variant={meta.variant} label={meta.label} />
}

export function WorkItemDetailTemplate() @{
	const [fields, setFields] = useState({
		status: 'in_progress',
		assignee: 'priya-shah',
		priority: 'high',
		labels: LABEL_OPTIONS.map((l) => l.value),
	})
	const [subtasks, setSubtasks] = useState(SUBTASKS)
	const [comment, setComment] = useState('')

	const isNarrow = useMediaQuery('(max-width: 1024px)')
	const [isRailOpen, setRailOpen] = useState(true)
	const [isDialogOpen, setDialogOpen] = useState(false)
	const isDetailsOpen = isNarrow ? isDialogOpen : isRailOpen
	const setDetailsOpen = isNarrow ? setDialogOpen : setRailOpen
	const toggleDetails = () => setDetailsOpen((open: boolean) => !open)

	const updateFields = (patch: Partial<typeof fields>) =>
		setFields((prev) => ({ ...prev, ...patch }))

	const setSubtaskDone = (id: number, isDone: boolean) =>
		setSubtasks((prev) => prev.map((task) => (task.id === id ? { ...task, isDone } : task)))

	const status = optionFor(STATUS_OPTIONS, fields.status)
	const assignee = optionFor(ASSIGNEE_OPTIONS, fields.assignee)
	const doneCount = subtasks.filter((t) => t.isDone).length

	const detailsPanel = (
		<VStack gap={10}>
			<VStack gap={4}>
				<SectionHeader title="Details" level={3} />
				<MetadataList>
					<MetadataListItem label="Status">
						<HStack gap={2} vAlign="center">
							{status.icon}
							<Text type="body">{status.label}</Text>
						</HStack>
					</MetadataListItem>
					<MetadataListItem label="Priority">
						<PriorityBadge value={fields.priority} />
					</MetadataListItem>
					<MetadataListItem label="Assignee">
						<PersonRow name={assignee.label} />
					</MetadataListItem>
					<MetadataListItem label="Reporter">
						<PersonRow name="Sofia Alvarez" />
					</MetadataListItem>
					<MetadataListItem label="Start date">
						<Timestamp value={Date.parse("2026-03-02")} valueUnit="unix-milliseconds" format="date" type="body" color="primary" />
					</MetadataListItem>
					<MetadataListItem label="Due date">
						<Timestamp value={Date.parse("2026-03-18")} valueUnit="unix-milliseconds" format="date" type="body" color="primary" />
					</MetadataListItem>
					<MetadataListItem label="Sprint">
						<Text type="body">Sprint 24 · Mar 2 – Mar 15</Text>
					</MetadataListItem>
					<MetadataListItem label="Parent">
						<Link href="#">PLT-192 · Activation initiative</Link>
					</MetadataListItem>
					<MetadataListItem label="Labels">
						<HStack gap={1} wrap="wrap">
							{LABEL_OPTIONS.filter((l) => fields.labels.includes(l.value)).map((label) => (
								<Token key={label.value} color={label.color} label={label.label} size="sm" />
							))}
						</HStack>
					</MetadataListItem>
					<MetadataListItem label="Team">
						<Text type="body">Platform · Growth pod</Text>
					</MetadataListItem>
				</MetadataList>
			</VStack>
			<VStack gap={4}>
				<SectionHeader title="Watchers" level={3} />
				<AvatarGroup size={24}>
					{WATCHERS.map((name, i) => (
						<Avatar key={i} name={name} />
					))}
				</AvatarGroup>
			</VStack>
			<VStack gap={4}>
				<SectionHeader title="Linked items" level={3} />
				<VStack gap={1}>
					{LINKED_ITEMS.map((item) => (
						<Card key={item.id} padding={3}>
							<VStack gap={0}>
								<Text type="supporting" color="secondary">{item.id}</Text>
								<Text type="body" weight="semibold">{item.title}</Text>
							</VStack>
						</Card>
					))}
				</VStack>
			</VStack>
		</VStack>
	)

	<>
		<Layout
			height="fill"
			contentWidth={1260}
			header={
				<LayoutHeader padding={6} hasDivider>
					<VStack gap={3}>
						<Breadcrumbs
							items={[
								{ label: 'Platform', href: '#' },
								{ label: 'Growth pod', href: '#' },
								{ label: 'Sprint 24', href: '#' },
								{ label: 'PLT-217' },
							]}
						/>
						<HStack gap={4} vAlign="start" wrap="wrap">
							<StackItem size="fill">
								<HStack gap={2} vAlign="start">
									<StackItem size="fill">
										<Heading level={1} maxLines={2}>
											Personalize the first-run onboarding flow
										</Heading>
									</StackItem>
									<Button
										label={isDetailsOpen ? 'Hide details' : 'Show details'}
										variant="ghost" size="sm" isIconOnly
										icon={<Icon name="sandbox-information-circle" size={16} />}
										clickAction={toggleDetails}
									/>
								</HStack>
							</StackItem>
							<HStack gap={2} wrap="wrap">
								<Selector
									label="Status" isLabelHidden
									options={STATUS_OPTIONS}
									value={fields.status}
									onValueChange={(v) => updateFields({ status: v ?? 'todo' })}
								/>
								<Selector
									label="Priority" isLabelHidden
									options={[
										{ value: 'high', label: 'High' },
										{ value: 'mid', label: 'Mid' },
										{ value: 'low', label: 'Low' },
										{ value: 'none', label: 'None' },
									]}
									value={fields.priority}
									onValueChange={(v) => updateFields({ priority: v ?? 'todo' })}
								/>
								<Selector
									label="Assignee" isLabelHidden
									options={ASSIGNEE_OPTIONS}
									value={fields.assignee}
									onValueChange={(v) => updateFields({ assignee: v ?? 'todo' })}
								/>
								<MultiSelector
									label="Labels" isLabelHidden
									options={LABEL_OPTIONS}
									value={fields.labels}
									onValueChange={(v) => updateFields({ labels: v ?? 'todo' })}
									triggerDisplay="badges"
								/>
							</HStack>
						</HStack>
					</VStack>
				</LayoutHeader>
			}
			content={
				<LayoutContent padding={6} role="main">
					<VStack gap={6}>
						{/* Description */}
						<Section padding={SECTION_PADDING}>
							<VStack gap={4}>
								<SectionHeader title="Description" />
								<Text type="body">
									Redesign the first-run onboarding sequence so new workspaces
									see a personalized starting state instead of an empty
									dashboard. The experiment targets activation: a workspace is
									activated when a member completes three setup actions in the
									first seven days.
								</Text>
								<VStack gap={2}>
									<Heading level={4}>
										Success criteria
									</Heading>
									<List listStyle="disc" density="compact">
										<ListItem label="Day-seven activation rises from 42 to 55 percent for new workspaces in the variant." />
										<ListItem label="Median time to first completed action drops below eight minutes." />
										<ListItem label="No regression in day-thirty retention." />
									</List>
								</VStack>
							</VStack>
						</Section>
						<Divider />

						{/* Subtasks */}
						<Section padding={SECTION_PADDING}>
							<VStack gap={4}>
								<SectionHeader title="Subtasks" action={<Button label="Add subtask" clickAction={() => {}} />} />
								<HStack gap={3} vAlign="center">
									<Text type="supporting" color="secondary">
										{doneCount} of {subtasks.length} complete
									</Text>
									<StackItem size="fill">
										<ProgressBar
											label="Subtask progress" isLabelHidden
											value={subtasks.length ? (doneCount / subtasks.length) * 100 : 0}
											variant="success"
										/>
									</StackItem>
								</HStack>
								<List>
									{subtasks.map((task) => (
										<CheckboxListItem
											key={task.id}
											label={task.title}
											isChecked={task.isDone}
											onCheck={(isDone) => setSubtaskDone(task.id, isDone)}
											endContent={
												<HStack gap={2} vAlign="center">
													<Timestamp value={Date.parse(task.due)} valueUnit="unix-milliseconds" format="date" type="supporting" color="secondary" />
													<Avatar name={task.assignee} size="sm" />
												</HStack>
											}
										/>
									))}
								</List>
							</VStack>
						</Section>
						<Divider />

						{/* Attachments */}
						<Section padding={SECTION_PADDING}>
							<VStack gap={4}>
								<SectionHeader title="Attachments" action={<Button label="Add attachment" clickAction={() => {}} />} />
								<VStack gap={1}>
									{ATTACHMENTS.map((attachment) => (
										<Card key={attachment.id} padding={3}>
											<HStack gap={4} vAlign="center">
												<div style={{
													width: 44, height: 44, borderRadius: 'var(--radius-element)',
													backgroundColor: 'var(--color-background-muted)',
													display: 'flex', alignItems: 'center', justifyContent: 'center',
												}}>
													<Icon name={ATTACHMENT_ICONS[attachment.kind]} size={20} color="secondary" />
												</div>
												<StackItem size="fill">
													<VStack gap={0}>
														<Link href={attachment.href}>
															<Text type="body" weight="semibold">{attachment.title}</Text>
														</Link>
														<Text type="supporting" color="secondary">{attachment.subtitle}</Text>
													</VStack>
												</StackItem>
											</HStack>
										</Card>
									))}
								</VStack>
							</VStack>
						</Section>
						<Divider />

						{/* Activity */}
						<Section padding={SECTION_PADDING}>
							<VStack gap={10}>
								<SectionHeader
									title="Comments and activity"
									action={<Button label="Add comment" clickAction={() => {}} />}
								/>
								<VStack gap={6}>
									{ACTIVITY.map((entry) => {
										const isComment = entry.kind === 'comment'
										return (
											<HStack key={entry.id} gap={3} vAlign="start">
												<Avatar name={entry.author} size="sm" />
												<StackItem size="fill">
													<VStack gap={1}>
														<HStack gap={2} vAlign="center">
															<Text type="body" weight="semibold">{entry.author}</Text>
															{!isComment ? (
																<Text type="supporting" color="secondary">{entry.body}</Text>
															) : null}
															<StackItem size="fill" />
															<Timestamp value={Date.parse(entry.time)} valueUnit="unix-milliseconds" format="relative" type="supporting" color="secondary" />
														</HStack>
														{isComment ? (
															<>
																<Card variant="muted" padding={3}>
																	<Text type="body">{entry.body}</Text>
																</Card>
																<Link href="#" color="secondary">Reply</Link>
															</>
														) : null}
													</VStack>
												</StackItem>
											</HStack>
										)
									})}
								</VStack>
								<VStack gap={2} hAlign="stretch">
									<TextArea
										width="100%"
										label="Add a comment" isLabelHidden
										placeholder="Write a comment…"
										value={comment} onChange={(v) => setComment(v ?? '')} rows={5}
									/>
									<HStack gap={2} hAlign="end">
										<Button label="Cancel" variant="ghost" clickAction={() => setComment('')} />
										<Button
											label="Comment" variant="primary"
											isDisabled={comment.trim().length === 0}
											clickAction={() => setComment('')}
										/>
									</HStack>
								</VStack>
							</VStack>
						</Section>
					</VStack>
				</LayoutContent>
			}
			end={
				!isNarrow && isDetailsOpen ? (
					<LayoutPanel width={340} padding={6} role="complementary" hasDivider>
						{detailsPanel}
					</LayoutPanel>
				) : undefined
			}
		/>
		{isNarrow ? (
			<Dialog
				variant="fullscreen"
				isOpen={isDetailsOpen}
				onOpenChange={setDialogOpen}
			>
				<Layout
					header={
						<LayoutHeader hasDivider>
							<DialogHeader title="Details" onOpenChange={setDialogOpen} />
						</LayoutHeader>
					}
					content={<LayoutContent padding={6}>{detailsPanel}</LayoutContent>}
				/>
			</Dialog>
		) : null}
	</>
}
