/** @jsxImportSource @octane-xplat/jsx/dom */
import { Field } from '@octane-xplat/ui'
import type { Renderable } from '@octane-xplat/ui'
// Copyright (c) Meta Platforms, Inc. and affiliates.

import './MobileSpacingPage.css'

import { useMemo, useState } from 'octane'
import { AspectRatio } from '@octane-xplat/ui'
import { Badge } from '@octane-xplat/ui'
import { Button } from '@octane-xplat/ui'
import { Center } from '@octane-xplat/ui'
import { Accordion } from '@octane-xplat/ui'
import { Divider } from '@octane-xplat/ui'
import { Icon, registerIcons } from '@octane-xplat/ui'
import { HStack, VStack } from '@octane-xplat/ui'
import { NumberInput } from '@octane-xplat/ui'
import { SegmentedControl, SegmentedControlItem } from '@octane-xplat/ui'
import { SelectableCard } from '@octane-xplat/ui'
import { Selector } from '@octane-xplat/ui'
import { Slider } from '@octane-xplat/ui'
import { Switch } from '@octane-xplat/ui'
import { Table } from '@octane-xplat/ui'
import type { TableColumn } from '@octane-xplat/ui'
import { Text, Heading } from '@octane-xplat/ui'

type ViewMode = 'preview' | 'tokens'
type Viewport = 'mobile' | 'tablet' | 'desktop'
type Behavior = 'current' | 'proposal'
type MobileIntensity = 'recommended' | number
type CssVars = Record<string, string | number> & Record<`--${string}`, string | number>

type SemanticTokenId =
	| 'layout-padding-inline'
	| 'layout-padding-block'
	| 'section-gap'
	| 'card-padding'
	| 'container-region-gap'
	| 'section-padding'
	| 'dialog-padding'
	| 'overlay-region-gap'

type MobileTokenOverrides = Partial<Record<SemanticTokenId, number>>
type MobileTokenOverridesByBase = Record<number, MobileTokenOverrides>

interface SpacingPreset {
	label: string
	value: number
	description: string
}

interface SemanticTokenSpec {
	id: SemanticTokenId
	token: `--${string}`
	label: string
	componentScope: string
	currentMultiplier: number
	shownInPreview: boolean
}

interface TokenTableRow extends Record<string, unknown> {
	id: string
	token: string
	role: string
	scope: string
	small: Renderable
	medium: Renderable
	large: Renderable
	xlarge: Renderable
}

interface OverrideTableRow extends Record<string, unknown> {
	id: SemanticTokenId
	role: string
	token: string
	scope: string
	current: number
	calculated: number
	value: number
}

const SPACING_PRESETS: ReadonlyArray<SpacingPreset> = [
	{ label: 'S', value: 2, description: 'Compact' },
	{ label: 'M', value: 4, description: 'Default' },
	{ label: 'L', value: 6, description: 'Comfortable' },
	{ label: 'XL', value: 8, description: 'Gigantic' },
] as const

const VIEWPORTS: Record<Viewport, { label: string; width: number; height: number }> = {
	mobile: { label: 'Mobile', width: 390, height: 844 },
	tablet: { label: 'Tablet', width: 768, height: 1024 },
	desktop: { label: 'Desktop', width: 1440, height: 900 },
}

const VIEW_OPTIONS: Array<{ label: string; value: ViewMode }> = [
	{ value: 'preview', label: 'Product preview' },
	{ value: 'tokens', label: 'Token values' },
]

const INTENSITY_MIN = 0
const INTENSITY_MAX = 1.5
const INTENSITY_STEP = 0.5

const INTENSITY_OPTIONS = [
	{ value: 0, label: 'None' },
	{ value: 0.5, label: 'Gentle' },
	{ value: 1, label: 'Standard' },
	{ value: 1.5, label: 'Dense' },
]

const INTENSITY_MARKS = INTENSITY_OPTIONS.map(({ value }) => ({ value }))

