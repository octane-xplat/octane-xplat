// Port of upstream templates/pages/canvas-editor/page.tsx (Astryx 0.6.4,
// MIT) — route /templates/canvas-editor/.
// CONDENSED PORT: upstream is ~2900 lines (HSV color picker with pointer
// tracking, per-property shadow/filter editors, canvas drag handles). This
// preserves the editor shell contract: menubar-in-dropdown, document tabs
// (add/close), tool rail with layer tree, zoom-scaled canvas with selectable
// layers, and a resizable inspector editing the selected layer's position,
// text and image properties. GAPS: custom HSV picker → native color input +
// hex text field; pointer-drag canvas manipulation → numeric axis inputs.
import { useRef, useState } from 'octane'
import {
	Badge, Button, Card, Center, CheckboxInput, Divider, DropdownMenu,
	Heading, HStack, Icon, IconButton, Layout, LayoutContent,
	LayoutHeader, LayoutPanel, List, ListItem, NumberInput, ResizeHandle,
	Section, Selector, StackItem, Switch, Tab, TabList, Text, TextInput,
	TreeList, useResizable, VStack,
} from '@octane-xplat/ui'

type LayerKind = 'text' | 'image'
type ThemeMode = 'light' | 'dark' | 'system'
type AlignX = 'start' | 'center' | 'end' | 'justify'
type AlignY = 'start' | 'center' | 'end'

interface Filters {
	blur: number
	brightness: number
	contrast: number
	grayscale: number
	hue: number
	invert: number
	opacity: number
	saturate: number
	sepia: number
}

interface Shadow {
	x: number
	y: number
	blur: number
	spread: number
	color: string
}

interface Layer {
	id: string
	name: string
	kind: LayerKind
	x: number
	y: number
	width: number
	height: number
	rotation: number
	paddingInline: number
	paddingBlock: number
	radius: number
	isLocked: boolean
	content: string
	border?: string
	fill?: string
	shadow?: Shadow
	family?: string
	weight?: string
	color?: string
	size?: number
	line?: number
	tracking?: number
	alignX?: AlignX
	alignY?: AlignY
	isItalic?: boolean
	fit?: string
	filters?: Filters
}

interface DocumentTabData {
	id: string
	name: string
}

const FRAME = { width: 1080, height: 1920 }
const PHOTO_LAYER_SRC = '/template-assets/moody-scene-vertical-1.png'

const NO_FILTERS: Filters = {
	blur: 0, brightness: 100, contrast: 100, grayscale: 0, hue: 0,
	invert: 0, opacity: 100, saturate: 100, sepia: 0,
}

const NO_SHADOW: Shadow = { x: 0, y: 0, blur: 0, spread: 0, color: '#000000' }

const ZOOM_OPTIONS = [
	{ value: '0.25', label: '25%' },
	{ value: '0.4', label: '40%' },
	{ value: '0.6', label: '60%' },
	{ value: '0.8', label: '80%' },
	{ value: '1', label: '100%' },
]

const FONT_OPTIONS = [
	{ value: 'Anton', label: 'Anton' },
	{ value: 'Archivo Black', label: 'Archivo Black' },
	{ value: 'Bebas Neue', label: 'Bebas Neue' },
	{ value: 'Inter Tight', label: 'Inter Tight' },
]

const WEIGHT_OPTIONS = [
	{ value: 'Regular', label: 'Regular' },
	{ value: 'Medium', label: 'Medium' },
	{ value: 'Semibold', label: 'Semibold' },
	{ value: 'Bold', label: 'Bold' },
]

const EXPORT_FORMATS = [
	'PNG at 1×', 'PNG at 2×', 'PNG at 4×', 'JPG at 1×', 'JPG at 2×', 'WebP at 1×', 'PDF',
]

const INITIAL_TABS: DocumentTabData[] = [
	{ id: 'poster', name: 'Salzburg poster' },
	{ id: 'brand', name: 'Brand sheet' },
	{ id: 'draft', name: 'Untitled draft' },
]

