import { Field } from '@octane-xplat/ui'
import './ColorStudioPage.inline.css'
// Copyright (c) Meta Platforms, Inc. and affiliates.

import { useState, useCallback, useMemo } from 'octane'
import { TextInput } from '@octane-xplat/ui'
import { Button, useClipboard } from '@octane-xplat/ui'
import { VStack, HStack } from '@octane-xplat/ui'
import { Text, Heading } from '@octane-xplat/ui'
import { IconButton } from '@octane-xplat/ui'
import { Selector } from '@octane-xplat/ui'
import { Slider } from '@octane-xplat/ui'
import { NumberInput } from '@octane-xplat/ui'
import { SegmentedControl, SegmentedControlItem } from '@octane-xplat/ui'

import {
	hexToOklch,
	oklchClampedHex,
	hctToHex,
	toneToOklabL,
	DEFAULT_OKLCH_CHROMA,
	DEFAULT_OKLCH_HUE,
	parseColorInput,
	generateExportCode,
	THEME_ROLES,
	type PaletteColor,
	type ThemeRole,
	type ThemeOptions,
} from './colorUtils'

// =============================================================================
// Styles
// =============================================================================

const MONO = "'JetBrains Mono', 'SF Mono', Menlo, monospace"

const S = {
	page: {
		display: 'flex',
		height: '100vh',
		overflow: 'hidden',
		backgroundColor: 'var(--color-background-surface, #fff)',
	} satisfies Record<string, string | number>,
	sidebar: {
		width: 320,
		flexShrink: 0,
		height: '100vh',
		display: 'flex',
		flexDirection: 'column' as const,
		overflow: 'hidden',
	} satisfies Record<string, string | number>,
	sidebarPanel: {
		flex: 1,
		backgroundColor: 'var(--color-background-card, #fff)',
		borderRadius: 16,
		border: '1px solid var(--color-border, #e0e0e0)',
		overflow: 'hidden',
		display: 'flex',
		flexDirection: 'column' as const,
		margin: 8,
	} satisfies Record<string, string | number>,
	sidebarHeader: {
		padding: '14px 16px',
		borderBottom: '1px solid var(--color-border)',
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'space-between',
	} satisfies Record<string, string | number>,
	sidebarScroll: {
		flex: 1,
		overflow: 'auto',
		padding: 16,
	} satisfies Record<string, string | number>,
	main: {
		flex: 1,
		overflowY: 'auto' as const,
		height: '100vh',
		padding: 24,
	} satisfies Record<string, string | number>,
	swatch: (bg: string): Record<string, string | number> => ({
		width: 28,
		height: 28,
		borderRadius: 4,
		background: bg,
		border: '1px solid rgba(0,0,0,0.08)',
		flexShrink: 0,
		position: 'relative' as const,
		overflow: 'hidden',
		cursor: 'pointer',
	}),
	colorInput: {
		position: 'absolute' as const,
		inset: -8,
		width: 'calc(100% + 16px)',
		height: 'calc(100% + 16px)',
		border: 'none',
		cursor: 'pointer',
		opacity: 0,
	} satisfies Record<string, string | number>,
	tonalRow: {
		display: 'flex',
		alignItems: 'center',
		gap: 6,
		marginBottom: 3,
	} satisfies Record<string, string | number>,
	tonalLabel: {
		width: 70,
		flexShrink: 0,
		fontSize: 9,
		fontFamily: MONO,
		color: '#888',
		overflow: 'hidden',
		textOverflow: 'ellipsis',
		whiteSpace: 'nowrap' as const,
	} satisfies Record<string, string | number>,
	tonalStrip: {
		display: 'flex',
		flex: 1,
		overflow: 'hidden',
		border: '1px solid rgba(0,0,0,0.08)',
	} satisfies Record<string, string | number>,
	tonalCell: (bg: string): Record<string, string | number> => ({
		flex: 1,
		height: 28,
		background: bg,
	}),
	tonalHct: {
		width: 55,
		flexShrink: 0,
		fontSize: 8,
		fontFamily: MONO,
		color: '#52525b',
		textAlign: 'right' as const,
	} satisfies Record<string, string | number>,
}

// =============================================================================
// Multi-color presets
// =============================================================================

// =============================================================================
// Palette Color Entry
// =============================================================================

const ROLE_OPTIONS = [
	{ value: '', label: 'None' },
	...THEME_ROLES.map((r) => ({
		value: r.value,
		label: `${r.label}`,
		disabled: false,
	})),
]

