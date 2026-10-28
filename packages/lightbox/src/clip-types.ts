export interface ClipWriter {
	readonly mechanism: 'mask' | 'outline'
	/** Insets and corner radius in untransformed view-local DIPs. */
	setClip(inset: { top: number; right: number; bottom: number; left: number }, radius: number): void
	clear(): void
}
