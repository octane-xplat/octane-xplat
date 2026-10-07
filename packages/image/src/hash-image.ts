/** VENDORED from packages/ui/src/hash-image.ts — keep in sync.
 *  Placeholder-hash decoders shared by the Image leaves: `blurhash:` and
 *  `thumbhash:` URIs decode to a PNG in pure JS so a placeholder is a real
 *  image on every platform — ImageSource.fromBase64Sync on native, a
 *  data:image/png URL on web. Decode sizes stay small (~32px); the view's
 *  own fit/stretch scales the result, same as the final image.
 *
 *  blurhash decode is a port of the Wolt reference decoder (MIT);
 *  thumbHashToRGBA and rgbaToPng are ports of Evan Wallace's thumbhash.js
 *  (MIT), with the data-URL/btoa tail replaced by byte output so this file
 *  carries no DOM or platform APIs. */

export function isHashPlaceholder(src: string): boolean {
	return src.startsWith('blurhash:') || src.startsWith('thumbhash:')
}

/** `blurhash:<hash>` / `thumbhash:<base64>` → PNG bytes as base64, or null. */
export function hashToPngBase64(src: string): string | null {
	if (src.startsWith('blurhash:')) {
		const rgba = decodeBlurHash(src.slice(9), 32, 32)
		return rgba ? base64Encode(rgbaToPng(32, 32, rgba)) : null
	}

	if (src.startsWith('thumbhash:')) {
		const hash = base64Decode(src.slice(10))
		const decoded = hash ? thumbHashToRGBA(hash) : null
		return decoded ? base64Encode(rgbaToPng(decoded.w, decoded.h, decoded.rgba)) : null
	}

	return null
}

// ---------- blurhash (Wolt reference, MIT) ----------

const BASE83 = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz#$%*+,-.:;=?@[]^_{|}~'

function decode83(str: string, start: number, end: number): number {
	let value = 0
	for (let i = start; i < end; i++) {
		const digit = BASE83.indexOf(str[i])
		if (digit === -1) {return -1}
		value = value * 83 + digit
	}

	return value
}

function srgbToLinear(value: number): number {
	const v = value / 255
	return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
}

function linearToSrgb(value: number): number {
	const v = Math.max(0, Math.min(1, value))
	return v <= 0.0031308
		? Math.round(v * 12.92 * 255 + 0.5)
		: Math.round((1.055 * Math.pow(v, 1 / 2.4) - 0.055) * 255 + 0.5)
}

function signPow(value: number, exp: number): number {
	return Math.sign(value) * Math.pow(Math.abs(value), exp)
}

function decodeBlurHash(hash: string, width: number, height: number): Uint8ClampedArray | null {
	if (hash.length < 6) {return null}
	const sizeFlag = decode83(hash, 0, 1)
	const quantisedMax = decode83(hash, 1, 2)
	const dcValue = decode83(hash, 2, 6)
	if (sizeFlag < 0 || quantisedMax < 0 || dcValue < 0) {return null}
	const numY = Math.floor(sizeFlag / 9) + 1
	const numX = (sizeFlag % 9) + 1
	if (hash.length !== 4 + 2 * numX * numY) {return null}
	const maximumValue = (quantisedMax + 1) / 166
	const colors: [number, number, number][] = new Array(numX * numY)
	colors[0] = [
		srgbToLinear(dcValue >> 16),
		srgbToLinear((dcValue >> 8) & 255),
		srgbToLinear(dcValue & 255),
	]

	for (let i = 1; i < numX * numY; i++) {
		const value = decode83(hash, 4 + i * 2, 6 + i * 2)
		if (value < 0) {return null}
		const quantR = Math.floor(value / (19 * 19))
		const quantG = Math.floor(value / 19) % 19
		const quantB = value % 19
		colors[i] = [
			signPow((quantR - 9) / 9, 2) * maximumValue,
			signPow((quantG - 9) / 9, 2) * maximumValue,
			signPow((quantB - 9) / 9, 2) * maximumValue,
		]
	}

	const pixels = new Uint8ClampedArray(width * height * 4)
	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			let r = 0
			let g = 0
			let b = 0
			for (let j = 0; j < numY; j++) {
				for (let i = 0; i < numX; i++) {
					const basis =
						Math.cos((Math.PI * x * i) / width) * Math.cos((Math.PI * y * j) / height)

					const color = colors[i + j * numX]
					r += color[0] * basis
					g += color[1] * basis
					b += color[2] * basis
				}
			}

			const o = (x + y * width) * 4
			pixels[o] = linearToSrgb(r)
			pixels[o + 1] = linearToSrgb(g)
			pixels[o + 2] = linearToSrgb(b)
			pixels[o + 3] = 255
		}
	}

	return pixels
}

