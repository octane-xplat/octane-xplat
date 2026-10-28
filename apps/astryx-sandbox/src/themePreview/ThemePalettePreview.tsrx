// Port of upstream ThemePalettePreview.tsx (Astryx 0.6.4, MIT), adapted to
// Xplat components + sandbox.css classes. Preserves the two-mode-column
// contract: each column renders inside its own `<Theme theme mode>` scope
// so a theme's light and dark surfaces sit side by side regardless of the
// app mode — the exercised nested-mode Theme behavior. The upstream audit
// drawer + pending-override editor are recorded adaptations (dev tooling;
// see docs/coverage.md); tonal usage snap markers are omitted with them.

import { useState } from 'octane'
import {
	Badge,
	Banner,
	Button,
	Card,
	CheckboxInput,
	HStack,
	Heading,
	ProgressBar,
	RadioList,
	Spinner,
	Stack,
	Switch,
	Text,
	TextInput,
	Theme,
	VStack,
	View,
	type DefinedTheme,
} from '@octane-xplat/ui'

import { TONE_STEPS, hexToHct, tonalPaletteForMode, type Mode, type ToneStep } from './colorMath'

export interface TonalColor {
	name: string
	sourceHex: string
	semantic?: string
	note?: string
	/** Canonical ramp override (butter) — verbatim tone map instead of the
	 *  HCT-generated ramp. */
	tones?: Record<string | number, string | number>
	dark?: { sourceHex: string; tones?: Record<string | number, string | number> }
}

export interface CoreSwatch {
	hex: string
	name: string
	dark?: { hex: string; name: string }
}

export interface ThemePalettePreviewProps {
	theme: DefinedTheme
	title: string
	subtitle?: string
	tonalColors: TonalColor[]
	coreSwatches?: CoreSwatch[]
	extraSections?: any
	leadingExtras?: any
	shadowDescription?: string
	/** Render a single mode only (dark-only themes like gothic). */
	singleMode?: Mode
}

const sectionTitle = { fontSize: 13, fontWeight: 600, margin: 0, marginBottom: 12 } as const

function SectionTitle(props: { children: any }) @{
	return <Text style={sectionTitle}>{props.children}</Text>
}

function CoreSection(props: { swatches: CoreSwatch[]; mode: Mode }) @{
	const isDark = props.mode === 'dark'
	return (
		<View className="sb-pp-section">
			<SectionTitle>Core Palette</SectionTitle>
			<HStack gap={3} wrap="wrap">
				{props.swatches.map((swatch) => {
					const s = isDark && swatch.dark ? swatch.dark : swatch
					return (
						<VStack gap={1} key={swatch.name}>
							<View
								style={{
									width: 72,
									height: 48,
									background: s.hex,
									borderRadius: 8,
									border: '1px solid var(--color-border)',
								}}
							/>
							<Text style={{ fontSize: 11 }}>{s.name}</Text>
						</VStack>
					)
				})}
			</HStack>
		</View>
	)
}

const RAMP_TEXT = [
	'Display 1 · 84',
	'Heading · 42',
	'Title · 26',
	'Body · 14',
	'Label · 12',
	'Caption · 11',
]

function TextRampSection() @{
	return (
		<View className="sb-pp-section">
			<SectionTitle>Text Hierarchy</SectionTitle>
			<VStack gap={1}>
				{RAMP_TEXT.map((label, i) => {
					const size = [42, 32, 24, 14, 12, 11][i]
					return (
						<Text key={label} style={{ fontSize: size, color: 'var(--color-text-primary)' }}>
							{label}
						</Text>
					)
				})}
			</VStack>
		</View>
	)
}

const SEMANTICS = ['accent', 'success', 'warning', 'error', 'neutral'] as const
const CATEGORICAL = [
	'red',
	'orange',
	'yellow',
	'green',
	'teal',
	'cyan',
	'blue',
	'purple',
	'pink',
	'gray',
] as const

