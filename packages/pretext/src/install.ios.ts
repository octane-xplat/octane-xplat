import {
	NSFontAttributeName,
	NSDictionary,
	NSString,
	UIFont,
	UIFontDescriptor,
	UIFontDescriptorFamilyAttribute,
	UIFontDescriptorSizeAttribute,
	UIFontDescriptorTraitsAttribute,
	UIFontSymbolicTrait,
	UIFontWeightTrait,
} from '@octane-xplat/platform/ios'
import { installNativeMeasurement, parseFont } from './measurement.js'
import './intl.js'

const fonts = new Map<string, UIFont>()
const systemFamilies = new Set(['-apple-system', 'system-ui', 'sans-serif'])
const weights = [
	[100, -0.8],
	[200, -0.6],
	[300, -0.4],
	[400, 0],
	[500, 0.23],
	[600, 0.3],
	[700, 0.4],
	[800, 0.56],
	[900, 0.62],
] as const

function fontFor(font: string): UIFont {
	const cached = fonts.get(font)

	if (cached) {
		return cached
	}

	const parsed = parseFont(font)
	const weight = weights.find(([limit]) => parsed.weight <= limit)![1]
	const family = parsed.family.toLowerCase()
	const traits = NSDictionary.dictionaryWithObjectsForKeys(
		[weight, parsed.italic ? 1 : 0],
		[UIFontWeightTrait, UIFontSymbolicTrait],
	)
	const descriptorAttributes = NSDictionary.dictionaryWithObjectsForKeys(
		[parsed.family, parsed.size, traits],
		[
			UIFontDescriptorFamilyAttribute,
			UIFontDescriptorSizeAttribute,
			UIFontDescriptorTraitsAttribute,
		],
	)
	let resolved = systemFamilies.has(family)
		? UIFont.systemFontOfSizeWeight(parsed.size, weight)
		: UIFont.fontWithDescriptorSize(
				UIFontDescriptor.fontDescriptorWithFontAttributes(descriptorAttributes),
				parsed.size,
			)

	if (parsed.italic) {
		const descriptor = resolved.fontDescriptor.fontDescriptorWithSymbolicTraits(
			resolved.fontDescriptor.symbolicTraits | 1, // UIFontDescriptorTraitItalic.
		)

		if (descriptor) {
			resolved = UIFont.fontWithDescriptorSize(descriptor, parsed.size)
		}
	}

	fonts.set(font, resolved)
	return resolved
}

installNativeMeasurement((text, font) =>
	NSString.stringWithString(text)
		.sizeWithAttributes(NSDictionary.dictionaryWithObjectForKey(fontFor(font), NSFontAttributeName))
		.width,
)
