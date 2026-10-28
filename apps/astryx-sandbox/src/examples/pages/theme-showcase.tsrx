// Port of upstream templates/pages/theme-showcase/page.tsx (Astryx 0.6.4,
// MIT) — route /templates/theme-showcase/.
// A static showcase surface: a themed store preview (TopNav + hero + product
// grid) above a card gallery exercising Table, Chat, form controls, and KPI
// cards under one theme. GAPS: lucide icons → registered sandbox icons;
// `Item` is a public component; MoreMenu items use the action-item shape.
import {
	AspectRatio, Badge, Banner, Button, Card, Center, CheckboxInput,
	Divider, Grid, GridSpan, Heading, HStack, Icon, Item, LayoutContent,
	Link, MoreMenu, NumberInput, OverflowList, RadioList, RadioListItem,
	Section, SelectableCard, Selector, StackItem, Table, Text, TextInput,
	TopNav, TopNavHeading, TopNavItem, VStack, pixel } from '@octane-xplat/ui'
import {
	ChatComposer, ChatMessage, ChatMessageBubble, ChatMessageList,
	ChatSystemMessage,
} from '@octane-xplat/ui/chat'

interface ProductSpec {
	name: string
	description: string
	badge: string
	badgeVariant: 'blue' | 'green' | 'yellow'
}

const DEFAULT_PRODUCTS: ProductSpec[] = [
	{ name: 'Minimalist Watch', description: 'Clean design meets everyday durability.', badge: 'New', badgeVariant: 'blue' },
	{ name: 'Wireless Headphones', description: 'Immersive sound, all-day comfort.', badge: 'Popular', badgeVariant: 'green' },
	{ name: 'Canvas Backpack', description: 'Water-resistant canvas with a quiet, modern profile.', badge: 'Limited', badgeVariant: 'yellow' },
]

const DEFAULT_IMAGES: Record<string, string> = {
	watch: '/template-assets/Neutral-Watch.png',
	headphones: '/template-assets/Neutral-Headphones.png',
	backpack: '/template-assets/Neutral-Backpack.png',
	wallet: '/template-assets/Neutral-Wallet.png',
	tumbler: '/template-assets/Neutral-Tumbler.png',
	throw_: '/template-assets/Neutral-Blanket.png',
}

const PRODUCT_IMAGE_KEYS = ['watch', 'headphones', 'backpack']

const SUGGESTED_QUESTIONS = [
	'Reschedule delivery',
	'Update shipping address',
	'Start a return',
]

interface ActivityRow {
	id: string
	icon: string
	label: string
	detail: string
	amount: number
}

const ACTIVITY: ActivityRow[] = [
	{ id: '1', icon: 'sandbox-shopping-bag', label: 'Order #1043', detail: 'Placed · 1:59 pm', amount: 248 },
	{ id: '2', icon: 'sandbox-banknotes', label: 'Order #1041', detail: 'Refunded · 12:40 pm', amount: -89 },
	{ id: '3', icon: 'sandbox-shopping-bag', label: 'Order #1040', detail: 'Placed · 10:30 am', amount: 156 },
	{ id: '4', icon: 'sandbox-shopping-bag', label: 'Order #1038', detail: 'Placed · 9:11 am', amount: 412 },
	{ id: '5', icon: 'sandbox-shopping-bag', label: 'Order #1037', detail: 'Placed · 8:42 am', amount: 95 },
]

const formatAmount = (amount: number): string =>
	`${amount < 0 ? '−' : '+'}$${Math.abs(amount).toLocaleString()}`

interface TagSpec {
	label: string
	variant: 'blue' | 'green' | 'yellow' | 'orange'
}

interface InventoryRow extends Record<string, unknown> {
	id: string
	name: string
	meta: string
	available: number
	location: string
	tags: TagSpec[]
	imageKey?: string
	thumbnailFallback: string
	selected: boolean
}

