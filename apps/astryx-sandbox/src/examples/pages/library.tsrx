// Port of upstream templates/pages/library/page.tsx (Astryx 0.6.4, MIT) —
// route /templates/library/.
// GAPS: DropdownMenu items {label,onClick} → {type:'action',key,label,onSelect};
// card thumbnails render via <img> on template-assets (same as upstream).
import { useMemo, useState } from 'octane'
import {
	Card, Center, Divider, DropdownMenu, Grid, Heading, HStack, Icon,
	Layout, LayoutContent, LayoutHeader, OverflowList, Section, StackItem,
	Text, TextInput, ToggleButton, ToggleButtonGroup, VStack,
} from '@octane-xplat/ui'

interface LibraryItem {
	id: string
	name: string
	description: string
	category: string
	type: 'Component' | 'Pattern' | 'Utility'
	imageUrl?: string
}

const CATEGORIES = ['All', 'Layout', 'Forms', 'Navigation', 'Feedback', 'Data']

const ITEMS: LibraryItem[] = [
	{ id: '1', name: 'Stack', description: 'Vertical and horizontal stack layouts with configurable gap and alignment.', category: 'Layout', type: 'Component', imageUrl: '/template-assets/colorful-home-horizontal-1.png' },
	{ id: '2', name: 'Grid', description: 'Responsive grid container with auto-fit columns and gap control.', category: 'Layout', type: 'Component', imageUrl: '/template-assets/illustrative-horizontal-3.png' },
	{ id: '3', name: 'Card', description: 'Surface container with optional padding, border, and shadow variants.', category: 'Layout', type: 'Component', imageUrl: '/template-assets/light-working-horizontal-2.png' },
	{ id: '4', name: 'Center', description: 'Centers its child both horizontally and vertically.', category: 'Layout', type: 'Utility', imageUrl: '/template-assets/moody-scene-horizontal-1.png' },
	{ id: '5', name: 'Section', description: 'Semantic page section with optional heading and divider.', category: 'Layout', type: 'Pattern', imageUrl: '/template-assets/colorful-lifestyle-horizontal-2.png' },
	{ id: '6', name: 'Collapsible', description: 'Expandable region with animated height transition.', category: 'Layout', type: 'Component', imageUrl: '/template-assets/light-scene-horizontal-1.png' },
	{ id: '7', name: 'TextInput', description: 'Single-line text field with label, description, and status.', category: 'Forms', type: 'Component', imageUrl: '/template-assets/colorful-working-horizontal-1.png' },
	{ id: '8', name: 'TextArea', description: 'Multi-line text field with auto-sizing and character count.', category: 'Forms', type: 'Component', imageUrl: '/template-assets/moody-product-horizontal-1.png' },
	{ id: '9', name: 'CheckboxInput', description: 'Single checkbox with label and optional description.', category: 'Forms', type: 'Component', imageUrl: '/template-assets/light-lifestyle-horizontal-1.png' },
	{ id: '10', name: 'RadioList', description: 'Group of radio buttons with accessible fieldset wrapper.', category: 'Forms', type: 'Component', imageUrl: '/template-assets/colorful-home-horizontal-2.png' },
	{ id: '11', name: 'Switch', description: 'Toggle switch for binary on/off settings.', category: 'Forms', type: 'Component', imageUrl: '/template-assets/illustrative-horizontal-1.png' },
	{ id: '12', name: 'Selector', description: 'Dropdown select with search, grouping, and custom renderers.', category: 'Forms', type: 'Component', imageUrl: '/template-assets/light-working-horizontal-3.png' },
	{ id: '13', name: 'TabList', description: 'Horizontal tab strip for switching between related views.', category: 'Navigation', type: 'Component', imageUrl: '/template-assets/moody-scene-horizontal-2.png' },
	{ id: '14', name: 'TopNav', description: 'Application top bar with logo, nav links, and action slots.', category: 'Navigation', type: 'Pattern', imageUrl: '/template-assets/colorful-lifestyle-horizontal-1.png' },
	{ id: '15', name: 'SideNav', description: 'Vertical navigation rail with sections and collapsible groups.', category: 'Navigation', type: 'Pattern', imageUrl: '/template-assets/light-home-horizontal-1.png' },
	{ id: '16', name: 'Breadcrumbs', description: 'Path trail navigation with separator and truncation support.', category: 'Navigation', type: 'Component', imageUrl: '/template-assets/moody-product-horizontal-2.png' },
	{ id: '17', name: 'Pagination', description: 'Page navigation with numbered pages and compact mode.', category: 'Navigation', type: 'Component', imageUrl: '/template-assets/colorful-working-horizontal-2.png' },
	{ id: '18', name: 'MobileNav', description: 'Bottom navigation bar for small viewports with badge support.', category: 'Navigation', type: 'Pattern', imageUrl: '/template-assets/light-scene-horizontal-1.png' },
	{ id: '19', name: 'Badge', description: 'Small status label for counts, tags, and state indicators.', category: 'Feedback', type: 'Component', imageUrl: '/template-assets/colorful-home-horizontal-3.png' },
	{ id: '20', name: 'Banner', description: 'Page-level announcement bar for warnings, info, and errors.', category: 'Feedback', type: 'Component', imageUrl: '/template-assets/illustrative-horizontal-2.png' },
	{ id: '21', name: 'Spinner', description: 'Animated loading indicator with size and color variants.', category: 'Feedback', type: 'Component', imageUrl: '/template-assets/light-lifestyle-horizontal-2.png' },
	{ id: '22', name: 'ProgressBar', description: 'Horizontal bar indicating task completion percentage.', category: 'Feedback', type: 'Component', imageUrl: '/template-assets/moody-working-horizontal-1.png' },
	{ id: '23', name: 'StatusDot', description: 'Compact status indicator with semantic color variants.', category: 'Feedback', type: 'Component', imageUrl: '/template-assets/colorful-lifestyle-horizontal-3.png' },
	{ id: '24', name: 'Tooltip', description: 'Contextual helper displayed on hover or focus.', category: 'Feedback', type: 'Component', imageUrl: '/template-assets/light-working-horizontal-1.png' },
	{ id: '25', name: 'Table', description: 'Data table with sorting, selection, and column management.', category: 'Data', type: 'Component', imageUrl: '/template-assets/moody-home-horizontal-1.png' },
	{ id: '26', name: 'TreeList', description: 'Hierarchical list with expandable nodes and keyboard nav.', category: 'Data', type: 'Component', imageUrl: '/template-assets/colorful-product-horizontal-1.png' },
	{ id: '27', name: 'Typeahead', description: 'Command-palette style search with grouped results and keyboard nav.', category: 'Data', type: 'Component', imageUrl: '/template-assets/light-home-horizontal-2.png' },
	{ id: '28', name: 'MetadataList', description: 'Label/value definition list for object detail views.', category: 'Data', type: 'Component', imageUrl: '/template-assets/moody-scene-horizontal-3.png' },
]

