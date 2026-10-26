// Port of Astryx 0.6.4; Copyright (c) Meta Platforms, Inc. (MIT).
import { useState } from 'octane'
import {
	Heading,
	Text,
	VStack,
	HStack,
	Button,
	Theme,
	useThemeName,
	getRegisteredTheme,
	Divider,
	View,
	Image,
	useImageMode,
} from '@octane-xplat/ui'

import { useImageModeTest, type Algorithm } from './useImageModeTest'
// =============================================================================
// Algorithm metadata
// =============================================================================

const ALGO_INFO: Record<Algorithm, { label: string; description: string }> = {
	gamma: {
		label: 'BT.709 Gamma',
		description:
			'Luma on gamma-encoded sRGB, threshold 0.5. Fast but overestimates brightness of saturated colors.',
	},
	wcag: {
		label: 'WCAG 2',
		description:
			'sRGB linearization + BT.709 coefficients, threshold 0.18. Standard web accessibility formula.',
	},
	apca: {
		label: 'APCA',
		description:
			'sRGB linearization + perceptual power curve (Y^0.56), threshold 0.5. Best mid-tone discrimination. Targeting WCAG 3.',
	},
}

const ALGO_FN: Record<
	Algorithm,
	{ fn: (r: number, g: number, b: number) => number; threshold: number }