const DEFAULT_INVENTORY: InventoryRow[] = [
	{ id: 'a', name: 'Minimalist Watch', meta: 'Stainless steel, sapphire crystal', available: 42, location: 'Aisle 3', tags: [{ label: 'New', variant: 'blue' }], imageKey: 'watch', thumbnailFallback: 'M', selected: false },
	{ id: 'b', name: 'Wireless Headphones', meta: 'ANC, 30hr battery', available: 128, location: 'Aisle 1', tags: [{ label: 'Popular', variant: 'green' }], imageKey: 'headphones', thumbnailFallback: 'W', selected: true },
	{ id: 'c', name: 'Canvas Backpack', meta: 'Water-resistant, 25L', available: 63, location: 'Aisle 2', tags: [{ label: 'Limited', variant: 'yellow' }], imageKey: 'backpack', thumbnailFallback: 'C', selected: false },
	{ id: 'd', name: 'Leather Wallet', meta: 'Full-grain, RFID blocking', available: 15, location: 'Aisle 4', tags: [{ label: 'Leather', variant: 'yellow' }], imageKey: 'wallet', thumbnailFallback: 'L', selected: true },
	{ id: 'e', name: 'Travel Tumbler', meta: 'Vacuum insulated, 16oz', available: 87, location: 'Aisle 5', tags: [{ label: 'Drinkware', variant: 'green' }], imageKey: 'tumbler', thumbnailFallback: 'T', selected: false },
	{ id: 'f', name: 'Linen Throw', meta: 'Heavyweight, oat', available: 24, location: 'Aisle 6', tags: [{ label: 'Home', variant: 'orange' }], imageKey: 'throw_', thumbnailFallback: 'L', selected: true },
]

const LOW_STOCK_THRESHOLD = 25