const thumbnailWrapper = {
	overflow: 'hidden',
	borderRadius: 'var(--radius-card, 12px) var(--radius-card, 12px) 0 0',
	borderBottom: '1px solid var(--color-border)',
	backgroundColor: 'var(--color-background-muted)',
} as const

const thumbnailImage = {
	display: 'block',
	width: '100%',
	height: 160,
	objectFit: 'cover',
} as const

function LibraryCard(props: { item: LibraryItem }) @{
	<Card padding={0}>
		<div style={thumbnailWrapper}>
			<img src={props.item.imageUrl} alt={props.item.name} style={thumbnailImage} />
		</div>
		<Section variant="transparent" padding={4}>
			<VStack gap={1}>
				<Heading level={3}>{props.item.name}</Heading>
				<Text type="body" size="sm" color="secondary">
					{props.item.description}
				</Text>
			</VStack>
		</Section>
	</Card>
}

function LibrarySection(props: { category: string; items: LibraryItem[] }) @{
	<VStack gap={6}>
		<Heading level={2}>{props.category}</Heading>
		<Grid columns={{ minWidth: 320 }} style={{ gap: 'var(--spacing-4)' }}>
			{props.items.map((item) => (
				<LibraryCard key={item.id} item={item} />
			))}
		</Grid>
	</VStack>
}