const INITIAL_LAYERS: Layer[] = [
	{
		id: 'headline', name: 'Headline', kind: 'text',
		x: 56, y: 136, width: 968, height: 300, rotation: 0,
		paddingInline: 0, paddingBlock: 0, radius: 0, isLocked: false,
		content: 'A weekend in Salzburg', fill: '#111111',
		family: 'Anton', weight: 'Regular', color: '#ffffff', size: 128,
		line: 1.1, tracking: 0, alignX: 'start', alignY: 'start',
	},
	{
		id: 'dateline', name: 'Dateline', kind: 'text',
		x: 56, y: 470, width: 968, height: 60, rotation: 0,
		paddingInline: 0, paddingBlock: 0, radius: 0, isLocked: false,
		content: 'July 17 – 21 · five days in the Alps', fill: '#111111',
		family: 'Inter Tight', weight: 'Medium', color: '#ffffff', size: 32,
		line: 1.3, tracking: 0.02, alignX: 'start', alignY: 'start',
	},
	{
		id: 'photo', name: 'Photo', kind: 'image',
		x: 0, y: 0, width: 1080, height: 1920, rotation: 0,
		paddingInline: 0, paddingBlock: 0, radius: 0, isLocked: true,
		content: 'Moody alpine scene at dusk', fit: 'cover',
		filters: { ...NO_FILTERS, brightness: 88, saturate: 110 },
	},
]

const filterCss = (f?: Filters): string => {
	if (!f) {return 'none'}
	const parts = [
		f.blur ? `blur(${f.blur}px)` : '',
		f.brightness !== 100 ? `brightness(${f.brightness}%)` : '',
		f.contrast !== 100 ? `contrast(${f.contrast}%)` : '',
		f.grayscale ? `grayscale(${f.grayscale}%)` : '',
		f.hue ? `hue-rotate(${f.hue}deg)` : '',
		f.invert ? `invert(${f.invert}%)` : '',
		f.opacity !== 100 ? `opacity(${f.opacity}%)` : '',
		f.saturate !== 100 ? `saturate(${f.saturate}%)` : '',
		f.sepia ? `sepia(${f.sepia}%)` : '',
	].filter(Boolean)
	return parts.length ? parts.join(' ') : 'none'
}

const shadowCss = (s?: Shadow): string | undefined =>
	s ? `${s.x}px ${s.y}px ${s.blur}px ${s.spread}px ${s.color}` : undefined

const layerIcon = (kind: LayerKind) =>
	kind === 'text' ? 'sandbox-document-text' : 'sandbox-photo'

function InspectorSection(props: { title: string; children: any }) @{
	<VStack gap={2}>
		<Text type="supporting" weight="semibold" color="secondary">
			{props.title}
		</Text>
		<VStack gap={2}>{props.children}</VStack>
	</VStack>
}

function StepperRow(props: {
	label: string
	value: number
	onChange: (v: number) => void
	min?: number
	max?: number
	step?: number
}) @{
	<HStack hAlign="between" vAlign="center">
		<Text type="supporting">{props.label}</Text>
		<NumberInput
			label={props.label} isLabelHidden width={96} size="sm"
			value={props.value}
			onValueChange={(v) => props.onChange(v ?? 0)}
			min={props.min} max={props.max} step={props.step ?? 1}
		/>
	</HStack>
}

function AxisInput(props: {
	label: string
	x: number
	y: number
	onChange: (axis: 'x' | 'y', v: number) => void
}) @{
	<HStack gap={2} vAlign="center">
		<Text type="supporting" style={{ width: 80 }}>{props.label}</Text>
		<NumberInput
			label={`${props.label} X`} isLabelHidden size="sm"
			value={props.x} onValueChange={(v) => props.onChange('x', v ?? 0)}
		/>
		<NumberInput
			label={`${props.label} Y`} isLabelHidden size="sm"
			value={props.y} onValueChange={(v) => props.onChange('y', v ?? 0)}
		/>
	</HStack>
}

function FilterRow(props: {
	label: string
	value: number
	onChange: (v: number) => void
}) @{
	<HStack hAlign="between" vAlign="center">
		<Text type="supporting">{props.label}</Text>
		<NumberInput
			label={props.label} isLabelHidden width={96} size="sm"
			value={props.value} onValueChange={(v) => props.onChange(v ?? 0)}
		/>
	</HStack>
}

