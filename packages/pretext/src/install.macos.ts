import {
	NSAttributedString,
	NSFont,
	NSFontAttributeName,
	NSFontItalicTrait,
	NSFontManager,
} from '@octane-xplat/platform/macos'
import { installNativeMeasurement, parseFont } from './measurement.js'
import './intl.js'

const fonts = new Map<string, NSFont>()
const weights = [
	[100, -0.8, 1],
	[200, -0.6, 2],
	[300, -0.4, 3],
	[400, 0, 5],
	[500, 0.23, 6],
	[600, 0.3, 8],
	[700, 0.4, 9],
	[800, 0.56, 10],
	[900, 0.62, 12],
] as const
const systemFamilies = new Set(['-apple-system', 'system-ui', 'sans-serif'])

function fontFor(font: string): NSFont {
	const cached = fonts.get(font)

	if (cached) {
		return cached
	}

	const parsed = parseFont(font)
	const [, nativeWeight, managerWeight] = weights.find(([limit]) => parsed.weight <= limit)!
	const manager = NSFontManager.sharedFontManager
	const system = systemFamilies.has(parsed.family.toLowerCase())
	let resolved = system
		? NSFont.systemFontOfSizeWeight(parsed.size, nativeWeight)
		: manager.fontWithFamilyTraitsWeightSize(
				parsed.family,
				parsed.italic ? NSFontItalicTrait : 0,
				managerWeight,
				parsed.size,
			)

	if (!resolved) {
		resolved = NSFont.systemFontOfSizeWeight(parsed.size, nativeWeight)
	}

	if (system && parsed.italic) {
		resolved = manager.convertFontToHaveTrait(resolved, NSFontItalicTrait)
	}

	fonts.set(font, resolved)
	return resolved
}

installNativeMeasurement((text, font) =>
	NSAttributedString.alloc().initWithStringAttributes(text, {
		[NSFontAttributeName]: fontFor(font),
	}).size().width,
)
