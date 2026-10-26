// Adapted from Astryx 0.6.4, Copyright (c) Meta Platforms, Inc. (MIT).
import { useEffect, useState } from 'octane'
import type { UseImageModeOptions } from './props'

/** Browser image luminance sampling. null/fallback while loading or on error.
 * CORS permission is required for remote images. Sampling never inspects UI. */
export function useImageMode(
	src: string | null | undefined,
	options: UseImageModeOptions = {},
): 'dark' | 'light' | null {
	const { fallback = null, threshold = 0.5, region } = options
	const x = region?.x ?? 0,
		y = region?.y ?? 0

	const width = region?.width ?? 1,
		height = region?.height ?? 1

	const key = JSON.stringify([src, x, y, width, height, threshold, fallback])
	const [result, setResult] = useState<{ key: string; mode: 'dark' | 'light' | null } | null>(null)
	useEffect(() => {
		if (!src) {
			return
		}

		const controller = new AbortController()
		let cancelled = false
		const detect = async () => {
			let bitmap: ImageBitmap | undefined
			try {
				const response = await fetch(src, { mode: 'cors', signal: controller.signal })
				if (!response.ok) {
					throw new Error('Image unavailable')
				}

				bitmap = await createImageBitmap(await response.blob())
				if (cancelled) {
					return
				}

				if (
					![x, y, width, height].every(Number.isFinite) ||
					x < 0 ||
					y < 0 ||
					width <= 0 ||
					height <= 0 ||
					x + width > 1 ||
					y + height > 1
				) {
					throw new Error('Invalid region')
				}

				const canvas = new OffscreenCanvas(10, 10)
				const ctx = canvas.getContext('2d')
				if (!ctx) {
					throw new Error('Image sampling unavailable')
				}

				ctx.drawImage(
					bitmap,
					x * bitmap.width,
					y * bitmap.height,
					width * bitmap.width,
					height * bitmap.height,
					0,
					0,
					10,
					10,
				)

				const pixels = ctx.getImageData(0, 0, 10, 10).data
				let r = 0,
					g = 0,
					b = 0

				for (let i = 0; i < pixels.length; i += 4) {
					r += pixels[i]
					g += pixels[i + 1]
					b += pixels[i + 2]
				}

				const lin = (value: number) => Math.pow(value / 100 / 255, 2.4)
				const lightness = Math.pow(
					0.2126729 * lin(r) + 0.7151522 * lin(g) + 0.072175 * lin(b),
					0.56,
				)

				if (!cancelled) {
					setResult({ key, mode: lightness > threshold ? 'light' : 'dark' })
				}
			} catch {
				if (!cancelled) {
					setResult({ key, mode: fallback })
				}
			} finally {
				bitmap?.close()
			}
		}

		void detect()
		return () => {
			cancelled = true
			controller.abort()
		}
	}, [key])

	return result?.key === key ? result.mode : fallback
}