const SEMANTIC_TOKENS: ReadonlyArray<SemanticTokenSpec> = [
	{
		id: 'layout-padding-inline',
		token: '--astryx-layout-padding-inline',
		label: 'Page inline padding',
		componentScope: 'Layout / page shell',
		currentMultiplier: 4,
		shownInPreview: true,
	},
	{
		id: 'layout-padding-block',
		token: '--astryx-layout-padding-block',
		label: 'Page block padding',
		componentScope: 'Layout / page shell',
		currentMultiplier: 4,
		shownInPreview: true,
	},
	{
		id: 'section-gap',
		token: '--astryx-mobile-section-gap',
		label: 'Major section gap',
		componentScope: 'Opt-in layout regions',
		currentMultiplier: 6,
		shownInPreview: true,
	},
	{
		id: 'card-padding',
		token: '--astryx-card-padding',
		label: 'Card/panel inset',
		componentScope: 'Card, ClickableCard, SelectableCard',
		currentMultiplier: 4,
		shownInPreview: true,
	},
	{
		id: 'container-region-gap',
		token: '--astryx-mobile-container-region-gap',
		label: 'Owned container region gap',
		componentScope: 'Regions inside cards/panels',
		currentMultiplier: 3,
		shownInPreview: true,
	},
	{
		id: 'section-padding',
		token: '--astryx-section-padding',
		label: 'Section inset',
		componentScope: 'Section',
		currentMultiplier: 4,
		shownInPreview: false,
	},
	{
		id: 'dialog-padding',
		token: '--astryx-dialog-padding',
		label: 'Dialog/drawer inset',
		componentScope: 'Dialog, Drawer, Bottom Sheet',
		currentMultiplier: 4,
		shownInPreview: false,
	},
	{
		id: 'overlay-region-gap',
		token: '--astryx-mobile-overlay-region-gap',
		label: 'Owned overlay region gap',
		componentScope: 'Regions inside overlays',
		currentMultiplier: 3,
		shownInPreview: false,
	},
] as const

const EXPLICIT_MOBILE_PROFILES: Record<number, Record<SemanticTokenId, number>> = {
	2: {
		'layout-padding-inline': 8,
		'layout-padding-block': 8,
		'section-gap': 12,
		'card-padding': 8,
		'container-region-gap': 6,
		'section-padding': 8,
		'dialog-padding': 8,
		'overlay-region-gap': 6,
	},
	4: {
		'layout-padding-inline': 14,
		'layout-padding-block': 14,
		'section-gap': 22,
		'card-padding': 14,
		'container-region-gap': 10,
		'section-padding': 14,
		'dialog-padding': 14,
		'overlay-region-gap': 10,
	},
	6: {
		'layout-padding-inline': 18,
		'layout-padding-block': 18,
		'section-gap': 30,
		'card-padding': 18,
		'container-region-gap': 12,
		'section-padding': 18,
		'dialog-padding': 18,
		'overlay-region-gap': 12,
	},
	8: {
		'layout-padding-inline': 24,
		'layout-padding-block': 24,
		'section-gap': 40,
		'card-padding': 24,
		'container-region-gap': 16,
		'section-padding': 24,
		'dialog-padding': 24,
		'overlay-region-gap': 16,
	},
}

const PRODUCT_IMAGES = [
	'/template-assets/light-product-1.png',
	'/template-assets/light-product-1.png',
	'/template-assets/light-product-2.png',
	'/template-assets/light-product-3.png',
	'/template-assets/light-product-4.png',
	'/template-assets/light-product-5.png',
	'/template-assets/light-product-3.png',
] as const

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
}

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

const stickyInfo: Record<string, string | number> = {
	position: 'sticky',
	top: 'var(--spacing-8)',
	alignSelf: 'start',
}

function getRecommendedIntensity(spacingBase: number): number {
	if (spacingBase <= 2) {
		return 0
	}

	if (spacingBase <= 4) {
		return 0.5
	}

	return 1
}

function getIntensityMultiplier(spacingBase: number, intensity: MobileIntensity): number {
	if (typeof intensity === 'number') {
		return intensity
	}

	return getRecommendedIntensity(spacingBase)
}

function getIntensityLabel(value: number): string {
	const matchingMark = INTENSITY_OPTIONS.find((mark) => mark.value === value)
	if (matchingMark != null) {
		return matchingMark.label
	}

	return `${value}×`
}

function formatPx(value: number): string {
	return Number.isInteger(value) ? `${value}px` : `${value.toFixed(1)}px`
}

function getIntensityRateLabel(spacingBase: number, intensity: number): string {
	const change = spacingBase * intensity
	return change === 0 ? '0px' : `−${formatPx(change)}`
}

