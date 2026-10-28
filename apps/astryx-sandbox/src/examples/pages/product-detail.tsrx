// Port of upstream templates/pages/product-detail/page.tsx (Astryx 0.6.4,
// MIT) — route /templates/product-detail/.
// GAPS: `Icon icon={StarIconSolid}` solid variant has no registry twin —
// NumberInput `step={1}` has no equivalent — `step={1}` substitutes.
// filled stars reuse the outline glyph (recorded); SelectableCard `onChange`
// takes the next boolean (upstream no-arg toggle).
import { useState } from 'octane'
import {
	AspectRatio, Badge, Button, Center, Collapsible, CollapsibleGroup,
	Divider, Grid, Heading, HStack, Icon, Layout, LayoutContent, NumberInput,
	SegmentedControl, SegmentedControlItem, SelectableCard, Text, VStack,
} from '@octane-xplat/ui'

// Custom CSS here is limited to what the components can't express today:
// - image fill + corner radius (no Image primitive — upstream #2582)
// - the sticky info column (no sticky prop on layout primitives — upstream
//   #2613)
const stickyInfo = {
	position: 'sticky',
	top: 'var(--spacing-8)',
	alignSelf: 'start',
} as const
const heroImage = {
	width: '100%',
	height: '100%',
	objectFit: 'cover',
	borderRadius: 'var(--radius-container)',
} as const
const thumbImage = {
	width: '100%',
	height: '100%',
	objectFit: 'cover',
	display: 'block',
} as const

function StarRating(props: { rating: number; count: number }) @{
	const filled = Math.round(props.rating)
	const empty = 5 - filled

	<HStack gap={1} vAlign="center">
		{Array.from({ length: filled }, (_, i) => (
			<Icon key={`full-${i}`} name="sandbox-star" size={16} />
		))}
		{Array.from({ length: empty }, (_, i) => (
			<Icon key={`empty-${i}`} name="sandbox-star" size={16} color="secondary" />
		))}
		<Text type="body" color="secondary">
			{props.rating} ({props.count})
		</Text>
	</HStack>
}

// IMAGES[0] = fallback hero; IMAGES[1..6] = thumbnails (first selected).
const IMAGES = [
	'/template-assets/light-product-1.png',
	'/template-assets/light-product-1.png',
	'/template-assets/light-product-2.png',
	'/template-assets/light-product-3.png',
	'/template-assets/light-product-4.png',
	'/template-assets/light-product-5.png',
	'/template-assets/light-product-3.png',
]

const PRODUCT = {
	name: 'Solstice Mug & Plate Set',
	price: 89.0,
	originalPrice: 119.0,
	description:
		'A hand-thrown mug and plate set that brings quiet warmth to every meal. The mug sits easy in the hand with a generous 12 oz capacity, while the 8-inch plate works for everything from toast to tapas. Each piece is kiln-fired at 2,300°F for a finish that resists chips and stains. Subtle variations in the reactive glaze mean no two sets are exactly alike. Dishwasher and microwave safe.',
	composition:
		'High-fire stoneware clay, wheel-thrown and trimmed by hand. Reactive glaze applied by dipping — color pools and breaks naturally over the clay body. Lead-free and food-safe. Unglazed foot ring reveals the raw clay underneath. Each piece is bisque-fired, glazed, then fired again to cone 10 in a gas reduction kiln.',
	deliveryReturns:
		'Free shipping on all ceramics orders over $75. Each piece is individually wrapped in recycled kraft paper and cushioned for transit. Returns accepted within 30 days — items must be unused and in original packaging. Replacement pieces available individually.',
	dimensions:
		'Mug height: 9.5 cm / 3.75 in. Mug diameter: 8.5 cm / 3.35 in. Capacity: 350 ml / 12 oz. Plate diameter: 20 cm / 8 in. Plate height: 2 cm / 0.75 in. Weight: 680 g / 1.5 lb (set).',
} as const

const COLORS = [
	{ value: 'snow', label: 'Snow' },
	{ value: 'sage', label: 'Sage' },
	{ value: 'charcoal', label: 'Charcoal' },
]

const FINISHES = [
	{ value: 'matte', label: 'Matte' },
	{ value: 'satin', label: 'Satin' },
	{ value: 'speckled', label: 'Speckled' },
]

const fmt = (n: number) => `$${n.toFixed(2)}`