function PaletteEntry({
	color,
	canRemove,
	usedRoles,
	onChange,
	onRemove,
}: {
	color: PaletteColor
	canRemove: boolean
	usedRoles: Set<ThemeRole>
	onChange: (id: string, changes: Partial<PaletteColor>) => void
	onRemove: (id: string) => void
}) {
	const roleOptions = useMemo(
		() =>
			ROLE_OPTIONS.map((o) => ({
				...o,
				disabled: o.value !== '' && o.value !== color.role && usedRoles.has(o.value as ThemeRole),
			})),
		[color.role, usedRoles],
	)

	return (
		<HStack gap={2} vAlign="center" className="ColorStudioPage-static-1">
			<div style={S.swatch(color.hex)}>
				<input
					type="color"
					value={color.hex}
					onChange={(e) => onChange(color.id, { hex: (e.currentTarget as HTMLInputElement).value })}
					className="ColorStudioPage-static-2"
				/>
			</div>
			<div className="ColorStudioPage-static-3">
				<TextInput
					label="Hex"
					isLabelHidden
					value={color.hex}
					onChange={(v) => {
						const parsed = parseColorInput(v.trim())
						if (parsed) {
							onChange(color.id, { hex: parsed })
						}
					}}
					size="sm"
				/>
			</div>
			<Selector
				label="Role"
				isLabelHidden
				options={roleOptions}
				value={color.role ?? ''}
				onValueChange={(v) =>
					onChange(color.id, { role: (v || undefined) as ThemeRole | undefined })
				}
				size="sm"
			/>
			{canRemove && (
				<IconButton
					label="Remove"
					variant="ghost"
					size="sm"
					clickAction={() => onRemove(color.id)}
					icon={<span className="ColorStudioPage-static-4">✕</span>}
				/>
			)}
		</HStack>
	)
}

// =============================================================================
// Tonal Ramps — full color system
// =============================================================================

interface ColorChannel {
	name: string
	role: ThemeRole
	oklchHue: number
	oklchChroma: number
}

// Channel definitions derive hue/chroma from the shared defaults
// so ramps and token generation stay in sync.
function makeChannel(name: string, role: ThemeRole): ColorChannel {
	return {
		name,
		role,
		oklchHue: DEFAULT_OKLCH_HUE[role] ?? 0,
		oklchChroma: DEFAULT_OKLCH_CHROMA[role] ?? 0.13,
	}
}

const DEFAULT_CHANNELS: ColorChannel[] = [
	makeChannel('Accent', 'accent'),
	makeChannel('Gray', 'gray'),
	makeChannel('Red', 'red'),
	makeChannel('Orange', 'orange'),
	makeChannel('Yellow', 'yellow'),
	makeChannel('Green', 'green'),
	makeChannel('Teal', 'teal'),
	makeChannel('Cyan', 'cyan'),
	makeChannel('Blue', 'blue'),
	makeChannel('Purple', 'purple'),
	makeChannel('Pink', 'pink'),
]

interface CustomChannel {
	id: string
	name: string
	hex: string
}

function generateToneSteps(count: number): number[] {
	if (count <= 1) {
		return [50]
	}

	return Array.from({ length: count }, (_, i) => Math.round((i / (count - 1)) * 100))
}

function TonalRamps({
	palette,
	vibrancy,
	grayTone,
	customChannels,
	toneSteps,
}: {
	palette: PaletteColor[]
	vibrancy: number
	grayTone: 'warm' | 'neutral' | 'cool'
	customChannels: CustomChannel[]
	toneSteps: number[]
}) {
	const roleMap = useMemo(() => {
		const map = new Map<ThemeRole, PaletteColor>()
		for (const pc of palette) {
			if (pc.role) {
				map.set(pc.role, pc)
			}
		}

		return map
	}, [palette])

	return (
		<div className="ColorStudioPage-static-5">
			<h2 className="ColorStudioPage-static-6">Tonal Palettes</h2>
			<p className="ColorStudioPage-static-7">
				OKLCH tonal ramps: {toneSteps.length} steps per channel.
				{vibrancy !== 1.0 && ` Vibrancy: ${vibrancy.toFixed(1)}x.`}
			</p>
			<div style={{ ...S.tonalRow, marginBottom: 6 }}>
				<span className="ColorStudioPage-static-8" />
				<div className="ColorStudioPage-static-9">
					{toneSteps.map((t) => (
						<div key={t} className="ColorStudioPage-static-10">
							{t}
						</div>
					))}
				</div>
				<span className="ColorStudioPage-static-11" />
			</div>
			{DEFAULT_CHANNELS.map((ch) => {
				const assigned = roleMap.get(ch.role)
				let hue: number
				let chroma: number

				if (ch.role === 'gray') {
					hue = assigned
						? hexToOklch(assigned.hex).H
						: grayTone === 'warm'
							? 60
							: grayTone === 'cool'
								? 260
								: 0

					chroma =
						(assigned
							? Math.min(hexToOklch(assigned.hex).C, 0.02)
							: grayTone === 'neutral'
								? 0.003
								: 0.012) * vibrancy
				} else {
					const oklch = assigned ? hexToOklch(assigned.hex) : { C: ch.oklchChroma, H: ch.oklchHue }
					hue = oklch.H
					chroma = oklch.C * vibrancy
				}

				return (
					<div key={ch.role} className="ColorStudioPage-static-12">
						<span
							style={{
								...S.tonalLabel,
								color: assigned ? '#4f46e5' : '#888',
								fontWeight: assigned ? 600 : 400,
							}}
							title={assigned ? `${ch.name} ← ${assigned.name}` : `${ch.name} (default)`}
						>
							{ch.name}
						</span>
						<div className="ColorStudioPage-static-13">
							{toneSteps.map((t) => (
								<div
									key={t}
									style={S.tonalCell(oklchClampedHex(toneToOklabL(t), chroma, hue))}
									title={`${ch.name} T${t}`}
								/>
							))}
						</div>
						<span className="ColorStudioPage-static-14">H:{hue.toFixed(0)}</span>
					</div>
				)
			})}
			{customChannels.map((cc) => {
				const oklch = hexToOklch(cc.hex)
				const chroma = oklch.C * vibrancy
				return (
					<div key={cc.id} className="ColorStudioPage-static-15">
						<span style={{ ...S.tonalLabel, color: '#4f46e5', fontWeight: 600 }}>{cc.name}</span>
						<div className="ColorStudioPage-static-16">
							{toneSteps.map((t) => (
								<div
									key={t}
									style={S.tonalCell(oklchClampedHex(toneToOklabL(t), chroma, oklch.H))}
									title={`${cc.name} T${t}`}
								/>
							))}
						</div>
						<span className="ColorStudioPage-static-17">H:{oklch.H.toFixed(0)}</span>
					</div>
				)
			})}
		</div>
	)
}