function getFormulaValue(
	value: number,
	spacingBase: number,
	intensity: MobileIntensity = 'recommended',
): number {
	return Math.max(0, value - spacingBase * getIntensityMultiplier(spacingBase, intensity))
}

function getCurrentProfile(spacingBase: number): Record<SemanticTokenId, number> {
	return Object.fromEntries(
		SEMANTIC_TOKENS.map((item) => [item.id, spacingBase * item.currentMultiplier]),
	) as Record<SemanticTokenId, number>
}

function getRecommendedMobileProfile(spacingBase: number): Record<SemanticTokenId, number> {
	const explicitProfile = EXPLICIT_MOBILE_PROFILES[spacingBase]
	if (explicitProfile != null) {
		return explicitProfile
	}

	return Object.fromEntries(
		SEMANTIC_TOKENS.map((item) => [
			item.id,
			getFormulaValue(spacingBase * item.currentMultiplier, spacingBase),
		]),
	) as Record<SemanticTokenId, number>
}

function getMobileProfile(
	spacingBase: number,
	intensity: MobileIntensity = 'recommended',
	overrides: MobileTokenOverrides = {},
): Record<SemanticTokenId, number> {
	const baseProfile =
		intensity === 'recommended'
			? getRecommendedMobileProfile(spacingBase)
			: (Object.fromEntries(
					SEMANTIC_TOKENS.map((item) => [
						item.id,
						getFormulaValue(spacingBase * item.currentMultiplier, spacingBase, intensity),
					]),
				) as Record<SemanticTokenId, number>)

	return {
		...baseProfile,
		...overrides,
	}
}

function getActiveProfile(
	spacingBase: number,
	viewport: Viewport,
	behavior: Behavior,
	intensity: MobileIntensity = 'recommended',
	overrides: MobileTokenOverrides = {},
): Record<SemanticTokenId, number> {
	if (viewport === 'mobile' && behavior === 'proposal') {
		return getMobileProfile(spacingBase, intensity, overrides)
	}

	return getCurrentProfile(spacingBase)
}

function getSemanticVariables(
	profile: Record<SemanticTokenId, number>,
): Record<string, string | number> {
	const vars: CssVars = {}
	for (const item of SEMANTIC_TOKENS) {
		vars[item.token] = `${profile[item.id]}px`
	}

	return vars
}

function renderValuePair(current: number, mobile: number): Renderable {
	return (
		<HStack gap={1} wrap="wrap">
			<Text type="body">{current}px</Text>
			<Text type="body" color="secondary">
				→
			</Text>
			<span className={['MobileSpacingPage-changedValue'].filter(Boolean).join(' ')}>
				{mobile}px
			</span>
		</HStack>
	)
}

function getTokenRows(
	intensity: MobileIntensity,
	overridesByBase: MobileTokenOverridesByBase,
): TokenTableRow[] {
	return SEMANTIC_TOKENS.map((item) => {
		const cells = SPACING_PRESETS.map((preset) => {
			const current = preset.value * item.currentMultiplier
			const mobile = getMobileProfile(preset.value, intensity, overridesByBase[preset.value])[
				item.id
			]

			return renderValuePair(current, mobile)
		})

		return {
			id: item.id,
			token: item.token,
			role: item.label,
			scope: item.componentScope,
			small: cells[0],
			medium: cells[1],
			large: cells[2],
			xlarge: cells[3],
		}
	})
}

function SpacingControl({ value, onChange }: { value: number; onChange: (value: number) => void }) {
	const selectedPreset = SPACING_PRESETS.some((option) => option.value === value)
		? String(value)
		: null

	return (
		<div className={['MobileSpacingPage-spacingControl'].filter(Boolean).join(' ')}>
			<SegmentedControl
				label="Source spacing preset"
				size="sm"
				value={selectedPreset ?? ''}
				onValueChange={(next: string) => {
					onChange(Number(next))
				}}
			>
				{SPACING_PRESETS.map((option) => (
					<SegmentedControlItem
						key={option.value}
						label={option.label}
						value={String(option.value)}
					/>
				))}
			</SegmentedControl>
			<Field label="Custom spacing base" isLabelHidden>
				<NumberInput
					label="Custom spacing base"
					isLabelHidden
					value={value}
					min={0}
					max={16}
					step={2}
					units="px"
					size="sm"
					className="authored-number-96"

					onValueChange={(next) => {
						if (typeof next === 'number') {
							onChange(next)
						}
					}}
				/>
			</Field>
		</div>
	)
}