function ShadowFields(props: {
	shadow: Shadow | undefined
	onChange: (shadow: Shadow | undefined) => void
}) @{
	const s = props.shadow ?? NO_SHADOW
	<>
		<Switch
			label="Drop shadow" value={props.shadow != null}
			onChange={(on) => props.onChange(on ? NO_SHADOW : undefined)}
			labelPosition="start" labelSpacing="spread"
		/>
		{props.shadow ? (
			<VStack gap={2}>
				{(['x', 'y', 'blur', 'spread'] as const).map((key) => (
					<StepperRow
						key={key}
						label={key === 'x' ? 'Offset X' : key === 'y' ? 'Offset Y' : key === 'blur' ? 'Blur' : 'Spread'}
						value={s[key]}
						onChange={(v) => props.onChange({ ...s, [key]: v })}
					/>
				))}
				<HStack hAlign="between" vAlign="center">
					<Text type="supporting">Color</Text>
					<TextInput
						label="Shadow color" isLabelHidden width={96} size="sm"
						value={s.color} onChange={(v) => props.onChange({ ...s, color: v })}
					/>
				</HStack>
			</VStack>
		) : null}
	</>
}

function LayerRow(props: {
	layer: Layer
	isSelected: boolean
	onSelect: () => void
}) @{
	<ListItem
		label={props.layer.name}
		startContent={
			<Icon
				name={layerIcon(props.layer.kind)} size={16}
				color={props.isSelected ? 'accent' : 'secondary'}
			/>
		}
		endContent={props.layer.isLocked ? <Icon name="sandbox-lock-closed" size={14} color="secondary" /> : undefined}
		isSelected={props.isSelected}
		onPress={props.onSelect}
	/>
}

