/** Tag used by service calls that omit their tag. */
export const KeepAwakeDefaultTag = 'KeepAwakeDefaultTag'

/** Screen-sleep prevention with independent, deduplicated tag ownership. */
export interface KeepAwakeImpl {
	/** Request a tag; false means unsupported or not granted. Native startup/backgrounding may defer application. */
	activate(tag?: string): Promise<boolean>
	/** Release this tag only. Unknown tags are harmless; unsupported targets return false. */
	deactivate(tag?: string): Promise<boolean>
	/** Whether a screen-sleep inhibitor is currently held, not merely requested. */
	isActivated(): Promise<boolean>
	/** Whether a mechanism exists; this does not guarantee an OS grant. */
	isAvailable(): Promise<boolean>
	/** Subscribe to web sentinel release, including OS auto-release and explicit release. */
	onRelease?(listener: (tag: string) => void): () => void
}

/** Optional cleanup-warning and web release behavior for useKeepAwake. */
export interface KeepAwakeOptions {
	suppressDeactivateWarnings?: boolean
	/** Subscribe to web sentinel release, including OS auto-release and explicit release. */
	onRelease?: (tag: string) => void
}
