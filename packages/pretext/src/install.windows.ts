import { Windows } from '@octane-xplat/platform/windows'
import { installNativeMeasurement, parseFont } from './measurement.js'
import './intl.js'

interface TextBlockSurface {
	Text: string
	FontFamily: unknown
	FontSize: number
	FontWeight: unknown
	FontStyle: unknown
	TextWrapping: unknown
	Measure(availableSize: unknown): void
	readonly DesiredSize: { Width: number }
}

const blocks = new Map<string, TextBlockSurface>()
const weightName = (weight: number): string =>
	weight < 200
		? 'Thin'
		: weight < 350
			? 'Light'
			: weight < 450
				? 'Normal'
				: weight < 550
					? 'Medium'
					: weight < 650
						? 'SemiBold'
						: weight < 750
							? 'Bold'
							: 'Black'

function blockFor(font: string): TextBlockSurface {
	const cached = blocks.get(font)

	if (cached) {
		return cached
	}

	const parsed = parseFont(font)
	const systemFamily = ['-apple-system', 'sans-serif', 'system-ui'].includes(
		parsed.family.toLowerCase(),
	)
	const block: TextBlockSurface = new Windows.UI.Xaml.Controls.TextBlock()
	block.FontFamily = new Windows.UI.Xaml.Media.FontFamily(
		systemFamily ? 'Segoe UI' : parsed.family,
	)
	block.FontSize = parsed.size
	block.FontWeight = Windows.UI.Text.FontWeights[weightName(parsed.weight)]
	block.FontStyle = parsed.italic
		? Windows.UI.Text.FontStyle.Italic
		: Windows.UI.Text.FontStyle.Normal
	block.TextWrapping = Windows.UI.Xaml.TextWrapping.NoWrap
	blocks.set(font, block)
	return block
}

installNativeMeasurement((text, font) => {
	const block = blockFor(font)
	block.Text = text
	block.Measure(new Windows.Foundation.Size(Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY))
	return block.DesiredSize.Width
})
