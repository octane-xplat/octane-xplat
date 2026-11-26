export interface ParsedFont {
	family: string
	italic: boolean
	size: number
	weight: number
}

export type NativeWidth = (text: string, font: string) => number

const BASE64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'

function decodeBase64(input: string): string {
	const compact = input.replace(/[\t\n\f\r ]/g, '')
	const encoded = compact.length % 4 === 0 ? compact.replace(/={1,2}$/, '') : compact
	if (encoded.length % 4 === 1 || /[^A-Za-z0-9+/]/.test(encoded)) {
		throw new TypeError('Invalid base64')
	}

	let result = ''
	let bits = 0
	let buffer = 0
	for (const character of encoded) {
		buffer = (buffer << 6) | BASE64.indexOf(character)
		bits += 6
		if (bits >= 8) {
			bits -= 8
			result += String.fromCharCode((buffer >> bits) & 0xff)
		}
	}
	return result
}

function installBase64(): void {
	const decode: unknown = Reflect.get(globalThis, 'atob')
	if (typeof decode === 'function') {
		try {
			if (Reflect.apply(decode, globalThis, ['QQ==']) === 'A') return
		} catch {
			// Some native host builds expose a stub.
		}
	}
	Object.defineProperty(globalThis, 'atob', {
		configurable: true,
		writable: true,
		value: decodeBase64,
	})
}

const FONT_SIZE = /(?:^|\s)(\d+(?:\.\d+)?)(px|pt)(?:\s*\/\s*[^\s]+)?(?:\s+|$)/i
const WEIGHT_ALIASES = new Map([
	['normal', 400],
	['regular', 400],
	['bold', 700],
	['bolder', 700],
	['lighter', 300],
	['thin', 100],
	['extralight', 200],
	['light', 300],
	['medium', 500],
	['semibold', 600],
	['extrabold', 800],
	['black', 900],
])

/** Parse the absolute-size CSS font strings accepted by the native adapters. */
export function parseFont(font: string): ParsedFont {
	const match = FONT_SIZE.exec(font)

	if (!match) {
		throw new TypeError(`Pretext native measurement needs a font size in px or pt: ${font}`)
	}

	const familyText = font.slice(match.index + match[0].length).trim()
	const quotedFamily = /^(['"])(.*?)\1(?:\s*,|$)/.exec(familyText)
	const family = (quotedFamily?.[2] ?? familyText.split(',')[0] ?? '').trim()
	const prelude = font.slice(0, match.index)

	if (!family) {
		throw new TypeError(`Pretext native measurement needs a font family: ${font}`)
	}

	const weightToken = /\b(100|200|300|400|500|600|700|800|900|normal|regular|bold|bolder|lighter|thin|extralight|light|medium|semibold|extrabold|black)\b/i.exec(
		prelude,
	)?.[1].toLowerCase()
	const weight = weightToken
		? (WEIGHT_ALIASES.get(weightToken) ?? Number(weightToken))
		: 400
	const size = Number(match[1]) * (match[2].toLowerCase() === 'pt' ? 96 / 72 : 1)

	if (!Number.isFinite(size) || size <= 0) {
		throw new RangeError(`Pretext native measurement needs a positive font size: ${font}`)
	}

	return {
		family: family.replace(/^(['"])(.*)\1$/, '$2'),
		italic: /\b(?:italic|oblique)\b/i.test(prelude),
		size,
		weight,
	}
}

/** Install Pretext's documented OffscreenCanvas hook around a native width provider. */
export function installNativeMeasurement(width: NativeWidth): void {
	// Pretext 1.0 decodes its packed Unicode line-breaking tables with atob.
	installBase64()
	// Read the DOM global through globalThis — non-web envs have no OffscreenCanvas type.
	const OC = (globalThis as Record<string, any>).OffscreenCanvas
	if (typeof OC !== 'undefined') {
		try {
			if (new OC(1, 1).getContext('2d')) {
				return
			}
		} catch {}
	}

	class TextMeasurementContext {
		font = '10px sans-serif'

		measureText(text: string): { width: number } {
			const measured = width(text, this.font)

			if (!Number.isFinite(measured) || measured < 0) {
				throw new Error('Native text measurement returned an invalid width')
			}

			return { width: measured }
		}
	}

	class TextMeasurementCanvas {
		constructor(
			readonly width: number,
			readonly height: number,
		) {}

		getContext(kind: string): TextMeasurementContext | null {
			return kind === '2d' ? new TextMeasurementContext() : null
		}
	}

	Object.defineProperty(globalThis, 'OffscreenCanvas', {
		configurable: true,
		writable: true,
		value: TextMeasurementCanvas,
	})
}