> = {
	gamma: {
		fn: (r, g, b) => (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255,
		threshold: 0.5,
	},
	wcag: {
		fn: (r, g, b) => {
			const lin = (c: number) => {
				const v = c / 255
				return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
			}

			return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
		},
		threshold: 0.18,
	},
	apca: {
		fn: (r, g, b) => {
			const lin = (c: number) => Math.pow(c / 255, 2.4)
			return Math.pow(0.2126729 * lin(r) + 0.7151522 * lin(g) + 0.072175 * lin(b), 0.56)
		},
		threshold: 0.5,
	},
}

// =============================================================================
// Test data
// =============================================================================

const SOLID_COLORS: Array<{ name: string; rgb: [number, number, number] }> = [
	{ name: 'black', rgb: [0, 0, 0] },
	{ name: 'white', rgb: [255, 255, 255] },
	{ name: 'red', rgb: [255, 0, 0] },
	{ name: 'green', rgb: [0, 255, 0] },
	{ name: 'blue', rgb: [0, 0, 255] },
	{ name: 'yellow', rgb: [255, 255, 0] },
	{ name: 'cyan', rgb: [0, 255, 255] },
	{ name: 'magenta', rgb: [255, 0, 255] },
	{ name: 'mid-gray', rgb: [128, 128, 128] },
	{ name: 'dark-gray', rgb: [64, 64, 64] },
	{ name: 'light-gray', rgb: [192, 192, 192] },
	{ name: 'orange', rgb: [255, 165, 0] },
	{ name: 'navy', rgb: [0, 0, 128] },
	{ name: 'forest', rgb: [0, 100, 0] },
	{ name: 'maroon', rgb: [128, 0, 0] },
	{ name: 'teal', rgb: [0, 128, 128] },
]

const IMAGE_SWATCHES = [
	{ label: 'forest', src: 'https://picsum.photos/id/10/200/200' },
	{ label: 'laptop', src: 'https://picsum.photos/id/15/200/200' },
	{ label: 'clouds', src: 'https://picsum.photos/id/28/200/200' },
	{ label: 'water', src: 'https://picsum.photos/id/36/200/200' },
	{ label: 'door', src: 'https://picsum.photos/id/96/200/200' },
	{ label: 'bones', src: 'https://picsum.photos/id/106/200/200' },
	{ label: 'road', src: 'https://picsum.photos/id/136/200/200' },
	{ label: 'puppy', src: 'https://picsum.photos/id/237/200/200' },
]

const BUTTON_REGION = { x: 0.5, y: 0.06, width: 0.44, height: 0.44 }

// =============================================================================
// Static styles live in sandbox.css; swatch colors remain dynamic.
// =============================================================================

// =============================================================================
// Swatch components
// =============================================================================

function RemoveButton() {
	return (
		<Button
			icon="xplat-close"
			isIconOnly
			label="Remove"
			variant="secondary"
			size="sm"

			className="sb-mode-remove"
			clickAction={() => {}}
		/>
	)
}

function Swatch({
	color,
	mode,
	value,
}: {
	color: (typeof SOLID_COLORS)[0]
	mode: 'dark' | 'light'
	value: number
}) {
	return (
		<View className="sb-mode-swatch">
			<Theme theme={getRegisteredTheme(useThemeName())!} mode={mode}>
				<View className="sb-mode-box" style={{ backgroundColor: `rgb(${color.rgb.join(',')})` }}>
					<View className="sb-mode-remove-position">
						<RemoveButton />
					</View>
				</View>
			</Theme>
			<View className="sb-mode-color-label">{color.name}</View>
			<View className="sb-mode-value" style={{ color: mode === 'dark' ? '#c44' : '#48a' }}>
				{value.toFixed(3)} → {mode}
			</View>
		</View>
	)
}

function ImageSwatch({
	src,
	label,
	algorithm,
}: {
	src: string
	label: string
	algorithm: Algorithm
}) {
	const comparison = useImageModeTest(src, { region: BUTTON_REGION, algorithm })
	const detected = useImageMode(src, { region: BUTTON_REGION })
	const mode = algorithm === 'apca' ? detected : comparison.mode
	const value = comparison.value
	return (
		<View className="sb-mode-swatch">
			{mode != null ? (
				<Theme theme={getRegisteredTheme(useThemeName())!} mode={mode}>
					<View className="sb-mode-box">
						<Image src={src} alt={label} className="sb-mode-image" />
						<View className="sb-mode-remove-position">
							<RemoveButton />
						</View>
					</View>
				</Theme>
			) : (
				<View className="sb-mode-box">
					<Image src={src} alt={label} className="sb-mode-image" />
					<View className="sb-mode-remove-position">
						<RemoveButton />
					</View>
				</View>
			)}
			<View className="sb-mode-image-label">{label}</View>
			<View
				className="sb-mode-value"
				style={{ color: mode === 'dark' ? '#c44' : mode === 'light' ? '#48a' : '#999' }}
			>
				{value != null ? `${value.toFixed(3)} → ${mode}` : 'detecting…'}
			</View>
		</View>
	)
}

// =============================================================================
// Page
// =============================================================================

export function MediaModePage() {
	const [algo, setAlgo] = useState<Algorithm>('apca')
	const info = ALGO_INFO[algo]
	const config = ALGO_FN[algo]

	return (
		<VStack gap={6} className="sb-mode-page">
			<View>
				<Heading level={2}>Media Mode Comparison</Heading>
				<Text type="body" color="secondary">
					Compare luminance algorithms for detecting dark vs light surfaces. Used by useImageMode +
					MediaTheme to adapt overlaid controls.
				</Text>
			</View>

			<HStack gap={2}>
				{(Object.keys(ALGO_INFO) as Algorithm[]).map((id) => (
					<Button
						key={id}
						label={ALGO_INFO[id].label}
						variant={algo === id ? 'primary' : 'secondary'}
						size="sm"
						clickAction={() => setAlgo(id)}
					/>
				))}
			</HStack>

			<View className="sb-mode-info">{info.description}</View>

			<Divider />

			<Heading level={4}>Solid Colors</Heading>

			<View className="sb-mode-grid">
				{SOLID_COLORS.map((c) => {
					const value = config.fn(...c.rgb)
					const mode: 'dark' | 'light' = value > config.threshold ? 'light' : 'dark'
					return <Swatch key={c.name} color={c} mode={mode} value={value} />
				})}
			</View>

			<Divider />

			<Heading level={4}>Real Images</Heading>
			<View className="sb-mode-info">
				Samples the upper-right corner where a remove button would sit. Switch algorithms above;
				images re-detect with the selected algorithm.
			</View>

			<View className="sb-mode-grid">
				{IMAGE_SWATCHES.map((img) => (
					<ImageSwatch
						key={`${img.label}-${algo}`}
						src={img.src}
						label={img.label}
						algorithm={algo}
					/>
				))}
			</View>
		</VStack>
	)
}