function ImageGallery(props: { selected: number; onSelect: (i: number) => void }) @{
	const heroSrc = IMAGES[props.selected + 1] ?? IMAGES[0]
	const thumbnails = IMAGES.slice(1)

	<VStack gap={3}>
		<AspectRatio ratio={4 / 5}>
			<img style={heroImage} src={heroSrc} alt={PRODUCT.name} />
		</AspectRatio>
		<Grid style={{gap: 'var(--spacing-2)'}} columns={3} >
			{thumbnails.map((src, i) => (
				<AspectRatio key={i} ratio={1}>
					<SelectableCard
						label={`Product image ${i + 1}`}
						isSelected={props.selected === i}
						onChange={() => props.onSelect(i)}
						variant="transparent"
						padding={0}
						width="100%"
						height="100%"
					>
						<img style={thumbImage} src={src} alt={`Product image ${i + 1}`} />
					</SelectableCard>
				</AspectRatio>
			))}
		</Grid>
	</VStack>
}

function ProductInfo() @{
	const [color, setColor] = useState('snow')
	const [finish, setFinish] = useState('matte')
	const [quantity, setQuantity] = useState<number | null>(1)

	const decrement = () => setQuantity((q) => Math.max(1, (q ?? 1) - 1))
	const increment = () => setQuantity((q) => Math.min(10, (q ?? 1) + 1))

	<VStack gap={5}>
		<VStack gap={2}>
			<Heading type="display-2" level={1}>
				{PRODUCT.name}
			</Heading>
			<StarRating rating={4.3} count={128} />
			<HStack gap={2} vAlign="center">
				<Text type="large" weight="bold">
					{fmt(PRODUCT.price)}
				</Text>
				<Text type="body" color="secondary" style={{textDecoration: 'line-through'}}>
					{fmt(PRODUCT.originalPrice)}
				</Text>
				<Badge variant="error" label="Sale" />
			</HStack>
		</VStack>
		<Text type="large" weight="normal">
			{PRODUCT.description}
		</Text>
		<VStack gap={2}>
			<Text type="label">Glaze</Text>
			<VStack hAlign="start">
				<SegmentedControl value={color} onValueChange={setColor} label="Glaze">
					{COLORS.map((c) => (
						<SegmentedControlItem key={c.value} value={c.value} label={c.label} />
					))}
				</SegmentedControl>
			</VStack>
		</VStack>
		<VStack gap={2}>
			<Text type="label">Finish</Text>
			<VStack hAlign="start">
				<SegmentedControl value={finish} onValueChange={setFinish} label="Finish">
					{FINISHES.map((f) => (
						<SegmentedControlItem key={f.value} value={f.value} label={f.label} />
					))}
				</SegmentedControl>
			</VStack>
		</VStack>
		<VStack gap={2}>
			<Text type="label">Quantity</Text>
			<HStack gap={1} vAlign="center">
				<Button
					label="Decrease quantity"
					variant="ghost"
					icon={<Icon name="sandbox-minus" size={16} />}
					clickAction={decrement}
					isDisabled={(quantity ?? 1) <= 1}
					isIconOnly
				/>
				<Center width={100}>
					<NumberInput
						label="Quantity"
						isLabelHidden
						value={quantity}
						onValueChange={setQuantity}
						min={1}
						max={10}
						step={1}
					/>
				</Center>
				<Button
					label="Increase quantity"
					variant="ghost"
					icon={<Icon name="sandbox-plus" size={16} />}
					clickAction={increment}
					isDisabled={(quantity ?? 1) >= 10}
					isIconOnly
				/>
			</HStack>
		</VStack>
		<VStack gap={2}>
			<Button label="Add to Cart" variant="primary" size="lg" clickAction={() => {}} />
			<Button label="Buy it now" size="lg" clickAction={() => {}} />
		</VStack>
		<CollapsibleGroup type="multiple" defaultValue={['composition']}>
			<Divider />
			<Collapsible value="composition" trigger={<Heading level={3}>Composition</Heading>}>
				<Text type="body">{PRODUCT.composition}</Text>
			</Collapsible>
			<Divider />
			<Collapsible
				value="delivery"
				defaultOpen={false}
				trigger={<Heading level={3}>Delivery & Returns</Heading>}
			>
				<Text type="body">{PRODUCT.deliveryReturns}</Text>
			</Collapsible>
			<Divider />
			<Collapsible
				value="dimensions"
				defaultOpen={false}
				trigger={<Heading level={3}>Dimensions</Heading>}
			>
				<Text type="body">{PRODUCT.dimensions}</Text>
			</Collapsible>
			<Divider />
		</CollapsibleGroup>
	</VStack>
}

export function ProductDetailTemplate() @{
	const [selectedThumb, setSelectedThumb] = useState(0)

	<Layout
		height="fill"
		contentWidth={1200}
		content={
			<LayoutContent padding={6}>
				<Grid style={{gap: 'var(--spacing-5)'}} columns={{ minWidth: 320, repeat: 'fit' }} >
					<ImageGallery selected={selectedThumb} onSelect={setSelectedThumb} />
					<VStack gap={0} style={stickyInfo}>
						<ProductInfo />
					</VStack>
				</Grid>
			</LayoutContent>
		}
	/>
}