function SemanticBadgeSection() @{
	return (
		<View className="sb-pp-section">
			<SectionTitle>Semantic Badges</SectionTitle>
			<HStack gap={2} wrap="wrap">
				{SEMANTICS.map((s) => (
					<Badge key={s} className={`sb-pp-badge sb-pp-badge--${s}`}>
						{s}
					</Badge>
				))}
			</HStack>
		</View>
	)
}

function CategoricalBadgeSection() @{
	return (
		<View className="sb-pp-section">
			<SectionTitle>Categorical Badges</SectionTitle>
			<HStack gap={2} wrap="wrap">
				{CATEGORICAL.map((c) => (
					<Badge key={c} className={`sb-pp-badge sb-pp-cat sb-pp-cat--${c}`}>
						{c}
					</Badge>
				))}
			</HStack>
		</View>
	)
}

function BannerSection() @{
	return (
		<View className="sb-pp-section">
			<SectionTitle>Banners</SectionTitle>
			<VStack gap={2}>
				<Banner className="sb-pp-banner sb-pp-banner--info">
					<Text style={{ fontSize: 13 }}>Info banner — Description text for the info state.</Text>
				</Banner>
				<Banner className="sb-pp-banner sb-pp-banner--success">
					<Text style={{ fontSize: 13 }}>
						Success banner — Description text for the success state.
					</Text>
				</Banner>
				<Banner className="sb-pp-banner sb-pp-banner--warning">
					<Text style={{ fontSize: 13 }}>
						Warning banner — Description text for the warning state.
					</Text>
				</Banner>
				<Banner className="sb-pp-banner sb-pp-banner--error">
					<Text style={{ fontSize: 13 }}>Error banner — Description text for the error state.</Text>
				</Banner>
			</VStack>
		</View>
	)
}

function InputSection() @{
	return (
		<View className="sb-pp-section">
			<SectionTitle>Inputs</SectionTitle>
			<VStack gap={3}>
				<TextInput label="Default" placeholder="Placeholder text" value="" onChange={() => {}} />
				<TextInput
					label="Error"
					value="Invalid input"
					onChange={() => {}}
					status={{ type: 'error', message: 'This field is required.' }}
				/>
				<TextInput label="Disabled" value="Cannot edit" onChange={() => {}} isDisabled />
			</VStack>
		</View>
	)
}

function ButtonSection() @{
	return (
		<View className="sb-pp-section">
			<SectionTitle>Buttons</SectionTitle>
			<VStack gap={3}>
				<HStack gap={2} wrap="wrap">
					<Button label="Primary" variant="primary" />
					<Button label="Secondary" variant="secondary" />
					<Button label="Ghost" variant="ghost" />
					<Button label="Destructive" variant="destructive" />
				</HStack>
				<HStack gap={2} wrap="wrap">
					<Button label="Disabled" isDisabled />
					<Button label="Loading" isLoading />
					<Button label="Small" size="sm" />
				</HStack>
			</VStack>
		</View>
	)
}

function SpinnerSection() @{
	return (
		<View className="sb-pp-section">
			<SectionTitle>Spinners</SectionTitle>
			<HStack gap={3}>
				<Spinner />
			</HStack>
		</View>
	)
}

function ProgressBarSection() @{
	return (
		<View className="sb-pp-section">
			<SectionTitle>Progress</SectionTitle>
			<VStack gap={3}>
				<ProgressBar label="Upload progress" value={45} hasValueLabel />
				<ProgressBar label="Indeterminate" isIndeterminate isLabelHidden />
			</VStack>
		</View>
	)
}

function CheckboxRadioSwitchSection() @{
	const [checked, setChecked] = useState({ a: true, b: false })
	return (
		<View className="sb-pp-section">
			<SectionTitle>Controls</SectionTitle>
			<HStack gap={4} wrap="wrap">
				<VStack gap={2}>
					<CheckboxInput
						value={checked.a}
						onChange={(v) => setChecked({ ...checked, a: Boolean(v) })}
						accessibilityLabel="Checked option"
					/>
					<CheckboxInput value={false} isDisabled accessibilityLabel="Disabled option" />
				</VStack>
				<RadioList
					options={[
						{ value: 'one', label: 'Option one' },
						{ value: 'two', label: 'Option two' },
					]}
					value="one"
					onValueChange={() => {}}
				/>
				<VStack gap={2}>
					<Switch
						value={checked.b}
						onChange={(v) => setChecked({ ...checked, b: Boolean(v) })}
						accessibilityLabel="Toggle"
					/>
					<Switch value={true} isDisabled accessibilityLabel="Disabled toggle" />
				</VStack>
			</HStack>
		</View>
	)
}

