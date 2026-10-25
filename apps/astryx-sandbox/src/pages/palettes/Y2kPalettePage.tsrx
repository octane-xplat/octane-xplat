// Port of upstream (fullscreen)/pages/y2k-palette/page.tsx (Astryx 0.6.4, MIT).
import { y2kTheme } from '../../themes/y2k'
import { y2kPalettes } from '../../themes/y2kPalettes'
import { ThemePalettePreview, type TonalColor } from '../../themePreview/ThemePalettePreview'
import { DisplayTextSection } from './shared'

const TONAL_COLORS: TonalColor[] = [
	{ name: 'Y2K Neutral', sourceHex: '#c3b7ab', note: 'H=75 C=8', tones: y2kPalettes.neutral },
	{ name: 'Green', sourceHex: '#C5E17A', semantic: 'Success', tones: y2kPalettes.green },
	{ name: 'Red', sourceHex: '#FF9E9A', semantic: 'Error', tones: y2kPalettes.red },
	{ name: 'Yellow', sourceHex: '#FFCC55', semantic: 'Warning', tones: y2kPalettes.yellow },
	{ name: 'Blue', sourceHex: '#8ECFFF', tones: y2kPalettes.blue },
	{ name: 'Pink', sourceHex: '#FFA0C8', tones: y2kPalettes.pink },
	{ name: 'Purple', sourceHex: '#C0AAFF', tones: y2kPalettes.purple },
	{ name: 'Cyan', sourceHex: '#70E8D0', tones: y2kPalettes.cyan },
	{ name: 'Orange', sourceHex: '#FFAA66', tones: y2kPalettes.orange },
	{ name: 'Teal', sourceHex: '#78E0B0', tones: y2kPalettes.teal },
]

export function Y2kPalettePage() @{
	return (
		<ThemePalettePreview
			theme={y2kTheme}
			title="Y2K Theme Palette"
			subtitle="A bubbly, playful pop theme: hot pink body, lime green accents, Crimson Text headings + Poppins body."
			tonalColors={TONAL_COLORS}
			leadingExtras={
				<DisplayTextSection
					title="Display Text (Crimson Text)"
					family={"'Crimson Text', Georgia, 'Times New Roman', serif"}
					sizes={[{ size: 83 }, { size: 67 }, { size: 53 }]}
				/>
			}
		/>
	)
}
