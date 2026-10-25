// Port of upstream (fullscreen)/pages/butter-palette/page.tsx (Astryx 0.6.4, MIT).
import { butterTheme } from '../../themes/butter'
import { butterPalettes } from '../../themes/butterPalettes'
import { ThemePalettePreview, type TonalColor, type CoreSwatch } from '../../themePreview/ThemePalettePreview'
import { DisplayTextSection } from './shared'

const TONAL_COLORS: TonalColor[] = [
	{ name: 'Accent', sourceHex: '#225BFF', tones: butterPalettes.accent, dark: { sourceHex: '#FDEE8C', tones: butterPalettes.yellow } },
	{ name: 'Gray', sourceHex: '#868B99', tones: butterPalettes.neutral },
	{ name: 'Red', sourceHex: '#FF7553', tones: butterPalettes.red },
	{ name: 'Orange', sourceHex: '#FFA347', tones: butterPalettes.orange },
	{ name: 'Yellow', sourceHex: '#EDD64B', tones: butterPalettes.yellow },
	{ name: 'Green', sourceHex: '#5DCE5F', tones: butterPalettes.green },
	{ name: 'Cyan', sourceHex: '#60CFD3', tones: butterPalettes.cyan },
	{ name: 'Teal', sourceHex: '#6CD9A8', tones: butterPalettes.teal },
	{ name: 'Blue', sourceHex: '#5681FF', tones: butterPalettes.blue },
	{ name: 'Purple', sourceHex: '#B780F6', tones: butterPalettes.purple },
	{ name: 'Pink', sourceHex: '#F680E8', tones: butterPalettes.pink },
	{ name: 'Error', sourceHex: '#FF5947', tones: butterPalettes.error, semantic: 'Error' },
	{ name: 'Warning', sourceHex: '#F8C726', tones: butterPalettes.warning, semantic: 'Warning' },
	{ name: 'Success', sourceHex: '#91D143', tones: butterPalettes.success, semantic: 'Success' },
]

const CORE: CoreSwatch[] = [
	{ hex: '#225BFF', name: '#225BFF', dark: { hex: '#FDEE8C', name: '#FDEE8C' } },
	{ hex: '#5681FF', name: '#5681FF', dark: { hex: '#EDD64B', name: '#EDD64B' } },
	{ hex: '#FDEE8C', name: '#FDEE8C', dark: { hex: '#725538', name: '#725538' } },
	{ hex: '#FDFBE4', name: '#FDFBE4', dark: { hex: '#36261C', name: '#36261C' } },
	{ hex: '#FFFFFF', name: '#FFFFFF', dark: { hex: '#261A13', name: '#261A13' } },
]

export function ButterPalettePage() @{
	return (
		<ThemePalettePreview
			theme={butterTheme}
			title="Butter Theme Palette"
			subtitle="Golden buttery theme with blue accents. Sarina for Display, Outfit for headings and body."
			tonalColors={TONAL_COLORS}
			coreSwatches={CORE}
			leadingExtras={
				<DisplayTextSection
					title="Display Text (Sarina)"
					family={"'Sarina', cursive"}
					sizes={[{ size: 83 }, { size: 67 }, { size: 53 }]}
				/>
			}
		/>
	)
}