const inlineStyles: Record<string, any> = {
	inventoryBannerWrap: { paddingInline: 'var(--spacing-6)', paddingBottom: 'var(--spacing-4)' },
	thumbnail: { width: pixel(40), height: 40, borderRadius: 'var(--radius-element)', objectFit: 'cover', display: 'block', flexShrink: 0 },
	thumbnailFallback: { width: pixel(40), height: 40, borderRadius: 'var(--radius-element)', backgroundColor: 'var(--color-background-muted)', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 'var(--font-size-sm)', fontWeight: 600, flexShrink: 0 },
	kpiValue: { fontSize: 24, fontWeight: 700, lineHeight: 1.1, color: 'var(--color-text-primary)', fontFamily: 'var(--font-family-heading)', letterSpacing: '-0.01em' },
	chatBody: { flex: 1, minHeight: 0, overflow: 'hidden' },
	chatSuggestions: { paddingInline: 'var(--spacing-4)', paddingBottom: 'var(--spacing-2)' },
	chatComposer: { paddingInline: 'var(--spacing-4)', paddingBottom: 'var(--spacing-4)' },
	activityIcon: { width: pixel(32), height: 32, borderRadius: 'var(--radius-full)', backgroundColor: 'var(--color-background-muted)', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
	productImage: { width: '100%', height: '100%', objectFit: 'cover' },
	cardBody: { padding: 'var(--spacing-4)', flex: 1, display: 'flex', flexDirection: 'column' },
	checkoutColumn: { flex: '1 1 300px', minWidth: 0, display: 'grid' },
	chatColumn: { flex: '2 1 520px', minWidth: 0, display: 'grid' },
	searchInput: { flex: '1 1 160px', maxWidth: 320 },
}

const styles: Record<string, any> = {
	content: { maxWidth: 1080, marginInline: 'auto', width: '100%' },
	heroText: { maxWidth: 560 },
	centerText: { textAlign: 'center' },
	cardStack: { flex: 1 },
	cardDescription: { flex: 1 },
	paymentCardContent: { alignItems: 'center' },
	chatCard: { display: 'flex', flexDirection: 'column', height: 480 },
	chatHeader: { padding: 'var(--spacing-4)' },
	inventoryHeader: { padding: 'var(--spacing-5) var(--spacing-6)' },
	inventoryFilterRow: { padding: 'var(--spacing-4) var(--spacing-6)', flexWrap: 'wrap' },
}

function CheckoutCard(props: { isMobile: boolean }) @{
	<Card padding={props.isMobile ? 4 : 5} style={{ height: '100%' }}>
		<VStack gap={4}>
			<Heading level={2}>Checkout</Heading>
			<VStack gap={3}>
				<TextInput
					label="Email" placeholder="you@studio.com"
					value="" onChange={() => {}} size="lg"
				/>
				<RadioList
					label="Shipping method"
					description="Delivery time may vary based on location and availability."
					value="economy" onValueChange={() => {}}
				>
					<RadioListItem
						value="economy" label="Economy Shipping"
						description="Delivered in 5–7 business days"
						endContent={<Text type="body" weight="bold">$12.00</Text>}
					/>
					<RadioListItem
						value="standard" label="Standard Shipping"
						description="Delivered in 3–5 business days"
						endContent={<Text type="body" weight="bold">$16.00</Text>}
					/>
					<RadioListItem
						value="express" label="Express Shipping"
						description="Delivered in 1–2 business days"
						endContent={<Text type="body" weight="bold">$24.00</Text>}
					/>
				</RadioList>
				<VStack gap={2}>
					<Text type="supporting" weight="bold">Payment method</Text>
					<Grid columns={props.isMobile ? 1 : { minWidth: 80 }} style={{ gap: 'var(--spacing-2)', gridTemplateColumns: props.isMobile ? '1fr' : 'repeat(3, 1fr)' }}>
						<SelectableCard label="Pay with card" isSelected padding={3} onChange={() => {}}>
							<VStack gap={1} hAlign="center">
								<Icon name="sandbox-credit-card" size={20} />
								<Text type="supporting" weight="bold">Card</Text>
							</VStack>
						</SelectableCard>
						<SelectableCard label="Pay with Apple Pay" isSelected={false} padding={3} onChange={() => {}}>
							<VStack gap={1} hAlign="center">
								<Icon name="sandbox-device-phone-mobile" size={20} />
								<Text type="supporting" weight="bold">Apple Pay</Text>
							</VStack>
						</SelectableCard>
						<SelectableCard label="Pay with Google Pay" isSelected={false} padding={3} onChange={() => {}}>
							<VStack gap={1} hAlign="center">
								<Icon name="sandbox-wallet" size={20} />
								<Text type="supporting" weight="bold">Google Pay</Text>
							</VStack>
						</SelectableCard>
					</Grid>
				</VStack>
				<Button label="Pay now" variant="primary" size="lg" clickAction={() => {}} />
			</VStack>
		</VStack>
	</Card>
}

function ChatCard() @{
	<Card padding={0} style={styles.chatCard}>
		<HStack hAlign="between" vAlign="center" gap={3} style={styles.chatHeader}>
			<Heading level={2}>Studio AI</Heading>
			<HStack gap={1} vAlign="center">
				<Button variant="ghost" size="sm" isIconOnly label="Export conversation" icon={<Icon name="sandbox-arrow-down-tray" size={16} />} clickAction={() => {}} />
				<Button variant="ghost" size="sm" isIconOnly label="Close chat" icon={<Icon name="sandbox-x-mark" size={16} />} clickAction={() => {}} />
			</HStack>
		</HStack>
		<Divider variant="subtle" />
		<div style={inlineStyles.chatBody}>
			<ChatMessageList>
				<ChatSystemMessage>Today</ChatSystemMessage>
				<ChatMessage sender="user">
					<ChatMessageBubble variant="filled">Where’s my order?</ChatMessageBubble>
				</ChatMessage>
				<ChatMessage sender="assistant">
					<VStack gap={3}>
						<Text type="body">
							Your order #1043 — the Minimalist Watch and Linen Throw —
							shipped this morning from the Aisle 3 warehouse and is currently
							in transit with UPS. It’s on track to arrive at your address by
							end of day tomorrow.
						</Text>
						<Text type="body">
							Let me know if you’d like to reschedule the delivery, redirect
							it to a pickup point, or start a return once it arrives.
						</Text>
					</VStack>
				</ChatMessage>
				<ChatMessage sender="user">
					<ChatMessageBubble variant="filled">Can you show me the full details?</ChatMessageBubble>
				</ChatMessage>
				<ChatMessage sender="assistant">
					<VStack gap={3}>
						<Text type="body">Here’s everything I have on order #1043:</Text>
						<Card padding={3}>
							<VStack gap={1}>
								<Item label="Items" description="Minimalist Watch · Linen Throw" endContent={<Text type="body" weight="bold">$248</Text>} />
								<Item label="Shipping" description="UPS Ground" endContent={<Text type="body" weight="bold">$12</Text>} />
								<Item label="Estimated arrival" description="Tomorrow by 8pm" endContent={<Badge variant="green" label="On time" />} />
								<Item label="Tracking" description="UPS 1Z 999 AA1 0123 4567 84" endContent={<Link href="#">Track →</Link>} />
							</VStack>
						</Card>
					</VStack>
				</ChatMessage>
			</ChatMessageList>
		</div>
		<div style={inlineStyles.chatSuggestions}>
			<HStack gap={1} hAlign="center" wrap="wrap">
				{SUGGESTED_QUESTIONS.map((question) => (
					<Button key={question} variant="secondary" size="sm" label={question} clickAction={() => {}} />
				))}
			</HStack>
		</div>
		<div style={inlineStyles.chatComposer}>
			<ChatComposer
				value=""
				onChange={() => {}}
				placeholder="Ask about your order…"
				sendActions={
					<Button variant="ghost" size="md" isIconOnly label="Voice input" icon={<Icon name="sandbox-microphone" size={16} />} clickAction={() => {}} />
				}
			/>
		</div>
	</Card>
}

function LatestActivityCard(props: { isMobile: boolean }) @{
	<Card padding={5}>
		<VStack gap={4}>
			<Heading level={2}>Revenue</Heading>
			<Grid columns={props.isMobile ? 1 : 2} style={{ gap: 'var(--spacing-3)' }}>
				<VStack gap={0}>
					<span style={inlineStyles.kpiValue}>18K</span>
					<Text type="supporting" color="secondary">Monthly revenue</Text>
				</VStack>
				<VStack gap={0}>
					<span style={inlineStyles.kpiValue}>+12%</span>
					<Text type="supporting" color="secondary">Order growth</Text>
				</VStack>
			</Grid>
			<Divider variant="subtle" />
			<HStack hAlign="between" vAlign="center">
				<Heading level={3}>Activity</Heading>
				<Link href="#">See all</Link>
			</HStack>
			<VStack gap={1}>
				{ACTIVITY.map((item) => (
					<Item
						key={item.id}
						startContent={
							<div style={inlineStyles.activityIcon} aria-hidden="true">
								<Icon name={item.icon} size={16} />
							</div>
						}
						label={item.label}
						description={item.detail}
						endContent={
							<Text type="body" weight="bold" color={item.amount < 0 ? 'secondary' : 'primary'}>
								{formatAmount(item.amount)}
							</Text>
						}
					/>
				))}
			</VStack>
		</VStack>
	</Card>
}

function InventoryCard(props: { images: Record<string, string>; inventory: InventoryRow[] }) @{
	const lowStockCount = props.inventory.filter((row) => row.available < LOW_STOCK_THRESHOLD).length
	<Card padding={0}>
		<HStack hAlign="between" vAlign="center" style={styles.inventoryHeader}>
			<Heading level={2}>Inventory</Heading>
			<Button label="Add item" variant="primary" size="sm" icon={<Icon name="sandbox-plus" size={16} />} clickAction={() => {}} />
		</HStack>
		<Divider variant="subtle" />
		{lowStockCount > 0 ? (
			<div style={inlineStyles.inventoryBannerWrap}>
				<Banner status="warning" title={`${lowStockCount} ${lowStockCount === 1 ? 'item' : 'items'} below ${LOW_STOCK_THRESHOLD} units`} />
			</div>
		) : null}
		<HStack gap={3} vAlign="center" hAlign="between" style={styles.inventoryFilterRow}>
			<HStack gap={2} vAlign="center" style={{ flex: 1, minWidth: 0 }}>
				<TextInput
					label="Search inventory" isLabelHidden
					placeholder="Type and hit enter…"
					value="" onChange={() => {}}
					startIcon={<Icon name="sandbox-magnifying-glass" size={16} />}
					style={inlineStyles.searchInput}
				/>
				<OverflowList
					gap={2}
					overflowRenderer={() => (
						<Button label="Filters" variant="ghost" size="sm" icon={<Icon name="sandbox-tag" size={16} />} clickAction={() => {}} />
					)}
				>
					<Selector
						label="Categories" isLabelHidden placeholder="Categories" size="sm"
						value={undefined} onValueChange={() => {}}
						options={[
							{ value: 'Wearables', label: 'Wearables' },
							{ value: 'Audio', label: 'Audio' },
							{ value: 'Bags', label: 'Bags' },
							{ value: 'Drinkware', label: 'Drinkware' },
							{ value: 'Home', label: 'Home' },
						]}
					/>
					<Selector
						label="Locations" isLabelHidden placeholder="Locations" size="sm"
						value={undefined} onValueChange={() => {}}
						options={['Aisle 1', 'Aisle 2', 'Aisle 3', 'Aisle 4', 'Aisle 5', 'Aisle 6'].map((v) => ({ value: v, label: v }))}
					/>
					<Selector
						label="Tags" isLabelHidden placeholder="Tags" size="sm"
						value={undefined} onValueChange={() => {}}
						options={['New', 'Popular', 'Limited', 'Leather', 'Drinkware', 'Home'].map((v) => ({ value: v, label: v }))}
					/>
				</OverflowList>
			</HStack>
		</HStack>
		<Table
			data={props.inventory}
			idKey="id"

			columns={[
				{
					key: 'select', header: '', width: pixel(36),
					renderCell: (row: InventoryRow) => (
						<CheckboxInput label={`Select ${row.name}`} isLabelHidden value={row.selected} onChange={() => {}} />
					),
				},
				{
					key: 'name', header: 'Item',
					renderCell: (row: InventoryRow) => {
						const src = row.imageKey ? props.images[row.imageKey] : undefined
						return (
							<HStack gap={3} vAlign="center">
								{src ? (
									<img src={src} alt="" style={inlineStyles.thumbnail} />
								) : (
									<div style={inlineStyles.thumbnailFallback} aria-hidden="true">
										{row.thumbnailFallback}
									</div>
								)}
								<VStack gap={0} style={{ minWidth: 0 }}>
									<Text type="body" weight="bold">{row.name}</Text>
									<Text type="supporting" color="secondary">{row.meta}</Text>
								</VStack>
							</HStack>
						)
					},
				},
				{ key: 'available', header: 'Available', width: pixel(90) },
				{ key: 'location', header: 'Location', width: pixel(100) },
				{
					key: 'tags', header: 'Tags',
					renderCell: (row: InventoryRow) => (
						<HStack gap={1} wrap="wrap" hAlign="end">
							{row.tags.map((tag) => (
								<Badge key={tag.label} label={tag.label} variant={tag.variant} />
							))}
						</HStack>
					),
				},
				{
					key: 'actions', header: '', width: pixel(48),
					renderCell: () => (
						<MoreMenu
							label="Row actions" size="sm"
							items={[
								{ type: 'action', key: 'edit', label: 'Edit', onSelect: () => {} },
								{ type: 'action', key: 'dup', label: 'Duplicate', onSelect: () => {} },
								{ type: 'action', key: 'move', label: 'Move to…', onSelect: () => {} },
																{ type: 'action', key: 'del', label: 'Delete', onSelect: () => {} },
							]}
						/>
					),
				},
			]}
		/>
	</Card>
}

export function ThemeShowcaseTemplate() @{
	const isMobile = false // viewport queries inside cards approximate upstream's AppShell mobile flag
	<div style={{ minHeight: '100%', backgroundColor: 'var(--color-background-body)' }}>
		<div data-theme-preview="true">
			<VStack gap={0}>
				<TopNav
					label="Theme preview navigation"
					heading={<TopNavHeading heading="Studio" />}
					centerContent={
						isMobile ? undefined : (
							<>
								<TopNavItem label="Shop" href="#" isSelected />
								<TopNavItem label="New In" href="#" />
								<TopNavItem label="Stories" href="#" />
								<TopNavItem label="Help" href="#" />
							</>
						)
					}
					endContent={
						<HStack gap={2} vAlign="center">
							<HStack gap={0.5}>
								<Button label="Search" variant="ghost" isIconOnly icon={<Icon name="sandbox-magnifying-glass" size={20} />} clickAction={() => {}} />
								<Button label="Account" variant="ghost" isIconOnly icon={<Icon name="sandbox-user" size={20} />} clickAction={() => {}} />
								<Button label="Cart" variant="ghost" isIconOnly icon={<Icon name="sandbox-shopping-bag" size={20} />} clickAction={() => {}} />
							</HStack>
							<Button label="Sign in" variant="primary" clickAction={() => {}} />
						</HStack>
					}
				/>
				<Section padding={6} variant="transparent">
					<VStack gap={10} style={styles.content}>
						<Center>
							<VStack gap={4} hAlign="center" style={styles.heroText}>
								<Heading type="display-2" level={1} color="accent" style={styles.centerText}>
									Little joys,{'\n'}everywhere you go
								</Heading>
								<Text type="body" color="secondary" style={styles.centerText}>
									We believe the smallest details are the ones that matter
									most. Turn an ordinary day into something worth remembering.
								</Text>
							</VStack>
						</Center>
						<Grid columns={isMobile ? 1 : { minWidth: 200 }} style={{ gap: 'var(--spacing-4)', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)' }}>
							{DEFAULT_PRODUCTS.map((p, i) => (
								<Card key={p.name} padding={0} height="100%">
									<VStack gap={0} style={styles.cardStack}>
										<AspectRatio ratio={1}>
											<img src={DEFAULT_IMAGES[PRODUCT_IMAGE_KEYS[i]]} alt={p.name} style={inlineStyles.productImage} />
										</AspectRatio>
										<div style={inlineStyles.cardBody}>
											<VStack gap={2} hAlign="center" style={styles.cardStack}>
												<HStack>
													<Badge label={p.badge} variant={p.badgeVariant} />
												</HStack>
												<Heading level={2} style={styles.centerText}>{p.name}</Heading>
												<Text type="supporting" color="secondary" style={{ ...styles.cardDescription, ...styles.centerText }}>
													{p.description}
												</Text>
												<HStack gap={2} vAlign="center" hAlign="center" wrap="wrap">
													<NumberInput
														label="Quantity" isLabelHidden
														value={1} onValueChange={() => {}}
														min={1} max={10} step={1} size="sm"
													/>
													<Button label="Add to cart" variant="primary" clickAction={() => {}} />
												</HStack>
											</VStack>
										</div>
									</VStack>
								</Card>
							))}
						</Grid>
					</VStack>
				</Section>
			</VStack>
		</div>
		<div style={{ padding: 'var(--spacing-6)', backgroundColor: 'var(--color-background-surface)' }}>
			<VStack gap={8} style={styles.content}>
				<HStack gap={4} wrap="wrap">
					<div style={inlineStyles.checkoutColumn}>
						<CheckoutCard isMobile={isMobile} />
					</div>
					<div style={inlineStyles.chatColumn}>
						<ChatCard />
					</div>
				</HStack>
				<Grid columns={isMobile ? 1 : { minWidth: 200 }} style={{ gap: 'var(--spacing-4)', gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)' }}>
					<GridSpan columns={isMobile ? 1 : 3}>
						<InventoryCard images={DEFAULT_IMAGES} inventory={DEFAULT_INVENTORY} />
					</GridSpan>
					<GridSpan columns={1}>
						<LatestActivityCard isMobile={isMobile} />
					</GridSpan>
				</Grid>
			</VStack>
		</div>
	</div>
}