function IntensityControl({
	spacingBase,
	value,
	onChange,
}: {
	spacingBase: number
	value: MobileIntensity
	onChange: (value: MobileIntensity) => void
}) {
	const resolvedValue = getIntensityMultiplier(spacingBase, value)
	const rateLabel = getIntensityRateLabel(spacingBase, resolvedValue)

	return (
		<div className={['MobileSpacingPage-intensityControl'].filter(Boolean).join(' ')}>
			<div className={['MobileSpacingPage-intensitySlider'].filter(Boolean).join(' ')}>
				<Slider
					label="Mobile spacing intensity"
					isLabelHidden
					value={resolvedValue}
					min={INTENSITY_MIN}
					max={INTENSITY_MAX}
					step={INTENSITY_STEP}
					marks={INTENSITY_MARKS}
					valueDisplay="none"
					formatValue={(next) => getIntensityLabel(next)}
					onValueChange={(next) => {
						if (typeof next === 'number') {
							onChange(next)
						}
					}}
				/>
			</div>
			<Text
				type="label"
				color="secondary"
				className={['MobileSpacingPage-intensityRate'].filter(Boolean).join(' ')}
			>
				Intensity · {rateLabel}
			</Text>
		</div>
	)
}

function MobileTokenOverrideControls({
	spacingBase,
	intensity,
	overrides,
	onChange,
	onReset,
}: {
	spacingBase: number
	intensity: MobileIntensity
	overrides: MobileTokenOverrides
	onChange: (id: SemanticTokenId, value: number) => void
	onReset: () => void
}) {
	const currentProfile = getCurrentProfile(spacingBase)
	const calculatedProfile = getMobileProfile(spacingBase, intensity)
	const hasOverrides = SEMANTIC_TOKENS.some((item) => overrides[item.id] != null)
	const overrideRows: OverrideTableRow[] = SEMANTIC_TOKENS.map((item) => ({
		id: item.id,
		role: item.label,
		token: item.token,
		scope: item.componentScope,
		current: currentProfile[item.id],
		calculated: calculatedProfile[item.id],
		value: overrides[item.id] ?? calculatedProfile[item.id],
	}))

	const overrideColumns: TableColumn<OverrideTableRow>[] = [
		{ key: 'role', header: 'Role' },
		{
			key: 'token',
			header: 'Token',
			renderCell: (row) => <Text type="code">{row.token}</Text>,
		},
		{ key: 'scope', header: 'Scope' },
		{
			key: 'current',
			header: 'Current',
			renderCell: (row) => <Text type="body">{row.current}px</Text>,
		},
		{
			key: 'calculated',
			header: 'Calculated',
			renderCell: (row) => <Text type="body">{row.calculated}px</Text>,
		},
		{
			key: 'value',
			header: 'Mobile value',
			renderCell: (row) => (
				<Field label={`${row.role} mobile value`} isLabelHidden>
					<NumberInput
						label={`${row.role} mobile value`}
						isLabelHidden
						value={row.value}
						min={0}
						max={128}
						step={1}
						units="px"
						size="sm"
						className="authored-number-112"

						onValueChange={(next) => onChange(row.id, next ?? row.calculated)}
					/>
				</Field>
			),
		},
	]

	return (
		<VStack gap={2}>
			<HStack gap={2} justify="between" wrap="wrap">
				<VStack gap={0.5}>
					<Heading level={3}>Customize mobile token values</Heading>
					<Text type="body" color="secondary">
						Overrides apply to the selected spacing preset when Mobile proposal is enabled.
					</Text>
				</VStack>
				<Button
					label="Reset custom values"
					size="sm"
					isDisabled={!hasOverrides}
					clickAction={onReset}
				/>
			</HStack>
			<Table<OverrideTableRow>
				data={overrideRows}
				columns={overrideColumns}
				idKey="id"
				density="spacious"
				dividers="rows"
			/>
		</VStack>
	)
}

function StarRating({ rating, count }: { rating: number; count: number }) {
	const filled = Math.round(rating)
	const empty = 5 - filled

	return (
		<HStack gap={1} vAlign="center">
			{Array.from({ length: filled }, (_, i) => (
				<Icon key={`full-${i}`} name="authored-star-solid" size={16} />
			))}
			{Array.from({ length: empty }, (_, i) => (
				<Icon key={`empty-${i}`} name="authored-star" size={16} />
			))}
			<Text type="body" color="secondary">
				{rating} ({count})
			</Text>
		</HStack>
	)
}

