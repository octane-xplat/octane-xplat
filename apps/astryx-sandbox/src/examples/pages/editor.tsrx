// Port of upstream templates/pages/editor/page.tsx (Astryx 0.6.4, MIT) —
// route /templates/editor/.
// GAPS: block add/move/delete/select preserved; mobile dock → Dialog keeps
// the upstream contract (panel can't dock on a narrow canvas).
import { useCallback, useState } from 'octane'
import {
	Button, Card, Dialog, DialogHeader, Divider, EmptyState, Heading,
	HStack, Icon, Layout, LayoutContent, LayoutHeader, LayoutPanel, List,
	ListItem, SegmentedControl, SegmentedControlItem, Selector, Spinner,
	StackItem, Tab, TabList, Text, TextInput, useMediaQuery, VStack,
} from '@octane-xplat/ui'

type BlockType = 'hero' | 'text' | 'image' | 'button' | 'cards' | 'features' | 'cta'

interface Block {
	id: string
	type: BlockType
	label: string
	props: Record<string, unknown>
}

type ViewportSize = 'desktop' | 'tablet' | 'phone'
type SidebarTab = 'blocks' | 'properties'

const BLOCK_META: Record<BlockType, { label: string; icon: string }> = {
	hero: { label: 'Hero', icon: 'sandbox-squares-2x2' },
	text: { label: 'Text', icon: 'sandbox-document-text' },
	image: { label: 'Image', icon: 'sandbox-photo' },
	button: { label: 'Button', icon: 'sandbox-cursor-arrow-rays' },
	cards: { label: 'Cards', icon: 'sandbox-view-columns' },
	features: { label: 'Features', icon: 'sandbox-sparkles' },
	cta: { label: 'CTA', icon: 'sandbox-megaphone' },
}

type Transaction = {
	id: string
	name: string
	category: string
	date: string
	amount: string
	isPositive?: boolean
}

const DEFAULT_BLOCKS: Block[] = [
	{
		id: '2', type: 'features', label: 'Recent Transactions',
		props: {
			heading: 'Recent Transactions',
			description: 'Your latest account activity.',
			items: [
				{ id: 't1', name: 'Blue Bottle Coffee', category: 'Food & Drink', date: 'Today, 10:24 AM', amount: '-$6.50' },
				{ id: 't2', name: 'Whole Foods Market', category: 'Groceries', date: 'Yesterday', amount: '-$142.30' },
				{ id: 't3', name: 'Stripe Payout', category: 'Income', date: 'Oct 12', amount: '+$4,200.00', isPositive: true },
				{ id: 't4', name: 'Uber Technologies', category: 'Transport', date: 'Oct 11', amount: '-$24.10' },
				{ id: 't5', name: 'Netflix Subscription', category: 'Entertainment', date: 'Oct 10', amount: '-$19.99' },
			],
		},
	},
	{
		id: '3', type: 'text', label: 'Syncing State',
		props: {
			heading: 'Syncing your accounts',
			description: "We're pulling in your latest transactions.\nThis usually takes a few seconds.",
			buttonLabel: 'Cancel',
		},
	},
	{
		id: '4', type: 'cta', label: 'Trust Notice',
		props: {
			heading: 'Adding devices from people you trust',
			description: "When you approve a request, you grant someone full access to your account. They'll be able to change reservations and send messages on your behalf.",
		},
	},
]

function defaultProps(type: BlockType): Record<string, unknown> {
	switch (type) {
		case 'hero':
			return { heading: 'New Hero', subheading: 'Subtitle goes here', buttonLabel: 'Click Me', alignment: 'center' }
		case 'text':
			return { content: 'Enter your text here.' }
		case 'image':
			return {}
		case 'button':
			return { label: 'Button', variant: 'primary', size: 'md' }
		case 'cards':
			return {
				cards: [
					{ title: 'Pricing', description: 'Flexible plans for every team size.' },
					{ title: 'Support', description: 'Get help whenever you need it.' },
				],
			}
		case 'features':
			return {
				heading: 'Activity', description: '',
				items: [{ id: 't1', name: 'New Item', category: 'General', date: 'Today', amount: '$0.00' }],
			}
		case 'cta':
			return { heading: 'New CTA', description: 'Supporting copy goes here.', buttonLabel: 'Learn more' }
	}
}