export function CanvasEditorTemplate() @{
	const [layers, setLayers] = useState(INITIAL_LAYERS)
	const [selectedID, setSelectedID] = useState('headline')
	const [panel, setPanel] = useState<'layers' | 'assets'>('layers')
	const [zoom, setZoom] = useState('0.4')
	const [imageName, setImageName] = useState('Image')
	const [chrome, setChrome] = useState({ left: true, right: true, toolbar: true })
	const [appearance, setAppearance] = useState<ThemeMode>('system')
	const [tabs, setTabs] = useState(INITIAL_TABS)
	const [activeTab, setActiveTab] = useState(INITIAL_TABS[0].id)
	const untitledCount = useRef(1)

	const closeTab = (id: string) => {
		setTabs((current) => {
			const index = current.findIndex((tab) => tab.id === id)
			const next = current.filter((tab) => tab.id !== id)
			if (id === activeTab) {
				const neighbour = next[index] ?? next[index - 1]
				setActiveTab(neighbour ? neighbour.id : '')
			}
			return next
		})
	}

	const addTab = () => {
		untitledCount.current += 1
		const tab = { id: `untitled-${untitledCount.current}`, name: `Untitled ${untitledCount.current}` }
		setTabs((current) => [...current, tab])
		setActiveTab(tab.id)
	}

	const rail = useResizable({ defaultSize: 216, minSize: 176, maxSize: 320 })
	const inspector = useResizable({ defaultSize: 288, minSize: 264, maxSize: 400 })

	const selected = layers.find((layer) => layer.id === selectedID) ?? layers[0]
	const scale = Number(zoom)

	const updateSelected = (patch: Partial<Layer>) => {
		setLayers((current) =>
			current.map((layer) =>
				layer.id === selectedID ? { ...layer, ...patch } : layer,
			),
		)
	}

	const orderedLayers = [...layers].reverse()

	const canvas = (
		<VStack gap={3} padding={6} style={{ flex: 1, minWidth: 0 }}>
			<div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 0 }}>
				<div style={{
					width: FRAME.width * scale,
					height: FRAME.height * scale,
					maxHeight: '100%',
					position: 'relative',
					backgroundColor: 'var(--color-background-muted)',
					borderRadius: 'var(--radius-element)',
					overflow: 'hidden',
					flexShrink: 0,
				}}>
					{orderedLayers.map((layer) => {
						const isPhoto = layer.kind === 'image'
						return (
							<div
								key={layer.id}
								onClick={() => !layer.isLocked && setSelectedID(layer.id)}
								style={{
									position: 'absolute',
									left: layer.x * scale,
									top: layer.y * scale,
									width: layer.width * scale,
									height: layer.height * scale,
									transform: `rotate(${layer.rotation}deg)`,
									cursor: layer.isLocked ? 'default' : 'pointer',
									outline: layer.id === selectedID ? '2px solid var(--color-accent-primary, #0171E3)' : undefined,
									backgroundColor: layer.fill,
									borderRadius: layer.radius * scale,
									padding: `${layer.paddingBlock * scale}px ${layer.paddingInline * scale}px`,
									border: layer.border ? `1px solid ${layer.border}` : undefined,
									boxShadow: shadowCss(layer.shadow),
									filter: filterCss(layer.filters),
									overflow: 'hidden',
								}}
							>
								{isPhoto ? (
									<img
										src={PHOTO_LAYER_SRC}
										alt={layer.content}
										style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
									/>
								) : (
									<div style={{
										fontFamily: layer.family,
										fontWeight: layer.weight === 'Bold' ? 700 : layer.weight === 'Semibold' ? 600 : layer.weight === 'Medium' ? 500 : 400,
										fontStyle: layer.isItalic ? 'italic' : 'normal',
										fontSize: (layer.size ?? 16) * scale,
										lineHeight: layer.line,
										letterSpacing: `${(layer.tracking ?? 0) * scale}em`,
										color: layer.color,
										textAlign: layer.alignX === 'justify' ? 'justify' : (layer.alignX ?? 'start') as any,
										display: 'flex',
										alignItems: layer.alignY === 'end' ? 'flex-end' : layer.alignY === 'center' ? 'center' : 'flex-start',
										height: '100%',
									}}>
										{layer.content}
									</div>
								)}
							</div>
						)
					})}
				</div>
			</div>
		</VStack>
	)

	const inspectorBody = (
		<VStack gap={5} padding={4}>
			<InspectorSection title="Layer">
				<HStack hAlign="between" vAlign="center">
					<Text type="supporting">Name</Text>
					<TextInput
						label="Layer name" isLabelHidden width={160} size="sm"
						value={selected.name} onChange={(v) => updateSelected({ name: v })}
					/>
				</HStack>
				<Switch
					label="Locked" value={selected.isLocked}
					onChange={(v) => updateSelected({ isLocked: v })}
					labelPosition="start" labelSpacing="spread"
				/>
			</InspectorSection>
			<InspectorSection title="Position & size">
				<AxisInput label="Position" x={selected.x} y={selected.y} onChange={(axis, v) => updateSelected({ [axis]: v })} />
				<AxisInput label="Size" x={selected.width} y={selected.height} onChange={(axis, v) => updateSelected({ [axis === 'x' ? 'width' : 'height']: v })} />
				<StepperRow label="Rotation" value={selected.rotation} onChange={(v) => updateSelected({ rotation: v })} />
				<StepperRow label="Corner radius" value={selected.radius} onChange={(v) => updateSelected({ radius: v })} min={0} />
			</InspectorSection>
			<InspectorSection title="Fill & stroke">
				<HStack hAlign="between" vAlign="center">
					<Text type="supporting">Fill</Text>
					<TextInput
						label="Fill color" isLabelHidden width={96} size="sm"
						value={selected.fill ?? ''} placeholder="#hex"
						onChange={(v) => updateSelected({ fill: v || undefined })}
					/>
				</HStack>
				<HStack hAlign="between" vAlign="center">
					<Text type="supporting">Border</Text>
					<TextInput
						label="Border color" isLabelHidden width={96} size="sm"
						value={selected.border ?? ''} placeholder="#hex"
						onChange={(v) => updateSelected({ border: v || undefined })}
					/>
				</HStack>
			</InspectorSection>
			{selected.kind === 'text' ? (
				<>
					<InspectorSection title="Content">
						<TextInput
							label="Text content" isLabelHidden
							value={selected.content} onChange={(v) => updateSelected({ content: v })}
						/>
					</InspectorSection>
					<InspectorSection title="Typography">
						<HStack hAlign="between" vAlign="center">
							<Text type="supporting">Family</Text>
							<Selector
								label="Font family" isLabelHidden width={160} size="sm"
								options={FONT_OPTIONS} value={selected.family ?? 'Anton'}
								onValueChange={(v) => updateSelected({ family: v ?? 'Anton' })}
							/>
						</HStack>
						<HStack hAlign="between" vAlign="center">
							<Text type="supporting">Weight</Text>
							<Selector
								label="Weight" isLabelHidden width={160} size="sm"
								options={WEIGHT_OPTIONS} value={selected.weight ?? 'Regular'}
								onValueChange={(v) => updateSelected({ weight: v ?? 'Regular' })}
							/>
						</HStack>
						<StepperRow label="Size" value={selected.size ?? 16} onChange={(v) => updateSelected({ size: v })} min={1} />
						<StepperRow label="Line height" value={selected.line ?? 1} onChange={(v) => updateSelected({ line: v })} step={0.1} />
						<HStack hAlign="between" vAlign="center">
							<Text type="supporting">Color</Text>
							<HStack gap={2} vAlign="center">
								<input
									type="color"
									value={selected.color ?? '#ffffff'}
									onChange={(e) => updateSelected({ color: (e.target as HTMLInputElement).value })}
									style={{ width: 32, height: 24, padding: 0, border: 'none', background: 'none' }}
								/>
								<TextInput
									label="Text color" isLabelHidden width={96} size="sm"
									value={selected.color ?? ''} onChange={(v) => updateSelected({ color: v })}
								/>
							</HStack>
						</HStack>
						<HStack hAlign="between" vAlign="center">
							<Text type="supporting">Align X</Text>
							<Selector
								label="Horizontal alignment" isLabelHidden width={160} size="sm"
								options={[
									{ value: 'start', label: 'Start' },
									{ value: 'center', label: 'Center' },
									{ value: 'end', label: 'End' },
									{ value: 'justify', label: 'Justify' },
								]}
								value={selected.alignX ?? 'start'}
								onValueChange={(v) => updateSelected({ alignX: (v ?? 'start') as AlignX })}
							/>
						</HStack>
						<HStack hAlign="between" vAlign="center">
							<Text type="supporting">Align Y</Text>
							<Selector
								label="Vertical alignment" isLabelHidden width={160} size="sm"
								options={[
									{ value: 'start', label: 'Top' },
									{ value: 'center', label: 'Middle' },
									{ value: 'end', label: 'Bottom' },
								]}
								value={selected.alignY ?? 'start'}
								onValueChange={(v) => updateSelected({ alignY: (v ?? 'start') as AlignY })}
							/>
						</HStack>
						<Switch
							label="Italic" value={selected.isItalic ?? false}
							onChange={(v) => updateSelected({ isItalic: v })}
							labelPosition="start" labelSpacing="spread"
						/>
					</InspectorSection>
				</>
			) : null}
			{selected.kind === 'image' ? (
				<InspectorSection title="Adjustments">
					{(['brightness', 'contrast', 'saturate', 'grayscale', 'sepia', 'hue', 'blur', 'opacity', 'invert'] as const).map((key) => (
						<FilterRow
							key={key}
							label={key[0].toUpperCase() + key.slice(1)}
							value={selected.filters?.[key] ?? (key === 'hue' || key === 'blur' || key === 'grayscale' || key === 'sepia' || key === 'invert' ? 0 : 100)}
							onChange={(v) =>
								updateSelected({ filters: { ...(selected.filters ?? NO_FILTERS), [key]: v } })
							}
						/>
					))}
				</InspectorSection>
			) : null}
			<InspectorSection title="Shadow">
				<ShadowFields
					shadow={selected.shadow}
					onChange={(shadow) => updateSelected({ shadow })}
				/>
			</InspectorSection>
		</VStack>
	)

	<Layout
		height="fill"
		padding={0}
		header={
			<LayoutHeader hasDivider padding={1}>
				<HStack gap={0.5} vAlign="center" hAlign="between">
					<HStack gap={0.5} vAlign="center">
						<DropdownMenu
							button={{ label: 'Menu', variant: 'ghost', size: 'sm', isIconOnly: true, icon: <Icon name="sandbox-bars-3" size={16} /> }}
							menuWidth={280}
							items={[
								{ type: 'action', key: 'new', label: 'New poster', onSelect: addTab },
								{ type: 'action', key: 'open', label: 'Open…', onSelect: () => {} },
								{ type: 'separator', key: 'd1' },
								{ type: 'action', key: 'save', label: 'Save', onSelect: () => {} },
								{ type: 'action', key: 'saveas', label: 'Save as…', onSelect: () => {} },
								{
									type: 'submenu', key: 'export', label: 'Export',
									items: EXPORT_FORMATS.map((format, i) => ({
										type: 'action', key: `export-${i}`, label: format, onSelect: () => {},
									})),
								},
								{ type: 'separator', key: 'd2' },
								{ type: 'action', key: 'close', label: 'Close', onSelect: () => closeTab(activeTab) },
							]}
						/>
						<HStack gap={0} vAlign="center" isScrollable style={{ flex: 1, minWidth: 0 }}>
							{tabs.map((tab) => (
								<HStack
									key={tab.id}
									gap={1}
									vAlign="center"
									style={{
										padding: '2px 8px',
										borderRadius: 'var(--radius-element)',
										backgroundColor: tab.id === activeTab ? 'var(--color-background-muted)' : undefined,
										maxWidth: 164,
										flexShrink: 0,
									}}
								>
									<Icon name="sandbox-document" size={14} color={tab.id === activeTab ? 'accent' : 'secondary'} />
									<Text
										type="supporting" maxLines={1}
										color={tab.id === activeTab ? 'primary' : 'secondary'}
									>
										{tab.name}
									</Text>
									<Button
										label={`Close ${tab.name}`} variant="ghost" size="sm" isIconOnly
										icon={<Icon name="sandbox-x-mark" size={12} />}
										clickAction={() => closeTab(tab.id)}
									/>
								</HStack>
							))}
							<Button
								label="New document" variant="ghost" size="sm" isIconOnly
								icon={<Icon name="sandbox-plus" size={16} />}
								clickAction={addTab}
							/>
						</HStack>
					</HStack>
					<HStack gap={2} vAlign="center">
						<Selector
							label="Zoom" isLabelHidden size="sm" width={96}
							options={ZOOM_OPTIONS} value={zoom}
							onValueChange={(v) => setZoom(v ?? '0.4')}
						/>
						<DropdownMenu
							button={{ label: 'Appearance', variant: 'ghost', size: 'sm', icon: <Icon name="sandbox-sun" size={16} /> }}
							items={(['system', 'light', 'dark'] as const).map((mode) => ({
								type: 'action', key: mode,
								label: `${mode[0].toUpperCase() + mode.slice(1)}${appearance === mode ? ' ✓' : ''}`,
								onSelect: () => setAppearance(mode),
							}))}
						/>
						<DropdownMenu
							button={{ label: 'Export', variant: 'secondary', size: 'sm', icon: <Icon name="sandbox-arrow-down-tray" size={16} /> }}
							items={EXPORT_FORMATS.map((format, i) => ({
								type: 'action', key: `e${i}`, label: format, onSelect: () => {},
							}))}
						/>
						<Button label="Share" variant="primary" size="sm" clickAction={() => {}} />
					</HStack>
				</HStack>
			</LayoutHeader>
		}
		start={
			chrome.left ? (
				<LayoutPanel width={rail.props._size} hasDivider>
					<VStack gap={0}>
						<TabList
							value={panel}
							onChange={(v) => setPanel(v as 'layers' | 'assets')}
						>
							<Tab value="layers" label="Layers" />
							<Tab value="assets" label="Assets" />
						</TabList>
						{panel === 'layers' ? (
							<List density="compact">
								{orderedLayers.map((layer) => (
									<LayerRow
										key={layer.id}
										layer={layer}
										isSelected={layer.id === selectedID}
										onSelect={() => setSelectedID(layer.id)}
									/>
								))}
							</List>
						) : (
							<VStack gap={2} padding={3}>
								<Card padding={3}>
									<VStack gap={1} hAlign="center">
										<Icon name="sandbox-photo" size={24} color="secondary" />
										<Text type="supporting" color="secondary">moody-scene-vertical-1.png</Text>
									</VStack>
								</Card>
								<Text type="supporting" color="secondary">
									Drop images here to add them as layers.
								</Text>
							</VStack>
						)}
					</VStack>
				</LayoutPanel>
			) : undefined
		}
		end={
			chrome.right ? (
				<LayoutPanel width={inspector.props._size} hasDivider>
					<VStack gap={0}>
						<HStack gap={2} vAlign="center" padding={3} hAlign="between">
							<Heading level={3}>{selected.name}</Heading>
							<Badge variant="neutral" label={selected.kind} />
						</HStack>
						<Divider />
						{inspectorBody}
					</VStack>
				</LayoutPanel>
			) : undefined
		}
		content={<LayoutContent padding={0}>{canvas}</LayoutContent>}
	/>
}
