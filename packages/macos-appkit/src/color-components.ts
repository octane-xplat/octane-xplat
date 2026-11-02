/** Catalog and dynamic NSColors (labelColor, controlAccentColor) carry no
 *  components: their component getters raise an NSException that aborts the
 *  process. Resolve them to sRGB under the appearance they render in first. */

export type SRGBComponents = { red: number; green: number; blue: number; alpha: number }

export function withDrawingAppearance<T>(appearance: any, read: () => T): T {
	let value!: T
	const readValue = () => {
		value = read()
	}

	if (typeof appearance?.performAsCurrentDrawingAppearance === 'function') {
		appearance.performAsCurrentDrawingAppearance(readValue)
	} else {
		readValue()
	}

	return value
}

export function srgbComponents(color: any, appearance?: any): SRGBComponents | null {
	if (!color) {
		return null
	}

	return withDrawingAppearance(appearance, () => {
		const rgb = color.colorUsingColorSpace((globalThis as any).NSColorSpace.sRGBColorSpace)
		// Pattern colors and other colors without an sRGB equivalent convert to
		// nil; never fall back to reading components on the unconverted color.
		if (!rgb) {
			return null
		}

		return {
			red: Number(rgb.redComponent),
			green: Number(rgb.greenComponent),
			blue: Number(rgb.blueComponent),
			alpha: Number(rgb.alphaComponent),
		}
	})
}
