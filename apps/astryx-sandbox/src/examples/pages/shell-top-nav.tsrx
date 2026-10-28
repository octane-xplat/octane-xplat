// Port of upstream templates/pages/shell-top-nav/page.tsx (Astryx 0.6.4, MIT) —
// route /templates/shell-top-nav/.
// GAPS: `stylex` rules → styles/shell-top-nav.css classes; `Icon icon={Cmp}`
// → registered `Icon name`; Grid `gap` is not a prop — it moves into style.
import {
	AppShell, Badge, Button, Card, Grid, Icon, IconButton, NavIcon, Stack, TopNav,
	TopNavHeading, TopNavItem, TopNavMegaMenu, TopNavMegaMenuFeaturedCard,
	TopNavMegaMenuItem, VStack,
} from '@octane-xplat/ui'
import './styles/shell-top-nav.css'

type MegaItem = { name: string; tagline: string; icon: string }

// Shop and Brands each render 8 items — the mega menu's built-in 2-column grid
// lays them out as 2 columns × 4 rows, alongside a featured card.
const SHOP_ITEMS: MegaItem[] = [
	{ name: 'New Arrivals', tagline: 'The latest drops', icon: 'sandbox-sparkles' },
	{ name: 'Womenswear', tagline: 'Dresses, knitwear & more', icon: 'sandbox-swatch' },
	{ name: 'Menswear', tagline: 'Shirts, tailoring & more', icon: 'sandbox-tag' },
	{ name: 'Home', tagline: 'Bedding, lighting & décor', icon: 'sandbox-home-modern' },
	{ name: 'Beauty', tagline: 'Skincare, fragrance & makeup', icon: 'sandbox-face-smile' },
	{ name: 'Accessories', tagline: 'Bags, hats & sunglasses', icon: 'sandbox-shopping-bag' },
	{ name: 'Sale', tagline: 'Up to 50% off', icon: 'sandbox-receipt-percent' },
	{ name: 'Gift Cards', tagline: 'The perfect present', icon: 'sandbox-gift' },
]

const BRAND_ITEMS: MegaItem[] = [
	{ name: 'Aether', tagline: 'Performance essentials', icon: 'sandbox-sparkles' },
	{ name: 'Northwind', tagline: 'Outdoor & technical', icon: 'sandbox-cloud' },
	{ name: 'Loomwell', tagline: 'Everyday knitwear', icon: 'sandbox-bolt' },
	{ name: 'Verdant', tagline: 'Sustainable basics', icon: 'sandbox-hero-sun' },
	{ name: 'Studio Mara', tagline: 'Modern tailoring', icon: 'sandbox-star' },
	{ name: 'Atelier Kos', tagline: 'Limited ateliers', icon: 'sandbox-fire' },
	{ name: 'Rue & Co', tagline: 'City streetwear', icon: 'sandbox-globe' },
	{ name: 'Halden', tagline: 'Minimal staples', icon: 'sandbox-hero-moon' },
]

const CATEGORY_TILES = [
	'New Arrivals',
	'Womenswear',
	'Menswear',
	'Home & Living',
	'Beauty',
	'Accessories',
]

// Wraps the 8 items in a fixed-width 2-column grid so every mega menu's item
// area is exactly the same width regardless of its content.
function MegaItems(props: { items: MegaItem[] }) {
	return (
		<Stack className="tp-shell-top-nav-mega-items">
			<Grid columns={2} style={{ gap: 8 }}>
				{props.items.map((item) => (
					<TopNavMegaMenuItem
						key={item.name}
						title={item.name}
						description={item.tagline}
						icon={<Icon name={item.icon} size={20} color="secondary" />}
						href="#"
					/>
				))}
			</Grid>
		</Stack>
	)
}

// Pins the featured card to a fixed width so both panels match exactly.
function MegaFeatured(props: {
	title: string
	description: string
	image: string
	imageAlt: string
	linkLabel: string
	linkHref: string
}) {
	return (
		<Stack className="tp-shell-top-nav-mega-featured">
			<TopNavMegaMenuFeaturedCard
				title={props.title}
				description={props.description}
				image={props.image}
				imageAlt={props.imageAlt}
				linkLabel={props.linkLabel}
				linkHref={props.linkHref}
			/>
		</Stack>
	)
}

export function ShellTopNavTemplate() @{
	<AppShell
		variant="surface"
		contentPadding={6}
		style={{ height: '100%', minHeight: 0 }}
		topNav={
			<TopNav
				label="Lumen storefront navigation"
				heading={
					<TopNavHeading
						heading="Lumen"
						logo={<NavIcon icon={<Icon name="sandbox-shopping-bag" size={16} />} />}
						headingHref="#"
					/>
				}
				centerContent={
					<>
						<TopNavMegaMenu
							label="Shop"
							items={<MegaItems items={SHOP_ITEMS} />}
							featured={
								<MegaFeatured
									title="The Autumn Edit"
									description="Layering staples in warm, earthy tones."
									image="/template-assets/texture-beige-horizontal-1.png"
									imageAlt="Autumn collection lookbook"
									linkLabel="Shop the edit"
									linkHref="#autumn-edit"
								/>
							}
						/>
						<TopNavMegaMenu
							label="Brands"
							items={<MegaItems items={BRAND_ITEMS} />}
							featured={
								<MegaFeatured
									title="Meet Studio Mara"
									description="Modern tailoring, made to last."
									image="/template-assets/texture-beige-horizontal-2.png"
									imageAlt="Studio Mara lookbook"
									linkLabel="Discover the label"
									linkHref="#studio-mara"
								/>
							}
						/>
						<TopNavItem label="Sale" href="#" />
						<TopNavItem label="Service" href="#" />
					</>
				}
				endContent={
					<>
						<IconButton
							label="Search products"
							tooltip="Search"
							variant="ghost"
							icon={<Icon name="sandbox-magnifying-glass" size={16} />}
						/>
						<Button label="Sign in" variant="ghost" />
						<Button
							label="Checkout"
							variant="primary"
							icon={<Icon name="sandbox-shopping-cart" size={16} />}
							endContent={<Badge label={3} />}
						/>
					</>
				}
			/>
		}
	>
		<VStack gap={10} className="tp-shell-top-nav-content-max">
			<Card variant="muted" padding={0} width="100%" height={360} />

			{[0, 1, 2].map((section) => (
				<VStack key={section} gap={4}>
					<Card variant="muted" padding={0} width={200} height={24} />
					<Grid columns={{ minWidth: 160, repeat: 'fit' }} style={{ gap: 16 }}>
						{CATEGORY_TILES.map((tile) => (
							<VStack key={tile} gap={2}>
								<Card variant="muted" padding={0} width="100%" height={120} />
								<Card variant="muted" padding={0} width="60%" height={14} />
							</VStack>
						))}
					</Grid>
				</VStack>
			))}
		</VStack>
	</AppShell>
}