// ---------- thumbhash (Evan Wallace reference, MIT) ----------

function thumbHashToApproximateAspectRatio(hash: Uint8Array): number {
	const header = hash[3]
	const hasAlpha = (hash[2] & 0x80) !== 0
	const isLandscape = (hash[4] & 0x80) !== 0
	const lx = isLandscape ? (hasAlpha ? 5 : 7) : header & 7
	const ly = isLandscape ? header & 7 : hasAlpha ? 5 : 7
	return lx / ly
}

function thumbHashToRGBA(hash: Uint8Array): { w: number; h: number; rgba: Uint8Array } | null {
	if (hash.length < 5) {return null}
	const { PI, min, max, cos, round } = Math
	const header24 = hash[0] | (hash[1] << 8) | (hash[2] << 16)
	const header16 = hash[3] | (hash[4] << 8)
	const l_dc = (header24 & 63) / 63
	const p_dc = ((header24 >> 6) & 63) / 31.5 - 1
	const q_dc = ((header24 >> 12) & 63) / 31.5 - 1
	const l_scale = ((header24 >> 18) & 31) / 31
	const hasAlpha = header24 >> 23 !== 0
	const p_scale = ((header16 >> 3) & 63) / 63
	const q_scale = ((header16 >> 9) & 63) / 63
	const isLandscape = header16 >> 15 !== 0
	const lx = max(3, isLandscape ? (hasAlpha ? 5 : 7) : header16 & 7)
	const ly = max(3, isLandscape ? header16 & 7 : hasAlpha ? 5 : 7)
	const a_dc = hasAlpha ? (hash[5] & 15) / 15 : 1
	const a_scale = (hash[5] >> 4) / 15
	const ac_start = hasAlpha ? 6 : 5
	let ac_index = 0
	const decodeChannel = (nx: number, ny: number, scale: number) => {
		const ac: number[] = []
		for (let cy = 0; cy < ny; cy++)
			{for (let cx = cy ? 0 : 1; cx * ny < nx * (ny - cy); cx++) {
				const byte = hash[ac_start + (ac_index >> 1)]
				if (byte === undefined) {return null}
				ac.push((((byte >> ((ac_index++ & 1) << 2)) & 15) / 7.5 - 1) * scale)
			}}

		return ac
	}

	const l_ac = decodeChannel(lx, ly, l_scale)
	const p_ac = decodeChannel(3, 3, p_scale * 1.25)
	const q_ac = decodeChannel(3, 3, q_scale * 1.25)
	const a_ac = hasAlpha ? decodeChannel(5, 5, a_scale) : null
	if (!l_ac || !p_ac || !q_ac || (hasAlpha && !a_ac)) {return null}

	const ratio = thumbHashToApproximateAspectRatio(hash)
	const w = round(ratio > 1 ? 32 : 32 * ratio)
	const h = round(ratio > 1 ? 32 / ratio : 32)
	const rgba = new Uint8Array(w * h * 4)
	const fx: number[] = []
	const fy: number[] = []
	for (let y = 0, i = 0; y < h; y++) {
		for (let x = 0; x < w; x++, i += 4) {
			let l = l_dc
			let p = p_dc
			let q = q_dc
			let a = a_dc
			for (let cx = 0, n = max(lx, hasAlpha ? 5 : 3); cx < n; cx++)
				{fx[cx] = cos((PI / w) * (x + 0.5) * cx)}

			for (let cy = 0, n = max(ly, hasAlpha ? 5 : 3); cy < n; cy++)
				{fy[cy] = cos((PI / h) * (y + 0.5) * cy)}

			for (let cy = 0, j = 0; cy < ly; cy++)
				{for (let cx = cy ? 0 : 1, fy2 = fy[cy] * 2; cx * ly < lx * (ly - cy); cx++, j++)
					{l += l_ac[j] * fx[cx] * fy2}}

			for (let cy = 0, j = 0; cy < 3; cy++) {
				for (let cx = cy ? 0 : 1, fy2 = fy[cy] * 2; cx < 3 - cy; cx++, j++) {
					const f = fx[cx] * fy2
					p += p_ac[j] * f
					q += q_ac[j] * f
				}
			}

			if (hasAlpha && a_ac) {
				for (let cy = 0, j = 0; cy < 5; cy++)
					{for (let cx = cy ? 0 : 1, fy2 = fy[cy] * 2; cx < 5 - cy; cx++, j++) {
						a += a_ac[j] * fx[cx] * fy2
					}}
			}

			const b = l - (2 / 3) * p
			const r = (3 * l - b + q) / 2
			const g = r - q
			rgba[i] = max(0, 255 * min(1, r))
			rgba[i + 1] = max(0, 255 * min(1, g))
			rgba[i + 2] = max(0, 255 * min(1, b))
			rgba[i + 3] = max(0, 255 * min(1, a))
		}
	}

	return { w, h, rgba }
}