const CARD_VARIANTS = ['', 'muted'] as const

function CardVariantsSection() @{
	return (
		<View className="sb-pp-section">
			<SectionTitle>Card Variants</SectionTitle>
			<HStack gap={3} wrap="wrap">
				{CARD_VARIANTS.map((v) => (
					<Card key={v || 'default'} variant={v || undefined} padding={2} width={140}>
						<Text style={{ fontSize: 12 }}>{v || 'default'} card</Text>
					</Card>
				))}
			</HStack>
		</View>
	)
}

function SurfacesSection(props: { mode: Mode }) @{
	const isDark = props.mode === 'dark'
	const ring = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'
	const surfaces = [
		{ label: 'body', bg: 'var(--color-background-body)' },
		{ label: 'surface', bg: 'var(--color-background-surface)' },
		{ label: 'card', bg: 'var(--color-background-card)' },
		{ label: 'muted', bg: 'var(--color-background-muted)' },
		{ label: 'popover', bg: 'var(--color-background-popover)' },
	]

	return (
		<View className="sb-pp-section">
			<SectionTitle>Borders &amp; Surfaces</SectionTitle>
			<HStack gap={3} wrap="wrap">
				{surfaces.map((s) => (
					<VStack gap={1} key={s.label}>
						<View
							style={{
								width: 72,
								height: 48,
								background: s.bg,
								borderRadius: 8,
								border: '1px solid var(--color-border)',
								boxShadow: `0 0 0 1px ${ring}`,
							}}
						/>
						<Text style={{ fontSize: 11 }}>{s.label}</Text>
					</VStack>
				))}
			</HStack>
		</View>
	)
}

function ElevationsSection() @{
	return (
		<View className="sb-pp-section">
			<SectionTitle>Elevations</SectionTitle>
			<HStack gap={3} wrap="wrap">
				{(['low', 'med', 'high'] as const).map((e) => (
					<VStack gap={1} key={e}>
						<View
							style={{
								width: 72,
								height: 48,
								background: 'var(--color-background-surface)',
								borderRadius: 8,
								boxShadow: `var(--shadow-${e})`,
							}}
						/>
						<Text style={{ fontSize: 11 }}>{e}</Text>
					</VStack>
				))}
			</HStack>
		</View>
	)
}

function TonalSection(props: { colors: TonalColor[]; mode: Mode }) @{
	return (
		<View style={{ marginBottom: 40 }}>
			<Text style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Tonal Palettes</Text>
			{props.colors.map((color) => {
				const seed = props.mode === 'dark' && color.dark ? color.dark : color
				const tones =
					seed.tones ??
					(() => {
						const { hue, chroma } = hexToHct(seed.sourceHex)
						return tonalPaletteForMode(hue, chroma, props.mode)
					})()

				const { hue, chroma } = hexToHct(seed.sourceHex)
				return (
					<View key={color.name} style={{ marginBottom: 10 }}>
						<HStack gap={2} vAlign="center">
							<Text style={{ fontSize: 12, width: 72 }}>
								{color.name}
								{color.semantic ? ` · ${color.semantic}` : ''}
							</Text>
							<HStack gap={0} style={{ flex: 1 }}>
								{TONE_STEPS.map((t: ToneStep) => (
									<View
										key={t}
										style={{
											flex: 1,
											height: 28,
											background: tones[t] ?? 'transparent',
										}}
									/>
								))}
							</HStack>
							<Text
								style={{
									fontSize: 10,
									color: 'var(--color-text-secondary)',
									fontFamily: 'var(--font-mono)',
								}}
							>
								H:{hue.toFixed(0)} C:{chroma.toFixed(0)}
							</Text>
						</HStack>
					</View>
				)
			})}
		</View>
	)
}