let nextId = 100
const uid = () => `b${nextId++}`

const clickable = { cursor: 'pointer' } as const
const selectedCard = {
	outline: '2px solid var(--color-accent-primary, #0171E3)',
	outlineOffset: -1,
} as const

const VIEWPORT_MAX: Record<ViewportSize, number> = { desktop: 960, tablet: 640, phone: 375 }

const canvasStyle = (maxWidth: number) => ({
	maxWidth,
	marginInline: 'auto',
	width: '100%',
})

function BlockProperties(props: { block: Block; onUpdate: (key: string, value: unknown) => void }) {
	const { type, props: p } = props.block
	const set = (key: string) => (v: string) => props.onUpdate(key, v)

	switch (type) {
		case 'hero':
   return <VStack gap={3}>
				<TextInput label="Heading" value={(p.heading as string) ?? ''} onChange={set('heading')} />
				<TextInput label="Subheading" value={(p.subheading as string) ?? ''} onChange={set('subheading')} />
				<TextInput label="Button label" value={(p.buttonLabel as string) ?? ''} onChange={set('buttonLabel')} />
				<Selector
					label="Alignment"
					options={[
						{ value: 'left', label: 'Left' },
						{ value: 'center', label: 'Center' },
						{ value: 'right', label: 'Right' },
					]}
					value={(p.alignment as string) ?? 'center'}
					onValueChange={(v) => props.onUpdate('alignment', v)}
				/>
			</VStack>
		case 'text':
   return <VStack gap={3}>
				<TextInput label="Heading" value={(p.heading as string) ?? ''} onChange={set('heading')} />
				<TextInput label="Description" value={(p.description as string) ?? ''} onChange={set('description')} />
				<TextInput label="Button label" value={(p.buttonLabel as string) ?? ''} onChange={set('buttonLabel')} />
				<TextInput label="Body text" value={(p.content as string) ?? ''} onChange={set('content')} />
			</VStack>
		case 'button':
   return <VStack gap={3}>
				<TextInput label="Label" value={(p.label as string) ?? ''} onChange={set('label')} />
				<Selector
					label="Variant"
					options={[
						{ value: 'primary', label: 'Primary' },
						{ value: 'secondary', label: 'Secondary' },
						{ value: 'ghost', label: 'Ghost' },
					]}
					value={(p.variant as string) ?? 'primary'}
					onValueChange={(v) => props.onUpdate('variant', v)}
				/>
				<Selector
					label="Size"
					options={[
						{ value: 'sm', label: 'Small' },
						{ value: 'md', label: 'Medium' },
						{ value: 'lg', label: 'Large' },
					]}
					value={(p.size as string) ?? 'md'}
					onValueChange={(v) => props.onUpdate('size', v)}
				/>
			</VStack>
		case 'features':
		case 'cta':
   return <VStack gap={3}>
				<TextInput label="Heading" value={(p.heading as string) ?? ''} onChange={set('heading')} />
				<TextInput label="Description" value={(p.description as string) ?? ''} onChange={set('description')} />
				<TextInput label="Button label" value={(p.buttonLabel as string) ?? ''} onChange={set('buttonLabel')} />
			</VStack>
		default:
   return <EmptyState title="No configurable properties" isCompact />
	}
}

