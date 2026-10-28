// Port of upstream (fullscreen)/pages/gothic-palette/page.tsx (Astryx 0.6.4, MIT).
import { gothicTheme } from '../../themes/gothic'
import { gothicPalettes } from '../../themes/gothicPalettes'
import {
	ThemePalettePreview,
	type TonalColor,
	type CoreSwatch,
} from '../../themePreview/ThemePalettePreview'

import { DisplayTextSection } from './shared'

const TONAL_COLORS: TonalColor[] = [
	{
		name: 'Gothic Neutral',
		sourceHex: '#96A0AB',
		note: 'cool blue-gray',
		tones: gothicPalettes.neutral,
	},
	{
		name: 'Green',
		sourceHex: '#b3c79a',
		semantic: 'Success / sage moss',
		tones: gothicPalettes.green,
	},
	{ name: 'Red', sourceHex: '#c6a6a2', semantic: 'Error / dusty rose', tones: gothicPalettes.red },
	{
		name: 'Yellow',
		sourceHex: '#d3c490',
		semantic: 'Warning / aged gold',
		tones: gothicPalettes.yellow,
	},
	{ name: 'Blue', sourceHex: '#a3b5d6', note: 'periwinkle midnight', tones: gothicPalettes.blue },
	{ name: 'Purple', sourceHex: '#b29bc4', note: 'muted plum', tones: gothicPalettes.purple },
	{ name: 'Pink', sourceHex: '#c89aab', note: 'dusty rose', tones: gothicPalettes.pink },
	{ name: 'Cyan', sourceHex: '#a3c2cf', note: 'cathedral mist', tones: gothicPalettes.cyan },
	{ name: 'Orange', sourceHex: '#d3b89a', note: 'warm tan', tones: gothicPalettes.orange },
	{ name: 'Teal', sourceHex: '#a3c2b6', note: 'sage verdigris', tones: gothicPalettes.teal },
]

const CORE: CoreSwatch[] = [
	{ hex: '#101314', name: 'Body / Surface' },
	{ hex: '#1a1d20', name: 'Card' },
	{ hex: '#24292D', name: 'Popover' },
	{ hex: '#495056', name: 'Border emp.' },
	{ hex: '#96A0AB', name: 'Text secondary' },
	{ hex: '#E8F1F6', name: 'Text primary' },
]

export function GothicPalettePage() @{
	return (
		<ThemePalettePreview
			theme={gothicTheme}
			title="Gothic Theme Palette"
			subtitle="Dark-only theme: deep blue-gray surfaces, distressed display heading, pastel categorical accents that glow against the dark page like illuminated panels."
			tonalColors={TONAL_COLORS}
			coreSwatches={CORE}
			singleMode="dark"
			leadingExtras={
				<DisplayTextSection
					title="Display Text (Manufacturing Consent)"
					family={'"Manufacturing Consent", "UnifrakturMaguntia", "Old English Text MT", serif'}
					sizes={[{ size: 72 }, { size: 56 }, { size: 44 }, { size: 28 }]}
				/>
			}
		/>
	)
}