function ModeColumn(props: {
	theme: DefinedTheme
	mode: Mode
	coreSwatches?: CoreSwatch[]
	extraSections?: any
	leadingExtras?: any
}) @{
	return (
		<Theme theme={props.theme} mode={props.mode}>
			<View
				style={{
					display: 'flex',
					flexDirection: 'column',
					gap: 28,
					background: 'var(--color-background-body)',
					color: 'var(--color-text-primary)',
					border: '1px solid var(--color-border)',
					borderRadius: 16,
					padding: 24,
					flex: 1,
					minWidth: 0,
				}}
			>
				<Text
					style={{
						fontSize: 11,
						fontWeight: 600,
						letterSpacing: 1,
						textTransform: 'uppercase',
						color: 'var(--color-text-secondary)',
					}}
				>
					{props.mode === 'light' ? 'Light Mode' : 'Dark Mode'}
				</Text>
				{props.coreSwatches && props.coreSwatches.length > 0 && (
					<CoreSection swatches={props.coreSwatches} mode={props.mode} />
				)}
				{props.leadingExtras}
				<TextRampSection />
				<SemanticBadgeSection />
				<CategoricalBadgeSection />
				<BannerSection />
				<InputSection />
				<ButtonSection />
				<SpinnerSection />
				<ProgressBarSection />
				<CheckboxRadioSwitchSection />
				<CardVariantsSection />
				<SurfacesSection mode={props.mode} />
				<ElevationsSection />
				{props.extraSections}
			</View>
		</Theme>
	)
}

export function ThemePalettePreview(props: ThemePalettePreviewProps) @{
	const modes = props.singleMode ? [props.singleMode] : (['light', 'dark'] as const)
	const chromeMode = props.singleMode ?? 'light'
	return (
		<Theme theme={props.theme} mode={chromeMode}>
			<View
				style={{
					background: 'var(--color-background-body)',
					color: 'var(--color-text-primary)',
					minHeight: '100%',
					padding: 32,
				}}
			>
				<View style={{ maxWidth: 1400, marginLeft: 'auto', marginRight: 'auto' }}>
					<Heading level={1}>{props.title}</Heading>
					{props.subtitle ? (
						<Text
							style={{
								fontSize: 13,
								color: 'var(--color-text-secondary)',
								marginTop: 8,
								marginBottom: 24,
							}}
						>
							{props.subtitle}
						</Text>
					) : null}
					{modes.map((m) => (
						<Theme key={m} theme={props.theme} mode={m}>
							<View
								style={{
									background: 'var(--color-background-body)',
									color: 'var(--color-text-primary)',
									borderRadius: 16,
									padding: 24,
									marginBottom: 16,
									border: '1px solid var(--color-border)',
								}}
							>
								<Text
									style={{
										fontSize: 11,
										fontWeight: 600,
										letterSpacing: 1,
										textTransform: 'uppercase',
										color: 'var(--color-text-secondary)',
										marginBottom: 16,
									}}
								>
									{m === 'light' ? 'Light Mode' : 'Dark Mode'}
								</Text>
								<TonalSection colors={props.tonalColors} mode={m} />
							</View>
						</Theme>
					))}
					{props.singleMode ? (
						<ModeColumn
							theme={props.theme}
							mode={props.singleMode}
							coreSwatches={props.coreSwatches}
							extraSections={props.extraSections}
							leadingExtras={props.leadingExtras}
						/>
					) : (
						<HStack gap={4} align="start" wrap="wrap">
							<ModeColumn
								theme={props.theme}
								mode="light"
								coreSwatches={props.coreSwatches}
								extraSections={props.extraSections}
								leadingExtras={props.leadingExtras}
							/>
							<ModeColumn
								theme={props.theme}
								mode="dark"
								coreSwatches={props.coreSwatches}
								extraSections={props.extraSections}
								leadingExtras={props.leadingExtras}
							/>
						</HStack>
					)}
				</View>
			</View>
		</Theme>
	)
}
