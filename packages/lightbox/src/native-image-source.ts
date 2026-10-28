/** Observe the Image host's existing decode; never fetch a second copy. */
export interface NativeImageHost {
	src: unknown
	isLoading: boolean
	imageSource?: { width: number; height: number }
	on(event: string, callback: () => void): void
	off(event: string, callback: () => void): void
}
export interface NativeImageResult { width: number; height: number; failed: boolean }
export function observeNativeImage(host: NativeImageHost, source: string, changed: (result: NativeImageResult) => void) {
	let active = true
	let started = host.isLoading
	let previous = ''
	const read = () => {
		if (!active || host.src !== source) return
		started ||= host.isLoading
		const width = host.imageSource?.width ?? 0
		const height = host.imageSource?.height ?? 0
		const valid = width > 0 && height > 0 && Number.isFinite(width) && Number.isFinite(height)
		if (!valid && (!started || host.isLoading)) return
		const result = { width: valid ? width : 0, height: valid ? height : 0, failed: !valid }
		const key = `${result.width}/${result.height}/${result.failed}`
		if (key === previous) return
		previous = key
		changed(result)
	}
	for (const event of ['imageSourceChange', 'isLoadingChange', 'loaded']) host.on(event, read)
	read()
	return () => {
		active = false
		for (const event of ['imageSourceChange', 'isLoadingChange', 'loaded']) host.off(event, read)
	}
}