function ProductImageGallery({
	selected,
	onSelect,
}: {
	selected: number
	onSelect: (i: number) => void
}) {
	const thumbnails = PRODUCT_IMAGES.slice(1)

	return (
		<div className={['MobileSpacingPage-productMediaStack'].filter(Boolean).join(' ')}>
			<div className={['MobileSpacingPage-thumbnailGrid'].filter(Boolean).join(' ')}>
				{thumbnails.map((src, i) => (
					<div
						key={`${src}-${i}`}
						className={['MobileSpacingPage-thumbnailCell'].filter(Boolean).join(' ')}
					>
						<AspectRatio ratio={1}>
							<SelectableCard
								label={`Product image ${i + 1}`}
								isSelected={selected === i}
								onChange={() => onSelect(i)}
								variant="transparent"
								padding={0}
								width="100%"
								height="100%"
							>
								<img
									src={src}
									alt={`Product image ${i + 1}`}
									className={['MobileSpacingPage-image'].filter(Boolean).join(' ')}
								/>
							</SelectableCard>
						</AspectRatio>
					</div>
				))}
			</div>
		</div>
	)
}

function ProductInfo() {
	const [color, setColor] = useState('snow')
	const [finish, setFinish] = useState('matte')
	const [quantity, setQuantity] = useState<number | null>(1)

	const decrement = () => setQuantity((q) => Math.max(1, (q ?? 1) - 1))
	const increment = () => setQuantity((q) => Math.min(10, (q ?? 1) + 1))

	return (
		<div className={['MobileSpacingPage-productInfoRegions'].filter(Boolean).join(' ')}>
			<VStack gap={2}>
				<Text type="display-2">{PRODUCT.name}</Text>
				<StarRating rating={4.3} count={128} />
				<HStack gap={2} vAlign="center">
					<Text type="large" weight="bold">
						{fmt(PRODUCT.price)}
					</Text>
					<Text type="body" color="secondary" className="authored-strikethrough">
						{fmt(PRODUCT.originalPrice)}
					</Text>
					<Badge>{'Sale'}</Badge>
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
						icon={<Icon name="authored-minus" size={16} />}
						clickAction={decrement}
						isDisabled={(quantity ?? 1) <= 1}
						isIconOnly
					/>
					<Center width={100}>
						<Field label="Quantity" isLabelHidden>
							<NumberInput
								label="Quantity"
								isLabelHidden
								value={quantity}
								onValueChange={(v) => setQuantity(v === null ? null : Math.round(v))}
								min={1}
								max={10}
								step={1}
							/>
						</Field>
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
				<Button label="Add to Cart" variant="primary" size="lg" />
				<Button label="Buy it now" size="lg" />
			</VStack>
			<Accordion
				multiple
				defaultOpen={['composition']}
				items={[
					{
						key: 'composition',
						header: <Heading level={3}>Composition</Heading>,
						content: <Text>{PRODUCT.composition}</Text>,
					},
					{
						key: 'delivery',
						header: <Heading level={3}>Delivery &amp; Returns</Heading>,
						content: <Text>{PRODUCT.deliveryReturns}</Text>,
					},
					{
						key: 'dimensions',
						header: <Heading level={3}>Dimensions</Heading>,
						content: <Text>{PRODUCT.dimensions}</Text>,
					},
				]}
			/>
		</div>
	)
}