// ---------- PNG encode + base64 (Wallace rgbaToDataURL port, MIT) ----------

const PNG_CRC_TABLE = [
	0, 498536548, 997073096, 651767980, 1994146192, 1802195444, 1303535960, 1342533948,
	-306674912, -267414716, -690576408, -882789492, -1687895376, -2032938284, -1609899400,
	-1111625188,
]

/** Uncompressed PNG (zlib store blocks) — correctness over size; inputs are
 *  ~32px placeholders so the payload stays small. */
function rgbaToPng(w: number, h: number, rgba: Uint8ClampedArray | Uint8Array): number[] {
	const row = w * 4 + 1
	const idat = 6 + h * (5 + row)
	const bytes = [
		137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82, 0, 0, w >> 8,
		w & 255, 0, 0, h >> 8, h & 255, 8, 6, 0, 0, 0, 0, 0, 0, 0, idat >>> 24,
		(idat >> 16) & 255, (idat >> 8) & 255, idat & 255, 73, 68, 65, 84, 120, 1,
	]

	let a = 1
	let b = 0
	for (let y = 0, i = 0, end = row - 1; y < h; y++, end += row - 1) {
		bytes.push(y + 1 < h ? 0 : 1, row & 255, row >> 8, ~row & 255, (row >> 8) ^ 255, 0)
		for (b = (b + a) % 65521; i < end; i++) {
			const u = rgba[i] & 255
			bytes.push(u)
			a = (a + u) % 65521
			b = (b + a) % 65521
		}
	}

	bytes.push(
		b >> 8, b & 255, a >> 8, a & 255, 0, 0, 0, 0,
		0, 0, 0, 0, 73, 69, 78, 68, 174, 66, 96, 130,
	)

	for (let [start, end] of [
		[12, 29],
		[37, 41 + idat],
	]) {
		let c = ~0
		for (let i = start; i < end; i++) {
			c ^= bytes[i]
			c = (c >>> 4) ^ PNG_CRC_TABLE[c & 15]
			c = (c >>> 4) ^ PNG_CRC_TABLE[c & 15]
		}

		c = ~c
		bytes[end++] = c >>> 24
		bytes[end++] = (c >> 16) & 255
		bytes[end++] = (c >> 8) & 255
		bytes[end++] = c & 255
	}

	return bytes
}

const BASE64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'

function base64Encode(bytes: number[] | Uint8Array): string {
	let out = ''
	for (let i = 0; i < bytes.length; i += 3) {
		const b0 = bytes[i]
		const b1 = i + 1 < bytes.length ? bytes[i + 1] : 0
		const b2 = i + 2 < bytes.length ? bytes[i + 2] : 0
		out += BASE64_CHARS[b0 >> 2]
		out += BASE64_CHARS[((b0 & 3) << 4) | (b1 >> 4)]
		out += i + 1 < bytes.length ? BASE64_CHARS[((b1 & 15) << 2) | (b2 >> 6)] : '='
		out += i + 2 < bytes.length ? BASE64_CHARS[b2 & 63] : '='
	}

	return out
}

function base64Decode(text: string): Uint8Array | null {
	const clean = text.replace(/-/g, '+').replace(/_/g, '/').replace(/[\s=]/g, '')
	const bytes = new Uint8Array(Math.floor((clean.length * 3) / 4))
	let out = 0
	let acc = 0
	let bits = 0
	for (const ch of clean) {
		const digit = BASE64_CHARS.indexOf(ch)
		if (digit === -1) {return null}
		acc = (acc << 6) | digit
		bits += 6
		if (bits >= 8) {
			bits -= 8
			if (out < bytes.length) {bytes[out++] = (acc >> bits) & 255}
		}
	}

	return bytes.subarray(0, out)
}