function BlockPreview(props: { block: Block; isSelected: boolean; onSelect: () => void }) {
	const { type, props: p } = props.block
	const cardStyle = { ...clickable, ...(props.isSelected ? selectedCard : {}) }

	switch (type) {
		case 'hero':
   return <Card padding={6} style={cardStyle}>
				<div onClick={props.onSelect} style={clickable}>
					<VStack gap={4} hAlign={((p.alignment as 'left' | 'center' | 'right') ?? 'center') === 'left' ? 'start' : ((p.alignment as 'left' | 'center' | 'right') ?? 'center') === 'right' ? 'end' : 'center'}>
						<Heading level={2}>{(p.heading as string) || 'Hero Heading'}</Heading>
						<Text type="supporting" color="secondary">
							{(p.subheading as string) || 'Subtitle text goes here'}
						</Text>
						{p.buttonLabel ? <Button label={p.buttonLabel as string} clickAction={() => {}} /> : null}
					</VStack>
				</div>
			</Card>
		case 'text':
			if (p.heading) {
				return (
				<Card padding={6} style={cardStyle}>
					<div onClick={props.onSelect} style={clickable}>
						<EmptyState
							title={p.heading as string}
							description={p.description as string}
							icon={<Spinner />}
							actions={p.buttonLabel ? <Button label={p.buttonLabel as string} variant="secondary" clickAction={() => {}} /> : undefined}
						/>
					</div>
				</Card>
				)
			}
			return <Card style={cardStyle}>
				<div onClick={props.onSelect} style={{ ...clickable, padding: 'var(--spacing-4)' }}>
					<Text type="body">{(p.content as string) || 'Text content'}</Text>
				</div>
			</Card>
		case 'image':
   return <Card padding={0} style={cardStyle}>
				<div onClick={props.onSelect} style={{ ...clickable, height: 180, backgroundColor: 'var(--color-background-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
					<Icon name="sandbox-photo" size={32} color="secondary" />
				</div>
			</Card>
		case 'button':
   return <Card padding={6} style={cardStyle}>
				<div onClick={props.onSelect} style={clickable}>
					<Button
						label={(p.label as string) || 'Button'}
						variant={(p.variant as 'primary' | 'secondary' | 'ghost') ?? 'primary'}
						size={(p.size as 'sm' | 'md' | 'lg') ?? 'md'}
						clickAction={() => {}}
					/>
				</div>
			</Card>
		case 'features': {
			const items = (p.items as Transaction[]) || []
			return <Card padding={6} style={cardStyle}>
				<div onClick={props.onSelect} style={clickable}>
					<VStack gap={3}>
						<Heading level={3}>{(p.heading as string) || 'Features'}</Heading>
						{p.description ? (
							<Text type="supporting" color="secondary">{p.description as string}</Text>
						) : null}
						<VStack gap={2}>
							{items.map((item) => (
								<HStack key={item.id} gap={3} vAlign="center">
									<Icon name="sandbox-sparkles" color="secondary" />
									<StackItem size="fill">
										<VStack gap={0}>
											<Text type="label" weight="semibold">{item.name}</Text>
											<Text type="supporting" color="secondary">{item.category}</Text>
										</VStack>
									</StackItem>
									<Text type="label" weight="semibold" style={{ color: item.isPositive ? 'var(--color-text-success, #067647)' : undefined }}>
										{item.amount}
									</Text>
								</HStack>
							))}
						</VStack>
					</VStack>
				</div>
			</Card>
		}
		case 'cards': {
			const cardItems = (p.cards as { title: string; description: string }[]) || []
			return <Card style={cardStyle}>
				<div onClick={props.onSelect} style={{ ...clickable, padding: 'var(--spacing-4)' }}>
					<Heading level={3}>Cards</Heading>
					<List density="balanced" hasDividers={false}>
						{cardItems.map((c) => (
							<ListItem key={c.title} label={c.title} description={c.description} />
						))}
					</List>
				</div>
			</Card>
		}
		case 'cta':
   return <Card padding={6} style={cardStyle}>
				<div onClick={props.onSelect} style={clickable}>
					<EmptyState
						title={(p.heading as string) || 'CTA'}
						description={p.description as string}
						icon={<Icon name="sandbox-megaphone" size={24} />}
						actions={p.buttonLabel ? <Button label={p.buttonLabel as string} clickAction={() => {}} /> : undefined}
					/>
				</div>
			</Card>
	}
}

export function EditorTemplate() @{
	const [blocks, setBlocks] = useState<Block[]>(DEFAULT_BLOCKS)
	const [selectedId, setSelectedId] = useState<string | null>(null)
	const [sidebarTab, setSidebarTab] = useState<SidebarTab>('blocks')
	const [pageTitle, setPageTitle] = useState('Page Editor')
	const [isEditingTitle, setIsEditingTitle] = useState(false)
	const [viewport, setViewport] = useState<ViewportSize>('desktop')
	const [isCustomizeOpen, setIsCustomizeOpen] = useState(false)

	const isMobile = useMediaQuery('(max-width: 768px)')
	const selectedBlock = blocks.find((b) => b.id === selectedId) ?? null

	const updateBlockProp = useCallback((id: string, key: string, value: unknown) => {
		setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, props: { ...b.props, [key]: value } } : b)))
	}, [])

	const moveBlock = useCallback((id: string, dir: -1 | 1) => {
		setBlocks((prev) => {
			const idx = prev.findIndex((b) => b.id === id)
			if (idx < 0) {return prev}
			const target = idx + dir
			if (target < 0 || target >= prev.length) {return prev}
			const next = [...prev]
			const [moved] = next.splice(idx, 1)
			next.splice(target, 0, moved)
			return next
		})
	}, [])

	const deleteBlock = useCallback((id: string) => {
		setBlocks((prev) => prev.filter((b) => b.id !== id))
		setSelectedId((s) => (s === id ? null : s))
	}, [])

	const addBlock = useCallback((type: BlockType) => {
		const id = uid()
		const block: Block = { id, type, label: `${BLOCK_META[type].label} ${id}`, props: defaultProps(type) }
		setBlocks((prev) => [...prev, block])
		setSelectedId(id)
		setSidebarTab('properties')
	}, [])

	const selectBlock = useCallback(
		(id: string) => {
			setSelectedId(id)
			setSidebarTab('properties')
			if (isMobile) {setIsCustomizeOpen(true)}
		},
		[isMobile],
	)

	const blocksTabContent = (
		<VStack gap={4} padding={4}>
			<VStack gap={1}>
				<Heading level={4}>Add Block</Heading>
				<List density="balanced" hasDividers={false}>
					{(Object.keys(BLOCK_META) as BlockType[]).map((type) => (
						<ListItem
							key={type}
							label={BLOCK_META[type].label}
							startContent={<Icon name={BLOCK_META[type].icon} color="secondary" />}
							onPress={() => addBlock(type)}
						/>
					))}
				</List>
			</VStack>
			<VStack gap={1}>
				<Heading level={4}>Layers</Heading>
				<List density="balanced" hasDividers={false}>
					{blocks.map((block) => (
						<ListItem
							key={block.id}
							label={block.label}
							isSelected={block.id === selectedId}
							onPress={() => selectBlock(block.id)}
							startContent={<Icon name={BLOCK_META[block.type].icon} color="secondary" />}
							endContent={
								<HStack gap={1}>
									<Button
										label="Move up"
										icon={<Icon name="sandbox-chevron-up" size={16} />}
										variant="ghost" size="sm" isIconOnly
										clickAction={() => moveBlock(block.id, -1)}
									/>
									<Button
										label="Move down"
										icon={<Icon name="sandbox-chevron-down" size={16} />}
										variant="ghost" size="sm" isIconOnly
										clickAction={() => moveBlock(block.id, 1)}
									/>
									<Button
										label="Delete block"
										icon={<Icon name="sandbox-trash" size={16} />}
										variant="ghost" size="sm" isIconOnly
										clickAction={() => deleteBlock(block.id)}
									/>
								</HStack>
							}
						/>
					))}
				</List>
			</VStack>
		</VStack>
	)

	const propertiesTabContent = selectedBlock ? (
		<VStack gap={3} padding={4}>
			<BlockProperties block={selectedBlock} onUpdate={(key, value) => updateBlockProp(selectedBlock.id, key, value)} />
		</VStack>
	) : (
		<EmptyState
			title="Nothing selected"
			description="Select a block to edit its properties"
			icon={<Icon name="sandbox-cursor-arrow-rays" size={24} color="secondary" />}
			isCompact
		/>
	)

	const editingContent = (
		<VStack gap={0}>
			<VStack padding={3}>
				<TabList
					value={sidebarTab}
					onChange={(v) => setSidebarTab(v as SidebarTab)}
				>
					<Tab value="blocks" label="Blocks" />
					<Tab value="properties" label="Properties" />
				</TabList>
			</VStack>
			{sidebarTab === 'blocks' ? blocksTabContent : propertiesTabContent}
		</VStack>
	)

	const sidebar = (
		<LayoutPanel hasDivider={!isMobile} style={{ width: isMobile ? '100%' : 320, flexShrink: 0 }}>
			<VStack gap={0}>
				<HStack gap={2} padding={3} vAlign="center">
					{isMobile ? (
						<>
							<StackItem size="fill">
								<Heading level={4}>Customize</Heading>
							</StackItem>
							<Button label="Publish" variant="primary" clickAction={() => {}} />
						</>
					) : (
						<>
							{isEditingTitle ? (
								<StackItem size="fill">
									<TextInput
										label="Page title"
										isLabelHidden
										value={pageTitle}
										onChange={(v) => setPageTitle(v ?? '')}
									/>
								</StackItem>
							) : (
								<StackItem size="fill">
									<HStack gap={2} vAlign="center">
										<Heading level={4}>{pageTitle}</Heading>
										<Button
											label="Rename page"
											icon={<Icon name="sandbox-pencil" size={14} />}
											variant="ghost" size="sm" isIconOnly
											clickAction={() => setIsEditingTitle(true)}
										/>
									</HStack>
								</StackItem>
							)}
							<SegmentedControl
								label="Viewport"
								value={viewport}
								onValueChange={(v) => setViewport(v as ViewportSize)}
								size="sm"
							>
								<SegmentedControlItem value="desktop" label="Desktop" />
								<SegmentedControlItem value="tablet" label="Tablet" />
								<SegmentedControlItem value="phone" label="Phone" />
							</SegmentedControl>
							<Button label="Publish" variant="primary" clickAction={() => {}} />
						</>
					)}
				</HStack>
				{!isMobile ? editingContent : null}
			</VStack>
		</LayoutPanel>
	)

	<>
		<Layout
			height="fill"
			header={isMobile ? undefined : sidebar}
			content={
				<LayoutContent padding={8}>
					<VStack gap={4} style={canvasStyle(VIEWPORT_MAX[viewport])}>
						{isMobile ? (
							<Button label="Customize" variant="secondary" clickAction={() => setIsCustomizeOpen(true)} />
						) : null}
						{blocks.map((block) => (
							<BlockPreview
								key={block.id}
								block={block}
								isSelected={block.id === selectedId}
								onSelect={() => selectBlock(block.id)}
							/>
						))}
						{blocks.length === 0 ? (
							<EmptyState
								title="Empty canvas"
								description="Add a block from the panel to start building."
								icon={<Icon name="sandbox-squares-2x2" size={24} color="secondary" />}
							/>
						) : null}
					</VStack>
				</LayoutContent>
			}
		/>
		{isMobile ? (
			<Dialog
				isOpen={isCustomizeOpen}
				onOpenChange={setIsCustomizeOpen}
				purpose="form"
			>
				<DialogHeader title="Customize" onOpenChange={setIsCustomizeOpen} />
				{editingContent}
			</Dialog>
		) : null}
	</>
}