function ProductDetailSemanticFixture({
	viewport,
	spacingBase,
	behavior,
	mobileIntensity,
	mobileOverrides,
}: {
	viewport: Viewport
	spacingBase: number
	behavior: Behavior
	mobileIntensity: MobileIntensity
	mobileOverrides: MobileTokenOverrides
}) {
	const [selectedThumb, setSelectedThumb] = useState(0)
	const profile = useMemo(
		() => getActiveProfile(spacingBase, viewport, behavior, mobileIntensity, mobileOverrides),
		[spacingBase, viewport, behavior, mobileIntensity, mobileOverrides],
	)

	const semanticVars = useMemo(() => getSemanticVariables(profile), [profile])
	const isStacked = viewport !== 'desktop'

	return (
		<div
			className={['MobileSpacingPage-previewFrame'].filter(Boolean).join(' ')}
			style={{
				...semanticVars,
				width: VIEWPORTS[viewport].width,
				height: VIEWPORTS[viewport].height,
				maxWidth: '100%',
			}}
		>
			<div className={['MobileSpacingPage-semanticPage'].filter(Boolean).join(' ')}>
				<VStack gap={4}>
					<div
						className={['MobileSpacingPage-productGrid'].filter(Boolean).join(' ')}
						style={{
							gridTemplateColumns: isStacked ? '1fr' : 'minmax(0, 1.1fr) minmax(320px, 0.9fr)',
						}}
					>
						<ProductImageGallery selected={selectedThumb} onSelect={setSelectedThumb} />
						<div
							className={['MobileSpacingPage-productInfoPanel'].filter(Boolean).join(' ')}
							style={isStacked ? undefined : stickyInfo}
						>
							<ProductInfo />
						</div>
					</div>
				</VStack>
			</div>
		</div>
	)
}

const tokenColumns: TableColumn<TokenTableRow>[] = [
	{ key: 'role', header: 'Role' },
	{
		key: 'token',
		header: 'Token',
		renderCell: (row) => <Text type="code">{row.token}</Text>,
	},
	{ key: 'scope', header: 'Component scope' },
	{ key: 'small', header: 'S · 2px base', renderCell: (row) => row.small },
	{ key: 'medium', header: 'M · 4px base', renderCell: (row) => row.medium },
	{ key: 'large', header: 'L · 6px base', renderCell: (row) => row.large },
	{ key: 'xlarge', header: 'XL · 8px base', renderCell: (row) => row.xlarge },
]

export function MobileSpacingPage() {
	const [viewMode, setViewMode] = useState<ViewMode>('preview')
	const [viewport, setViewport] = useState<Viewport>('mobile')
	const [behavior, setBehavior] = useState<Behavior>('proposal')
	const [mobileIntensity, setMobileIntensity] = useState<MobileIntensity>('recommended')
	const [spacingBase, setSpacingBase] = useState(4)
	const [mobileOverridesByBase, setMobileOverridesByBase] = useState<MobileTokenOverridesByBase>({})
	const activeOverrides = mobileOverridesByBase[spacingBase] ?? {}
	const setMobileOverride = (id: SemanticTokenId, value: number) => {
		setMobileOverridesByBase((prev) => ({
			...prev,
			[spacingBase]: {
				...prev[spacingBase],
				[id]: value,
			},
		}))
	}

	const resetMobileOverrides = () => {
		setMobileOverridesByBase((prev) => {
			const next = { ...prev }
			delete next[spacingBase]
			return next
		})
	}

	return (
		<div className={['MobileSpacingPage-page'].filter(Boolean).join(' ')}>
			<div className={['MobileSpacingPage-toolbar'].filter(Boolean).join(' ')}>
				<div className={['MobileSpacingPage-toolbarRow'].filter(Boolean).join(' ')}>
					<div className={['MobileSpacingPage-toolbarTitle'].filter(Boolean).join(' ')}>
						<Heading level={1}>Mobile spacing</Heading>
						<Selector
							label="View"
							isLabelHidden
							size="sm"
							width={180}
							options={VIEW_OPTIONS}
							value={viewMode}
							onValueChange={(next) => setViewMode(next as ViewMode)}
						/>
						<SegmentedControl
							label="Viewport"
							size="sm"
							value={viewport}
							onValueChange={(next) => setViewport(next as Viewport)}
						>
							<SegmentedControlItem
								value="desktop"
								label={VIEWPORTS.desktop.label}
								icon={<Icon name="authored-desktop" size={16} />}
								isLabelHidden
							/>
							<SegmentedControlItem
								value="tablet"
								label={VIEWPORTS.tablet.label}
								icon={<Icon name="authored-tablet" size={16} />}
								isLabelHidden
							/>
							<SegmentedControlItem
								value="mobile"
								label={VIEWPORTS.mobile.label}
								icon={<Icon name="authored-phone" size={16} />}
								isLabelHidden
							/>
						</SegmentedControl>
						<div
							aria-hidden="true"
							className={['MobileSpacingPage-toolbarDivider'].filter(Boolean).join(' ')}
						/>
						<SpacingControl value={spacingBase} onChange={setSpacingBase} />
					</div>

					<div className={['MobileSpacingPage-controls'].filter(Boolean).join(' ')}>
						{viewport === 'mobile' && (
							<>
								<div
									aria-hidden="true"
									className={['MobileSpacingPage-toolbarDivider'].filter(Boolean).join(' ')}
								/>
								<Switch
									label="Mobile proposal"
									value={behavior === 'proposal'}
									onChange={(checked) => setBehavior(checked ? 'proposal' : 'current')}
								/>
								{behavior === 'proposal' && (
									<IntensityControl
										spacingBase={spacingBase}
										value={mobileIntensity}
										onChange={setMobileIntensity}
									/>
								)}
							</>
						)}
					</div>
				</div>
			</div>

			<div className={['MobileSpacingPage-stage'].filter(Boolean).join(' ')}>
				{viewMode === 'preview' ? (
					<ProductDetailSemanticFixture
						viewport={viewport}
						spacingBase={spacingBase}
						behavior={behavior}
						mobileIntensity={mobileIntensity}
						mobileOverrides={activeOverrides}
					/>
				) : (
					<div className={['MobileSpacingPage-panel'].filter(Boolean).join(' ')}>
						<VStack gap={4}>
							<VStack gap={1}>
								<Heading level={2}>Mobile semantic spacing contract</Heading>
								<Text type="body" color="secondary">
									These are the semantic token roles the preview exercises. The formula is a design
									tool for candidate values; the theme should publish explicit token values per
									spacing preset.
								</Text>
							</VStack>
							<div className={['MobileSpacingPage-formulaPanel'].filter(Boolean).join(' ')}>
								<VStack gap={1}>
									<Text type="label">Candidate formula</Text>
									<Text type="code">mobile(s, base, intensity) = s - base × intensity</Text>
									<Text type="body" color="secondary">
										Recommended intensity keeps compact unchanged, makes default slightly tighter,
										and uses a full one-step reduction for L and XL. The slider can override that
										intensity, and custom token values still win.
									</Text>
								</VStack>
							</div>
							<MobileTokenOverrideControls
								spacingBase={spacingBase}
								intensity={mobileIntensity}
								overrides={activeOverrides}
								onChange={setMobileOverride}
								onReset={resetMobileOverrides}
							/>
							<VStack gap={2}>
								<Heading level={3}>Semantic tokens across spacing presets</Heading>
								<Table<TokenTableRow>
									data={getTokenRows(mobileIntensity, mobileOverridesByBase)}
									columns={tokenColumns}
									idKey="id"
									density="spacious"
									dividers="rows"
								/>
							</VStack>
						</VStack>
					</div>
				)}
			</div>
		</div>
	)
}