export function LibraryTemplate() @{
	const [activeTab, setActiveTab] = useState('All')
	const [search, setSearch] = useState('')
	const [sortOrder, setSortOrder] = useState('A-Z')

	const filtered = useMemo(() => {
		let items = activeTab === 'All' ? ITEMS : ITEMS.filter((i) => i.category === activeTab)
		if (search.trim()) {
			const q = search.toLowerCase()
			items = items.filter(
				(i) => i.name.toLowerCase().includes(q) || i.description.toLowerCase().includes(q),
			)
		}
		const sorted = [...items]
		if (sortOrder === 'A-Z') {
			sorted.sort((a, b) => a.name.localeCompare(b.name))
		} else if (sortOrder === 'Z-A') {
			sorted.sort((a, b) => b.name.localeCompare(a.name))
		} else if (sortOrder === 'Newest') {
			sorted.sort((a, b) => Number(b.id) - Number(a.id))
		}
		return sorted
	}, [activeTab, search, sortOrder])

	const groupedSections = useMemo(() => {
		if (activeTab !== 'All') {return null}
		const order = CATEGORIES.filter((c) => c !== 'All')
		const map = new Map<string, LibraryItem[]>()
		for (const item of filtered) {
			let group = map.get(item.category)
			if (!group) {
				group = []
				map.set(item.category, group)
			}
			group.push(item)
		}
		return order
			.filter((cat) => map.has(cat))
			.map((cat) => ({ category: cat, items: map.get(cat) ?? [] }))
	}, [activeTab, filtered])

	<Layout
		header={
			<LayoutHeader hasDivider padding={6}>
				<Heading level={1}>Library</Heading>
			</LayoutHeader>
		}
		content={
			<LayoutContent padding={6}>
				<VStack gap={6}>
					<VStack gap={4}>
						<TextInput
							label="Search"
							isLabelHidden
							placeholder="Search..."
							value={search}
							onChange={(v) => setSearch(v ?? '')}
							startIcon={<Icon name="sandbox-magnifying-glass" />}
							size="lg"
						/>
						<HStack vAlign="center" gap={4}>
							<StackItem size="fill">
								<VStack>
									<ToggleButtonGroup
										label="Filter by category"
										value={activeTab}
										onChange={(v) => setActiveTab(v ?? 'All')}
									>
										<OverflowList
											gap={1}
											behavior="observeParent"
											overflowRenderer={(overflowItems) => (
												<DropdownMenu
													button={{ label: `+${overflowItems.length}`, variant: 'ghost', size: 'lg' }}
													items={overflowItems.map(({ index }) => ({
														type: 'action' as const,
														key: CATEGORIES[index],
														label: CATEGORIES[index],
														onSelect: () => setActiveTab(CATEGORIES[index]),
													}))}
												/>
											)}
										>
											{CATEGORIES.map((cat) => (
												<ToggleButton key={cat} label={cat} value={cat} size="lg" />
											))}
										</OverflowList>
									</ToggleButtonGroup>
								</VStack>
							</StackItem>
							<DropdownMenu
								button={{ label: sortOrder, size: 'lg' }}
								items={[
									{ type: 'action', key: 'az', label: 'A-Z', onSelect: () => setSortOrder('A-Z') },
									{ type: 'action', key: 'za', label: 'Z-A', onSelect: () => setSortOrder('Z-A') },
									{ type: 'action', key: 'new', label: 'Newest', onSelect: () => setSortOrder('Newest') },
								]}
							/>
						</HStack>
					</VStack>

					{filtered.length === 0 ? (
						<Center>
							<Text type="supporting" color="secondary">
								No results found.
							</Text>
						</Center>
					) : (
						<VStack gap={6}>
							{(groupedSections ?? [{ category: activeTab, items: filtered }]).flatMap((section) => [
								<Divider key={`d-${section.category}`} />,
								<LibrarySection key={section.category} category={section.category} items={section.items} />,
							])}
						</VStack>
					)}
				</VStack>
			</LayoutContent>
		}
	/>
}
