// Port of upstream templates/pages/product-gallery/page.tsx (Astryx 0.6.4, MIT) —
// route /templates/product-gallery/.
// GAPS: Grid `gap`/`align` are not props — they move into style.
import { AspectRatio, Button, Card, Grid, Heading, Icon, Layout, LayoutContent, Text, VStack } from '@octane-xplat/ui'

// The only custom CSS is the image fill — there is no Image primitive to
// fill the AspectRatio box with `object-fit` (#2582).
const image = {
	width: '100%',
	height: '100%',
	objectFit: 'cover' as const,
}

interface Product {
	id: number
	name: string
	description: string
	price: number
	image: string
}

const PRODUCTS: Product[] = [
	{
		id: 1,
		name: 'Going places',
		description:
			"Sometimes all it takes is one small thing to turn your whole day around. That's what good design is for.",
		price: 75.0,
		image: '/template-assets/illustrative-horizontal-1.png',
	},
	{
		id: 2,
		name: 'Meeting people',
		description:
			"Sometimes all it takes is one small thing to turn your whole day around. That's what good design is for.",
		price: 80.0,
		image: '/template-assets/illustrative-vertical-1.png',
	},
	{
		id: 3,
		name: 'Seeing things',
		description:
			"Sometimes all it takes is one small thing to turn your whole day around. That's what good design is for.",
		price: 75.0,
		image: '/template-assets/illustrative-horizontal-3.png',
	},
	{
		id: 4,
		name: 'Sharing ideas',
		description:
			"Sometimes all it takes is one small thing to turn your whole day around. That's what good design is for.",
		price: 75.0,
		image: '/template-assets/illustrative-horizontal-4.png',
	},
	{
		id: 5,
		name: 'Making memories',
		description:
			"Sometimes all it takes is one small thing to turn your whole day around. That's what good design is for.",
		price: 60.0,
		image: '/template-assets/illustrative-horizontal-5.png',
	},
	{
		id: 6,
		name: 'Being free',
		description:
			"Sometimes all it takes is one small thing to turn your whole day around. That's what good design is for.",
		price: 80.0,
		image: '/template-assets/illustrative-horizontal-2.png',
	},
]

const fmt = (n: number) => `$${n.toFixed(2)}`

function ProductCard(props: { product: Product }) {
	return (
		<VStack gap={3}>
			<Card padding={0}>
				<AspectRatio ratio={1}>
					<img src={props.product.image} alt={props.product.name} style={image} />
				</AspectRatio>
			</Card>
			<VStack gap={1}>
				<Heading level={2}>{props.product.name}</Heading>
				<Text type="body" color="secondary" maxLines={2}>
					{props.product.description}
				</Text>
				<Text type="large" weight="bold">
					{fmt(props.product.price)}
				</Text>
			</VStack>
		</VStack>
	)
}

export function ProductGalleryTemplate() @{
	<Layout
		height="fill"
		contentWidth={1200}
		content={
			<LayoutContent padding={6}>
				<VStack gap={6}>
					{/* Header — Grid handles responsive stacking */}
					<Grid columns={{ minWidth: 280 }} style={{ gap: 16, alignItems: 'start' }}>
						<Heading level={1}>
							Make every day a little more delightful, one small detail at a time.
						</Heading>
						<VStack gap={3} hAlign="start">
							<Text type="body">
								We believe the smallest details are the ones that matter most. A little color, a
								thoughtful touch, a moment that catches your eye and makes you pause; that’s what
								turns an ordinary day into something worth remembering.
							</Text>
							<Button
								label="Get started"
								variant="primary"
								endContent={<Icon name="sandbox-arrow-right" size={20} color="inherit" />}
							/>
						</VStack>
					</Grid>

					{/* Product Grid — reflows 3 → 2 → 1 columns as width narrows */}
					<Grid columns={{ minWidth: 300 }} style={{ gap: 24 }}>
						{PRODUCTS.map((product) => (
							<ProductCard key={product.id} product={product} />
						))}
					</Grid>
				</VStack>
			</LayoutContent>
		}
	/>
}
