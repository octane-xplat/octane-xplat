// Port of upstream (fullscreen)/pages/stone-palette/page.tsx (Astryx 0.6.4, MIT).
import { stoneTheme } from '../../themes/stone'
import { stonePalettes } from '../../themes/stonePalettes'
import { ThemePalettePreview, type TonalColor, type CoreSwatch } from '../../themePreview/ThemePalettePreview'
import { DisplayTextSection } from './shared'

const TONAL_COLORS: TonalColor[] = [
	{ name: 'Stone Neutral', sourceHex: '#e2e2e2', tones: stonePalettes.neutral },
	{ name: 'Blue', sourceHex: '#d7e4f5', tones: stonePalettes.blue },
	{ name: 'Cyan', sourceHex: '#cce8e5', tones: stonePalettes.cyan },
	{ name: 'Green', sourceHex: '#d0e9ce', semantic: 'Success', tones: stonePalettes.green },
	{ name: 'Teal', sourceHex: '#d4e7dc', tones: stonePalettes.teal },
	{ name: 'Yellow', sourceHex: '#f4e1b7', semantic: 'Warning', tones: stonePalettes.yellow },
	{ name: 'Orange', sourceHex: '#ffdcbb', tones: stonePalettes.orange },
	{ name: 'Red', sourceHex: '#f9dcd7', semantic: 'Error', tones: stonePalettes.red },
	{ name: 'Pink', sourceHex: '#f0dde8', tones: stonePalettes.pink },
	{ name: 'Purple', sourceHex: '#e8dff3', tones: stonePalettes.purple },
]

const CORE: CoreSwatch[] = [
	{ hex: '#28282A', name: 'Stone 900' },
	{ hex: '#84848B', name: 'Stone 500' },
	{ hex: '#D8D8DB', name: 'Stone 300' },
	{ hex: '#f3f3f5', name: 'Stone 100' },
	{ hex: '#FFFFFF', name: 'White' },
]

export function StonePalettePage() @{
	return (
		<ThemePalettePreview
			theme={stoneTheme}
			title="Stone Theme Palette"
			subtitle="A warm, earthy neutral theme inspired by natural stone and sandstone. Montserrat for headings and display, Figtree for body, JetBrains Mono for code."
			tonalColors={TONAL_COLORS}
			coreSwatches={CORE}
			leadingExtras={
				<DisplayTextSection
					title="Display Text (Montserrat)"
					family={'"Montserrat", "Figtree", -apple-system, sans-serif'}
					sizes={[
						{ size: 72, weight: 700, letterSpacing: '-0.02em' },
						{ size: 56, weight: 700, letterSpacing: '-0.02em' },
						{ size: 44, weight: 600, letterSpacing: '-0.01em' },
						{ size: 28 },
					]}
				/>
			}
		/>
	)
}