// =============================================================================
// Contrast Matrix
// =============================================================================

// =============================================================================
// Export Panel
// =============================================================================

function ExportPanel({ palette, options }: { palette: PaletteColor[]; options: ThemeOptions }) {
	const { copy, isCopied: copied } = useClipboard({ resetAfterMs: 2000 })
	const code = useMemo(() => generateExportCode(palette, options), [palette, options])

	const handleCopy = async () => {
		await copy(code)
	}

	return (
		<Button
			label={copied ? 'Copied!' : 'Export'}
			variant="ghost"
			size="sm"
			clickAction={handleCopy}
		/>
	)
}

// =============================================================================
// ID Generator
// =============================================================================

let _nextId = 1
function nextId(): string {
	return String(_nextId++)
}

function makePaletteColor(name: string, hex: string, role?: ThemeRole): PaletteColor {
	return { id: nextId(), name, hex, role }
}

// =============================================================================
// Page Component
// =============================================================================

export function ColorStudioPage() {
	const [palette, setPalette] = useState<PaletteColor[]>([
		makePaletteColor('Blue', '#0064E0', 'accent'),
	])

	const [vibrancy, setVibrancy] = useState(1.0)
	const [customChannels, setCustomChannels] = useState<CustomChannel[]>([])
	const [stepCount, setStepCount] = useState(21)
	const toneSteps = useMemo(() => generateToneSteps(stepCount), [stepCount])
	const [grayTone, setGrayTone] = useState<'warm' | 'neutral' | 'cool'>('neutral')

	const usedRoles = useMemo(
		() => new Set(palette.map((c) => c.role).filter((r): r is ThemeRole => r != null)),
		[palette],
	)

	const themeOptions: ThemeOptions = useMemo(
		() => ({
			warmth: grayTone as 'warm' | 'cool' | 'neutral',
			surfaceStyle: 'tinted' as const,
			exactAccent: true,
			vibrancy,
			radiusMultiplier: 1,
		}),
		[grayTone, vibrancy],
	)

	const updateColor = useCallback((id: string, changes: Partial<PaletteColor>) => {
		setPalette((prev) => prev.map((c) => (c.id === id ? { ...c, ...changes } : c)))
	}, [])

	const removeColor = useCallback((id: string) => {
		setPalette((prev) => (prev.length > 1 ? prev.filter((c) => c.id !== id) : prev))
	}, [])

	const addColor = useCallback(() => {
		const h = Math.random() * 360
		const c = 30 + Math.random() * 50
		const hex = hctToHex({ hue: h, chroma: c, tone: 50 })
		setPalette((prev) => [...prev, makePaletteColor('Color ' + _nextId, hex)])
	}, [])

	return (
		<div className="ColorStudioPage-static-18">
			{/* ═══ Sidebar ═══ */}
			<aside className="ColorStudioPage-static-19">
				<div className="ColorStudioPage-static-20">
					<div className="ColorStudioPage-static-21">
						<Heading level={4}>Color Studio</Heading>
						<ExportPanel palette={palette} options={themeOptions} />
					</div>

					<div className="ColorStudioPage-static-22">
						<VStack gap={5}>
							{/* Controls */}
							<HStack vAlign="center" className="ColorStudioPage-static-23">
								<Text type="supporting" color="secondary">
									Steps
								</Text>
								<Field label="Steps" isLabelHidden>
									<NumberInput
										label="Steps"
										isLabelHidden
										value={stepCount}
										onValueChange={(v) => setStepCount(Math.max(2, Math.min(41, v ?? stepCount)))}
										min={2}
										max={41}
										step={1}
										size="sm"
									/>
								</Field>
							</HStack>

							<HStack vAlign="center" gap={3} className="ColorStudioPage-static-24">
								<Text type="supporting" color="secondary" className="ColorStudioPage-static-25">
									Vibrancy
								</Text>
								<div className="ColorStudioPage-static-26">
									<Slider
										label="Vibrancy"
										isLabelHidden
										min={50}
										max={200}
										step={10}
										value={vibrancy * 100}
										onValueChange={(v) => setVibrancy((typeof v === 'number' ? v : v[0]) / 100)}
										formatValue={(v) => `${Math.round(v)}%`}
									/>
								</div>
							</HStack>

							<HStack vAlign="center" className="ColorStudioPage-static-27">
								<Text type="supporting" color="secondary">
									Gray
								</Text>
								<SegmentedControl
									label="Gray tone"
									value={grayTone}
									onValueChange={(v) => setGrayTone(v as 'warm' | 'neutral' | 'cool')}
									size="sm"
								>
									<SegmentedControlItem value="warm" label="Warm" />
									<SegmentedControlItem value="neutral" label="Neutral" />
									<SegmentedControlItem value="cool" label="Cool" />
								</SegmentedControl>
							</HStack>

							{/* Color Set — colors with role assignments */}
							<VStack gap={2}>
								<HStack vAlign="center" className="ColorStudioPage-static-28">
									<Text type="label" weight="semibold">
										Brand Colors
									</Text>
									<IconButton
										label="Add color"
										variant="ghost"
										size="sm"
										clickAction={addColor}
										icon={<span className="ColorStudioPage-static-29">+</span>}
									/>
								</HStack>
								{palette.map((c) => (
									<PaletteEntry
										key={c.id}
										color={c}
										canRemove={palette.length > 1}
										usedRoles={usedRoles}
										onChange={updateColor}
										onRemove={removeColor}
									/>
								))}
							</VStack>

							{/* Custom Colors — extra ramps without roles */}
							<VStack gap={2}>
								<HStack vAlign="center" className="ColorStudioPage-static-30">
									<Text type="label" weight="semibold">
										Color Sets
									</Text>
									<IconButton
										label="Add custom color"
										variant="ghost"
										size="sm"
										clickAction={() => {
											const h = Math.random() * 360
											const hex = oklchClampedHex(0.5, 0.12, h)
											setCustomChannels((prev) => [
												...prev,
												{ id: nextId(), name: `Custom ${prev.length + 1}`, hex },
											])
										}}
										icon={<span className="ColorStudioPage-static-31">+</span>}
									/>
								</HStack>
								{customChannels.length === 0 && (
									<Text type="supporting" color="secondary">
										Add colors to generate extra ramps
									</Text>
								)}
								{customChannels.map((cc) => (
									<HStack key={cc.id} gap={2} vAlign="center" className="ColorStudioPage-static-32">
										<div style={S.swatch(cc.hex)}>
											<input
												type="color"
												value={cc.hex}
												onChange={(e) =>
													setCustomChannels((prev) =>
														prev.map((c) =>
															c.id === cc.id
																? { ...c, hex: (e.currentTarget as HTMLInputElement).value }
																: c,
														),
													)
												}
												className="ColorStudioPage-static-33"
											/>
										</div>
										<div className="ColorStudioPage-static-34">
											<TextInput
												label="Name"
												isLabelHidden
												value={cc.name}
												onChange={(v) =>
													setCustomChannels((prev) =>
														prev.map((c) => (c.id === cc.id ? { ...c, name: v } : c)),
													)
												}
												size="sm"
											/>
										</div>
										<IconButton
											label="Remove"
											variant="ghost"
											size="sm"
											clickAction={() =>
												setCustomChannels((prev) => prev.filter((c) => c.id !== cc.id))
											}
											icon={<span className="ColorStudioPage-static-35">✕</span>}
										/>
									</HStack>
								))}
							</VStack>
						</VStack>
					</div>
				</div>
			</aside>

			{/* ═══ Main Preview ═══ */}
			<main className="ColorStudioPage-static-36">
				<TonalRamps
					palette={palette}
					vibrancy={vibrancy}
					grayTone={grayTone}
					customChannels={customChannels}
					toneSteps={toneSteps}
				/>
			</main>
		</div>
	)
}
