const families = new Map()
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
]

const aliases = new Map([
	['thin', 100],
	['extralight', 200],
	['light', 300],
	['normal', 400],
	['regular', 400],
	['medium', 500],
	['semibold', 600],
	['bold', 700],
	['extrabold', 800],
	['black', 900],
])

const systemFamilies = new Set(['system-ui', '-apple-system', 'sans-serif'])

/** Associate an app-owned family with native descriptors, without loading assets. */
export function registerFontFamily(family, faces) {
	if (!family?.trim() || !faces?.length) {
		throw new Error('A font family needs a name and at least one face')
	}

	const sorted = faces
		.map(({ weight, descriptor }) => {
			if (!Number.isFinite(weight) || !descriptor) {
				throw new Error('A font face needs a finite weight and a native descriptor')
			}

			return { weight, descriptor }
		})
		.sort((left, right) => left.weight - right.weight)

	const name = family.trim().toLowerCase()
	if (systemFamilies.has(name)) {
		throw new Error('System font family names cannot be registered')
	}

	families.set(name, sorted)
}

/** Resolve an explicit family stack, falling back to the weighted system font. */
export function resolveFont(size, weight = 400, family) {
	const parsed = aliases.get(String(weight).toLowerCase()) ?? Number(weight)
	const numeric = Number.isFinite(parsed) ? Math.min(900, Math.max(100, parsed)) : 400
	const [, nativeWeight, managerWeight] = weights.find(([limit]) => numeric <= limit)
	const systemFont = () => {
		const font = NSFont.systemFontOfSizeWeight(Number(size), nativeWeight)
		if (!font) {
			throw new Error('Failed to create the AppKit system font face')
		}

		return font
	}

	for (const name of String(family ?? '').split(',')) {
		const trimmed = name.trim().replace(/^['"]|['"]$/g, '')
		if (!trimmed) {
			continue
		}

		if (systemFamilies.has(trimmed.toLowerCase())) {
			return systemFont()
		}

		const faces = families.get(trimmed.toLowerCase())
		if (faces) {
			const face = faces.find((face) => numeric <= face.weight) ?? faces.at(-1)
			const font = NSFont.fontWithDescriptorSize(face.descriptor, Number(size))
			if (font) {
				return font
			}
		} else {
			const manager = NSFontManager.sharedFontManager
			const font = manager.fontWithFamilyTraitsWeightSize(trimmed, 0, managerWeight, Number(size))

			if (font) {
				return font
			}
		}
	}

	return systemFont()
}
