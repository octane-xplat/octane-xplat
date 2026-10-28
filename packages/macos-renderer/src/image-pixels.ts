/** Largest positive representation in source pixels. NSImage.size is in
 * logical points and cannot stand in for unknown bitmap dimensions. */
export function imagePixelSize(image: { representations?: unknown }): { width: number; height: number } {
	let width = 0, height = 0
	try {
		const reps: any = image.representations
		const count = Array.isArray(reps) ? reps.length : Number(reps?.count ?? 0)
		if (!Number.isSafeInteger(count) || count < 0) return { width, height }
		for (let index = 0; index < count; index++) {
			const rep = Array.isArray(reps) ? reps[index] : reps.objectAtIndex(index)
			const w = Number(rep?.pixelsWide), h = Number(rep?.pixelsHigh)
			if (Number.isSafeInteger(w) && Number.isSafeInteger(h) && w > 0 && h > 0 && w * h > width * height) { width = w; height = h }
		}
	} catch { /* Unknown metadata does not turn a valid assignment into failure. */ }
	return { width, height }
}