registerIcons({
	'authored-desktop': {
		markup:
			'<rect x="2" y="3" width="20" height="14" rx="2" fill="none" stroke="currentColor"/><path d="M8 21h8m-4-4v4" stroke="currentColor"/>',
	},
	'authored-phone': {
		markup: '<rect x="6" y="2" width="12" height="20" rx="2" fill="none" stroke="currentColor"/>',
	},
	'authored-tablet': {
		markup: '<rect x="4" y="2" width="16" height="20" rx="2" fill="none" stroke="currentColor"/>',
	},
	'authored-minus': { markup: '<path d="M5 12h14" stroke="currentColor"/>' },
	'authored-star': {
		markup:
			'<path d="m12 3 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z" fill="none" stroke="currentColor"/>',
	},
	'authored-star-solid': {
		markup: '<path d="m12 3 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z" fill="currentColor"/>',
	},
})

function ComputerDesktopIcon(props: { className?: string }) {
	return <Icon name="authored-desktop" size={20} className={props.className} />
}

function DevicePhoneMobileIcon(props: { className?: string }) {
	return <Icon name="authored-phone" size={20} className={props.className} />
}

function DeviceTabletIcon(props: { className?: string }) {
	return <Icon name="authored-tablet" size={20} className={props.className} />
}

function MinusIcon(props: { className?: string }) {
	return <Icon name="authored-minus" size={20} className={props.className} />
}

function PlusIcon(props: { className?: string }) {
	return <Icon name="sandbox-plus" size={20} className={props.className} />
}

function StarIcon(props: { className?: string }) {
	return <Icon name="authored-star" size={20} className={props.className} />
}

function StarIconSolid(props: { className?: string }) {
	return <Icon name="authored-star-solid" size={20} className={props.className} />
}
